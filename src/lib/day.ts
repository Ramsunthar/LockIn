import { addDays, addMonths, endOfMonth, format, parseISO, subDays } from 'date-fns';

// The day starts at 04:00 local, not midnight, so a late-night session still
// counts toward the day it belongs to. This is the ONLY place in the codebase
// allowed to turn a Date into a calendar date.
export const DAY_BOUNDARY_HOUR = 4;

/** The 'YYYY-MM-DD' LockIn day that `date` falls in. */
export function localDateFor(date: Date): string {
  // Before 04:00 we are still in the previous day. subDays moves by calendar
  // day (not by 24h of milliseconds), so DST changes can't shift the result.
  const day = date.getHours() < DAY_BOUNDARY_HOUR ? subDays(date, 1) : date;
  return format(day, 'yyyy-MM-dd');
}

/** The LockIn day right now. `now` is a parameter only to keep it testable. */
export function currentLocalDate(now: Date = new Date()): string {
  return localDateFor(now);
}

/** Moves a 'YYYY-MM-DD' LockIn date forward (or back, if negative) by whole days. */
export function shiftLocalDate(localDate: string, days: number): string {
  // parseISO reads a date-only string as local midnight, and addDays moves by
  // calendar day, so DST can't shift the result.
  return format(addDays(parseISO(localDate), days), 'yyyy-MM-dd');
}

/** The LockIn day after the current one. At 01:00 that is today's calendar date. */
export function tomorrowLocalDate(now: Date = new Date()): string {
  return shiftLocalDate(currentLocalDate(now), 1);
}

/** Every LockIn date from `start` to `end`, both inclusive. Empty if start > end. */
export function localDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  // 'YYYY-MM-DD' strings sort the same as the dates they name.
  for (let d = start; d <= end; d = shiftLocalDate(d, 1)) dates.push(d);
  return dates;
}

/** 'YYYY-MM' of a 'YYYY-MM-DD' LockIn date. */
export function monthOf(localDate: string): string {
  return localDate.slice(0, 7);
}

/** Moves a 'YYYY-MM' month forward (or back, if negative). */
export function shiftMonth(month: string, months: number): string {
  return format(addMonths(parseISO(`${month}-01`), months), 'yyyy-MM');
}

/** First and last LockIn date of a 'YYYY-MM' month. */
export function monthRange(month: string): { first: string; last: string } {
  return { first: `${month}-01`, last: format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd') };
}
