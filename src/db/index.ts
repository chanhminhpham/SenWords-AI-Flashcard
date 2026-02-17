import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as localSchema from '@/db/local-schema';

const DB_NAME = 'senwords.db';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const sqlite = openDatabaseSync(DB_NAME, { enableChangeListener: true });
    db = drizzle(sqlite, { schema: localSchema });
  }
  return db;
}

export { localSchema };
export * from '@/db/local-schema';
