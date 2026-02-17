import { getTableName, getTableColumns } from 'drizzle-orm';
import { vocabularyCards, learningEvents, srSchedule, userPreferences } from '@/db/local-schema';

describe('local-schema', () => {
  describe('vocabularyCards table', () => {
    it('has the correct table name', () => {
      expect(getTableName(vocabularyCards)).toBe('vocabulary_cards');
    });

    it('defines all required columns', () => {
      const columns = getTableColumns(vocabularyCards);
      const columnNames = Object.keys(columns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('word');
      expect(columnNames).toContain('definition');
      expect(columnNames).toContain('partOfSpeech');
      expect(columnNames).toContain('ipa');
      expect(columnNames).toContain('exampleSentence');
      expect(columnNames).toContain('audioUrlAmerican');
      expect(columnNames).toContain('audioUrlBritish');
      expect(columnNames).toContain('imageUrl');
      expect(columnNames).toContain('difficultyLevel');
      expect(columnNames).toContain('topicTags');
      expect(columnNames).toContain('createdAt');
    });

    it('maps column names to snake_case in DB', () => {
      expect(vocabularyCards.word.name).toBe('word');
      expect(vocabularyCards.partOfSpeech.name).toBe('part_of_speech');
      expect(vocabularyCards.difficultyLevel.name).toBe('difficulty_level');
      expect(vocabularyCards.topicTags.name).toBe('topic_tags');
      expect(vocabularyCards.createdAt.name).toBe('created_at');
    });

    it('marks required fields as not null', () => {
      expect(vocabularyCards.word.notNull).toBe(true);
      expect(vocabularyCards.definition.notNull).toBe(true);
      expect(vocabularyCards.partOfSpeech.notNull).toBe(true);
      expect(vocabularyCards.difficultyLevel.notNull).toBe(true);
    });

    it('marks optional fields as nullable', () => {
      expect(vocabularyCards.ipa.notNull).toBe(false);
      expect(vocabularyCards.exampleSentence.notNull).toBe(false);
      expect(vocabularyCards.audioUrlAmerican.notNull).toBe(false);
      expect(vocabularyCards.audioUrlBritish.notNull).toBe(false);
      expect(vocabularyCards.imageUrl.notNull).toBe(false);
    });
  });

  describe('learningEvents table', () => {
    it('has the correct table name', () => {
      expect(getTableName(learningEvents)).toBe('learning_events');
    });

    it('defines all required columns', () => {
      const columns = getTableColumns(learningEvents);
      const columnNames = Object.keys(columns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('cardId');
      expect(columnNames).toContain('eventType');
      expect(columnNames).toContain('payload');
      expect(columnNames).toContain('createdAt');
    });

    it('maps userId to user_id in DB', () => {
      expect(learningEvents.userId.name).toBe('user_id');
      expect(learningEvents.cardId.name).toBe('card_id');
      expect(learningEvents.eventType.name).toBe('event_type');
    });
  });

  describe('srSchedule table', () => {
    it('has the correct table name', () => {
      expect(getTableName(srSchedule)).toBe('sr_schedule');
    });

    it('defines all 10 columns', () => {
      const columns = getTableColumns(srSchedule);
      const columnNames = Object.keys(columns);
      expect(columnNames).toHaveLength(10);
      expect(columnNames).toContain('easeFactor');
      expect(columnNames).toContain('nextReviewAt');
      expect(columnNames).toContain('reviewCount');
      expect(columnNames).toContain('accuracy');
    });

    it('maps column names correctly', () => {
      expect(srSchedule.easeFactor.name).toBe('ease_factor');
      expect(srSchedule.nextReviewAt.name).toBe('next_review_at');
      expect(srSchedule.reviewCount.name).toBe('review_count');
    });
  });

  describe('userPreferences table', () => {
    it('has the correct table name', () => {
      expect(getTableName(userPreferences)).toBe('user_preferences');
    });

    it('defines all columns', () => {
      const columns = getTableColumns(userPreferences);
      const columnNames = Object.keys(columns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('learningGoal');
      expect(columnNames).toContain('level');
      expect(columnNames).toContain('deviceTier');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('has unique constraint on userId', () => {
      expect(userPreferences.userId.isUnique).toBe(true);
    });
  });
});
