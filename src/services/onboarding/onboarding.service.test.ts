import * as Sentry from '@sentry/react-native';

import { getSupabase } from '@/services/supabase/client';
import { UserLevel } from '@/types/onboarding';

import { saveOnboardingResult } from './onboarding.service';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

describe('onboarding.service', () => {
  const mockSupabase = getSupabase();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('saveOnboardingResult', () => {
    it('calls RPC function to update onboarding data', async () => {
      const result = await saveOnboardingResult('user-123', 'ielts', UserLevel.Intermediate);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_profile_onboarding', {
        user_id: 'user-123',
        goal: 'ielts',
        user_level: UserLevel.Intermediate,
      });
    });

    it('returns error when RPC call fails', async () => {
      const mockRpc = mockSupabase.rpc as jest.Mock;
      mockRpc.mockResolvedValueOnce({ error: { message: 'RPC error' }, data: null });

      const result = await saveOnboardingResult('user-123', 'ielts', UserLevel.Beginner);

      expect(result).toEqual({
        success: false,
        error: 'ONBOARDING_SAVE_FAILED',
      });
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('returns network error after exhausting retries', async () => {
      jest.useFakeTimers();
      const mockRpc = mockSupabase.rpc as jest.Mock;
      const networkError = () => {
        throw new Error('Network failure');
      };
      mockRpc
        .mockImplementationOnce(networkError)
        .mockImplementationOnce(networkError)
        .mockImplementationOnce(networkError);

      const promise = saveOnboardingResult('user-123', 'travel', UserLevel.PreIntermediate);

      // Advance past all retry delays
      await jest.advanceTimersByTimeAsync(5000);

      const result = await promise;

      expect(result).toEqual({
        success: false,
        error: 'ONBOARDING_NETWORK_ERROR',
      });
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('retries on network error and succeeds', async () => {
      jest.useFakeTimers();
      const mockRpc = mockSupabase.rpc as jest.Mock;
      // First call throws, second call uses default mock (success)
      mockRpc.mockImplementationOnce(() => {
        throw new Error('Network failure');
      });

      const promise = saveOnboardingResult('user-123', 'ielts', UserLevel.Intermediate);

      // Advance past first retry delay
      await jest.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });
  });
});
