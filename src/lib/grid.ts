import { getDay, getDaysInMonth, parseISO } from 'date-fns';


export type Level = 0 | 1 | 2 | 3;

export type GridCell = {
  date: string;
  /** Day of month, for the label. */
  day: number;
  level: Level;
  /** A grace day: shown with a dashed border, whatever the shading. */
  grace: boolean;
  isToday: boolean;
  isFuture: boolean;
};

/** Completed sessions -> shading: 0 empty, 1 light, 2-3 medium, 4+ dark. */
export function shadingLevel(completedCount: number): Level {
  if (completedCount >= 4) return 3;
  if (completedCount >= 2) return 2;
  if (completedCount >= 1) return 1;
  return 0;
}

export function makeCell(
  date: string,
  counts: Record<string, number>,
  graceDates: ReadonlySet<string>,
  today: string
): GridCell {
  return {
    date,
    day: Number(date.slice(8, 10)),
    level: shadingLevel(counts[date] ?? 0),
    grace: graceDates.has(date),
    isToday: date === today,
    isFuture: date > today,
  };
}

/**
 * Cells for a month grid with seven columns, weeks starting on Monday.
 * `null` entries are the blank squares before the 1st.
 */
export function buildMonthCells(
  month: string,
  counts: Record<string, number>,
  graceDates: ReadonlySet<string>,
  today: string
): (GridCell | null)[] {
  const first = parseISO(`${month}-01`);
  // getDay: Sunday = 0. Shift so Monday = 0.
  const leading = (getDay(first) + 6) % 7;
  const cells: (GridCell | null)[] = Array.from({ length: leading }, () => null);
  for (let d = 1; d <= getDaysInMonth(first); d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    cells.push(makeCell(date, counts, graceDates, today));
  }
  return cells;
}

