import { getDb, vocabularyCards } from '@/db';

interface DictionaryEntry {
  word: string;
  definition: string;
  partOfSpeech: string;
  ipa: string;
  exampleSentence: string;
  difficultyLevel: number;
  topicTags: string[];
}

const baseDictionary = require('../../../assets/dictionary/base-5000.json') as DictionaryEntry[];

/**
 * Load bundled dictionary into SQLite on first launch.
 * Tracks loading state via a sentinel row in user_preferences to prevent double-load.
 */
export async function loadDictionary(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const db = getDb();

  try {
    // Check if dictionary is already loaded by counting vocabulary rows
    const existing = db.select({ id: vocabularyCards.id }).from(vocabularyCards).limit(1).all();
    if (existing.length > 0) {
      const total = db.select({ id: vocabularyCards.id }).from(vocabularyCards).all();
      return { success: true, count: total.length };
    }

    // Bulk insert in batches of 500 for performance
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < baseDictionary.length; i += BATCH_SIZE) {
      const batch = baseDictionary.slice(i, i + BATCH_SIZE);
      db.insert(vocabularyCards)
        .values(
          batch.map((entry) => ({
            word: entry.word,
            definition: entry.definition,
            partOfSpeech: entry.partOfSpeech,
            ipa: entry.ipa,
            exampleSentence: entry.exampleSentence,
            difficultyLevel: entry.difficultyLevel,
            topicTags: entry.topicTags,
          }))
        )
        .run();
      inserted += batch.length;
    }

    return { success: true, count: inserted };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DICTIONARY_LOAD_FAILED';
    return { success: false, count: 0, error: message };
  }
}

/**
 * Check if the dictionary has been loaded.
 */
export function isDictionaryLoaded(): boolean {
  const db = getDb();
  const existing = db.select({ id: vocabularyCards.id }).from(vocabularyCards).limit(1).all();
  return existing.length > 0;
}

/**
 * Get total word count in the dictionary.
 */
export function getDictionaryCount(): number {
  const db = getDb();
  return db.select({ id: vocabularyCards.id }).from(vocabularyCards).all().length;
}
