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

    it('initiates OAuth flow and sets session from token', async () => {
      // Mock signInWithOAuth returns URL
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize', provider: 'google' },
        error: null,
      });

      // Mock browser returns with token in hash
      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'ai-flash-card://redirect#access_token=test-token&refresh_token=refresh-token',
      } as WebBrowser.WebBrowserAuthSessionResult);

      // Mock setSession
      (mockAuth.setSession as jest.Mock).mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
          user: { id: 'user-123' },
        },
        error: null,
      });

      // Mock profile RPC
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({ error: null });

      const result = await signInWithProvider('google', ageVerification);

      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'ai-flash-card://redirect',
          skipBrowserRedirect: true,
        },
      });
      expect(mockAuth.setSession).toHaveBeenCalledWith({
        access_token: 'test-token',
        refresh_token: 'refresh-token',
      });
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

    it('throws AUTH_NO_TOKEN when redirect has no access_token', async () => {
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize', provider: 'facebook' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'ai-flash-card://redirect', // No access_token in hash
      } as WebBrowser.WebBrowserAuthSessionResult);

      await expect(signInWithProvider('facebook', ageVerification)).rejects.toThrow(
        'AUTH_NO_TOKEN'
      );
    });

    it('saves age verification data to profile after SSO success', async () => {
      (mockAuth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://auth.example.com/authorize', provider: 'apple' },
        error: null,
      });

      mockWebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success',
        url: 'ai-flash-card://redirect#access_token=test-token&refresh_token=refresh-token',
      } as WebBrowser.WebBrowserAuthSessionResult);

      (mockAuth.setSession as jest.Mock).mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
          user: { id: 'user-456' },
        },
        error: null,
      });

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({ error: null });

      await signInWithProvider('apple', ageVerification);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_profile', {
        user_id: 'user-456',
        dob: '2000-01-15',
        verified: true,
        consent: true,
      });
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
