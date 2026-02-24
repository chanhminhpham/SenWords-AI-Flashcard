// Vocabulary data services — fetch individual card and schedule data (Story 2.2)
import { eq, and } from 'drizzle-orm';

import { getDb } from '@/db';
import { vocabularyCards, srSchedule, userPreferences } from '@/db/local-schema';
import type { VocabularyCard, SrSchedule } from '@/types/vocabulary';
import type { UserLevelValue } from '@/types/onboarding';

/**
 * Fetch a single vocabulary card by ID.
 * Returns null if card not found.
 */
export function fetchCardById(cardId: number): VocabularyCard | null {
  const db = getDb();
  const results = db.select().from(vocabularyCards).where(eq(vocabularyCards.id, cardId)).all();

  return results.length > 0 ? results[0] : null;
}

/**
 * Fetch SR schedule for a card/user pair.
 * Returns null if no schedule exists (card never reviewed).
 */
export function fetchScheduleByCardId(cardId: number, userId: string): SrSchedule | null {
  const db = getDb();
  const results = db
    .select()
    .from(srSchedule)
    .where(and(eq(srSchedule.cardId, cardId), eq(srSchedule.userId, userId)))
    .all();

  return results.length > 0 ? results[0] : null;
}

/**
 * Fetch user level from user_preferences.
 * Returns 0 (Beginner) if not found.
 */
export function fetchUserLevel(userId: string): UserLevelValue {
  const db = getDb();
  const results = db
    .select({ level: userPreferences.level })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .all();

  return (results.length > 0 ? (results[0].level ?? 0) : 0) as UserLevelValue;
}
