import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateFor } from '../lib/day';
import { newId } from '../lib/id';
import type { Bucket } from '../types';
import { getSetting } from './settings';
import { markTaskDone } from './tasks';

const DEFAULT_COMPLETION_SECONDS = 1500;

/**
 * Inserts a session row when the user presses Start and returns its id.
 * `completed` starts at 0: nothing has been done yet. `endSession` decides.
 * `now` is a parameter only so tests can pin the clock.
 */
export async function startSession(
  db: SQLiteDatabase,
  bucket: Bucket,
  label: string | null,
  now: Date = new Date()
): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO sessions (id, bucket, label, started_at, actual_seconds, completed, local_date)
     VALUES (?, ?, ?, ?, 0, 0, ?)`,
    id,
    bucket,
    label,
    now.toISOString(),
    localDateFor(now)
  );
  return id;
}

/**
 * Closes a session. Judges `completed` against the threshold in force right
 * now and stores the verdict, so changing the threshold later never rewrites
 * history. Returns whether the session counted as completed.
 */
export async function endSession(
  db: SQLiteDatabase,
  id: string,
  elapsedSeconds: number,
  now: Date = new Date()
): Promise<boolean> {
  const threshold = await getSetting(db, 'completion_seconds', DEFAULT_COMPLETION_SECONDS);
  const completed = elapsedSeconds >= threshold;
  await db.runAsync(
    'UPDATE sessions SET ended_at = ?, actual_seconds = ?, completed = ? WHERE id = ?',
    now.toISOString(),
    elapsedSeconds,
    completed ? 1 : 0,
    id
  );
  return completed;
}

/** Completed sessions on one local date. Abandoned sessions are never counted. */
export async function countCompletedOn(db: SQLiteDatabase, localDate: string): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM sessions WHERE local_date = ? AND completed = 1',
    localDate
  );
  return row?.n ?? 0;
}

/**
 * Ends a session and, if it counted as completed, marks the planned task it
 * was started from as done. One transaction, so a crash can't leave a
 * completed session beside a task that still says pending.
 * Abandoned sessions leave the task pending.
 */
export async function finishSession(
  db: SQLiteDatabase,
  id: string,
  elapsedSeconds: number,
  taskId: string | null,
  now: Date = new Date()
): Promise<boolean> {
  let completed = false;
  await db.withTransactionAsync(async () => {
    completed = await endSession(db, id, elapsedSeconds, now);
    if (completed && taskId) await markTaskDone(db, taskId);
  });
  return completed;
}
