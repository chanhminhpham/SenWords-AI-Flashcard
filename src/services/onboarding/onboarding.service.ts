// Onboarding service — saves goal + level to Supabase profiles table
import * as Sentry from '@sentry/react-native';

import { getSupabase } from '@/services/supabase/client';
import type { LearningGoalId, UserLevelValue } from '@/types/onboarding';

interface ServiceResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Save onboarding result (goal + level) to profiles table.
 * Profile row already exists (created by auth signup trigger).
 * Retries up to MAX_RETRIES times on network errors.
 */
export async function saveOnboardingResult(
  userId: string,
  goal: LearningGoalId,
  level: UserLevelValue
): Promise<ServiceResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ learning_goal: goal, level })
        .eq('id', userId);

      if (error) {
        Sentry.captureException(error, {
          tags: { code: 'ONBOARDING_SAVE_FAILED', attempt: String(attempt) },
        });
        return { success: false, error: 'ONBOARDING_SAVE_FAILED' };
      }

      return { success: true };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  Sentry.captureException(lastError, {
    tags: { code: 'ONBOARDING_NETWORK_ERROR', retries: String(MAX_RETRIES) },
  });
  return { success: false, error: 'ONBOARDING_NETWORK_ERROR' };
}
