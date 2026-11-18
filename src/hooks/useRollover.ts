import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { runRollover } from '@/db/rollover';

/**
 * Records elapsed days on app open, and again whenever the app returns to the
 * foreground (it may have sat in the background across 04:00).
 * Returns true once the first pass has finished, so screens never read a
 * half-written history.
 */
export function useRollover(): boolean {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    runRollover(db).then(() => setReady(true));

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runRollover(db);
    });
    return () => sub.remove();
  }, [db]);

  return ready;
}
