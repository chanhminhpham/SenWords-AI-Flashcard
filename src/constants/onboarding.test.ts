import { UserLevel } from '@/types/onboarding';

import {
  calculateLevelFromScore,
  DEFAULT_GOAL_ID,
  getFeatureUnlockState,
  getLevelLabel,
  GOAL_OPTIONS,
  LEVEL_ENCOURAGEMENTS,
  LEVEL_INFO,
} from './onboarding';

describe('onboarding constants', () => {
  describe('GOAL_OPTIONS', () => {
    it('contains 6 goals', () => {
      expect(GOAL_OPTIONS).toHaveLength(6);
    });

    it('each goal has required fields', () => {
      for (const goal of GOAL_OPTIONS) {
        expect(goal.id).toBeTruthy();
        expect(goal.label).toBeTruthy();
        expect(goal.icon).toBeTruthy();
        expect(goal.description).toBeTruthy();
      }
    });

    it('has unique IDs', () => {
      const ids = GOAL_OPTIONS.map((g) => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('includes the default goal ID', () => {
      const ids = GOAL_OPTIONS.map((g) => g.id);
      expect(ids).toContain(DEFAULT_GOAL_ID);
    });
  });

  describe('DEFAULT_GOAL_ID', () => {
    it('is conversation', () => {
      expect(DEFAULT_GOAL_ID).toBe('conversation');
    });
  });

  describe('calculateLevelFromScore', () => {
    it.each([
      [0, UserLevel.Beginner],
      [1, UserLevel.Beginner],
      [3, UserLevel.Beginner],
      [4, UserLevel.PreIntermediate],
      [6, UserLevel.PreIntermediate],
      [7, UserLevel.Intermediate],
      [8, UserLevel.Intermediate],
      [9, UserLevel.UpperIntermediate],
      [10, UserLevel.UpperIntermediate],
    ])('maps score %d to level %d', (score, expected) => {
      expect(calculateLevelFromScore(score)).toBe(expected);
    });
  });

  describe('LEVEL_INFO', () => {
    it('contains 4 levels', () => {
      expect(LEVEL_INFO).toHaveLength(4);
    });

    it('covers all UserLevel values', () => {
      const indices = LEVEL_INFO.map((l) => l.index);
      expect(indices).toEqual([0, 1, 2, 3]);
    });
  });

  describe('getLevelLabel', () => {
    it('returns label for valid levels', () => {
      expect(getLevelLabel(UserLevel.Beginner)).toBe('Người mới bắt đầu');
      expect(getLevelLabel(UserLevel.UpperIntermediate)).toBe('Trên trung cấp');
    });

    it('returns fallback for invalid level', () => {
      expect(getLevelLabel(99 as never)).toBe('Không xác định');
    });
  });

  describe('getFeatureUnlockState', () => {
    it('beginner: no swipe up, large fonts, minimal UI', () => {
      const state = getFeatureUnlockState(UserLevel.Beginner);
      expect(state.swipeUpEnabled).toBe(false);
      expect(state.largerFonts).toBe(true);
      expect(state.minimalUI).toBe(true);
    });

    it('pre-intermediate+: swipe up enabled, normal fonts', () => {
      const state = getFeatureUnlockState(UserLevel.PreIntermediate);
      expect(state.swipeUpEnabled).toBe(true);
      expect(state.largerFonts).toBe(false);
      expect(state.minimalUI).toBe(false);
    });

    it('upper-intermediate: all features enabled', () => {
      const state = getFeatureUnlockState(UserLevel.UpperIntermediate);
      expect(state.swipeUpEnabled).toBe(true);
      expect(state.largerFonts).toBe(false);
      expect(state.minimalUI).toBe(false);
    });
  });

  describe('LEVEL_ENCOURAGEMENTS', () => {
    it('has an encouragement for every level', () => {
      expect(LEVEL_ENCOURAGEMENTS[UserLevel.Beginner]).toBeTruthy();
      expect(LEVEL_ENCOURAGEMENTS[UserLevel.PreIntermediate]).toBeTruthy();
      expect(LEVEL_ENCOURAGEMENTS[UserLevel.Intermediate]).toBeTruthy();
      expect(LEVEL_ENCOURAGEMENTS[UserLevel.UpperIntermediate]).toBeTruthy();
    });
  });
});
