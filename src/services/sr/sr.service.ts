// SR Scheduling Service — SM-2 Spaced Repetition (Story 1.7)
import { getDb, runInTransaction } from '@/db';
import { learningEvents, srSchedule, vocabularyCards } from '@/db/local-schema';
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
    }

    return { success: true, nextReviewAt, previousState };
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
 */
export function logLearningEvent(
  cardId: number,
  userId: string,
  direction: 'left' | 'right' | 'up'
): { success: boolean; eventId?: number; error?: string } {
  try {
    const db = getDb();
    const quality =
      direction === 'right'
        ? QUALITY_MAPPING.know
        : direction === 'left'
          ? QUALITY_MAPPING.dontKnow
          : 0;

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

    return { success: true, eventId: (result as any).lastInsertRowid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'EVENT_LOG_FAILED',
    };
  }
}

/**
 * Revert last SR schedule adjustment (for undo functionality).
 *
 * If a previous state snapshot is provided (from adjustSchedule result),
 * restores the exact SM-2 state. Otherwise falls back to simple revert.
 */
export function revertScheduleAdjustment(
  cardId: number,
  userId: string,
  previousState?: ScheduleSnapshot
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
      if (previousState) {
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
 * Build the SR review queue for a user.
 *
 * Priority order: overdue cards first (most overdue → least), then new cards.
 * New cards fill the gap up to MAX_NEW_CARDS_PER_DAY, total capped at MAX_DAILY_QUEUE.
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

  // Step 3: Calculate new card slots
  const remainingTotalSlots = Math.max(0, MAX_DAILY_QUEUE - dueCards.length);
  const newCardLimit = Math.min(MAX_NEW_CARDS_PER_DAY, remainingTotalSlots);

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
