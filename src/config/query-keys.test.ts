import { queryKeys } from '@/config/query-keys';

describe('queryKeys', () => {
  describe('dictionary keys', () => {
    it('produces correct base key', () => {
      expect(queryKeys.dictionary.all).toEqual(['dictionary']);
    });

    it('produces correct search key', () => {
      expect(queryKeys.dictionary.search('hello')).toEqual(['dictionary', 'search', 'hello']);
    });

    it('produces correct word key', () => {
      expect(queryKeys.dictionary.word('book')).toEqual(['dictionary', 'word', 'book']);
    });

    it('produces correct byDifficulty key', () => {
      expect(queryKeys.dictionary.byDifficulty(2)).toEqual(['dictionary', 'byDifficulty', 2]);
    });
  });

  describe('learning keys', () => {
    it('produces correct base key', () => {
      expect(queryKeys.learning.all).toEqual(['learning']);
    });

    it('produces correct events key with userId', () => {
      expect(queryKeys.learning.events('user-123')).toEqual(['learning', 'events', 'user-123']);
    });
  });

  describe('schedule keys', () => {
    it('produces correct upcoming key', () => {
      expect(queryKeys.schedule.upcoming('user-123')).toEqual(['schedule', 'upcoming', 'user-123']);
    });
  });

  describe('preferences keys', () => {
    it('produces correct user key', () => {
      expect(queryKeys.preferences.user('user-123')).toEqual(['preferences', 'user', 'user-123']);
    });
  });

  describe('wordFamily keys', () => {
    it('produces correct base key', () => {
      expect(queryKeys.wordFamily.all).toEqual(['word-family']);
    });

    it('produces correct byCardId key', () => {
      expect(queryKeys.wordFamily.byCardId(5)).toEqual(['word-family', 'byCardId', 5]);
    });
  });

  describe('key uniqueness', () => {
    it('all domain keys are unique', () => {
      const domains = [
        queryKeys.dictionary.all[0],
        queryKeys.learning.all[0],
        queryKeys.schedule.all[0],
        queryKeys.preferences.all[0],
        queryKeys.wordFamily.all[0],
      ];
      const unique = new Set(domains);
      expect(unique.size).toBe(domains.length);
    });
  });
});
