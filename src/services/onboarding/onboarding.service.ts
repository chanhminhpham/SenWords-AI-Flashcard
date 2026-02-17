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
 * Check if user has completed onboarding by fetching their profile.
 * Returns true if both learning_goal and level are set in the database.
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('learning_goal, level')
      .eq('id', userId)
      .single();

    if (error) {
      Sentry.captureException(error, {
        tags: { code: 'ONBOARDING_CHECK_FAILED' },
      });
      return false;
    }

    // User has completed onboarding if both fields are set
    return data?.learning_goal !== null && data?.level !== null;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { code: 'ONBOARDING_CHECK_ERROR' },
    });
    return false;
  }
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

      // Use RPC function instead of direct UPDATE to bypass RLS timing issues
      const { error } = await supabase.rpc('update_profile_onboarding', {
        user_id: userId,
        goal: goal,
        user_level: level,
      });

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
