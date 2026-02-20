// Unit test: selectFirstSessionWords (Story 1.8 — AC4)
import { selectFirstSessionWords, FIRST_SESSION_CARD_COUNT } from './sr.service';

// Configurable mock — variables prefixed with "mock" are allowed in jest.mock factories
const mockAll = jest.fn().mockReturnValue([]);

jest.mock('@/db', () => {
  const chainable = () => {
    const chain: Record<string, unknown> = {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: () => chain,
      all: () => mockAll(),
    };
    return chain;
  };

  return {
    getDb: () => ({
      select: () => chainable(),
    }),
    runInTransaction: (fn: () => void) => fn(),
  };
});

jest.mock('@/db/local-schema', () => ({
  vocabularyCards: {
    id: 'id',
    difficultyLevel: 'difficulty_level',
    topicTags: 'topic_tags',
  },
  srSchedule: {},
  learningEvents: {},
  userPreferences: {},
}));

jest.mock('drizzle-orm', () => ({
  and: () => undefined,
  asc: () => undefined,
  eq: () => undefined,
  inArray: () => undefined,
  lte: () => undefined,
  notInArray: () => undefined,
  sql: () => undefined,
}));

jest.mock('@/utils/sr-algorithm', () => ({
  calculateDepthLevel: jest.fn(),
  calculateNextReview: jest.fn(),
  QUALITY_MAPPING: { know: 4, dontKnow: 1 },
  SM2_DEFAULTS: { INITIAL_EASE_FACTOR: 2.5 },
}));

function makeCard(id: number, word: string, tags: string[] = [], level = 0) {
  return {
    id,
    word,
    definition: `def-${word}`,
    partOfSpeech: 'noun',
    ipa: null,
    exampleSentence: null,
    audioUrlAmerican: null,
    audioUrlBritish: null,
    imageUrl: null,
    difficultyLevel: level,
    topicTags: tags,
    createdAt: '2026-01-01',
  };
}

describe('selectFirstSessionWords', () => {
  beforeEach(() => {
    mockAll.mockReset().mockReturnValue([]);
  });

  it('exports FIRST_SESSION_CARD_COUNT as 5', () => {
    expect(FIRST_SESSION_CARD_COUNT).toBe(5);
  });

  // AC4 — Empty guard
  it('returns empty array when DB has no words', () => {
    mockAll.mockReturnValue([]);
    const result = selectFirstSessionWords(0, 'travel');
    expect(result).toEqual([]);
  });

  // AC4 — Goal-matching priority: filters by topic tag in JS
  it('prioritises goal-matching words first', () => {
    const allWords = [
      makeCard(1, 'airport', ['travel'], 0),
      makeCard(2, 'meeting', ['business'], 0),
      makeCard(3, 'hotel', ['travel'], 0),
      makeCard(4, 'passport', ['travel'], 0),
      makeCard(5, 'email', ['business'], 0),
      makeCard(6, 'suitcase', ['travel'], 0),
      makeCard(7, 'ticket', ['travel'], 0),
    ];

    // Step 1: all() returns all matching-level words → JS filter picks travel tags
    mockAll.mockReturnValueOnce(allWords);

    const result = selectFirstSessionWords(0, 'travel');
    expect(result).toHaveLength(5);
    for (const card of result) {
      expect(card.topicTags).toContain('travel');
    }
  });

  // AC4 — Fallback: fill remaining with same-level words when < 5 goal-match
  it('fills remaining slots with same-level words when fewer than 5 match goal', () => {
    const goalWords = [makeCard(1, 'airport', ['travel'], 0), makeCard(2, 'hotel', ['travel'], 0)];
    const fillWords = [
      makeCard(3, 'meeting', ['business'], 0),
      makeCard(4, 'email', ['business'], 0),
      makeCard(5, 'report', ['business'], 0),
    ];

    // Step 1: returns 2 travel words (after JS filter)
    mockAll.mockReturnValueOnce(goalWords);
    // Step 2: fills 3 remaining with same-level words
    mockAll.mockReturnValueOnce(fillWords);

    const result = selectFirstSessionWords(0, 'travel');
    expect(result).toHaveLength(5);
    expect(result[0].topicTags).toContain('travel');
    expect(result[1].topicTags).toContain('travel');
  });

  // AC4 — Fallback: expand difficulty level by 1 when still < 5
  it('expands difficulty level +1 when still fewer than 5 words', () => {
    const levelWords = [makeCard(1, 'hello', [], 0)];
    const expandedWords = [
      makeCard(2, 'negotiate', [], 1),
      makeCard(3, 'achieve', [], 1),
      makeCard(4, 'strategy', [], 1),
      makeCard(5, 'confirm', [], 1),
    ];

    // Step 2: only 1 word at level 0 (null goal skips Step 1)
    mockAll.mockReturnValueOnce(levelWords);
    // Step 3: 4 more at level+1
    mockAll.mockReturnValueOnce(expandedWords);

    const result = selectFirstSessionWords(0, null);
    expect(result).toHaveLength(5);
  });

  it('accepts null goalId and skips topic filtering', () => {
    const words = [
      makeCard(1, 'a', [], 0),
      makeCard(2, 'b', [], 0),
      makeCard(3, 'c', [], 0),
      makeCard(4, 'd', [], 0),
      makeCard(5, 'e', [], 0),
    ];
    // With null goal, Step 1 is skipped → Step 2 fills all 5
    mockAll.mockReturnValueOnce(words);

    const result = selectFirstSessionWords(0, null);
    expect(result).toHaveLength(5);
  });

  it('returns fewer than 5 when DB has insufficient words', () => {
    const twoWords = [makeCard(1, 'a', [], 0), makeCard(2, 'b', [], 0)];
    mockAll.mockReturnValue(twoWords);

    const result = selectFirstSessionWords(0, 'travel');
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles different user levels without error', () => {
    expect(() => selectFirstSessionWords(0, 'travel')).not.toThrow();
    expect(() => selectFirstSessionWords(1, 'business')).not.toThrow();
    expect(() => selectFirstSessionWords(2, 'ielts')).not.toThrow();
    expect(() => selectFirstSessionWords(3, 'movies')).not.toThrow();
  });
});
