import type { SQLiteDatabase } from 'expo-sqlite';

import { currentLocalDate } from '../lib/day';
import type { PlannedTask } from '../types';
import { countCompletedOn } from './sessions';
import { countTasks, getCurrentTask } from './tasks';

export type TodayData = {
  date: string;
  task: PlannedTask | null;
  pendingCount: number;
  totalCount: number;
  completedSessions: number;
};

export async function loadToday(db: SQLiteDatabase): Promise<TodayData> {
  const date = currentLocalDate();
  const [task, counts, completedSessions] = await Promise.all([
    getCurrentTask(db, date),
    countTasks(db, date),
    countCompletedOn(db, date),
  ]);
  return {
    date,
    task,
    pendingCount: counts.pending,
    totalCount: counts.total,
    completedSessions,
  };
}
