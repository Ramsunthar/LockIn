import type { SQLiteDatabase } from 'expo-sqlite';

import { newId } from '../lib/id';
import type { Bucket, PlannedTask } from '../types';

export type PlanEntry = { bucket: Bucket; label: string | null };

/** All tasks planned for a date, in their stable order. */
export async function getPlan(db: SQLiteDatabase, forDate: string): Promise<PlannedTask[]> {
  return db.getAllAsync<PlannedTask>(
    'SELECT * FROM planned_tasks WHERE for_date = ? ORDER BY position',
    forDate
  );
}

/** The one task Today shows: the first pending task in order. */
export async function getCurrentTask(
  db: SQLiteDatabase,
  forDate: string
): Promise<PlannedTask | null> {
  return db.getFirstAsync<PlannedTask>(
    `SELECT * FROM planned_tasks
     WHERE for_date = ? AND status = 'pending'
     ORDER BY position LIMIT 1`,
    forDate
  );
}

export async function countTasks(
  db: SQLiteDatabase,
  forDate: string
): Promise<{ total: number; pending: number }> {
  const row = await db.getFirstAsync<{ total: number; pending: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'pending'), 0) AS pending
     FROM planned_tasks WHERE for_date = ?`,
    forDate
  );
  return row ?? { total: 0, pending: 0 };
}

/**
 * Skip rotates: the task moves to the back of the queue. Nothing is lost,
 * and the schema needs no extra "skipped" state.
 */
export async function skipTask(db: SQLiteDatabase, id: string, forDate: string): Promise<void> {
  await db.runAsync(
    `UPDATE planned_tasks
     SET position = (SELECT COALESCE(MAX(position), 0) + 1 FROM planned_tasks WHERE for_date = ?)
     WHERE id = ?`,
    forDate,
    id
  );
}

export async function markTaskDone(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("UPDATE planned_tasks SET status = 'done' WHERE id = ?", id);
}

/** Replaces the whole plan for a date. Positions follow the entries' order. */
export async function savePlan(
  db: SQLiteDatabase,
  forDate: string,
  entries: PlanEntry[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM planned_tasks WHERE for_date = ?', forDate);
    for (const [position, entry] of entries.entries()) {
      await db.runAsync(
        `INSERT INTO planned_tasks (id, for_date, bucket, label, status, position)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        newId(),
        forDate,
        entry.bucket,
        entry.label,
        position
      );
    }
  });
}

