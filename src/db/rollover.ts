import type { SQLiteDatabase } from 'expo-sqlite';

import { currentLocalDate, localDatesBetween, shiftLocalDate } from '../lib/day';
import type { DayStatus } from '../types';

export const GRACE_PER_MONTH = 2;

export type DayRecord = { local_date: string; status: DayStatus };

/**
 * The pure rule. `days` are the elapsed dates still to be recorded, oldest
 * first. A day is `active` if a session completed; otherwise it spends a
 * grace day if fewer than two were used that calendar month; otherwise it is
 * `missed`. It has to run oldest-to-newest because each decision depends on
 * the grace already spent, which is why this table is materialised.
 */
export function planRollover(
  days: string[],
  activeDays: Set<string>,
  graceUsedByMonth: Record<string, number>
): DayRecord[] {
  const used = { ...graceUsedByMonth };
  return days.map((local_date) => {
    if (activeDays.has(local_date)) return { local_date, status: 'active' };
    const month = local_date.slice(0, 7);
    if ((used[month] ?? 0) < GRACE_PER_MONTH) {
      used[month] = (used[month] ?? 0) + 1;
      return { local_date, status: 'grace' };
    }
    return { local_date, status: 'missed' };
  });
}

/**
 * Writes a day_records row for every elapsed day that lacks one. Safe to run
 * any number of times, and handles the app being closed for a week: it walks
 * from the day after the last record up to yesterday.
 */
export async function runRollover(db: SQLiteDatabase, now: Date = new Date()): Promise<void> {
  const today = currentLocalDate(now);

  const last = await db.getFirstAsync<{ d: string | null }>(
    'SELECT MAX(local_date) AS d FROM day_records'
  );
  let start: string;
  if (last?.d) {
    start = shiftLocalDate(last.d, 1);
  } else {
    // First ever rollover: history begins at the first completed session, so
    // days before the user ever started are not held against them.
    const first = await db.getFirstAsync<{ d: string | null }>(
      'SELECT MIN(local_date) AS d FROM sessions WHERE completed = 1'
    );
    if (!first?.d) return;
    start = first.d;
  }

  const days = localDatesBetween(start, shiftLocalDate(today, -1));
  if (days.length === 0) return;

  const activeRows = await db.getAllAsync<{ local_date: string }>(
    'SELECT DISTINCT local_date FROM sessions WHERE completed = 1 AND local_date BETWEEN ? AND ?',
    days[0],
    days[days.length - 1]
  );
  const graceRows = await db.getAllAsync<{ month: string; n: number }>(
    `SELECT substr(local_date, 1, 7) AS month, COUNT(*) AS n
     FROM day_records WHERE status = 'grace' GROUP BY month`
  );
  const graceUsed = Object.fromEntries(graceRows.map((r) => [r.month, r.n]));

  const records = planRollover(days, new Set(activeRows.map((r) => r.local_date)), graceUsed);

  await db.withTransactionAsync(async () => {
    for (const r of records) {
      await db.runAsync(
        'INSERT OR IGNORE INTO day_records (local_date, status) VALUES (?, ?)',
        r.local_date,
        r.status
      );
    }
  });
}
