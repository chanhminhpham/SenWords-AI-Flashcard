/**
 * Shared interfaces that both local (SQLite) and server (PostgreSQL) schemas implement.
 * Prevents schema drift between client and server databases.
 */

export interface IVocabularyCard {
  id: number;
  word: string;
  definition: string;
  partOfSpeech: string;
  ipa: string | null;
  exampleSentence: string | null;
  audioUrlAmerican: string | null;
  audioUrlBritish: string | null;
  imageUrl: string | null;
  difficultyLevel: number;
  topicTags: string[];
  createdAt: string;
}

export interface ILearningEvent {
  id: number;
  userId: string;
  cardId: number;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface ISrSchedule {
  id: number;
  userId: string;
  cardId: number;
  interval: number;
  easeFactor: number;
  nextReviewAt: string;
  reviewCount: number;
  accuracy: number;
  createdAt: string;
  updatedAt: string;
}

export interface IUserPreferences {
  id: number;
  userId: string;
  learningGoal: string | null;
  level: number | null;
  deviceTier: string | null;
  createdAt: string;
  updatedAt: string;
}
