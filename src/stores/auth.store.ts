import { type AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  type AgeVerificationData,
  type SSOProvider,
  getSession,
  signInWithProvider,
  signOut as authSignOut,
} from '@/services/supabase/auth';
import { getSupabase } from '@/services/supabase/client';

export const TRIAL_LIMIT = 5;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Pre-auth onboarding flags — IN-MEMORY ONLY, NOT persisted.
  // Reset on app restart. After SSO success, server profiles table is source of truth.
  ageVerified: boolean;
  consentGiven: boolean;
  dateOfBirth: string | null; // ISO date string, stored in-memory until SSO completes

  // Trial mode — IN-MEMORY ONLY, resets on app restart
  trialMode: boolean;
  trialUsage: number;

  // Actions
  initializeAuth: () => Promise<void>;
  signInWithProvider: (
    provider: SSOProvider,
    ageVerification: AgeVerificationData
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  setAgeVerified: (verified: boolean) => void;
  setConsentGiven: (given: boolean) => void;
  enterTrialMode: () => void;
  incrementTrialUsage: () => { limitReached: boolean };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  ageVerified: false,
  consentGiven: false,
  dateOfBirth: null,
  trialMode: false,
  trialUsage: 0,

  initializeAuth: async () => {
    try {
      console.log('[AuthStore] Initializing auth...');
      set({ loading: true, error: null });

      console.log('[AuthStore] Getting session...');
      const session = await getSession();
      console.log('[AuthStore] Session retrieved:', !!session);

      set({
        session,
        user: session?.user ?? null,
      });

      // If user has existing session, check their onboarding status from server
      if (session?.user) {
        console.log('[AuthStore] Checking onboarding status for user:', session.user.id);
        try {
          // Add timeout to prevent infinite hang
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Onboarding check timeout')), 10000)
          );

          const { hasCompletedOnboarding } =
            await import('@/services/onboarding/onboarding.service');
          const { useOnboardingStore } = await import('@/stores/onboarding.store');

          const completed = (await Promise.race([
            hasCompletedOnboarding(session.user.id),
            timeoutPromise,
          ])) as boolean;

          console.log('[AuthStore] Onboarding check result:', completed);
          if (completed) {
            console.log('[AuthStore] Marking onboarding as completed');
            useOnboardingStore.getState().completeOnboarding();
          } else {
            console.log('[AuthStore] Onboarding not completed, keeping as incomplete');
          }
        } catch (onboardingError) {
          console.error('[AuthStore] Onboarding check failed:', onboardingError);
          // Continue anyway - don't block app from loading
        }
      }

      // Set loading false AFTER onboarding check completes (or fails)
      console.log('[AuthStore] Auth initialization complete');
      set({ loading: false });

      // Subscribe to auth state changes — differentiate event types
      const supabase = getSupabase();
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
        if (event === 'SIGNED_OUT') {
          // Could be voluntary signout or failed token refresh
          const wasAuthenticated = get().session !== null;
          set({
            session: null,
            user: null,
            ageVerified: false,
            consentGiven: false,
            dateOfBirth: null,
            trialMode: false,
            trialUsage: 0,
            // Set error only for involuntary signout (refresh failure)
            error: wasAuthenticated ? 'AUTH_SESSION_EXPIRED' : null,
          });
        } else {
          set({
            session,
            user: session?.user ?? null,
          });
        }
      });
    } catch {
      set({ loading: false, error: 'AUTH_INIT_FAILED' });
    }
  },

  signInWithProvider: async (provider, ageVerification) => {
    try {
      set({ loading: true, error: null });
      const result = await signInWithProvider(provider, ageVerification);

      if (!result) {
        // User cancelled
        set({ loading: false });
        return false;
      }

      set({
        session: result.session,
        user: result.user,
        loading: false,
        trialMode: false,
        trialUsage: 0,
      });

      // Check server for existing onboarding completion status
      // Returning users skip onboarding, new users go through it
      console.log('[AuthStore] Checking onboarding after sign-in for user:', result.user?.id);
      const { hasCompletedOnboarding } = await import('@/services/onboarding/onboarding.service');
      const { useOnboardingStore } = await import('@/stores/onboarding.store');

      if (result.user) {
        const completed = await hasCompletedOnboarding(result.user.id);
        console.log('[AuthStore] Post-login onboarding check result:', completed);
        if (completed) {
          // Returning user — mark onboarding as complete
          console.log('[AuthStore] Marking onboarding as completed (returning user)');
          useOnboardingStore.getState().completeOnboarding();
        } else {
          // New user — reset onboarding state to ensure clean flow
          console.log('[AuthStore] Resetting onboarding (new user)');
          useOnboardingStore.getState().resetOnboarding();
        }
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AUTH_PROVIDER_ERROR';
      set({ loading: false, error: message });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await authSignOut();
      set({
        user: null,
        session: null,
        loading: false,
        ageVerified: false,
        consentGiven: false,
        dateOfBirth: null,
        trialMode: false,
        trialUsage: 0,
      });

      // Reset onboarding state on sign out
      const { useOnboardingStore } = await import('@/stores/onboarding.store');
      useOnboardingStore.getState().resetOnboarding();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AUTH_SIGNOUT_FAILED';
      set({ loading: false, error: message });
    }
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
  setAgeVerified: (verified) => set({ ageVerified: verified }),
  setConsentGiven: (given) => set({ consentGiven: given }),

  enterTrialMode: () => set({ trialMode: true, trialUsage: 0 }),

  incrementTrialUsage: () => {
    const current = get().trialUsage + 1;
    set({ trialUsage: current });
    return { limitReached: current >= TRIAL_LIMIT };
  },
}));
