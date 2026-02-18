// SR Scheduling Service — Placeholder for SM-2 algorithm (Story 1.6)
// Full implementation in Story 1.7
import { getDb } from '@/db';
import { learningEvents, srSchedule } from '@/db/local-schema';
import { eq } from 'drizzle-orm';

export interface AdjustScheduleParams {
  cardId: number; // Integer ID from vocabularyCards table
  userId: string;
  response: 'know' | 'dontKnow';
}

export interface ScheduleResult {
  success: boolean;
  nextReviewAt?: Date;
  error?: string;
}

/**
 * Adjust SR schedule based on user swipe response (PLACEHOLDER).
 *
 * Story 1.6: Simple logic (left = 1 hour, right = tomorrow)
 * Story 1.7: Full SM-2 algorithm with ease factor, interval calculation
 *
 * @param params - Card ID, user ID, response type
 * @returns Schedule result with next review timestamp
 */
export async function adjustSchedule(params: AdjustScheduleParams): Promise<ScheduleResult> {
  try {
    const { cardId, userId, response } = params;

    // PLACEHOLDER logic (Story 1.6)
    const now = new Date();
    const nextReviewAt = new Date(now);

    if (response === 'dontKnow') {
      // Review in 1 hour
      nextReviewAt.setHours(now.getHours() + 1);
    } else {
      // Review tomorrow
      nextReviewAt.setDate(now.getDate() + 1);
    }

    // Check if schedule exists
    const db = getDb();
    const existing = await db
      .select()
      .from(srSchedule)
      .where(eq(srSchedule.cardId, cardId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing schedule
      await db
        .update(srSchedule)
        .set({
          nextReviewAt: nextReviewAt.toISOString(),
          reviewCount: existing[0].reviewCount + 1,
          updatedAt: now.toISOString(),
        })
        .where(eq(srSchedule.cardId, cardId));
    } else {
      // Insert new schedule
      await db.insert(srSchedule).values({
        cardId,
        userId,
        interval: 1, // Placeholder
        easeFactor: 2.5, // Default SM-2 ease factor
        nextReviewAt: nextReviewAt.toISOString(),
        reviewCount: 1,
        accuracy: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    return {
      success: true,
      nextReviewAt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SR_SCHEDULE_ADJUSTMENT_FAILED',
    };
  }
}

/**
 * Log learning event to SQLite (CARD_REVIEWED).
 *
 * @param cardId - Vocabulary card ID
 * @param userId - User ID
 * @param direction - Swipe direction
 */
export async function logLearningEvent(
  cardId: number,
  userId: string,
  direction: 'left' | 'right' | 'up'
): Promise<{ success: boolean; eventId?: number; error?: string }> {
  try {
    const db = getDb();
    const result = await db.insert(learningEvents).values({
      userId,
      cardId,
      eventType: 'CARD_REVIEWED',
      payload: {
        direction,
        timestamp: Date.now(),
      },
      createdAt: new Date().toISOString(),
    });

    // Return event ID for potential undo (Drizzle returns lastInsertRowid)
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
 * Decrements reviewCount and reverts nextReviewAt to previous value.
 *
 * NOTE: This is a simplified undo - full history tracking in Story 1.7
 *
 * @param cardId - Card ID to revert
 * @param userId - User ID
 */
export async function revertScheduleAdjustment(
  cardId: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Get current schedule
    const existing = await db
      .select()
      .from(srSchedule)
      .where(eq(srSchedule.cardId, cardId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'NO_SCHEDULE_TO_REVERT' };
    }

    const schedule = existing[0];

    // Revert: decrement reviewCount, reset nextReviewAt to "now"
    await db
      .update(srSchedule)
      .set({
        reviewCount: Math.max(0, schedule.reviewCount - 1),
        nextReviewAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(srSchedule.cardId, cardId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'REVERT_SCHEDULE_FAILED',
    };
  }
}
