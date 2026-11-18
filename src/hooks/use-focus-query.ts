import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';

/**
 * Runs `query` every time the screen comes into focus and returns its latest
 * result. Tabs stay mounted, so a plain useEffect would show stale data after
 * you finish a session and come back; focus is the right trigger.
 *
 * `query` must be a stable function (declared at module level), otherwise
 * the effect would re-run on every render.
 */
export function useFocusQuery<T>(query: (db: SQLiteDatabase) => Promise<T>) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | null>(null);
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // `cancelled` stops a slow query from setting state after the screen
      // lost focus or unmounted.
      let cancelled = false;
      query(db).then((result) => {
        if (!cancelled) setData(result);
      });
      return () => {
        cancelled = true;
      };
    }, [db, query, version])
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, reload };
}
