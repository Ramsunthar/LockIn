import type { SQLiteDatabase } from 'expo-sqlite';

// Settings values are stored as JSON strings (see docs/data-model.md).
export async function getSetting<T>(db: SQLiteDatabase, key: string, fallback: T): Promise<T> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row ? (JSON.parse(row.value) as T) : fallback;
}
