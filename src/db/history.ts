import type { SQLiteDatabase } from 'expo-sqlite';

export type RangeData = {
  /** Completed sessions per local_date. Days with none are absent. */
  counts: Record<string, number>;
  /** Dates that spent a grace day. */
  graceDates: string[];
};

/** Everything the grid and the 12-week strip need for [from, to], inclusive. */
export async function loadRange(db: SQLiteDatabase, from: string, to: string): Promise<RangeData> {
  const [countRows, graceRows] = await Promise.all([
    db.getAllAsync<{ local_date: string; n: number }>(
      `SELECT local_date, COUNT(*) AS n FROM sessions
       WHERE completed = 1 AND local_date BETWEEN ? AND ?
       GROUP BY local_date`,
      from,
      to
    ),
    db.getAllAsync<{ local_date: string }>(
      "SELECT local_date FROM day_records WHERE status = 'grace' AND local_date BETWEEN ? AND ?",
      from,
      to
    ),
  ]);
  return {
    counts: Object.fromEntries(countRows.map((r) => [r.local_date, r.n])),
    graceDates: graceRows.map((r) => r.local_date),
  };
}

/** True once the user has ever completed a session. Drives first-run messaging. */
export async function hasCompletedSession(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM (SELECT 1 FROM sessions WHERE completed = 1 LIMIT 1)'
  );
  return (row?.n ?? 0) > 0;
}
