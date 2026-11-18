import { format, parseISO } from 'date-fns';

/** 0 -> "00:00", 305 -> "05:05", 3725 -> "62:05". */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** '2026-05' -> "May 2026". */
export function formatMonth(month: string): string {
  return format(parseISO(`${month}-01`), 'MMMM yyyy');
}
