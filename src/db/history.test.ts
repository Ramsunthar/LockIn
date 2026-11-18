import { loadRange } from './history';
import { createTestDb } from './test-db';

it('returns empty data for an empty database', async () => {
  const db = await createTestDb();
  expect(await loadRange(db, '2026-05-01', '2026-05-31')).toEqual({ counts: {}, graceDates: [] });
});

it('counts completed sessions per date and lists grace dates in range', async () => {
  const db = await createTestDb();
  const add = (id: string, date: string, completed: number) =>
    db.runAsync(
      `INSERT INTO sessions (id, bucket, started_at, actual_seconds, completed, local_date)
       VALUES (?, 'dsa', '2026-05-01T00:00:00Z', 100, ?, ?)`,
      id, completed, date
    );
  await add('a', '2026-05-02', 1);
  await add('b', '2026-05-02', 1);
  await add('c', '2026-05-02', 0); // abandoned: not counted
  await add('d', '2026-06-01', 1); // outside range
  await db.runAsync("INSERT INTO day_records VALUES ('2026-05-03', 'grace')");
  await db.runAsync("INSERT INTO day_records VALUES ('2026-05-04', 'missed')");
  expect(await loadRange(db, '2026-05-01', '2026-05-31')).toEqual({
    counts: { '2026-05-02': 2 },
    graceDates: ['2026-05-03'],
  });
});
