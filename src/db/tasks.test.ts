import type { SQLiteDatabase } from 'expo-sqlite';

import {
  countTasks,
  getCurrentTask,
  getPlan,
  markTaskDone,
  savePlan,
  skipTask,
} from './tasks';
import { createTestDb } from './test-db';

let mockCounter = 0;
jest.mock('../lib/id', () => ({ newId: () => `task-${++mockCounter}` }));

const DAY = '2026-05-10';
let db: SQLiteDatabase;

beforeEach(async () => {
  db = await createTestDb();
});

const plan3 = () =>
  savePlan(db, DAY, [
    { bucket: 'study', label: 'IAM chapter' },
    { bucket: 'dsa', label: null },
    { bucket: 'project', label: 'streak hook' },
  ]);

describe('getCurrentTask', () => {
  it('is null when nothing is planned', async () => {
    expect(await getCurrentTask(db, DAY)).toBeNull();
  });

  it('returns the first pending task by position', async () => {
    await plan3();
    expect((await getCurrentTask(db, DAY))?.bucket).toBe('study');
  });

  it('moves on once a task is done', async () => {
    await plan3();
    const first = await getCurrentTask(db, DAY);
    await markTaskDone(db, first!.id);
    expect((await getCurrentTask(db, DAY))?.bucket).toBe('dsa');
  });

  it('only looks at the requested date', async () => {
    await plan3();
    expect(await getCurrentTask(db, '2026-05-11')).toBeNull();
  });
});

describe('skipTask', () => {
  it('rotates the task to the back of the queue', async () => {
    await plan3();
    const first = await getCurrentTask(db, DAY);
    await skipTask(db, first!.id, DAY);
    expect((await getCurrentTask(db, DAY))?.bucket).toBe('dsa');
    const order = (await getPlan(db, DAY)).map((t) => t.bucket);
    expect(order).toEqual(['dsa', 'project', 'study']);
  });

  it('keeps cycling through repeated skips', async () => {
    await plan3();
    for (let i = 0; i < 3; i++) {
      const task = await getCurrentTask(db, DAY);
      await skipTask(db, task!.id, DAY);
    }
    expect((await getCurrentTask(db, DAY))?.bucket).toBe('study');
  });
});

describe('countTasks', () => {
  it('returns zeros for an empty day', async () => {
    expect(await countTasks(db, DAY)).toEqual({ total: 0, pending: 0 });
  });

  it('separates pending from total', async () => {
    await plan3();
    const first = await getCurrentTask(db, DAY);
    await markTaskDone(db, first!.id);
    expect(await countTasks(db, DAY)).toEqual({ total: 3, pending: 2 });
  });
});

describe('savePlan', () => {
  it('replaces an existing plan rather than appending', async () => {
    await plan3();
    await savePlan(db, DAY, [{ bucket: 'applications', label: null }]);
    const plan = await getPlan(db, DAY);
    expect(plan.map((t) => t.bucket)).toEqual(['applications']);
    expect(plan[0]).toMatchObject({ status: 'pending', position: 0, label: null });
  });

  it('can save an empty plan', async () => {
    await plan3();
    await savePlan(db, DAY, []);
    expect(await getPlan(db, DAY)).toEqual([]);
  });
});
