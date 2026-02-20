// SR Scheduling Service — SM-2 Spaced Repetition (Story 1.7)
import { getDb, runInTransaction } from '@/db';
import { learningEvents, srSchedule, userPreferences, vocabularyCards } from '@/db/local-schema';
import { and, asc, eq, inArray, lte, notInArray } from 'drizzle-orm';

import {
  calculateDepthLevel,
  calculateNextReview,
  QUALITY_MAPPING,
  SM2_DEFAULTS,
} from '@/utils/sr-algorithm';
import type { VocabularyCard } from '@/types/vocabulary';

// ---------------------------------------------------------------------------
// Daily volume constants (AC6)
// ---------------------------------------------------------------------------
export const MAX_NEW_CARDS_PER_DAY = 15;
export const MAX_NEW_CARDS_ADVANCED = 10;
export const MAX_DAILY_QUEUE = 75;
export const BURNOUT_WARNING_THRESHOLD = 80;
export const SECONDS_PER_CARD = 8;

export interface AdjustScheduleParams {
  cardId: number; // Integer ID from vocabularyCards table
  userId: string;
  response: 'know' | 'dontKnow';
}

export interface ScheduleSnapshot {
  interval: number;
  easeFactor: number;
  nextReviewAt: string;
  reviewCount: number;
  accuracy: number;
  depthLevel: number;
}

export interface ScheduleResult {
  success: boolean;
  nextReviewAt?: string;
  previousState?: ScheduleSnapshot;
  /** True when the review created a new sr_schedule row (first review). */
  isFirstReview?: boolean;
  error?: string;
}

/**
 * Adjust SR schedule using SM-2 algorithm.
 *
 * Maps swipe response to quality rating (know=4, dontKnow=1),
 * calculates next interval/ease via SM-2, and persists to SQLite.
 * Returns previous state snapshot for undo support.
 */
