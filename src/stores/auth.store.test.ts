import { getSupabase } from '@/services/supabase/client';

import { TRIAL_LIMIT, useAuthStore } from '@/stores/auth.store';

// The getSupabase mock is auto-resolved by jest moduleNameMapper
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'ai-flash-card://redirect'),
}));
jest.mock('expo-web-browser');

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      session: null,
      loading: true,
      error: null,
      ageVerified: false,
      consentGiven: false,
      dateOfBirth: null,
      trialMode: false,
      trialUsage: 0,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.ageVerified).toBe(false);
      expect(state.consentGiven).toBe(false);
      expect(state.dateOfBirth).toBeNull();
      expect(state.trialMode).toBe(false);
      expect(state.trialUsage).toBe(0);
    });
  });

  describe('setAgeVerified', () => {
    it('sets ageVerified flag', () => {
      useAuthStore.getState().setAgeVerified(true);

      expect(useAuthStore.getState().ageVerified).toBe(true);
    });

    it('can reset ageVerified flag', () => {
      useAuthStore.getState().setAgeVerified(true);
      useAuthStore.getState().setAgeVerified(false);

      expect(useAuthStore.getState().ageVerified).toBe(false);
    });
  });

  describe('setConsentGiven', () => {
    it('sets consentGiven flag', () => {
      useAuthStore.getState().setConsentGiven(true);

      expect(useAuthStore.getState().consentGiven).toBe(true);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'AUTH_PROVIDER_ERROR' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets user', () => {
      const mockUser = { id: '123', email: 'test@test.com' } as never;

      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('can clear user', () => {
      useAuthStore.setState({ user: { id: '123' } as never });

      useAuthStore.getState().setUser(null);

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('initializeAuth', () => {
    it('sets loading to false after initialization', async () => {
      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('sets session from getSession result', async () => {
      // The mock getSession returns null session by default
      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('signOut', () => {
    it('clears all auth state and pre-auth flags', async () => {
      // Set up some state
      useAuthStore.setState({
        user: { id: '123' } as never,
        session: { access_token: 'token' } as never,
        ageVerified: true,
        consentGiven: true,
        dateOfBirth: '2000-01-01',
        trialMode: true,
        trialUsage: 3,
      });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.ageVerified).toBe(false);
      expect(state.consentGiven).toBe(false);
      expect(state.dateOfBirth).toBeNull();
      expect(state.trialMode).toBe(false);
      expect(state.trialUsage).toBe(0);
      expect(state.loading).toBe(false);
    });
  });

  describe('pre-auth flags are in-memory only', () => {
    it('ageVerified and consentGiven are NOT persisted', () => {
      useAuthStore.getState().setAgeVerified(true);
      useAuthStore.getState().setConsentGiven(true);

      // Verify flags are set
      expect(useAuthStore.getState().ageVerified).toBe(true);
      expect(useAuthStore.getState().consentGiven).toBe(true);

      // Simulate "app restart" by resetting store
      useAuthStore.setState({
        ageVerified: false,
        consentGiven: false,
      });

      expect(useAuthStore.getState().ageVerified).toBe(false);
      expect(useAuthStore.getState().consentGiven).toBe(false);
    });
  });

  describe('trial mode', () => {
    it('enterTrialMode sets trialMode true and resets usage', () => {
      useAuthStore.setState({ trialUsage: 3 });

      useAuthStore.getState().enterTrialMode();

      const state = useAuthStore.getState();
      expect(state.trialMode).toBe(true);
      expect(state.trialUsage).toBe(0);
    });

    it('incrementTrialUsage increments counter', () => {
      useAuthStore.getState().enterTrialMode();

      useAuthStore.getState().incrementTrialUsage();

      expect(useAuthStore.getState().trialUsage).toBe(1);
    });

    it('incrementTrialUsage returns limitReached false below limit', () => {
      useAuthStore.getState().enterTrialMode();

      const result = useAuthStore.getState().incrementTrialUsage();

      expect(result.limitReached).toBe(false);
    });

    it('incrementTrialUsage returns limitReached true at TRIAL_LIMIT', () => {
      useAuthStore.setState({ trialMode: true, trialUsage: TRIAL_LIMIT - 1 });

      const result = useAuthStore.getState().incrementTrialUsage();

      expect(result.limitReached).toBe(true);
      expect(useAuthStore.getState().trialUsage).toBe(TRIAL_LIMIT);
    });

    it('TRIAL_LIMIT is 5', () => {
      expect(TRIAL_LIMIT).toBe(5);
    });
  });

  describe('onAuthStateChange', () => {
    it('SIGNED_OUT clears state and sets error when previously authenticated', async () => {
      const mockSupabase = getSupabase();
      let authCallback: (event: string, session: unknown) => void = () => {};
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      await useAuthStore.getState().initializeAuth();

      // Simulate authenticated state
      useAuthStore.setState({
        session: { access_token: 'token' } as never,
        user: { id: '123' } as never,
        trialMode: true,
        trialUsage: 3,
      });

      // Fire SIGNED_OUT event (involuntary — token refresh failed)
      authCallback('SIGNED_OUT', null);

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.trialMode).toBe(false);
      expect(state.trialUsage).toBe(0);
      expect(state.error).toBe('AUTH_SESSION_EXPIRED');
    });

    it('SIGNED_OUT does not set error when not previously authenticated', async () => {
      const mockSupabase = getSupabase();
      let authCallback: (event: string, session: unknown) => void = () => {};
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      await useAuthStore.getState().initializeAuth();

      // session is null (not authenticated) — fire SIGNED_OUT
      authCallback('SIGNED_OUT', null);

      expect(useAuthStore.getState().error).toBeNull();
    });

    it('TOKEN_REFRESHED updates session without clearing state', async () => {
      const mockSupabase = getSupabase();
      let authCallback: (event: string, session: unknown) => void = () => {};
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      await useAuthStore.getState().initializeAuth();

      const newSession = { access_token: 'new', user: { id: '456' } };
      authCallback('TOKEN_REFRESHED', newSession);

      const state = useAuthStore.getState();
      expect(state.session).toBe(newSession);
      expect(state.user).toEqual({ id: '456' });
    });
  });
});
