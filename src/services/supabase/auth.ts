import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { getSupabase } from '@/services/supabase/client';

export type SSOProvider = 'google' | 'facebook' | 'apple';

export interface AgeVerificationData {
  dateOfBirth: string; // ISO date string YYYY-MM-DD
  privacyConsent: true; // Must be literal true
}

let _redirectUri: string | null = null;

function getRedirectUri(): string {
  if (!_redirectUri) {
    _redirectUri = makeRedirectUri({ scheme: 'ai-flash-card' });
  }
  return _redirectUri;
}

/**
 * Save age verification + privacy consent to the profiles table.
 * consent_timestamp is server-generated via DEFAULT NOW() — NOT sent from client.
 */
async function saveAgeVerification(
  userId: string,
  ageVerification: AgeVerificationData
): Promise<void> {
  const supabase = getSupabase();

  // Use RPC function with SECURITY DEFINER to bypass RLS timing issues
  const { error } = await supabase.rpc('upsert_profile', {
    user_id: userId,
    dob: ageVerification.dateOfBirth,
    verified: true,
    consent: true,
  });

  if (error) throw error;
}

/**
 * Sign in with SSO provider (Google, Facebook, or Apple) via PKCE flow.
 * Requires age verification data — saved to profile after successful auth.
 * Returns session data or null if user cancelled.
 */
export async function signInWithProvider(
  provider: SSOProvider,
  ageVerification: AgeVerificationData
) {
  const supabase = getSupabase();
  const redirectUri = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    console.error('[AUTH] signInWithOAuth error:', error);
    throw error;
  }
  if (!data.url) {
    console.error('[AUTH] No OAuth URL returned');
    throw new Error('AUTH_NO_URL');
  }

  // Open system browser for OAuth
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== 'success') {
    // User cancelled or dismissed
    return null;
  }

  // Implicit flow: extract session from redirect URL hash

  // With implicit flow, Supabase handles session automatically via detectSessionInUrl
  // But since we have detectSessionInUrl: false, we need to manually parse and set session
  const url = new URL(result.url);
  const hashParams = new URLSearchParams(url.hash.substring(1)); // Remove # and parse

  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken) {
    console.error('[AUTH] No access_token in redirect URL:', result.url);
    throw new Error('AUTH_NO_TOKEN');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || '',
  });

  if (sessionError) {
    throw sessionError;
  }

  // Save age verification to profile after successful SSO
  if (sessionData.user) {
    await saveAgeVerification(sessionData.user.id, ageVerification);
  }

  return sessionData;
}

/**
 * Sign out — clears session from both SecureStore key + AsyncStorage data.
 * Supabase client handles storage cleanup via SupabaseStorageAdapter.removeItem.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get current session (returns null if not authenticated). */
export async function getSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** Get current user (returns null if not authenticated). */
export async function getUser() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
