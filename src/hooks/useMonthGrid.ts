import { useCallback, useMemo, useState } from 'react';

import { loadRange } from '@/db/history';
import { currentLocalDate, monthOf, monthRange, shiftMonth } from '@/lib/day';
import { buildMonthCells } from '@/lib/grid';
import { useFocusQuery } from './use-focus-query';

export function useMonthGrid() {
  const today = currentLocalDate();
  const currentMonth = monthOf(today);
  const [month, setMonth] = useState(currentMonth);

  // useCallback keeps this function the same object until `month` changes.
  // useFocusQuery re-runs when that identity changes, so picking another
  // month fetches it, and re-renders for any other reason do not.
  const query = useCallback(
    async (db: Parameters<typeof loadRange>[0]) => {
      const { first, last } = monthRange(month);
      return { month, ...(await loadRange(db, first, last)) };
    },
    [month]
  );
  const { data } = useFocusQuery(query);

  // useMemo: building ~35 cells is cheap, but it would otherwise rebuild on
  // every render (a tap, a tick). Now it rebuilds only when the data, month or
  // today changes. `data.month === month` stops a half-way state, where the
  // old month's numbers would be drawn on the new month's calendar.
  const cells = useMemo(() => {
    if (!data || data.month !== month) return buildMonthCells(month, {}, new Set(), today);
    return buildMonthCells(month, data.counts, new Set(data.graceDates), today);
  }, [data, month, today]);

  return {
    month,
    cells,
    canGoNext: month < currentMonth,
    goPrev: () => setMonth((m) => shiftMonth(m, -1)),
    goNext: () => setMonth((m) => (m < currentMonth ? shiftMonth(m, 1) : m)),
  };
}
