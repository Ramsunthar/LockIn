import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

export const DATABASE_NAME = 'lockin.db';

// Passed to <SQLiteProvider onInit={...}>. Runs once when the database opens,
// before any screen can query it.
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db);
}
