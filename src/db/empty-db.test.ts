// T13: nothing may crash with zero rows in every table. This runs every read
// path the app uses against a freshly migrated, completely empty database.
import { hasCompletedSession, loadRange } from './history';
import { runRollover } from './rollover';
import { countCompletedOn } from './sessions';
import { loadStreak } from './streak';
import { countTasks, getCurrentTask, getPlan } from './tasks';
import { createTestDb } from './test-db';
import { loadToday } from './today';

jest.mock('../lib/id', () => ({ newId: () => 'test-id' }));

it('every read returns a sensible empty value', async () => {
  const db = await createTestDb();
  const noon = new Date(2026, 4, 10, 12, 0);

  expect(await loadToday(db)).toMatchObject({
    task: null,
    pendingCount: 0,
    totalCount: 0,
    completedSessions: 0,
  });
  expect(await loadStreak(db, noon)).toEqual({ streak: 0, graceRemaining: 2 });
  expect(await loadRange(db, '2026-05-01', '2026-05-31')).toEqual({ counts: {}, graceDates: [] });
  expect(await getPlan(db, '2026-05-10')).toEqual([]);
  expect(await getCurrentTask(db, '2026-05-10')).toBeNull();
  expect(await countTasks(db, '2026-05-10')).toEqual({ total: 0, pending: 0 });
  expect(await countCompletedOn(db, '2026-05-10')).toBe(0);
  expect(await hasCompletedSession(db)).toBe(false);
  await expect(runRollover(db, noon)).resolves.toBeUndefined();
});
