import type { SQLiteDatabase } from 'expo-sqlite';

import { currentLocalDate, shiftLocalDate } from '../lib/day';
import { countCompletedOn } from './sessions';
import { GRACE_PER_MONTH, type DayRecord } from './rollover';

export type StreakInfo = { streak: number; graceRemaining: number };

/**
 * Pure walk-back. `records` are the day_records before today, newest first.
 * - today counts if a session has already completed; if not, the day isn't
 *   over yet, so it neither adds nor breaks anything
 * - `active` adds one; `grace` bridges the gap without adding; `missed` ends it
 * - a gap in the records (history starts here) also ends it
 */
export function deriveStreak(today: string, todayActive: boolean, records: DayRecord[]): number {
  let streak = todayActive ? 1 : 0;
  let expected = shiftLocalDate(today, -1);

  for (const record of records) {
    if (record.local_date !== expected) break;
    if (record.status === 'missed') break;
    if (record.status === 'active') streak += 1;
    expected = shiftLocalDate(expected, -1);
  }
  return streak;
}

export async function loadStreak(db: SQLiteDatabase, now: Date = new Date()): Promise<StreakInfo> {
  const today = currentLocalDate(now);
  const [completedToday, records, graceRow] = await Promise.all([
    countCompletedOn(db, today),
    db.getAllAsync<DayRecord>(
      'SELECT local_date, status FROM day_records WHERE local_date < ? ORDER BY local_date DESC',
      today
    ),
    db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM day_records WHERE status = 'grace' AND substr(local_date, 1, 7) = ?",
      today.slice(0, 7)
    ),
  ]);

  return {
    streak: deriveStreak(today, completedToday > 0, records),
    graceRemaining: Math.max(0, GRACE_PER_MONTH - (graceRow?.n ?? 0)),
  };
}
