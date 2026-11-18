import { loadStreak } from '@/db/streak';
import { useFocusQuery } from './use-focus-query';

// loadStreak takes an optional `now`; wrapping it keeps the function passed
// to useFocusQuery stable and single-argument.
const query = (db: Parameters<typeof loadStreak>[0]) => loadStreak(db);

/** Current streak and grace days left this month. null until first loaded. */
export function useStreak() {
  return useFocusQuery(query).data;
}
