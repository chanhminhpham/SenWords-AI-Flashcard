import { count } from 'drizzle-orm';
import { getDb, vocabularyCards, runInTransaction } from '@/db';

interface DictionaryEntry {
  word: string;
  definition: string;
  partOfSpeech: string;
  ipa: string | null;
  exampleSentence: string | null;
  difficultyLevel: number;
  topicTags: string[];
}

/**
 * Load bundled dictionary into SQLite on first launch.
 * Uses a transaction to prevent partial loads on crash.
 */
export async function loadDictionary(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const db = getDb();

  try {
    // Single COUNT query to check if already loaded
    const existing = db.select({ value: count() }).from(vocabularyCards).all();
    const existingCount = existing[0]?.value ?? 0;

    if (existingCount > 0) {
      return { success: true, count: existingCount };
    }

    // Lazy-load JSON only when needed (avoids holding ~MB in memory permanently)
    const baseDictionary =
      require('../../../assets/dictionary/base-5000.json') as DictionaryEntry[];

    const BATCH_SIZE = 500;

    // Wrap entire insert in a transaction — all-or-nothing
    runInTransaction(() => {
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
      }
    });

    return { success: true, count: baseDictionary.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DICTIONARY_LOAD_FAILED';
    return { success: false, count: 0, error: message };
  }
}

/**
 * Check if the dictionary has been loaded.
 */
export function isDictionaryLoaded(): boolean {
  return getDictionaryCount() > 0;
}

/**
 * Get total word count in the dictionary using COUNT query.
 */
export function getDictionaryCount(): number {
  const db = getDb();
  const result = db.select({ value: count() }).from(vocabularyCards).all();
  return result[0]?.value ?? 0;
}
