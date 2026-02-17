import {
  loadDictionary,
  isDictionaryLoaded,
  getDictionaryCount,
} from '@/services/dictionary/dictionary.service';

// Chainable mock that supports: db.select({}).from(t).limit(n).all()
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

jest.mock('@/db', () => ({
  getDb: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue(chainable),
    insert: jest.fn().mockReturnValue(chainable),
  }),
  vocabularyCards: { id: 'id' },
}));

// Mock the dictionary JSON asset
jest.mock(
  '../../../assets/dictionary/base-5000.json',
  () => [
    {
      word: 'hello',
      definition: 'xin chào',
      partOfSpeech: 'interjection',
      ipa: '/həˈloʊ/',
      exampleSentence: 'Hello, how are you?',
      difficultyLevel: 0,
      topicTags: ['General'],
    },
    {
      word: 'book',
      definition: 'cuốn sách',
      partOfSpeech: 'noun',
      ipa: '/bʊk/',
      exampleSentence: 'I read a book every week.',
      difficultyLevel: 0,
      topicTags: ['General', 'Reading'],
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
      mockAllFn.mockReturnValueOnce([{ id: 1 }]);
      mockAllFn.mockReturnValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);

      const result = await loadDictionary();
      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('inserts dictionary entries when database is empty', async () => {
      mockAllFn.mockReturnValueOnce([]);

      const result = await loadDictionary();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(mockRunFn).toHaveBeenCalled();
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
      mockAllFn.mockReturnValueOnce([{ id: 1 }]);
      expect(isDictionaryLoaded()).toBe(true);
    });

    it('returns false when dictionary is empty', () => {
      mockAllFn.mockReturnValueOnce([]);
      expect(isDictionaryLoaded()).toBe(false);
    });
  });

  describe('getDictionaryCount', () => {
    it('returns the total number of entries', () => {
      mockAllFn.mockReturnValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(getDictionaryCount()).toBe(3);
    });

    it('returns 0 when empty', () => {
      mockAllFn.mockReturnValueOnce([]);
      expect(getDictionaryCount()).toBe(0);
    });
  });
});
