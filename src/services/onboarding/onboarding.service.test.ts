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
    it('updates profiles table with goal and level', async () => {
      const result = await saveOnboardingResult('user-123', 'ielts', UserLevel.Intermediate);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('returns error when Supabase update fails', async () => {
      const mockFrom = mockSupabase.from as jest.Mock;
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
      });

      const result = await saveOnboardingResult('user-123', 'ielts', UserLevel.Beginner);

      expect(result).toEqual({
        success: false,
        error: 'ONBOARDING_SAVE_FAILED',
      });
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('returns network error after exhausting retries', async () => {
      jest.useFakeTimers();
      const mockFrom = mockSupabase.from as jest.Mock;
      const networkError = () => {
        throw new Error('Network failure');
      };
      mockFrom
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
      const mockFrom = mockSupabase.from as jest.Mock;
      // First call throws, second call uses default mock (success)
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Network failure');
      });

      const promise = saveOnboardingResult('user-123', 'ielts', UserLevel.Intermediate);

      // Advance past first retry delay
      await jest.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });
});
