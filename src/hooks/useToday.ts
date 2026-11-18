import { useSQLiteContext } from 'expo-sqlite';

import { loadToday } from '@/db/today';
import { markTaskDone, skipTask } from '@/db/tasks';
import { useFocusQuery } from './use-focus-query';

export function useToday() {
  const db = useSQLiteContext();
  const { data, reload } = useFocusQuery(loadToday);

  async function skip() {
    if (!data?.task) return;
    await skipTask(db, data.task.id, data.date);
    reload();
  }

  // Applications aren't timed work: sending one is a tap, not a session.
  async function markDone() {
    if (!data?.task) return;
    await markTaskDone(db, data.task.id);
    reload();
  }

  return { data, skip, markDone };
}
