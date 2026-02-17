import { like, eq } from 'drizzle-orm';
import { getDb, vocabularyCards } from '@/db';
import type { VocabularyCard } from '@/types/vocabulary';

export interface SearchResult {
  word: string;
  definition: string;
  partOfSpeech: string;
  ipa: string | null;
  exampleSentence: string | null;
}

/**
 * Search the offline dictionary by word prefix or substring.
 * Uses LIKE-based search on the indexed `word` column.
 * Performance target: < 1 second (NFR4).
 */
export function searchDictionary(query: string, limit = 20): SearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const db = getDb();
  const normalizedQuery = query.trim().toLowerCase();

  const results = db
    .select({
      word: vocabularyCards.word,
      definition: vocabularyCards.definition,
      partOfSpeech: vocabularyCards.partOfSpeech,
      ipa: vocabularyCards.ipa,
      exampleSentence: vocabularyCards.exampleSentence,
    })
    .from(vocabularyCards)
    .where(like(vocabularyCards.word, `${normalizedQuery}%`))
    .limit(limit)
    .all();

  return results;
}

/**
 * Search with broader matching (contains) for when prefix search yields few results.
 */
export function searchDictionaryBroad(query: string, limit = 20): SearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const db = getDb();
  const normalizedQuery = query.trim().toLowerCase();

  return db
    .select({
      word: vocabularyCards.word,
      definition: vocabularyCards.definition,
      partOfSpeech: vocabularyCards.partOfSpeech,
      ipa: vocabularyCards.ipa,
      exampleSentence: vocabularyCards.exampleSentence,
    })
    .from(vocabularyCards)
    .where(like(vocabularyCards.word, `%${normalizedQuery}%`))
    .limit(limit)
    .all();
}

/**
 * Get a single vocabulary card by exact word match.
 */
export function getWordByExactMatch(word: string): VocabularyCard | undefined {
  const db = getDb();
  return db
    .select()
    .from(vocabularyCards)
    .where(eq(vocabularyCards.word, word.toLowerCase().trim()))
    .limit(1)
    .all()[0] as VocabularyCard | undefined;
}

/**
 * Get vocabulary cards filtered by difficulty level.
 */
export function getWordsByDifficulty(level: number, limit = 50): VocabularyCard[] {
  const db = getDb();
  return db
    .select()
    .from(vocabularyCards)
    .where(eq(vocabularyCards.difficultyLevel, level))
    .limit(limit)
    .all() as VocabularyCard[];
}
