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
 * Extract authorization code from redirect URL (PKCE flow).
 * Returns the code or null if not found.
 */
function extractCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('code');
  } catch {
    return null;
  }
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
  // Use upsert to handle race condition: the on_auth_user_created trigger
  // auto-creates the profile row, but if it hasn't completed yet, an UPDATE
  // would match 0 rows and silently lose data. Upsert ensures the data is saved.
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      date_of_birth: ageVerification.dateOfBirth,
      age_verified: true,
      privacy_consent: true,
    },
    { onConflict: 'id' }
  );

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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectUri(),
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('AUTH_NO_URL');

  // Open system browser for OAuth
  const result = await WebBrowser.openAuthSessionAsync(data.url, getRedirectUri());

  if (result.type !== 'success') {
    // User cancelled or dismissed
    return null;
  }

  // PKCE: extract code from redirect URL
  const code = extractCode(result.url);
  if (!code) throw new Error('AUTH_NO_CODE');

  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) throw sessionError;

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
