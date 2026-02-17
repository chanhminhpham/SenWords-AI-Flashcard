import * as WebBrowser from 'expo-web-browser';

import { getSupabase } from '@/services/supabase/client';
import { signInWithProvider, signOut, getSession, getUser } from '@/services/supabase/auth';

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'ai-flash-card://redirect'),
}));
jest.mock('expo-web-browser');

const mockWebBrowser = WebBrowser as jest.Mocked<typeof WebBrowser>;
const mockSupabase = getSupabase();
const mockAuth = mockSupabase.auth as jest.Mocked<typeof mockSupabase.auth>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithProvider', () => {
    const ageVerification = { dateOfBirth: '2000-01-15', privacyConsent: true as const };

    it('initiates OAuth flow and exchanges code for session', async () => {
      // Mock signInWithOAuth returns URL
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize?code_challenge=xxx', provider: 'google' },
        error: null,
      });

      // Mock browser returns with code
      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'ai-flash-card://redirect?code=test-auth-code',
      } as WebBrowser.WebBrowserAuthSessionResult);

      // Mock code exchange
      (mockAuth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: {
          session: { access_token: 'token' },
          user: { id: 'user-123' },
        },
        error: null,
      });

      // Mock profile upsert
      (mockSupabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await signInWithProvider('google', ageVerification);

      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'ai-flash-card://redirect',
          skipBrowserRedirect: true,
        },
      });
      expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith('test-auth-code');
      expect(result).toBeTruthy();
    });

    it('returns null when user cancels OAuth', async () => {
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize', provider: 'google' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'cancel',
      } as WebBrowser.WebBrowserAuthSessionResult);

      const result = await signInWithProvider('google', ageVerification);

      expect(result).toBeNull();
    });

    it('throws on OAuth error', async () => {
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: null, provider: null },
        error: { message: 'Provider down' },
      });

      await expect(signInWithProvider('google', ageVerification)).rejects.toEqual({
        message: 'Provider down',
      });
    });

    it('throws AUTH_NO_CODE when redirect has no code', async () => {
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize', provider: 'facebook' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'ai-flash-card://redirect', // No code parameter
      } as WebBrowser.WebBrowserAuthSessionResult);

      await expect(signInWithProvider('facebook', ageVerification)).rejects.toThrow('AUTH_NO_CODE');
    });

    it('saves age verification data to profile after SSO success', async () => {
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize', provider: 'apple' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'ai-flash-card://redirect?code=test-code',
      } as WebBrowser.WebBrowserAuthSessionResult);

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });

      (mockAuth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: {
          session: { access_token: 'token' },
          user: { id: 'user-456' },
        },
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

      await signInWithProvider('apple', ageVerification);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          id: 'user-456',
          date_of_birth: '2000-01-15',
          age_verified: true,
          privacy_consent: true,
        },
        { onConflict: 'id' }
      );
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      (mockAuth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await signOut();

      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('throws on signOut error', async () => {
      (mockAuth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Session expired' },
      });

      await expect(signOut()).rejects.toEqual({ message: 'Session expired' });
    });
  });

  describe('getSession', () => {
    it('returns session when authenticated', async () => {
      const mockSession = { access_token: 'test', user: { id: '123' } };
      (mockAuth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await getSession();

      expect(result).toEqual(mockSession);
    });

    it('returns null when not authenticated', async () => {
      (mockAuth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('returns user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (mockAuth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUser();

      expect(result).toEqual(mockUser);
    });

    it('returns null when not authenticated', async () => {
      (mockAuth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUser();

      expect(result).toBeNull();
    });
  });
});
