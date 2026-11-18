// Test-only helper: an in-memory SQLite database (Node's built-in node:sqlite)
// that exposes the small slice of the expo-sqlite API our db code uses.
// Lets us unit-test real SQL without a phone.
import { DatabaseSync } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

export async function createTestDb(): Promise<SQLiteDatabase> {
  const raw = new DatabaseSync(':memory:');
  const db = {
    execAsync: async (sql: string) => {
      raw.exec(sql);
    },
    runAsync: async (sql: string, ...params: any[]) => {
      raw.prepare(sql).run(...params);
    },
    getFirstAsync: async (sql: string, ...params: any[]) => {
      const row = raw.prepare(sql).get(...params);
      return row ? { ...row } : null;
    },
    getAllAsync: async (sql: string, ...params: any[]) =>
      raw
        .prepare(sql)
        .all(...params)
        .map((row) => ({ ...row })),
    withTransactionAsync: async (task: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;
  await runMigrations(db);
  return db;
}
