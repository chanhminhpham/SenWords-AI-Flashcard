import { UserLevel } from '@/types/onboarding';

import { getTabUnlockState } from './use-tab-unlock';

describe('getTabUnlockState', () => {
  // NOTE: All tabs are temporarily unlocked for testing (TODO in use-tab-unlock.ts).
  // These tests reflect the current "all unlocked" state.
  // Restore level-gated tests when progressive unlock is re-enabled.

  it('unlocks all tabs regardless of level (temporary override)', () => {
    const allUnlocked = {
      home: true,
      learn: true,
      scan: true,
      progress: true,
      profile: true,
    };

    expect(getTabUnlockState(UserLevel.Beginner)).toEqual(allUnlocked);
    expect(getTabUnlockState(UserLevel.PreIntermediate)).toEqual(allUnlocked);
    expect(getTabUnlockState(UserLevel.Intermediate)).toEqual(allUnlocked);
    expect(getTabUnlockState(UserLevel.UpperIntermediate)).toEqual(allUnlocked);
    expect(getTabUnlockState(null)).toEqual(allUnlocked);
  });

  it('always keeps home unlocked', () => {
    for (const level of Object.values(UserLevel)) {
      expect(getTabUnlockState(level).home).toBe(true);
    }
  });

  it('always keeps profile unlocked', () => {
    for (const level of Object.values(UserLevel)) {
      expect(getTabUnlockState(level).profile).toBe(true);
    }
  });
});
