/**
 * Vocabulary types — inferred from Drizzle schema via drizzle-zod.
 * DO NOT define types manually. All DB entity types come from the schema.
 */
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod';
import {
  vocabularyCards,
  learningEvents,
  srSchedule,
  userPreferences,
  wordFamilies,
  wordFamilyMembers,
} from '@/db/local-schema';

// ---------------------------------------------------------------------------
// Zod schemas (generated from Drizzle)
// ---------------------------------------------------------------------------
export const vocabularyCardSelectSchema = createSelectSchema(vocabularyCards);
export const vocabularyCardInsertSchema = createInsertSchema(vocabularyCards);

export const learningEventSelectSchema = createSelectSchema(learningEvents);
export const learningEventInsertSchema = createInsertSchema(learningEvents);

export const srScheduleSelectSchema = createSelectSchema(srSchedule);
export const srScheduleInsertSchema = createInsertSchema(srSchedule);

export const userPreferencesSelectSchema = createSelectSchema(userPreferences);
export const userPreferencesInsertSchema = createInsertSchema(userPreferences);

export const wordFamilySelectSchema = createSelectSchema(wordFamilies);
export const wordFamilyInsertSchema = createInsertSchema(wordFamilies);

export const wordFamilyMemberSelectSchema = createSelectSchema(wordFamilyMembers);
export const wordFamilyMemberInsertSchema = createInsertSchema(wordFamilyMembers);

// ---------------------------------------------------------------------------
// TypeScript types (inferred from Zod schemas)
// ---------------------------------------------------------------------------
export type VocabularyCard = z.infer<typeof vocabularyCardSelectSchema>;
export type NewVocabularyCard = z.infer<typeof vocabularyCardInsertSchema>;

export type LearningEvent = z.infer<typeof learningEventSelectSchema>;
export type NewLearningEvent = z.infer<typeof learningEventInsertSchema>;

export type SrSchedule = z.infer<typeof srScheduleSelectSchema>;
export type NewSrSchedule = z.infer<typeof srScheduleInsertSchema>;

export type UserPreferences = z.infer<typeof userPreferencesSelectSchema>;
export type NewUserPreferences = z.infer<typeof userPreferencesInsertSchema>;

export type WordFamily = z.infer<typeof wordFamilySelectSchema>;
export type NewWordFamily = z.infer<typeof wordFamilyInsertSchema>;

export type WordFamilyMember = z.infer<typeof wordFamilyMemberSelectSchema>;
export type NewWordFamilyMember = z.infer<typeof wordFamilyMemberInsertSchema>;

// ---------------------------------------------------------------------------
// Composite types (manual — joins across tables)
// ---------------------------------------------------------------------------
export interface WordFamilyWithMembers {
  family: WordFamily;
  members: (WordFamilyMember & { card: VocabularyCard | null })[];
}

// ---------------------------------------------------------------------------
// Event type constants
// ---------------------------------------------------------------------------
export const LEARNING_EVENT_TYPES = {
  CARD_REVIEWED: 'CARD_REVIEWED',
  DEPTH_ADVANCED: 'DEPTH_ADVANCED',
  LEVEL_UNLOCKED: 'LEVEL_UNLOCKED',
  WORD_ADDED: 'WORD_ADDED',
} as const;

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[keyof typeof LEARNING_EVENT_TYPES];
