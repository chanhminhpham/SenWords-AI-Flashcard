import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as localSchema from '@/db/local-schema';

const DB_NAME = 'senwords.db';

let sqliteInstance: SQLiteDatabase | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getSqliteInstance(): SQLiteDatabase {
  if (!sqliteInstance) {
    sqliteInstance = openDatabaseSync(DB_NAME, { enableChangeListener: true });
  }
  return sqliteInstance;
}

export function getDb() {
  if (!db) {
    db = drizzle(getSqliteInstance(), { schema: localSchema });
  }
  return db;
}

/**
 * Run a callback inside a SQLite transaction.
 * Automatically rolls back on error.
 */
export function runInTransaction(fn: () => void): void {
  getSqliteInstance().withTransactionSync(fn);
}

export { localSchema };
export * from '@/db/local-schema';
