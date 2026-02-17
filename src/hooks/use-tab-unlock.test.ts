import { UserLevel } from '@/types/onboarding';

import { getTabUnlockState } from './use-tab-unlock';

describe('getTabUnlockState', () => {
  it('unlocks only home and profile for Beginner (level 0)', () => {
    const state = getTabUnlockState(UserLevel.Beginner);
    expect(state).toEqual({
      home: true,
      learn: false,
      scan: false,
      progress: false,
      profile: true,
    });
  });

  it('unlocks home, learn, profile for PreIntermediate (level 1)', () => {
    const state = getTabUnlockState(UserLevel.PreIntermediate);
    expect(state).toEqual({
      home: true,
      learn: true,
      scan: false,
      progress: false,
      profile: true,
    });
  });

  it('unlocks home, learn, scan, profile for Intermediate (level 2)', () => {
    const state = getTabUnlockState(UserLevel.Intermediate);
    expect(state).toEqual({
      home: true,
      learn: true,
      scan: true,
      progress: false,
      profile: true,
    });
  });

  it('unlocks all tabs for UpperIntermediate (level 3)', () => {
    const state = getTabUnlockState(UserLevel.UpperIntermediate);
    expect(state).toEqual({
      home: true,
      learn: true,
      scan: true,
      progress: true,
      profile: true,
    });
  });

  it('defaults to Beginner when level is null', () => {
    const state = getTabUnlockState(null);
    expect(state).toEqual({
      home: true,
      learn: false,
      scan: false,
      progress: false,
      profile: true,
    });
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
