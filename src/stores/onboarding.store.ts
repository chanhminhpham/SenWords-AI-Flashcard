// Onboarding store for Story 1.4 — in-memory only, no persistence
import { create } from 'zustand';

import { calculateLevelFromScore, getFeatureUnlockState } from '@/constants/onboarding';
import type {
  FeatureUnlockState,
  LearningGoalId,
  PlacementResponse,
  SwipeResponse,
  UserLevelValue,
} from '@/types/onboarding';

interface OnboardingState {
  // State
  selectedGoal: LearningGoalId | null;
  placementResponses: PlacementResponse[];
  determinedLevel: UserLevelValue | null;
  onboardingCompleted: boolean;
  manualLevelSelected: boolean;
  featureUnlock: FeatureUnlockState | null;

  // Actions
  selectGoal: (goalId: LearningGoalId) => void;
  recordSwipe: (wordId: string, response: SwipeResponse) => void;
  undoLastSwipe: () => void;
  calculateLevel: () => UserLevelValue;
  selectLevelManually: (level: UserLevelValue) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialState = {
  selectedGoal: null,
  placementResponses: [],
  determinedLevel: null,
  onboardingCompleted: false,
  manualLevelSelected: false,
  featureUnlock: null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  selectGoal: (goalId) => set({ selectedGoal: goalId }),

  recordSwipe: (wordId, response) => {
    const { placementResponses } = get();
    set({
      placementResponses: [...placementResponses, { wordId, response }],
    });
  },

  undoLastSwipe: () => {
    const { placementResponses } = get();
    if (placementResponses.length === 0) return;
    set({
      placementResponses: placementResponses.slice(0, -1),
    });
  },

  calculateLevel: () => {
    const { placementResponses } = get();
    const correctCount = placementResponses.filter((r) => r.response === 'know').length;
    const level = calculateLevelFromScore(correctCount);
    const featureUnlock = getFeatureUnlockState(level);
    set({ determinedLevel: level, featureUnlock });
    return level;
  },

  selectLevelManually: (level) => {
    const featureUnlock = getFeatureUnlockState(level);
    set({
      determinedLevel: level,
      manualLevelSelected: true,
      featureUnlock,
    });
  },

  completeOnboarding: () => set({ onboardingCompleted: true }),

  resetOnboarding: () => set(initialState),
}));
