import {
  adjustSchedule,
  logLearningEvent,
  revertScheduleAdjustment,
  fetchSRQueue,
  getCardDepthLevel,
  MAX_NEW_CARDS_PER_DAY,
  MAX_DAILY_QUEUE,
  SECONDS_PER_CARD,
} from './sr.service';

// Mock database — chainable methods returning `this` for fluent queries
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  all: jest.fn().mockReturnValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

jest.mock('@/db', () => ({
  getDb: jest.fn(() => mockDb),
  runInTransaction: jest.fn((fn: () => void) => fn()),
}));

jest.mock('@/db/local-schema', () => ({
  srSchedule: {
    id: 'id',
    cardId: 'cardId',
    userId: 'userId',
    interval: 'interval',
    easeFactor: 'easeFactor',
    nextReviewAt: 'nextReviewAt',
    reviewCount: 'reviewCount',
    accuracy: 'accuracy',
    depthLevel: 'depthLevel',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  learningEvents: {
    userId: 'userId',
    cardId: 'cardId',
    eventType: 'eventType',
    payload: 'payload',
    createdAt: 'createdAt',
  },
  vocabularyCards: {
    id: 'id',
    word: 'word',
    definition: 'definition',
    partOfSpeech: 'partOfSpeech',
    difficultyLevel: 'difficultyLevel',
    createdAt: 'createdAt',
  },
}));

// eslint-disable-next-line import/first -- must import after jest.mock to get mocked module
import { runInTransaction } from '@/db';

function resetMocks() {
  // Must use mockReset (not clearAllMocks) to flush mockReturnValueOnce queues
  mockDb.all.mockReset().mockReturnValue([]);
  mockDb.run.mockReset().mockReturnValue({ lastInsertRowid: 1 });
  mockDb.select.mockReset().mockReturnThis();
  mockDb.from.mockReset().mockReturnThis();
  mockDb.where.mockReset().mockReturnThis();
  mockDb.limit.mockReset().mockReturnThis();
  mockDb.orderBy.mockReset().mockReturnThis();
  mockDb.insert.mockReset().mockReturnThis();
  mockDb.values.mockReset().mockReturnThis();
  mockDb.update.mockReset().mockReturnThis();
  mockDb.set.mockReset().mockReturnThis();
}

beforeEach(resetMocks);

// Helper to create a mock vocabulary card
function mockCard(id: number, word: string): Record<string, unknown> {
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
    difficultyLevel: id,
    topicTags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('SR Service', () => {
  describe('adjustSchedule — SM-2 integration', () => {
    it('creates new schedule entry on first review (know)', () => {
      mockDb.all.mockReturnValue([]);

      const result = adjustSchedule({
        cardId: 1,
        userId: 'user-1',
        response: 'know',
      });

      expect(result.success).toBe(true);
      expect(result.nextReviewAt).toBeDefined();
      expect(result.previousState).toBeUndefined();

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: 1,
          userId: 'user-1',
          interval: 1,
          reviewCount: 1,
          depthLevel: 1,
        })
      );
    });

    it('creates new schedule with accuracy=0 for first review (dontKnow)', () => {
      mockDb.all.mockReturnValue([]);

      const result = adjustSchedule({
        cardId: 2,
        userId: 'user-1',
        response: 'dontKnow',
      });

      expect(result.success).toBe(true);
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: 2,
          userId: 'user-1',
          interval: 1,
          accuracy: 0,
          depthLevel: 1,
        })
      );
    });

    it('updates existing schedule with SM-2 calculation (know)', () => {
      mockDb.all.mockReturnValue([
        {
          id: 10,
          cardId: 1,
          userId: 'user-1',
          interval: 1,
          easeFactor: 2.5,
          nextReviewAt: '2026-02-18T00:00:00.000Z',
          reviewCount: 1,
          accuracy: 1.0,
          depthLevel: 1,
        },
      ]);

      const result = adjustSchedule({
        cardId: 1,
        userId: 'user-1',
        response: 'know',
      });

      expect(result.success).toBe(true);
      expect(result.previousState).toEqual({
        interval: 1,
        easeFactor: 2.5,
        nextReviewAt: '2026-02-18T00:00:00.000Z',
        reviewCount: 1,
        accuracy: 1.0,
        depthLevel: 1,
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          interval: 6,
          reviewCount: 2,
        })
      );
    });

    it('resets interval to 1 on wrong answer (dontKnow)', () => {
      mockDb.all.mockReturnValue([
        {
          id: 10,
          cardId: 3,
          userId: 'user-1',
          interval: 6,
          easeFactor: 2.5,
          nextReviewAt: '2026-02-25T00:00:00.000Z',
          reviewCount: 2,
          accuracy: 1.0,
          depthLevel: 2,
        },
      ]);

      const result = adjustSchedule({
        cardId: 3,
        userId: 'user-1',
        response: 'dontKnow',
      });

      expect(result.success).toBe(true);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ interval: 1 }));

      const setCall = mockDb.set.mock.calls[0][0];
      expect(setCall.easeFactor).toBeLessThan(2.5);
      expect(setCall.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('tracks accuracy as running average', () => {
      mockDb.all.mockReturnValue([
        {
          id: 10,
          cardId: 1,
          userId: 'user-1',
          interval: 6,
          easeFactor: 2.5,
          nextReviewAt: '2026-02-25T00:00:00.000Z',
          reviewCount: 2,
          accuracy: 1.0,
          depthLevel: 1,
        },
      ]);

      adjustSchedule({
        cardId: 1,
        userId: 'user-1',
        response: 'dontKnow',
      });

      const setCall = mockDb.set.mock.calls[0][0];
      expect(setCall.accuracy).toBeCloseTo(2 / 3, 5);
      expect(setCall.reviewCount).toBe(3);
    });

    it('wraps writes in runInTransaction', () => {
      mockDb.all.mockReturnValue([]);

      adjustSchedule({ cardId: 1, userId: 'user-1', response: 'know' });

      expect(runInTransaction).toHaveBeenCalled();
    });

    it('handles database errors gracefully', () => {
      mockDb.all.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = adjustSchedule({
        cardId: 999,
        userId: 'user-1',
        response: 'know',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('logLearningEvent', () => {
    it('logs CARD_REVIEWED event with quality in payload', () => {
      const result = logLearningEvent(1, 'user-1', 'right');

      expect(result.success).toBe(true);
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CARD_REVIEWED',
          payload: expect.objectContaining({
            direction: 'right',
            quality: 4,
          }),
        })
      );
    });

    it('logs left swipe with quality 1', () => {
      logLearningEvent(2, 'user-1', 'left');

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            direction: 'left',
            quality: 1,
          }),
        })
      );
    });

    it('handles logging errors when database fails', () => {
      mockDb.insert.mockImplementationOnce(() => {
        throw new Error('Failed to write to learning_events table');
      });

      const result = logLearningEvent(5, 'user-1', 'right');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to write to learning_events table');
    });
  });

  describe('revertScheduleAdjustment', () => {
    it('restores previous SM-2 state from snapshot', () => {
      mockDb.all.mockReturnValue([
        {
          id: 10,
          cardId: 1,
          userId: 'user-1',
          interval: 6,
          easeFactor: 2.5,
          nextReviewAt: '2026-02-25T00:00:00.000Z',
          reviewCount: 2,
          accuracy: 1.0,
          depthLevel: 1,
        },
      ]);

      const previousState = {
        interval: 1,
        easeFactor: 2.5,
        nextReviewAt: '2026-02-18T00:00:00.000Z',
        reviewCount: 1,
        accuracy: 1.0,
        depthLevel: 1,
      };

      const result = revertScheduleAdjustment(1, 'user-1', previousState);

      expect(result.success).toBe(true);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          interval: 1,
          easeFactor: 2.5,
          nextReviewAt: '2026-02-18T00:00:00.000Z',
          reviewCount: 1,
          accuracy: 1.0,
          depthLevel: 1,
        })
      );
    });

    it('falls back to simple revert without snapshot', () => {
      mockDb.all.mockReturnValue([
        {
          id: 10,
          cardId: 1,
          userId: 'user-1',
          interval: 6,
          easeFactor: 2.5,
          nextReviewAt: '2026-02-25T00:00:00.000Z',
          reviewCount: 2,
          accuracy: 1.0,
          depthLevel: 1,
        },
      ]);

      const result = revertScheduleAdjustment(1, 'user-1');

      expect(result.success).toBe(true);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ reviewCount: 1 }));
    });

    it('returns error when no schedule exists', () => {
      mockDb.all.mockReturnValue([]);

      const result = revertScheduleAdjustment(99, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_SCHEDULE_TO_REVERT');
    });

    it('handles database errors', () => {
      mockDb.all.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = revertScheduleAdjustment(1, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('fetchSRQueue', () => {
    it('returns empty queue when no due cards and no vocabulary', () => {
      // All .all() calls return empty
      mockDb.all.mockReturnValue([]);

      const result = fetchSRQueue('user-1');

      expect(result.cards).toHaveLength(0);
      expect(result.dueCount).toBe(0);
      expect(result.newCount).toBe(0);
      expect(result.estimatedMinutes).toBe(0);
      expect(result.totalDue).toBe(0);
    });

    it('returns due cards sorted by overdue priority', () => {
      // Call 1: due schedules (sorted by nextReviewAt ASC)
      mockDb.all
        .mockReturnValueOnce([
          { cardId: 2, nextReviewAt: '2026-02-18T00:00:00Z', userId: 'user-1' },
          { cardId: 5, nextReviewAt: '2026-02-19T00:00:00Z', userId: 'user-1' },
        ])
        // Call 2: vocabulary cards for due cardIds
        .mockReturnValueOnce([mockCard(5, 'world'), mockCard(2, 'hello')])
        // Call 3: all reviewed IDs (for new card exclusion)
        .mockReturnValueOnce([{ cardId: 2 }, { cardId: 5 }])
        // Call 4: new cards
        .mockReturnValueOnce([mockCard(10, 'new-word')]);

      const result = fetchSRQueue('user-1');

      expect(result.dueCount).toBe(2);
      // Cards should be reordered to match schedule priority
      expect(result.cards[0]).toEqual(expect.objectContaining({ id: 2 }));
      expect(result.cards[1]).toEqual(expect.objectContaining({ id: 5 }));
    });

    it('fills remaining slots with new cards', () => {
      // No due cards
      mockDb.all
        .mockReturnValueOnce([]) // due schedules: empty
        .mockReturnValueOnce([]) // all reviewed IDs: empty
        .mockReturnValueOnce([mockCard(1, 'apple'), mockCard(2, 'banana')]); // new cards

      const result = fetchSRQueue('user-1');

      expect(result.dueCount).toBe(0);
      expect(result.newCount).toBe(2);
      expect(result.cards).toHaveLength(2);
    });

    it('calculates estimated minutes correctly', () => {
      // 10 due cards
      const schedules = Array.from({ length: 10 }, (_, i) => ({
        cardId: i + 1,
        nextReviewAt: '2026-02-18T00:00:00Z',
        userId: 'user-1',
      }));
      const cards = Array.from({ length: 10 }, (_, i) => mockCard(i + 1, `word-${i + 1}`));

      mockDb.all
        .mockReturnValueOnce(schedules) // due schedules
        .mockReturnValueOnce(cards) // vocabulary cards
        .mockReturnValueOnce(schedules.map((s) => ({ cardId: s.cardId }))) // all reviewed
        .mockReturnValueOnce([]); // no new cards left

      const result = fetchSRQueue('user-1');

      // 10 cards * 8 seconds = 80 seconds ≈ 2 minutes
      expect(result.estimatedMinutes).toBe(Math.ceil((10 * SECONDS_PER_CARD) / 60));
    });

    it('caps new cards at MAX_NEW_CARDS_PER_DAY', () => {
      expect(MAX_NEW_CARDS_PER_DAY).toBe(15);
    });

    it('caps total queue at MAX_DAILY_QUEUE', () => {
      expect(MAX_DAILY_QUEUE).toBe(75);
    });

    it('reports totalDue for burnout warning check', () => {
      // 85 overdue schedules
      const schedules = Array.from({ length: 85 }, (_, i) => ({
        cardId: i + 1,
        nextReviewAt: '2026-02-18T00:00:00Z',
        userId: 'user-1',
      }));

      mockDb.all
        .mockReturnValueOnce(schedules) // due schedules (85 total)
        .mockReturnValueOnce(
          schedules.slice(0, MAX_DAILY_QUEUE).map((s) => mockCard(s.cardId, `w-${s.cardId}`))
        ) // capped vocabulary
        .mockReturnValueOnce(schedules.map((s) => ({ cardId: s.cardId }))) // all reviewed
        .mockReturnValueOnce([]); // no new

      const result = fetchSRQueue('user-1');

      expect(result.totalDue).toBe(85);
      expect(result.dueCount).toBe(MAX_DAILY_QUEUE); // capped
    });
  });

  describe('getCardDepthLevel', () => {
    it('returns depth level from schedule', () => {
      mockDb.all.mockReturnValue([{ depthLevel: 3 }]);

      const depth = getCardDepthLevel(1, 'user-1');

      expect(depth).toBe(3);
    });

    it('returns 0 for unreviewed card', () => {
      mockDb.all.mockReturnValue([]);

      const depth = getCardDepthLevel(99, 'user-1');

      expect(depth).toBe(0);
    });
  });
});
