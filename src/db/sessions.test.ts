import type { SQLiteDatabase } from 'expo-sqlite';

import { countCompletedOn, endSession, finishSession, startSession } from './sessions';
import { getPlan, savePlan } from './tasks';
import { createTestDb } from './test-db';

// jest only allows out-of-scope variables in a mock factory if they start with `mock`.
let mockCounter = 0;
jest.mock('../lib/id', () => ({ newId: () => `id-${++mockCounter}` }));

const at = (d: number, h: number, min = 0) => new Date(2026, 4, d, h, min);

let db: SQLiteDatabase;
beforeEach(async () => {
  db = await createTestDb();
});

const row = (id: string) =>
  db.getFirstAsync<Record<string, unknown>>('SELECT * FROM sessions WHERE id = ?', id);

describe('startSession', () => {
  it('inserts an open, not-yet-completed row', async () => {
    const id = await startSession(db, 'dsa', 'two pointers', at(10, 9));
    expect(await row(id)).toMatchObject({
      bucket: 'dsa',
      label: 'two pointers',
      ended_at: null,
      actual_seconds: 0,
      completed: 0,
      local_date: '2026-05-10',
    });
  });

  it('assigns local_date using the 04:00 rule', async () => {
    const late = await startSession(db, 'study', null, at(11, 1, 30));
    expect((await row(late))?.local_date).toBe('2026-05-10');
  });
});

describe('endSession', () => {
  it('marks a 25 minute session completed', async () => {
    const id = await startSession(db, 'study', null, at(10, 9));
    expect(await endSession(db, id, 1500, at(10, 9, 25))).toBe(true);
    expect(await row(id)).toMatchObject({ actual_seconds: 1500, completed: 1 });
  });

  it('leaves a 24:59 session abandoned', async () => {
    const id = await startSession(db, 'study', null, at(10, 9));
    expect(await endSession(db, id, 1499, at(10, 9, 24))).toBe(false);
    expect(await row(id)).toMatchObject({ actual_seconds: 1499, completed: 0 });
  });

  it('judges against the threshold in settings', async () => {
    await db.runAsync("UPDATE settings SET value = '600' WHERE key = 'completion_seconds'");
    const id = await startSession(db, 'study', null, at(10, 9));
    expect(await endSession(db, id, 600, at(10, 9, 10))).toBe(true);
  });
});

describe('countCompletedOn', () => {
  it('counts only completed sessions on that date', async () => {
    const a = await startSession(db, 'study', null, at(10, 9));
    await endSession(db, a, 1600, at(10, 10));
    const b = await startSession(db, 'dsa', null, at(10, 11));
    await endSession(db, b, 300, at(10, 12));
    const c = await startSession(db, 'dsa', null, at(11, 9));
    await endSession(db, c, 1600, at(11, 10));
    expect(await countCompletedOn(db, '2026-05-10')).toBe(1);
    expect(await countCompletedOn(db, '2026-05-12')).toBe(0);
  });
});

describe('finishSession', () => {
  const taskStatus = async () => (await getPlan(db, '2026-05-10'))[0].status;

  it('marks the task done when the session completes', async () => {
    await savePlan(db, '2026-05-10', [{ bucket: 'study', label: null }]);
    const [task] = await getPlan(db, '2026-05-10');
    const id = await startSession(db, 'study', null, at(10, 9));
    expect(await finishSession(db, id, 1500, task.id, at(10, 9, 25))).toBe(true);
    expect(await taskStatus()).toBe('done');
  });

  it('leaves the task pending when the session is abandoned', async () => {
    await savePlan(db, '2026-05-10', [{ bucket: 'study', label: null }]);
    const [task] = await getPlan(db, '2026-05-10');
    const id = await startSession(db, 'study', null, at(10, 9));
    expect(await finishSession(db, id, 400, task.id, at(10, 9, 7))).toBe(false);
    expect(await taskStatus()).toBe('pending');
  });

  it('works for a free session with no task', async () => {
    const id = await startSession(db, 'dsa', null, at(10, 9));
    expect(await finishSession(db, id, 1500, null, at(10, 9, 25))).toBe(true);
  });
});
