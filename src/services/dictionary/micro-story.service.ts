import { count, eq } from 'drizzle-orm';
import { getDb, microStories, wordFamilies, runInTransaction } from '@/db';
import type { MicroStory } from '@/types/vocabulary';

/**
 * Fetch micro-stories for a given word family ID.
 * Returns empty array if no stories exist for this family.
 */
export function fetchMicroStories(familyId: number): MicroStory[] {
  const db = getDb();
  return db.select().from(microStories).where(eq(microStories.familyId, familyId)).all();
}

interface SeedHighlightedWord {
  wordText: string;
  startIndex: number;
  endIndex: number;
  definition: string;
  partOfSpeech: string;
}

interface SeedMicroStory {
  familyRootWord: string;
  storyText: string;
  highlightedWords: SeedHighlightedWord[];
  difficultyLevel: number;
}

/**
 * Load bundled micro-stories into SQLite on first launch.
 * Maps stories to word families by rootWord lookup.
 * Follows same pattern as loadWordFamilies().
 */
export async function loadMicroStories(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const db = getDb();

  try {
    const existing = db.select({ value: count() }).from(microStories).all();
    const existingCount = existing[0]?.value ?? 0;

    if (existingCount > 0) {
      return { success: true, count: existingCount };
    }

    const seedData = require('../../../assets/dictionary/micro-stories.json') as SeedMicroStory[];

    // Build rootWord → familyId lookup map
    const allFamilies = db
      .select({ id: wordFamilies.id, rootWord: wordFamilies.rootWord })
      .from(wordFamilies)
      .all();
    const familyMap = new Map(allFamilies.map((f) => [f.rootWord, f.id]));

    let insertedCount = 0;

    runInTransaction(() => {
      for (const story of seedData) {
        const familyId = familyMap.get(story.familyRootWord);
        if (!familyId) continue; // Skip stories for families not yet seeded

        db.insert(microStories)
          .values({
            familyId,
            storyText: story.storyText,
            highlightedWords: story.highlightedWords,
            difficultyLevel: story.difficultyLevel,
          })
          .run();
        insertedCount++;
      }
    });

    return { success: true, count: insertedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MICRO_STORY_LOAD_FAILED';
    return { success: false, count: 0, error: message };
  }
}
