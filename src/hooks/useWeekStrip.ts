import { useCallback, useMemo } from 'react';

import { loadRange } from '@/db/history';
import { currentLocalDate } from '@/lib/day';
import { buildWeekStrip, stripStart } from '@/lib/grid';
import { useFocusQuery } from './use-focus-query';

export function useWeekStrip() {
  const today = currentLocalDate();
  const query = useCallback(
    (db: Parameters<typeof loadRange>[0]) => loadRange(db, stripStart(today), today),
    [today]
  );
  const { data } = useFocusQuery(query);

  return useMemo(
    () => buildWeekStrip(today, data?.counts ?? {}, new Set(data?.graceDates ?? [])),
    [data, today]
  );
}
