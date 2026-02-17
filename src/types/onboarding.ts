// Onboarding types for Story 1.4: Goal Selection & Placement Test

export type LearningGoalId =
  | 'ielts'
  | 'business'
  | 'travel'
  | 'reading'
  | 'movies'
  | 'conversation';

export interface LearningGoal {
  id: LearningGoalId;
  label: string;
  icon: string; // Material Community Icons name
  description: string;
}

export const UserLevel = {
  Beginner: 0,
  PreIntermediate: 1,
  Intermediate: 2,
  UpperIntermediate: 3,
} as const;

export type UserLevelValue = (typeof UserLevel)[keyof typeof UserLevel];

export interface PlacementWord {
  id: string;
  word: string;
  translation: string;
  difficulty: number; // 0.0 (easy) to 1.0 (hard)
}

export type SwipeResponse = 'know' | 'dontKnow';

export interface PlacementResponse {
  wordId: string;
  response: SwipeResponse;
}

export interface PlacementResult {
  responses: PlacementResponse[];
  correctCount: number;
  determinedLevel: UserLevelValue;
  completedAt: string; // ISO date string
}

export interface FeatureUnlockState {
  swipeUpEnabled: boolean;
  largerFonts: boolean;
  minimalUI: boolean;
}
