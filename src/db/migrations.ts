import type { SQLiteDatabase } from 'expo-sqlite';

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

// Ordered, append-only. Never edit a migration that has shipped; add a new one.
export const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE sessions (
          id              TEXT PRIMARY KEY,
          bucket          TEXT NOT NULL,
          label           TEXT,
          started_at      TEXT NOT NULL,
          ended_at        TEXT,
          actual_seconds  INTEGER NOT NULL DEFAULT 0,
          completed       INTEGER NOT NULL DEFAULT 0,
          local_date      TEXT NOT NULL
        );
        CREATE INDEX idx_sessions_local_date ON sessions(local_date);

        CREATE TABLE planned_tasks (
          id        TEXT PRIMARY KEY,
          for_date  TEXT NOT NULL,
          bucket    TEXT NOT NULL,
          label     TEXT,
          status    TEXT NOT NULL DEFAULT 'pending',
          position  INTEGER NOT NULL
        );
        CREATE INDEX idx_planned_for_date ON planned_tasks(for_date);

        CREATE TABLE day_records (
          local_date  TEXT PRIMARY KEY,
          status      TEXT NOT NULL
        );

        CREATE TABLE settings (
          key    TEXT PRIMARY KEY,
          value  TEXT NOT NULL
        );
        INSERT INTO settings (key, value) VALUES
          ('day_boundary_hour', '4'),
          ('completion_seconds', '1500'),
          ('plan_reminder_time', '"21:30"');
      `);
    },
  },
];

const SCHEMA_VERSION_KEY = 'schema_version';

// On a brand-new database the settings table does not exist yet, so a fresh
// install counts as version 0.
async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const table = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'"
  );
  if (!table) return 0;

  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    SCHEMA_VERSION_KEY
  );
  return row ? Number(JSON.parse(row.value)) : 0;
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const current = await getSchemaVersion(db);

  for (const migration of migrations) {
    if (migration.version <= current) continue;

    // One transaction per migration: the schema change and the version bump
    // commit together, so a crash can never leave them out of step.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        SCHEMA_VERSION_KEY,
        JSON.stringify(migration.version)
      );
    });
  }
}
