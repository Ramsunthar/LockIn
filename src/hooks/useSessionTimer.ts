import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

import { endSession, startSession } from '@/db/sessions';
import type { Bucket } from '@/types';

export const FIVE_MINUTES = 300;
export const COMPLETION_SECONDS = 1500;

type Params = { bucket: Bucket; label: string | null };

export function useSessionTimer({ bucket, label }: Params) {
  const db = useSQLiteContext();
  const router = useRouter();

  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);
  // A ref (not state) because changing it must not re-render, and the effect
  // below must see the latest value without re-running.
  const sessionId = useRef<string | null>(null);

  // Effect 1: start the session once, when the screen mounts. The empty
  // dependency list means "run after the first render only".
  useEffect(() => {
    if (sessionId.current) return; // guard against a double mount (StrictMode)
    startSession(db, bucket, label).then((id) => {
      sessionId.current = id;
      setStartedAtMs(Date.now());
    });
    // Deliberately only on mount: bucket/label are fixed for this screen.
  }, []);

  // Effect 2: tick once a second once the session exists.
  useEffect(() => {
    if (startedAtMs === null) return;
    // Elapsed is recomputed from the start timestamp, not counted tick by tick.
    // Timers pause when the app is backgrounded; the clock does not.
    const tick = () => setElapsed(Math.floor((Date.now() - startedAtMs) / 1000));
    const interval = setInterval(tick, 1000);
    // The cleanup function runs on unmount. Without it the interval keeps
    // firing and calls setElapsed on a screen that no longer exists.
    return () => clearInterval(interval);
  }, [startedAtMs]);

  async function stop() {
    if (stopping || sessionId.current === null || startedAtMs === null) return;
    setStopping(true);
    const seconds = Math.floor((Date.now() - startedAtMs) / 1000);
    await endSession(db, sessionId.current, seconds);
    router.dismissTo('/');
  }

  return { elapsed, stop, stopping, ready: startedAtMs !== null };
}
