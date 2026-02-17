// Onboarding constants for Story 1.4: Goal Selection & Placement Test

import type { FeatureUnlockState, LearningGoal, UserLevelValue } from '@/types/onboarding';
import { UserLevel } from '@/types/onboarding';

// ─── Goal Options ──────────────────────────────────────────────

export const GOAL_OPTIONS: readonly LearningGoal[] = [
  {
    id: 'ielts',
    labelKey: 'goals.ielts.label',
    icon: 'target',
    descriptionKey: 'goals.ielts.description',
  },
  {
    id: 'business',
    labelKey: 'goals.business.label',
    icon: 'briefcase-outline',
    descriptionKey: 'goals.business.description',
  },
  {
    id: 'travel',
    labelKey: 'goals.travel.label',
    icon: 'airplane',
    descriptionKey: 'goals.travel.description',
  },
  {
    id: 'reading',
    labelKey: 'goals.reading.label',
    icon: 'book-open-variant',
    descriptionKey: 'goals.reading.description',
  },
  {
    id: 'movies',
    labelKey: 'goals.movies.label',
    icon: 'movie-open-outline',
    descriptionKey: 'goals.movies.description',
  },
  {
    id: 'conversation',
    labelKey: 'goals.conversation.label',
    icon: 'chat-outline',
    descriptionKey: 'goals.conversation.description',
  },
] as const;

export const DEFAULT_GOAL_ID = 'conversation' as const;

// ─── Level Thresholds ──────────────────────────────────────────

/**
 * Maps correct answer count (0-10) to user level.
 * 0-3 → Beginner, 4-6 → PreIntermediate, 7-8 → Intermediate, 9-10 → UpperIntermediate
 */
export function calculateLevelFromScore(correctCount: number): UserLevelValue {
  if (correctCount <= 3) return UserLevel.Beginner;
  if (correctCount <= 6) return UserLevel.PreIntermediate;
  if (correctCount <= 8) return UserLevel.Intermediate;
  return UserLevel.UpperIntermediate;
}

// ─── Level Labels (i18n keys) ─────────────────────────────────

export interface LevelInfo {
  index: UserLevelValue;
  labelKey: string;
  descriptionKey: string;
}

export const LEVEL_INFO: readonly LevelInfo[] = [
  {
    index: UserLevel.Beginner,
    labelKey: 'levels.beginner.label',
    descriptionKey: 'levels.beginner.description',
  },
  {
    index: UserLevel.PreIntermediate,
    labelKey: 'levels.preIntermediate.label',
    descriptionKey: 'levels.preIntermediate.description',
  },
  {
    index: UserLevel.Intermediate,
    labelKey: 'levels.intermediate.label',
    descriptionKey: 'levels.intermediate.description',
  },
  {
    index: UserLevel.UpperIntermediate,
    labelKey: 'levels.upperIntermediate.label',
    descriptionKey: 'levels.upperIntermediate.description',
  },
] as const;

export function getLevelLabelKey(level: UserLevelValue): string {
  return LEVEL_INFO[level]?.labelKey ?? 'levels.undefined';
}

// ─── Feature Unlock Map ────────────────────────────────────────

export function getFeatureUnlockState(level: UserLevelValue): FeatureUnlockState {
  return {
    swipeUpEnabled: level >= UserLevel.PreIntermediate,
    largerFonts: level === UserLevel.Beginner,
    minimalUI: level === UserLevel.Beginner,
  };
}

// ─── Encouraging Messages (i18n keys) ─────────────────────────

const LEVEL_KEY_MAP: Record<UserLevelValue, string> = {
  [UserLevel.Beginner]: 'beginner',
  [UserLevel.PreIntermediate]: 'preIntermediate',
  [UserLevel.Intermediate]: 'intermediate',
  [UserLevel.UpperIntermediate]: 'upperIntermediate',
};

export function getEncouragementKey(level: UserLevelValue): string {
  return `encouragement.${LEVEL_KEY_MAP[level]}`;
}
