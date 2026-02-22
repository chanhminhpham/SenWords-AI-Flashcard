import { getTableName, getTableColumns } from 'drizzle-orm';
import {
  vocabularyCards,
  learningEvents,
  srSchedule,
  userPreferences,
  wordFamilies,
  wordFamilyMembers,
} from '@/db/local-schema';

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
      expect(columnNames).toHaveLength(11);
      expect(columnNames).toContain('easeFactor');
      expect(columnNames).toContain('nextReviewAt');
      expect(columnNames).toContain('reviewCount');
      expect(columnNames).toContain('accuracy');
      expect(columnNames).toContain('depthLevel');
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

  describe('wordFamilies table', () => {
    it('has the correct table name', () => {
      expect(getTableName(wordFamilies)).toBe('word_families');
    });

    it('defines all required columns', () => {
      const columns = getTableColumns(wordFamilies);
      const columnNames = Object.keys(columns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('rootWord');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('maps column names to snake_case in DB', () => {
      expect(wordFamilies.rootWord.name).toBe('root_word');
      expect(wordFamilies.createdAt.name).toBe('created_at');
      expect(wordFamilies.updatedAt.name).toBe('updated_at');
    });

    it('has unique constraint on rootWord', () => {
      expect(wordFamilies.rootWord.isUnique).toBe(true);
    });

    it('marks rootWord as not null', () => {
      expect(wordFamilies.rootWord.notNull).toBe(true);
    });
  });

  describe('wordFamilyMembers table', () => {
    it('has the correct table name', () => {
      expect(getTableName(wordFamilyMembers)).toBe('word_family_members');
    });

    it('defines all required columns', () => {
      const columns = getTableColumns(wordFamilyMembers);
      const columnNames = Object.keys(columns);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('familyId');
      expect(columnNames).toContain('cardId');
      expect(columnNames).toContain('wordText');
      expect(columnNames).toContain('partOfSpeech');
      expect(columnNames).toContain('formLabel');
      expect(columnNames).toContain('createdAt');
    });

    it('maps column names to snake_case in DB', () => {
      expect(wordFamilyMembers.familyId.name).toBe('family_id');
      expect(wordFamilyMembers.cardId.name).toBe('card_id');
      expect(wordFamilyMembers.wordText.name).toBe('word_text');
      expect(wordFamilyMembers.partOfSpeech.name).toBe('part_of_speech');
      expect(wordFamilyMembers.formLabel.name).toBe('form_label');
    });

    it('marks required fields as not null', () => {
      expect(wordFamilyMembers.familyId.notNull).toBe(true);
      expect(wordFamilyMembers.wordText.notNull).toBe(true);
      expect(wordFamilyMembers.partOfSpeech.notNull).toBe(true);
    });

    it('allows cardId to be nullable', () => {
      expect(wordFamilyMembers.cardId.notNull).toBe(false);
    });
  });
});
