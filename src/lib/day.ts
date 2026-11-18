import { format, subDays } from 'date-fns';

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
