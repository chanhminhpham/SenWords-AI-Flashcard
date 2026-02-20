import {
  vocabularyCardSelectSchema,
  vocabularyCardInsertSchema,
  learningEventSelectSchema,
  learningEventInsertSchema,
  srScheduleSelectSchema,
  srScheduleInsertSchema,
  userPreferencesSelectSchema,
  userPreferencesInsertSchema,
  LEARNING_EVENT_TYPES,
} from '@/types/vocabulary';

describe('vocabulary Zod schemas', () => {
  describe('vocabularyCardSelectSchema', () => {
    it('validates a complete vocabulary card', () => {
      const card = {
        id: 1,
        word: 'hello',
        definition: 'xin chào',
        partOfSpeech: 'interjection',
        ipa: '/həˈloʊ/',
        exampleSentence: 'Hello, how are you?',
        audioUrlAmerican: null,
        audioUrlBritish: null,
        imageUrl: null,
        difficultyLevel: 0,
        topicTags: ['General', 'Daily Life'],
        createdAt: '2026-01-01 00:00:00',
      };
      const result = vocabularyCardSelectSchema.safeParse(card);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const invalid = { id: 1 };
      const result = vocabularyCardSelectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('vocabularyCardInsertSchema', () => {
    it('validates minimal insert data (only required fields)', () => {
      const insert = {
        word: 'test',
        definition: 'kiểm tra',
        partOfSpeech: 'verb',
      };
      const result = vocabularyCardInsertSchema.safeParse(insert);
      expect(result.success).toBe(true);
    });

    it('allows optional fields to be omitted', () => {
      const insert = {
        word: 'book',
        definition: 'cuốn sách',
        partOfSpeech: 'noun',
      };
      const result = vocabularyCardInsertSchema.safeParse(insert);
      expect(result.success).toBe(true);
    });
  });

  describe('learningEventSelectSchema', () => {
    it('validates a complete learning event', () => {
      const event = {
        id: 1,
        userId: 'user-123',
        cardId: 42,
        eventType: 'CARD_REVIEWED',
        payload: { score: 4 },
        createdAt: '2026-01-01 00:00:00',
      };
      const result = learningEventSelectSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('learningEventInsertSchema', () => {
    it('validates insert with required fields', () => {
      const insert = {
        userId: 'user-123',
        cardId: 1,
        eventType: 'WORD_ADDED',
      };
      const result = learningEventInsertSchema.safeParse(insert);
      expect(result.success).toBe(true);
    });
  });

  describe('srScheduleSelectSchema', () => {
    it('validates a complete SR schedule', () => {
      const schedule = {
        id: 1,
        userId: 'user-123',
        cardId: 1,
        interval: 7,
        easeFactor: 2.5,
        nextReviewAt: '2026-02-01 00:00:00',
        reviewCount: 3,
        accuracy: 0.85,
        depthLevel: 2,
        createdAt: '2026-01-01 00:00:00',
        updatedAt: '2026-01-15 00:00:00',
      };
      const result = srScheduleSelectSchema.safeParse(schedule);
      expect(result.success).toBe(true);
    });
  });

  describe('srScheduleInsertSchema', () => {
    it('validates insert with required fields', () => {
      const insert = {
        userId: 'user-123',
        cardId: 1,
      };
      const result = srScheduleInsertSchema.safeParse(insert);
      expect(result.success).toBe(true);
    });
  });

  describe('userPreferencesSelectSchema', () => {
    it('validates complete preferences', () => {
      const prefs = {
        id: 1,
        userId: 'user-123',
        learningGoal: 'ielts',
        level: 2,
        deviceTier: 'standard',
        createdAt: '2026-01-01 00:00:00',
        updatedAt: '2026-01-01 00:00:00',
      };
      const result = userPreferencesSelectSchema.safeParse(prefs);
      expect(result.success).toBe(true);
    });
  });

  describe('userPreferencesInsertSchema', () => {
    it('validates insert with required userId', () => {
      const insert = {
        userId: 'user-123',
      };
      const result = userPreferencesInsertSchema.safeParse(insert);
      expect(result.success).toBe(true);
    });
  });

  describe('LEARNING_EVENT_TYPES', () => {
    it('defines all expected event types', () => {
      expect(LEARNING_EVENT_TYPES.CARD_REVIEWED).toBe('CARD_REVIEWED');
      expect(LEARNING_EVENT_TYPES.DEPTH_ADVANCED).toBe('DEPTH_ADVANCED');
      expect(LEARNING_EVENT_TYPES.LEVEL_UNLOCKED).toBe('LEVEL_UNLOCKED');
      expect(LEARNING_EVENT_TYPES.WORD_ADDED).toBe('WORD_ADDED');
    });

    it('has exactly 4 event types', () => {
      expect(Object.keys(LEARNING_EVENT_TYPES)).toHaveLength(4);
    });
  });
});
