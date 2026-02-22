import {
  fetchWordFamily,
  fetchWordFamilyByWord,
  loadWordFamilies,
} from '@/services/dictionary/word-family.service';
import { runInTransaction } from '@/db';

// Chainable mock: db.select({}).from(t).leftJoin(t2).where(cond).all()
const mockAllFn = jest.fn();
const mockRunFn = jest.fn();

const chainable: Record<string, jest.Mock> = {};
chainable.all = mockAllFn;
chainable.run = mockRunFn;
chainable.where = jest.fn().mockReturnValue(chainable);
chainable.leftJoin = jest.fn().mockReturnValue(chainable);
chainable.from = jest.fn().mockReturnValue(chainable);
chainable.limit = jest.fn().mockReturnValue(chainable);
chainable.values = jest.fn().mockReturnValue(chainable);
chainable.returning = jest.fn().mockReturnValue(chainable);

jest.mock('@/db', () => ({
  getDb: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue(chainable),
    insert: jest.fn().mockReturnValue(chainable),
  }),
  vocabularyCards: { id: 'id', word: 'word', partOfSpeech: 'part_of_speech' },
  wordFamilies: { id: 'id', rootWord: 'root_word' },
  wordFamilyMembers: {
    id: 'id',
    familyId: 'family_id',
    cardId: 'card_id',
    wordText: 'word_text',
  },
  runInTransaction: jest.fn((fn: () => void) => fn()),
}));

jest.mock(
  '../../../assets/dictionary/word-families.json',
  () => [
    {
      rootWord: 'test',
      members: [
        { wordText: 'test', partOfSpeech: 'noun', formLabel: 'base form' },
        { wordText: 'testing', partOfSpeech: 'noun', formLabel: 'gerund' },
      ],
    },
  ],
  { virtual: true }
);

describe('word-family.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWordFamily', () => {
    it('returns null when cardId has no family membership', () => {
      mockAllFn.mockReturnValueOnce([]);

      const result = fetchWordFamily(999);
      expect(result).toBeNull();
    });

    it('returns WordFamilyWithMembers when family exists', () => {
      // First query: find family for this cardId
      mockAllFn.mockReturnValueOnce([
        {
          word_family_members: {
            id: 1,
            familyId: 10,
            cardId: 5,
            wordText: 'environment',
            partOfSpeech: 'noun',
            formLabel: 'base form',
            createdAt: '2026-01-01',
          },
          word_families: {
            id: 10,
            rootWord: 'environment',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        },
      ]);

      // Second query: get all members of that family
      mockAllFn.mockReturnValueOnce([
        {
          word_family_members: {
            id: 1,
            familyId: 10,
            cardId: 5,
            wordText: 'environment',
            partOfSpeech: 'noun',
            formLabel: 'base form',
            createdAt: '2026-01-01',
          },
          vocabulary_cards: {
            id: 5,
            word: 'environment',
            definition: 'moi truong',
            partOfSpeech: 'noun',
            ipa: null,
            exampleSentence: null,
            audioUrlAmerican: null,
            audioUrlBritish: null,
            imageUrl: null,
            difficultyLevel: 2,
            topicTags: [],
            createdAt: '2026-01-01',
          },
        },
        {
          word_family_members: {
            id: 2,
            familyId: 10,
            cardId: null,
            wordText: 'environmental',
            partOfSpeech: 'adjective',
            formLabel: 'derived',
            createdAt: '2026-01-01',
          },
          vocabulary_cards: null,
        },
      ]);

      const result = fetchWordFamily(5);
      expect(result).not.toBeNull();
      expect(result!.family.rootWord).toBe('environment');
      expect(result!.members).toHaveLength(2);
      expect(result!.members[0].card).not.toBeNull();
      expect(result!.members[1].card).toBeNull();
    });
  });

  describe('fetchWordFamilyByWord', () => {
    it('returns null when word has no family', () => {
      mockAllFn.mockReturnValueOnce([]);

      const result = fetchWordFamilyByWord('xyz');
      expect(result).toBeNull();
    });

    it('returns WordFamilyWithMembers for word', () => {
      // First query: find family by word text
      mockAllFn.mockReturnValueOnce([
        {
          word_family_members: {
            id: 1,
            familyId: 10,
            cardId: 5,
            wordText: 'run',
            partOfSpeech: 'verb',
            formLabel: 'base form',
            createdAt: '2026-01-01',
          },
          word_families: {
            id: 10,
            rootWord: 'run',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        },
      ]);

      // Second query: all members
      mockAllFn.mockReturnValueOnce([
        {
          word_family_members: {
            id: 1,
            familyId: 10,
            cardId: 5,
            wordText: 'run',
            partOfSpeech: 'verb',
            formLabel: 'base form',
            createdAt: '2026-01-01',
          },
          vocabulary_cards: {
            id: 5,
            word: 'run',
            definition: 'chay',
            partOfSpeech: 'verb',
            ipa: null,
            exampleSentence: null,
            audioUrlAmerican: null,
            audioUrlBritish: null,
            imageUrl: null,
            difficultyLevel: 1,
            topicTags: [],
            createdAt: '2026-01-01',
          },
        },
        {
          word_family_members: {
            id: 2,
            familyId: 10,
            cardId: null,
            wordText: 'runner',
            partOfSpeech: 'noun',
            formLabel: 'agent noun',
            createdAt: '2026-01-01',
          },
          vocabulary_cards: null,
        },
      ]);

      const result = fetchWordFamilyByWord('run');
      expect(result).not.toBeNull();
      expect(result!.family.rootWord).toBe('run');
      expect(result!.members).toHaveLength(2);
    });
  });

  describe('loadWordFamilies', () => {
    it('returns existing count when already loaded', async () => {
      mockAllFn.mockReturnValueOnce([{ value: 100 }]);

      const result = await loadWordFamilies();
      expect(result.success).toBe(true);
      expect(result.count).toBe(100);
    });

    it('inserts families when database is empty', async () => {
      // COUNT returns 0
      mockAllFn.mockReturnValueOnce([{ value: 0 }]);
      // Pre-load all vocabulary cards (returns card list for lookup map)
      mockAllFn.mockReturnValueOnce([{ id: 1, word: 'test', pos: 'noun' }]);
      // insert().values().returning().all() for family insert
      mockAllFn.mockReturnValue([{ id: 1 }]);
      mockRunFn.mockReturnValue(undefined);

      const result = await loadWordFamilies();
      expect(result.success).toBe(true);
      expect(result.count).toBe(1); // 1 family in mock JSON
      expect(runInTransaction).toHaveBeenCalled();
    });

    it('returns error on failure', async () => {
      mockAllFn.mockImplementationOnce(() => {
        throw new Error('DB_ERROR');
      });

      const result = await loadWordFamilies();
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB_ERROR');
    });
  });
});
