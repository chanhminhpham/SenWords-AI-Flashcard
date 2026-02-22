import { count, eq } from 'drizzle-orm';
import { getDb, wordFamilies, wordFamilyMembers, vocabularyCards, runInTransaction } from '@/db';
import type { WordFamilyWithMembers } from '@/types/vocabulary';

/**
 * Fetch word family data for a given vocabulary card ID.
 * Returns null if the card doesn't belong to any word family.
 */
export function fetchWordFamily(cardId: number): WordFamilyWithMembers | null {
  const db = getDb();

  // Find which family this card belongs to
  const memberRows = db
    .select()
    .from(wordFamilyMembers)
    .leftJoin(wordFamilies, eq(wordFamilyMembers.familyId, wordFamilies.id))
    .where(eq(wordFamilyMembers.cardId, cardId))
    .all();

  if (memberRows.length === 0 || !memberRows[0].word_families) {
    return null;
  }

  const family = memberRows[0].word_families;

  return buildFamilyWithMembers(db, family);
}

/**
 * Fetch word family data by word text (case-sensitive match on word_text).
 * Returns null if the word doesn't belong to any word family.
 */
export function fetchWordFamilyByWord(word: string): WordFamilyWithMembers | null {
  const db = getDb();

  const memberRows = db
    .select()
    .from(wordFamilyMembers)
    .leftJoin(wordFamilies, eq(wordFamilyMembers.familyId, wordFamilies.id))
    .where(eq(wordFamilyMembers.wordText, word))
    .all();

  if (memberRows.length === 0 || !memberRows[0].word_families) {
    return null;
  }

  const family = memberRows[0].word_families;

  return buildFamilyWithMembers(db, family);
}

interface SeedMember {
  wordText: string;
  partOfSpeech: string;
  formLabel?: string;
}

interface SeedFamily {
  rootWord: string;
  members: SeedMember[];
}

/**
 * Load bundled word families into SQLite on first launch.
 * Maps members to vocabulary_cards by word + partOfSpeech composite lookup.
 */
export async function loadWordFamilies(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const db = getDb();

  try {
    const existing = db.select({ value: count() }).from(wordFamilies).all();
    const existingCount = existing[0]?.value ?? 0;

    if (existingCount > 0) {
      return { success: true, count: existingCount };
    }

    const seedData = require('../../../assets/dictionary/word-families.json') as SeedFamily[];

    // Pre-load all vocabulary cards into a lookup map (1 query instead of ~2000)
    const allCards = db
      .select({
        id: vocabularyCards.id,
        word: vocabularyCards.word,
        pos: vocabularyCards.partOfSpeech,
      })
      .from(vocabularyCards)
      .all();
    const cardMap = new Map(allCards.map((c) => [`${c.word}|${c.pos}`, c.id]));

    runInTransaction(() => {
      for (const family of seedData) {
        const [inserted] = db
          .insert(wordFamilies)
          .values({ rootWord: family.rootWord })
          .returning({ id: wordFamilies.id })
          .all();

        for (const member of family.members) {
          const cardId = cardMap.get(`${member.wordText}|${member.partOfSpeech}`) ?? null;

          db.insert(wordFamilyMembers)
            .values({
              familyId: inserted.id,
              cardId,
              wordText: member.wordText,
              partOfSpeech: member.partOfSpeech,
              formLabel: member.formLabel ?? null,
            })
            .run();
        }
      }
    });

    return { success: true, count: seedData.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORD_FAMILY_LOAD_FAILED';
    return { success: false, count: 0, error: message };
  }
}

function buildFamilyWithMembers(
  db: ReturnType<typeof getDb>,
  family: typeof wordFamilies.$inferSelect
): WordFamilyWithMembers {
  // Get all members of this family with their linked vocabulary cards
  const allMembers = db
    .select()
    .from(wordFamilyMembers)
    .leftJoin(vocabularyCards, eq(wordFamilyMembers.cardId, vocabularyCards.id))
    .where(eq(wordFamilyMembers.familyId, family.id))
    .all();

  return {
    family,
    members: allMembers.map((row) => ({
      ...row.word_family_members,
      card: row.vocabulary_cards ?? null,
    })),
  };
}
