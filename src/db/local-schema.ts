import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// vocabulary_cards — base dictionary + user-added words
// ---------------------------------------------------------------------------
export const vocabularyCards = sqliteTable(
  'vocabulary_cards',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull(),
    definition: text('definition').notNull(),
    partOfSpeech: text('part_of_speech').notNull(),
    ipa: text('ipa'),
    exampleSentence: text('example_sentence'),
    audioUrlAmerican: text('audio_url_american'),
    audioUrlBritish: text('audio_url_british'),
    imageUrl: text('image_url'),
    difficultyLevel: integer('difficulty_level').notNull().default(0),
    topicTags: text('topic_tags', { mode: 'json' }).$type<string[]>().default([]),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_vocabulary_cards_word').on(table.word),
    index('idx_vocabulary_cards_difficulty_level').on(table.difficultyLevel),
  ]
);

// ---------------------------------------------------------------------------
// learning_events — append-only event log
// ---------------------------------------------------------------------------
export const learningEvents = sqliteTable(
  'learning_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    cardId: integer('card_id')
      .notNull()
      .references(() => vocabularyCards.id),
    eventType: text('event_type').notNull(),
    payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index('idx_learning_events_user_id').on(table.userId)]
);

// ---------------------------------------------------------------------------
// sr_schedule — spaced-repetition schedule per user/card
// ---------------------------------------------------------------------------
export const srSchedule = sqliteTable(
  'sr_schedule',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    cardId: integer('card_id')
      .notNull()
      .references(() => vocabularyCards.id),
    interval: integer('interval').notNull().default(0),
    easeFactor: real('ease_factor').notNull().default(2.5),
    nextReviewAt: text('next_review_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    reviewCount: integer('review_count').notNull().default(0),
    accuracy: real('accuracy').notNull().default(0),
    depthLevel: integer('depth_level').notNull().default(1),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index('idx_sr_schedule_user_id_next_review_at').on(table.userId, table.nextReviewAt)]
);

// ---------------------------------------------------------------------------
// word_families — word family groups sharing the same root
// ---------------------------------------------------------------------------
export const wordFamilies = sqliteTable('word_families', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rootWord: text('root_word').notNull().unique(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// word_family_members — individual words belonging to a family
// ---------------------------------------------------------------------------
export const wordFamilyMembers = sqliteTable(
  'word_family_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    familyId: integer('family_id')
      .notNull()
      .references(() => wordFamilies.id),
    cardId: integer('card_id').references(() => vocabularyCards.id),
    wordText: text('word_text').notNull(),
    partOfSpeech: text('part_of_speech').notNull(),
    formLabel: text('form_label'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_wfm_family_id').on(table.familyId),
    index('idx_wfm_card_id').on(table.cardId),
  ]
);

// ---------------------------------------------------------------------------
// user_preferences — local device preferences
// ---------------------------------------------------------------------------
export const userPreferences = sqliteTable('user_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  learningGoal: text('learning_goal'),
  level: integer('level').default(0),
  deviceTier: text('device_tier'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
