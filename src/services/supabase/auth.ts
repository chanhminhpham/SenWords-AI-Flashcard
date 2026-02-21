import Constants from 'expo-constants';
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
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) {
      // Expo Go: Supabase rejects exp:// scheme, use Expo auth proxy (HTTPS).
      // The proxy redirects back to exp:// which Expo Go intercepts.
      _redirectUri = 'https://auth.expo.io/@chanhpham/ai-flash-card';
    } else {
      _redirectUri = makeRedirectUri({ scheme: 'ai-flash-card' });
    }
    console.log('[AUTH] Redirect URI:', _redirectUri, isExpoGo ? '(Expo Go)' : '(Dev Build)');
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

  console.log('[AUTH] OAuth URL:', data.url);
  console.log('[AUTH] Listening for redirect to:', redirectUri);

  // Open system browser for OAuth
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  console.log('[AUTH] Browser result type:', result.type);

  let sessionData;

  if (result.type === 'success') {
    // Browser redirected back properly (dev build with custom scheme)
    console.log('[AUTH] Browser redirect URL:', (result as { url: string }).url);

    const url = new URL((result as { url: string }).url);
    const hashParams = new URLSearchParams(url.hash.substring(1));

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!accessToken) {
      console.error('[AUTH] No access_token in redirect URL:', (result as { url: string }).url);
      throw new Error('AUTH_NO_TOKEN');
    }

    const { data: setData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError) throw sessionError;
    sessionData = setData;
  } else {
    // Browser didn't redirect back (Expo Go — exp:// not supported by Supabase).
    // Check if session was set via onAuthStateChange listener anyway.
    console.log('[AUTH] Browser did not redirect. Checking for session...');
    const { data: check } = await supabase.auth.getSession();

    if (!check.session) {
      console.log('[AUTH] No session found — user likely cancelled');
      return null;
    }

    console.log('[AUTH] Session found via auth listener (Expo Go fallback)');
    sessionData = { session: check.session, user: check.session.user };
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
