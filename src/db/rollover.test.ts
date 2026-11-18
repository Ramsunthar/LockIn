import type { SQLiteDatabase } from 'expo-sqlite';

import { planRollover, runRollover } from './rollover';
import { createTestDb } from './test-db';

const none = new Set<string>();
const statuses = (days: string[], active = none, used = {}) =>
  planRollover(days, active, used).map((r) => r.status);

describe('planRollover', () => {
  it('marks days with a completed session active', () => {
    expect(statuses(['2026-05-01', '2026-05-02'], new Set(['2026-05-01', '2026-05-02']))).toEqual([
      'active',
      'active',
    ]);
  });

  it('spends two grace days then misses the third', () => {
    expect(statuses(['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04'])).toEqual([
      'grace',
      'grace',
      'missed',
      'missed',
    ]);
  });

  it('does not spend grace on active days', () => {
    const days = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04'];
    expect(statuses(days, new Set(['2026-05-01', '2026-05-03']))).toEqual([
      'active',
      'grace',
      'active',
      'grace',
    ]);
  });

  it('refreshes grace on a new calendar month', () => {
    expect(statuses(['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02'], none, {})).toEqual([
      'grace',
      'grace',
      'grace',
      'grace',
    ]);
  });

  it('counts grace already used this month', () => {
    expect(statuses(['2026-05-10', '2026-05-11'], none, { '2026-05': 1 })).toEqual([
      'grace',
      'missed',
    ]);
  });

  it('handles a week away from the app', () => {
    const week = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10'];
    expect(statuses(week)).toEqual(['grace', 'grace', 'missed', 'missed', 'missed', 'missed', 'missed']);
  });
});

describe('runRollover', () => {
  let db: SQLiteDatabase;
  beforeEach(async () => {
    db = await createTestDb();
  });
  const session = (date: string, completed = 1) =>
    db.runAsync(
      `INSERT INTO sessions (id, bucket, started_at, actual_seconds, completed, local_date)
       VALUES (?, 'study', '2026-01-01T00:00:00Z', 1500, ?, ?)`,
      `s-${date}-${completed}-${Math.random()}`,
      completed,
      date
    );
  const records = () =>
    db.getAllAsync<{ local_date: string; status: string }>(
      'SELECT * FROM day_records ORDER BY local_date'
    );
  const noon = (d: number) => new Date(2026, 4, d, 12, 0);

  it('writes nothing on an empty database', async () => {
    await runRollover(db, noon(10));
    expect(await records()).toEqual([]);
  });

  it('writes nothing if only abandoned sessions exist', async () => {
    await session('2026-05-08', 0);
    await runRollover(db, noon(10));
    expect(await records()).toEqual([]);
  });

  it('backfills from the first completed session up to yesterday, not today', async () => {
    await session('2026-05-06');
    await session('2026-05-08');
    await session('2026-05-10'); // today: must not be recorded yet
    await runRollover(db, noon(10));
    expect(await records()).toEqual([
      { local_date: '2026-05-06', status: 'active' },
      { local_date: '2026-05-07', status: 'grace' },
      { local_date: '2026-05-08', status: 'active' },
      { local_date: '2026-05-09', status: 'grace' },
    ]);
  });

  it('is idempotent', async () => {
    await session('2026-05-06');
    await runRollover(db, noon(10));
    const first = await records();
    await runRollover(db, noon(10));
    expect(await records()).toEqual(first);
  });

  it('resumes after the last record when the app was closed for days', async () => {
    await session('2026-05-01');
    await runRollover(db, noon(3)); // records 05-01 active, 05-02 grace
    await runRollover(db, noon(8)); // closed for five days
    const rows = await records();
    expect(rows.map((r) => r.status)).toEqual([
      'active', 'grace', 'grace', 'missed', 'missed', 'missed', 'missed',
    ]);
    expect(rows[rows.length - 1].local_date).toBe('2026-05-07');
  });

  it('uses the 04:00 rule for what "today" is', async () => {
    await session('2026-05-08');
    // 02:00 on the 10th is still LockIn day the 9th, so the 9th is not elapsed.
    await runRollover(db, new Date(2026, 4, 10, 2, 0));
    expect((await records()).map((r) => r.local_date)).toEqual(['2026-05-08']);
  });
});
