/**
 * Drizzle PostgreSQL schema — shared types with Supabase Edge Functions.
 * Story 1.5 scope: type generation only. Server-side migrations are deferred
 * to the sync story. This schema mirrors the local SQLite structure so
 * drizzle-zod can produce compatible Zod/TS types for both environments.
 */
import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// vocabulary_cards (server)
// ---------------------------------------------------------------------------
export const vocabularyCardsServer = pgTable('vocabulary_cards', {
  id: serial('id').primaryKey(),
  word: text('word').notNull(),
  definition: text('definition').notNull(),
  partOfSpeech: text('part_of_speech').notNull(),
  ipa: text('ipa'),
  exampleSentence: text('example_sentence'),
  audioUrlAmerican: text('audio_url_american'),
  audioUrlBritish: text('audio_url_british'),
  imageUrl: text('image_url'),
  difficultyLevel: integer('difficulty_level').notNull().default(0),
  topicTags: jsonb('topic_tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// learning_events (server)
// ---------------------------------------------------------------------------
export const learningEventsServer = pgTable('learning_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  cardId: integer('card_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// sr_schedule (server)
// ---------------------------------------------------------------------------
export const srScheduleServer = pgTable('sr_schedule', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  cardId: integer('card_id').notNull(),
  interval: integer('interval').notNull().default(0),
  easeFactor: doublePrecision('ease_factor').notNull().default(2.5),
  nextReviewAt: timestamp('next_review_at', { withTimezone: true }).notNull().defaultNow(),
  reviewCount: integer('review_count').notNull().default(0),
  accuracy: doublePrecision('accuracy').notNull().default(0),
  depthLevel: integer('depth_level').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// word_families (server)
// ---------------------------------------------------------------------------
export const wordFamiliesServer = pgTable('word_families', {
  id: serial('id').primaryKey(),
  rootWord: text('root_word').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// word_family_members (server)
// ---------------------------------------------------------------------------
export const wordFamilyMembersServer = pgTable(
  'word_family_members',
  {
    id: serial('id').primaryKey(),
    familyId: integer('family_id')
      .notNull()
      .references(() => wordFamiliesServer.id),
    cardId: integer('card_id').references(() => vocabularyCardsServer.id),
    wordText: text('word_text').notNull(),
    partOfSpeech: text('part_of_speech').notNull(),
    formLabel: text('form_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_wfm_family_id_server').on(table.familyId),
    index('idx_wfm_card_id_server').on(table.cardId),
  ]
);

// ---------------------------------------------------------------------------
// user_preferences (server)
// ---------------------------------------------------------------------------
export const userPreferencesServer = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  learningGoal: text('learning_goal'),
  level: integer('level').default(0),
  deviceTier: text('device_tier'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
