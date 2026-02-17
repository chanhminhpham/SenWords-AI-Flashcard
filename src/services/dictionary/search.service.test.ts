import {
  searchDictionary,
  searchDictionaryBroad,
  getWordByExactMatch,
  getWordsByDifficulty,
} from '@/services/dictionary/search.service';

const mockAllFn = jest.fn();

const chainable: Record<string, jest.Mock> = {};
chainable.all = mockAllFn;
chainable.limit = jest.fn().mockReturnValue(chainable);
chainable.where = jest.fn().mockReturnValue(chainable);
chainable.from = jest.fn().mockReturnValue(chainable);

jest.mock('@/db', () => ({
  getDb: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue(chainable),
  }),
  vocabularyCards: {
    word: 'word',
    definition: 'definition',
    partOfSpeech: 'part_of_speech',
    ipa: 'ipa',
    exampleSentence: 'example_sentence',
    difficultyLevel: 'difficulty_level',
    id: 'id',
  },
}));

jest.mock('drizzle-orm', () => ({
  like: jest.fn((col, pattern) => ({ type: 'like', col, pattern })),
  eq: jest.fn((col, value) => ({ type: 'eq', col, value })),
  sql: jest.fn(),
}));

const mockResults = [
  {
    word: 'hello',
    definition: 'xin chào',
    partOfSpeech: 'interjection',
    ipa: '/həˈloʊ/',
    exampleSentence: 'Hello, how are you?',
  },
  {
    word: 'help',
    definition: 'giúp đỡ',
    partOfSpeech: 'verb',
    ipa: '/hɛlp/',
    exampleSentence: 'Can you help me?',
  },
];

describe('search.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAllFn.mockReturnValue(mockResults);
  });

  describe('searchDictionary', () => {
    it('returns results for a valid query', () => {
      const results = searchDictionary('hel');
      expect(results).toEqual(mockResults);
    });

    it('returns empty array for empty query', () => {
      expect(searchDictionary('')).toEqual([]);
      expect(searchDictionary('  ')).toEqual([]);
    });

    it('trims and lowercases the query', () => {
      searchDictionary('  HELLO  ');
      expect(mockAllFn).toHaveBeenCalled();
    });

    it('respects the limit parameter', () => {
      searchDictionary('test', 5);
      expect(mockAllFn).toHaveBeenCalled();
    });

    it('uses default limit of 20', () => {
      searchDictionary('test');
      expect(mockAllFn).toHaveBeenCalled();
    });
  });

  describe('searchDictionaryBroad', () => {
    it('returns results for a valid query', () => {
      const results = searchDictionaryBroad('ell');
      expect(results).toEqual(mockResults);
    });

    it('returns empty array for empty query', () => {
      expect(searchDictionaryBroad('')).toEqual([]);
    });
  });

  describe('getWordByExactMatch', () => {
    it('returns a vocabulary card for exact match', () => {
      const fullCard = { ...mockResults[0], id: 1, difficultyLevel: 0, topicTags: [] };
      mockAllFn.mockReturnValueOnce([fullCard]);
      const result = getWordByExactMatch('hello');
      expect(result).toEqual(fullCard);
    });

    it('returns undefined when no match found', () => {
      mockAllFn.mockReturnValueOnce([]);
      const result = getWordByExactMatch('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getWordsByDifficulty', () => {
    it('returns cards filtered by difficulty level', () => {
      const cards = [
        { id: 1, word: 'cat', difficultyLevel: 0 },
        { id: 2, word: 'dog', difficultyLevel: 0 },
      ];
      mockAllFn.mockReturnValueOnce(cards);
      const results = getWordsByDifficulty(0);
      expect(results).toEqual(cards);
    });

    it('returns empty array when no cards at that level', () => {
      mockAllFn.mockReturnValueOnce([]);
      const results = getWordsByDifficulty(3);
      expect(results).toEqual([]);
    });
  });
});
