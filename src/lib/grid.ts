import { getDay, getDaysInMonth, parseISO } from 'date-fns';

import { shiftLocalDate } from './day';


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


export const STRIP_WEEKS = 12;

/** Monday of the week that contains `date`. */
function weekStart(date: string): string {
  return shiftLocalDate(date, -((getDay(parseISO(date)) + 6) % 7));
}

/** First date shown in the strip: the Monday 11 weeks before this week's. */
export function stripStart(today: string, weeks: number = STRIP_WEEKS): string {
  return shiftLocalDate(weekStart(today), -7 * (weeks - 1));
}

/**
 * The last-12-weeks strip: one array per week (oldest first), each holding
 * Monday..Sunday. Days after today are `null`, so the final column is
 * short-filled rather than showing the future.
 */
export function buildWeekStrip(
  today: string,
  counts: Record<string, number>,
  graceDates: ReadonlySet<string>,
  weeks: number = STRIP_WEEKS
): (GridCell | null)[][] {
  const start = stripStart(today, weeks);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = shiftLocalDate(start, w * 7 + d);
      return date > today ? null : makeCell(date, counts, graceDates, today);
    })
  );
}
