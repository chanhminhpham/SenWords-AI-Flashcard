import { UserLevel } from '@/types/onboarding';

import { useOnboardingStore } from './onboarding.store';

describe('onboarding.store', () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding();
  });

  describe('initial state', () => {
    it('starts with null/empty defaults', () => {
      const state = useOnboardingStore.getState();
      expect(state.selectedGoal).toBeNull();
      expect(state.placementResponses).toEqual([]);
      expect(state.determinedLevel).toBeNull();
      expect(state.onboardingCompleted).toBe(false);
      expect(state.manualLevelSelected).toBe(false);
      expect(state.featureUnlock).toBeNull();
    });
  });

  describe('selectGoal', () => {
    it('sets the selected goal', () => {
      useOnboardingStore.getState().selectGoal('ielts');
      expect(useOnboardingStore.getState().selectedGoal).toBe('ielts');
    });

    it('replaces previously selected goal', () => {
      useOnboardingStore.getState().selectGoal('ielts');
      useOnboardingStore.getState().selectGoal('travel');
      expect(useOnboardingStore.getState().selectedGoal).toBe('travel');
    });
  });

  describe('recordSwipe', () => {
    it('appends a response', () => {
      useOnboardingStore.getState().recordSwipe('pw-01', 'know');
      const responses = useOnboardingStore.getState().placementResponses;
      expect(responses).toHaveLength(1);
      expect(responses[0]).toEqual({ wordId: 'pw-01', response: 'know' });
    });

    it('appends multiple responses in order', () => {
      useOnboardingStore.getState().recordSwipe('pw-01', 'know');
      useOnboardingStore.getState().recordSwipe('pw-02', 'dontKnow');
      const responses = useOnboardingStore.getState().placementResponses;
      expect(responses).toHaveLength(2);
      expect(responses[1]).toEqual({ wordId: 'pw-02', response: 'dontKnow' });
    });
  });

  describe('undoLastSwipe', () => {
    it('removes the last response', () => {
      useOnboardingStore.getState().recordSwipe('pw-01', 'know');
      useOnboardingStore.getState().recordSwipe('pw-02', 'dontKnow');
      useOnboardingStore.getState().undoLastSwipe();
      const responses = useOnboardingStore.getState().placementResponses;
      expect(responses).toHaveLength(1);
      expect(responses[0].wordId).toBe('pw-01');
    });

    it('does nothing when no responses exist', () => {
      useOnboardingStore.getState().undoLastSwipe();
      expect(useOnboardingStore.getState().placementResponses).toEqual([]);
    });
  });

  describe('calculateLevel', () => {
    const recordKnown = (count: number) => {
      for (let i = 0; i < count; i++) {
        useOnboardingStore.getState().recordSwipe(`pw-${String(i + 1).padStart(2, '0')}`, 'know');
      }
      // Fill the rest as dontKnow
      for (let i = count; i < 10; i++) {
        useOnboardingStore
          .getState()
          .recordSwipe(`pw-${String(i + 1).padStart(2, '0')}`, 'dontKnow');
      }
    };

    it.each([
      [0, UserLevel.Beginner],
      [3, UserLevel.Beginner],
      [4, UserLevel.PreIntermediate],
      [6, UserLevel.PreIntermediate],
      [7, UserLevel.Intermediate],
      [8, UserLevel.Intermediate],
      [9, UserLevel.UpperIntermediate],
      [10, UserLevel.UpperIntermediate],
    ])('with %d correct answers → level %d', (correct, expectedLevel) => {
      recordKnown(correct);
      const level = useOnboardingStore.getState().calculateLevel();
      expect(level).toBe(expectedLevel);
      expect(useOnboardingStore.getState().determinedLevel).toBe(expectedLevel);
    });

    it('sets featureUnlock when calculating level', () => {
      recordKnown(0); // Beginner
      useOnboardingStore.getState().calculateLevel();
      const { featureUnlock } = useOnboardingStore.getState();
      expect(featureUnlock).not.toBeNull();
      expect(featureUnlock!.swipeUpEnabled).toBe(false);
      expect(featureUnlock!.largerFonts).toBe(true);
    });
  });

  describe('selectLevelManually', () => {
    it('sets level and marks manual selection', () => {
      useOnboardingStore.getState().selectLevelManually(UserLevel.Intermediate);
      const state = useOnboardingStore.getState();
      expect(state.determinedLevel).toBe(UserLevel.Intermediate);
      expect(state.manualLevelSelected).toBe(true);
    });

    it('sets featureUnlock for the selected level', () => {
      useOnboardingStore.getState().selectLevelManually(UserLevel.UpperIntermediate);
      const { featureUnlock } = useOnboardingStore.getState();
      expect(featureUnlock).not.toBeNull();
      expect(featureUnlock!.swipeUpEnabled).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('marks onboarding as completed', () => {
      useOnboardingStore.getState().completeOnboarding();
      expect(useOnboardingStore.getState().onboardingCompleted).toBe(true);
    });
  });

  describe('resetOnboarding', () => {
    it('resets all state to initial values', () => {
      useOnboardingStore.getState().selectGoal('ielts');
      useOnboardingStore.getState().recordSwipe('pw-01', 'know');
      useOnboardingStore.getState().selectLevelManually(UserLevel.Intermediate);
      useOnboardingStore.getState().completeOnboarding();

      useOnboardingStore.getState().resetOnboarding();

      const state = useOnboardingStore.getState();
      expect(state.selectedGoal).toBeNull();
      expect(state.placementResponses).toEqual([]);
      expect(state.determinedLevel).toBeNull();
      expect(state.onboardingCompleted).toBe(false);
      expect(state.manualLevelSelected).toBe(false);
      expect(state.featureUnlock).toBeNull();
    });
  });
});
