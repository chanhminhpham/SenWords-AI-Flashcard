import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { getDb } from '@/db';
import migrations from '@/db/migrations/migrations';

/**
 * Hook that runs Drizzle migrations on app startup.
 * Returns { success, error } so the layout can gate rendering on DB readiness.
 */
export function useDatabase() {
  const db = getDb();
  return useMigrations(db, migrations);
}
