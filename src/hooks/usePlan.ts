import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getPlan, savePlan, type PlanEntry } from '@/db/tasks';
import { tomorrowLocalDate } from '@/lib/day';
import { BUCKETS, type Bucket } from '@/types';

export type PlanRow = { enabled: boolean; label: string };
export type PlanRows = Record<Bucket, PlanRow>;

/** Loads tomorrow's existing plan (if any) as form rows, and saves edits. */
export function usePlan() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [date] = useState(tomorrowLocalDate);
  const [initial, setInitial] = useState<PlanRows | null>(null);

  useEffect(() => {
    getPlan(db, date).then((existing) => {
      const planned = existing.length > 0;
      const rows = {} as PlanRows;
      for (const bucket of BUCKETS) {
        const found = existing.find((t) => t.bucket === bucket);
        // A first-time plan starts with every bucket on; turning one off is
        // one tap, and Save is a single tap for the common "do everything".
        rows[bucket] = { enabled: planned ? !!found : true, label: found?.label ?? '' };
      }
      setInitial(rows);
    });
  }, [db, date]);

  async function save(rows: PlanRows) {
    const entries: PlanEntry[] = BUCKETS.filter((b) => rows[b].enabled).map((bucket) => ({
      bucket,
      label: rows[bucket].label.trim() || null,
    }));
    await savePlan(db, date, entries);
    router.back();
  }

  return { initial, save, cancel: () => router.back() };
}
