import type { SQLiteDatabase } from 'expo-sqlite';

import { deriveStreak, loadStreak } from './streak';
import { createTestDb } from './test-db';
import type { DayRecord } from './rollover';

// streak.ts imports sessions.ts, which imports the (ESM-only) uuid via newId.
jest.mock('../lib/id', () => ({ newId: () => 'test-id' }));

const rec = (local_date: string, status: DayRecord['status']): DayRecord => ({ local_date, status });
const TODAY = '2026-05-10';

describe('deriveStreak', () => {
  it('is 0 with no history and nothing done today', () => {
    expect(deriveStreak(TODAY, false, [])).toBe(0);
  });

  it('counts today once a session has completed', () => {
    expect(deriveStreak(TODAY, true, [])).toBe(1);
  });

  it('does not break on an unfinished today', () => {
    const records = [rec('2026-05-09', 'active'), rec('2026-05-08', 'active')];
    expect(deriveStreak(TODAY, false, records)).toBe(2);
  });

  it('counts consecutive active days plus today', () => {
    const records = [rec('2026-05-09', 'active'), rec('2026-05-08', 'active')];
    expect(deriveStreak(TODAY, true, records)).toBe(3);
  });

  it('bridges grace days without counting them', () => {
    const records = [rec('2026-05-09', 'grace'), rec('2026-05-08', 'active'), rec('2026-05-07', 'active')];
    expect(deriveStreak(TODAY, true, records)).toBe(3);
  });

  it('stops at a missed day', () => {
    const records = [rec('2026-05-09', 'active'), rec('2026-05-08', 'missed'), rec('2026-05-07', 'active')];
    expect(deriveStreak(TODAY, true, records)).toBe(2);
  });

  it('is 0 when yesterday was missed and nothing is done today', () => {
    expect(deriveStreak(TODAY, false, [rec('2026-05-09', 'missed')])).toBe(0);
  });

  it('stops where history has a gap', () => {
    const records = [rec('2026-05-09', 'active'), rec('2026-05-07', 'active')];
    expect(deriveStreak(TODAY, false, records)).toBe(1);
  });
});

describe('loadStreak', () => {
  let db: SQLiteDatabase;
  beforeEach(async () => {
    db = await createTestDb();
  });
  const noon = new Date(2026, 4, 10, 12, 0);

  it('returns zero streak and full grace on an empty database', async () => {
    expect(await loadStreak(db, noon)).toEqual({ streak: 0, graceRemaining: 2 });
  });

  it('derives the streak and grace remaining from stored rows', async () => {
    for (const [d, s] of [['2026-05-07', 'active'], ['2026-05-08', 'grace'], ['2026-05-09', 'active']]) {
      await db.runAsync('INSERT INTO day_records (local_date, status) VALUES (?, ?)', d, s);
    }
    await db.runAsync(
      `INSERT INTO sessions (id, bucket, started_at, actual_seconds, completed, local_date)
       VALUES ('x', 'dsa', '2026-05-10T09:00:00Z', 1600, 1, '2026-05-10')`
    );
    expect(await loadStreak(db, noon)).toEqual({ streak: 3, graceRemaining: 1 });
  });

  it("only counts this month's grace days", async () => {
    await db.runAsync("INSERT INTO day_records VALUES ('2026-04-30', 'grace')");
    await db.runAsync("INSERT INTO day_records VALUES ('2026-04-29', 'grace')");
    expect((await loadStreak(db, noon)).graceRemaining).toBe(2);
  });
});
