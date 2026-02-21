import { useOnboardingStore } from '@/stores/onboarding.store';
import { UserLevel } from '@/types/onboarding';
import type { UserLevelValue } from '@/types/onboarding';

/**
 * Tab names matching Expo Router (tabs) folder structure.
 * ADR-3: Abstract hook for tab unlock state — currently reads from
 * onboarding store. Story 5.1 will swap to learning-engine store.
 */
export type TabName = 'home' | 'learn' | 'scan' | 'progress' | 'profile';

export type TabUnlockState = Record<TabName, boolean>;

export interface UseTabUnlockResult {
  unlocked: TabUnlockState;
  lockedMessage: string;
}

const LOCKED_MESSAGE = 'Học thêm để mở khóa tính năng này!';

/**
 * Determines which tabs are unlocked based on user level.
 * home and profile are ALWAYS unlocked (ADR: profile for settings/logout access).
 */
export function getTabUnlockState(level: UserLevelValue | null): TabUnlockState {
  const safeLevel = level ?? UserLevel.Beginner;

  return {
    home: true, // Always unlocked — core learning entry point
    learn: true, // TODO: restore `safeLevel >= UserLevel.PreIntermediate` after Story 1.8
    scan: true, // TODO: restore `safeLevel >= UserLevel.Intermediate` after Story 1.8
    progress: true, // TODO: restore `safeLevel >= UserLevel.UpperIntermediate` after Story 1.8
    profile: true, // Always unlocked — settings, logout, data privacy (FR48-FR53)
  };
}

/**
 * React hook returning tab unlock state from current user level.
 * ADR-3: Abstracts state source for easy swap in Story 5.1.
 */
export function useTabUnlock(): UseTabUnlockResult {
  const determinedLevel = useOnboardingStore((s) => s.determinedLevel);

  return {
    unlocked: getTabUnlockState(determinedLevel),
    lockedMessage: LOCKED_MESSAGE,
  };
}