export function adjustSchedule(params: AdjustScheduleParams): ScheduleResult {
  try {
    const { cardId, userId, response } = params;
    const db = getDb();
    const quality = QUALITY_MAPPING[response];
    // NOTE (F5): All dates stored/compared as UTC ISO 8601 via .toISOString()
    // which always produces the 'Z' suffix — safe for lexicographic comparison.
    const now = new Date().toISOString();

    // Read existing schedule (filter by both cardId AND userId)
    const existing = db
      .select()
      .from(srSchedule)
      .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
      .all();

    let previousState: ScheduleSnapshot | undefined;
    let nextReviewAt: string;

    if (existing.length > 0) {
      const schedule = existing[0];

      // Capture previous state for undo
      previousState = {
        interval: schedule.interval,
        easeFactor: schedule.easeFactor,
        nextReviewAt: schedule.nextReviewAt,
        reviewCount: schedule.reviewCount,
        accuracy: schedule.accuracy,
        depthLevel: schedule.depthLevel,
      };

      // Calculate SM-2 result
      const sm2Result = calculateNextReview({
        quality,
        previousInterval: schedule.interval,
        easeFactor: schedule.easeFactor,
        reviewCount: schedule.reviewCount,
      });

      // Running average accuracy
      const totalReviews = schedule.reviewCount + 1;
      const correctReviews = schedule.accuracy * schedule.reviewCount + (quality >= 3 ? 1 : 0);
      const newAccuracy = correctReviews / totalReviews;

      nextReviewAt = sm2Result.nextReviewDate;

      // Calculate new depth level
      const newDepthLevel = calculateDepthLevel({
        reviewCount: totalReviews,
        easeFactor: sm2Result.nextEaseFactor,
        accuracy: newAccuracy,
      });
      const depthAdvanced = newDepthLevel > schedule.depthLevel;

      runInTransaction(() => {
        db.update(srSchedule)
          .set({
            interval: sm2Result.nextInterval,
            easeFactor: sm2Result.nextEaseFactor,
            nextReviewAt: sm2Result.nextReviewDate,
            reviewCount: totalReviews,
            accuracy: newAccuracy,
            depthLevel: newDepthLevel,
            updatedAt: now,
          })
          .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
          .run();

        // Emit DEPTH_ADVANCED event on level change
        if (depthAdvanced) {
          db.insert(learningEvents)
            .values({
              userId,
              cardId,
              eventType: 'DEPTH_ADVANCED',
              payload: {
                previousLevel: schedule.depthLevel,
                newLevel: newDepthLevel,
                timestamp: Date.now(),
              },
              createdAt: now,
            })
            .run();
        }
      });

      return { success: true, nextReviewAt, previousState, isFirstReview: false };
    } else {
      // First review — create initial schedule
      const sm2Result = calculateNextReview({
        quality,
        previousInterval: 0,
        easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
        reviewCount: 0,
      });

      nextReviewAt = sm2Result.nextReviewDate;

      runInTransaction(() => {
        db.insert(srSchedule)
          .values({
            cardId,
            userId,
            interval: sm2Result.nextInterval,
            easeFactor: sm2Result.nextEaseFactor,
            nextReviewAt: sm2Result.nextReviewDate,
            reviewCount: 1,
            accuracy: quality >= 3 ? 1 : 0,
            depthLevel: 1,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      });

      return { success: true, nextReviewAt, previousState: undefined, isFirstReview: true };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SR_SCHEDULE_ADJUSTMENT_FAILED',
    };
  }
}

/**
 * Log learning event to SQLite (CARD_REVIEWED).
 * Includes quality rating in payload per AC1/AC2.
 *
 * NOTE: Swipe-up direction should NOT call this function — swipe-up is a
 * "peek/explore" gesture, not a review action. The Learn screen skips logging
 * for 'up' direction. (F9)
 */
export function logLearningEvent(
  cardId: number,
  userId: string,
  direction: 'left' | 'right'
): { success: boolean; eventId?: number; error?: string } {
  try {
    const db = getDb();
    const quality = direction === 'right' ? QUALITY_MAPPING.know : QUALITY_MAPPING.dontKnow;

    const result = db
      .insert(learningEvents)
      .values({
        userId,
        cardId,
        eventType: 'CARD_REVIEWED',
        payload: {
          direction,
          quality,
          timestamp: Date.now(),
        },
        createdAt: new Date().toISOString(),
      })
      .run();

    // F6: Drizzle's expo-sqlite .run() returns { changes, lastInsertRowid }
    const runResult = result as unknown as { lastInsertRowid?: number };
    return { success: true, eventId: runResult.lastInsertRowid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'EVENT_LOG_FAILED',
    };
  }
}

/**
 * Log a compensating CARD_REVIEW_REVERTED event when the user undoes a swipe.
 * Keeps the learning_events table append-only while marking the original
 * CARD_REVIEWED event as logically reverted. (F2)
 */
export function logUndoEvent(cardId: number, userId: string): { success: boolean; error?: string } {
  try {
    const db = getDb();
    db.insert(learningEvents)
      .values({
        userId,
        cardId,
        eventType: 'CARD_REVIEW_REVERTED',
        payload: { timestamp: Date.now() },
        createdAt: new Date().toISOString(),
      })
      .run();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'UNDO_EVENT_LOG_FAILED',
    };
  }
}

/**
 * Revert last SR schedule adjustment (for undo functionality).
 *
 * - If `previousState` is provided → restores the exact SM-2 state (UPDATE).
 * - If `previousState` is undefined AND card was a first review → DELETE the row (F3).
 * - Otherwise → simple fallback (decrement reviewCount).
 */
export function revertScheduleAdjustment(
  cardId: number,
  userId: string,
  previousState?: ScheduleSnapshot,
  isFirstReview?: boolean
): { success: boolean; error?: string } {
  try {
    const db = getDb();

    const existing = db
      .select()
      .from(srSchedule)
      .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
      .all();

    if (existing.length === 0) {
      return { success: false, error: 'NO_SCHEDULE_TO_REVERT' };
    }

    const now = new Date().toISOString();

    runInTransaction(() => {
      if (isFirstReview) {
        // F3: First review created this row — DELETE it to fully undo
        db.delete(srSchedule)
          .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
          .run();
      } else if (previousState) {
        // Full SM-2 state restoration from snapshot
        db.update(srSchedule)
          .set({
            interval: previousState.interval,
            easeFactor: previousState.easeFactor,
            nextReviewAt: previousState.nextReviewAt,
            reviewCount: previousState.reviewCount,
            accuracy: previousState.accuracy,
            depthLevel: previousState.depthLevel,
            updatedAt: now,
          })
          .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
          .run();
      } else {
        // Simple fallback: decrement reviewCount, reset nextReviewAt
        const schedule = existing[0];
        db.update(srSchedule)
          .set({
            reviewCount: Math.max(0, schedule.reviewCount - 1),
            nextReviewAt: now,
            updatedAt: now,
          })
          .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
          .run();
      }
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'REVERT_SCHEDULE_FAILED',
    };
  }
}

// ---------------------------------------------------------------------------
// SR Queue Fetching (AC3, AC7)
// ---------------------------------------------------------------------------

export interface SRQueueResult {
  cards: VocabularyCard[];
  dueCount: number;
  newCount: number;
  estimatedMinutes: number;
  totalDue: number; // Total due before cap (for warning check)
}

/**
 * Determine new-card-per-day cap based on user level. (F7 / AC6)
 * Intermediate+ (level ≥ 2) → 10, Beginner/Pre-intermediate → 15.
 */
function getNewCardCap(db: ReturnType<typeof getDb>, userId: string): number {
  const prefs = db
    .select({ level: userPreferences.level })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .all();

  const userLevel = prefs.length > 0 ? (prefs[0].level ?? 0) : 0;
  return userLevel >= 2 ? MAX_NEW_CARDS_ADVANCED : MAX_NEW_CARDS_PER_DAY;
}

/**
 * Build the SR review queue for a user.
 *
 * Priority order: overdue cards first (most overdue → least), then new cards.
 * New cards fill the gap up to the user's new-card cap (AC6),
 * total capped at MAX_DAILY_QUEUE.
 *
 * NOTE (AC7 design choice / F8): New cards do NOT get a pre-created sr_schedule
 * row when entering the queue. The initial sr_schedule entry is created on first
 * review (inside adjustSchedule). This avoids creating orphaned rows for cards
 * the user never actually reviews in a session.
 *
 * NOTE (F12 / query optimization): The current approach uses 3-4 separate queries.
 * A single JOIN would be more efficient at scale, but for a mobile SQLite DB with
 * <5000 cards, the current approach is readable and fast enough. The compound
 * index on (userId, nextReviewAt) ensures the primary query is indexed.
 */
export function fetchSRQueue(userId: string): SRQueueResult {
  const db = getDb();
  const now = new Date().toISOString();

  // Step 1: Fetch overdue review schedules
  const dueSchedules = db
    .select()
    .from(srSchedule)
    .where(and(eq(srSchedule.userId, userId), lte(srSchedule.nextReviewAt, now)))
    .orderBy(asc(srSchedule.nextReviewAt))
    .all();

  const totalDue = dueSchedules.length;

  // Cap due cards to MAX_DAILY_QUEUE
  const cappedSchedules = dueSchedules.slice(0, MAX_DAILY_QUEUE);
  const dueCardIds = cappedSchedules.map((s) => s.cardId);

  // Step 2: Fetch vocabulary data for due cards
  let dueCards: VocabularyCard[] = [];
  if (dueCardIds.length > 0) {
    dueCards = db
      .select()
      .from(vocabularyCards)
      .where(inArray(vocabularyCards.id, dueCardIds))
      .all();

    // Restore overdue priority order
    const orderMap = new Map(dueCardIds.map((id, idx) => [id, idx]));
    dueCards.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  }

  // Step 3: Calculate new card slots (F7: level-aware cap)
  const maxNewCards = getNewCardCap(db, userId);
  const remainingTotalSlots = Math.max(0, MAX_DAILY_QUEUE - dueCards.length);
  const newCardLimit = Math.min(maxNewCards, remainingTotalSlots);

  // Step 4: Fetch new cards (never reviewed by this user)
  let newCards: VocabularyCard[] = [];
  if (newCardLimit > 0) {
    const allReviewedIds = db
      .select({ cardId: srSchedule.cardId })
      .from(srSchedule)
      .where(eq(srSchedule.userId, userId))
      .all()
      .map((r) => r.cardId);

    if (allReviewedIds.length > 0) {
      newCards = db
        .select()
        .from(vocabularyCards)
        .where(notInArray(vocabularyCards.id, allReviewedIds))
        .orderBy(asc(vocabularyCards.difficultyLevel))
        .limit(newCardLimit)
        .all();
    } else {
      newCards = db
        .select()
        .from(vocabularyCards)
        .orderBy(asc(vocabularyCards.difficultyLevel))
        .limit(newCardLimit)
        .all();
    }
  }

  // Combine: due first, then new
  const allCards = [...dueCards, ...newCards];
  const estimatedMinutes = Math.ceil((allCards.length * SECONDS_PER_CARD) / 60);

  return {
    cards: allCards,
    dueCount: dueCards.length,
    newCount: newCards.length,
    estimatedMinutes,
    totalDue,
  };
}

/**
 * Get depth level for a specific card/user from sr_schedule.
 * Returns 0 if card has never been reviewed.
 */
export function getCardDepthLevel(cardId: number, userId: string): number {
  const db = getDb();
  const result = db
    .select({ depthLevel: srSchedule.depthLevel })
    .from(srSchedule)
    .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
    .all();

  return result.length > 0 ? result[0].depthLevel : 0;
}
