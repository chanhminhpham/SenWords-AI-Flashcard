import {
  loadDictionary,
  isDictionaryLoaded,
  getDictionaryCount,
} from '@/services/dictionary/dictionary.service';
import { runInTransaction } from '@/db';

jest.mock('@/config/env', () => ({
  ENV: { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test-key', SENTRY_DSN: '' },
}));

// Chainable mock that supports: db.select({}).from(t).all()
// and db.insert(t).values([]).run()
const mockAllFn = jest.fn();
const mockRunFn = jest.fn();

const chainable: Record<string, jest.Mock> = {};
chainable.all = mockAllFn;
chainable.run = mockRunFn;
chainable.limit = jest.fn().mockReturnValue(chainable);
chainable.where = jest.fn().mockReturnValue(chainable);
chainable.from = jest.fn().mockReturnValue(chainable);
chainable.values = jest.fn().mockReturnValue(chainable);
chainable.set = jest.fn().mockReturnValue(chainable);

jest.mock('@/db', () => ({
  getDb: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue(chainable),
    insert: jest.fn().mockReturnValue(chainable),
    update: jest.fn().mockReturnValue(chainable),
  }),
  vocabularyCards: { id: 'id' },
  runInTransaction: jest.fn((fn: () => void) => fn()),
}));

// Mock the dictionary JSON asset
jest.mock(
  '../../../assets/dictionary/base-5000.json',
  () => [
    {
      word: 'hello',
      definition: 'xin chào',
      partOfSpeech: 'interjection',
      ipa: null,
      exampleSentence: 'Hello! That was unexpected.',
      difficultyLevel: 0,
      topicTags: ['General'],
    },
    {
      word: 'book',
      definition: 'cuốn sách',
      partOfSpeech: 'noun',
      ipa: null,
      exampleSentence: 'I need a book for this.',
      difficultyLevel: 0,
      topicTags: ['General', 'Reading'],
      imageUrl: 'vocabulary-images/book_card.webp',
      mediaType: 'image',
    },
  ],
  { virtual: true }
);

describe('dictionary.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadDictionary', () => {
    it('returns success with count when dictionary already loaded', async () => {
      // COUNT query returns existing count
      mockAllFn.mockReturnValueOnce([{ value: 3 }]);
      // backfillMediaType COUNT query — already has image cards
      mockAllFn.mockReturnValueOnce([{ value: 100 }]);

      const result = await loadDictionary();
      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('inserts dictionary entries when database is empty', async () => {
      // COUNT query returns 0
      mockAllFn.mockReturnValueOnce([{ value: 0 }]);

      const result = await loadDictionary();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockRunFn).toHaveBeenCalled();
    });

    it('stores raw imageUrl and mediaType from dictionary JSON', async () => {
      mockAllFn.mockReturnValueOnce([{ value: 0 }]);

      await loadDictionary();

      const insertedValues = chainable.values.mock.calls[0][0] as {
        imageUrl: string | null;
        mediaType: string;
      }[];
      // 'hello' has no imageUrl → null
      expect(insertedValues[0].imageUrl).toBeNull();
      // 'book' has relative imageUrl → stored as-is (resolved at render time)
      expect(insertedValues[1].imageUrl).toBe('vocabulary-images/book_card.webp');
      expect(insertedValues[1].mediaType).toBe('image');
    });

    it('wraps inserts in a transaction', async () => {
      mockAllFn.mockReturnValueOnce([{ value: 0 }]);

      await loadDictionary();
      expect(runInTransaction).toHaveBeenCalled();
    });

    it('returns error on database failure', async () => {
      mockAllFn.mockImplementationOnce(() => {
        throw new Error('DB_WRITE_ERROR');
      });

      const result = await loadDictionary();
      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
      expect(result.error).toBe('DB_WRITE_ERROR');
    });
  });

  describe('isDictionaryLoaded', () => {
    it('returns true when dictionary has entries', () => {
      mockAllFn.mockReturnValueOnce([{ value: 5 }]);
      expect(isDictionaryLoaded()).toBe(true);
    });

    it('returns false when dictionary is empty', () => {
      mockAllFn.mockReturnValueOnce([{ value: 0 }]);
      expect(isDictionaryLoaded()).toBe(false);
    });
  });

  describe('getDictionaryCount', () => {
    it('returns the total number of entries', () => {
      mockAllFn.mockReturnValueOnce([{ value: 42 }]);
      expect(getDictionaryCount()).toBe(42);
    });

    it('returns 0 when empty', () => {
      mockAllFn.mockReturnValueOnce([{ value: 0 }]);
      expect(getDictionaryCount()).toBe(0);
    });
  });
});
