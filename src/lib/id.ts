import 'react-native-get-random-values'; // polyfills crypto.getRandomValues for uuid
import { v4 } from 'uuid';

// IDs are client-generated UUIDs, never auto-increment integers.
// Wrapped in one tiny module so tests can mock it (uuid is ESM-only and
// jest can't load it).
export function newId(): string {
  return v4();
}
