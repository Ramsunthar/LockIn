import { useSQLiteContext } from 'expo-sqlite';

import { loadToday } from '@/db/today';
import { skipTask } from '@/db/tasks';
import { useFocusQuery } from './use-focus-query';

export function useToday() {
  const db = useSQLiteContext();
  const { data, reload } = useFocusQuery(loadToday);

  async function skip() {
    if (!data?.task) return;
    await skipTask(db, data.task.id, data.date);
    reload();
  }

  return { data, skip };
}
