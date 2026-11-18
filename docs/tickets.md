# LockIn — v1 tickets

Ordered. Each should be roughly a day or less. T1–T5 together form the
walking skeleton: one path from button press to persisted row to visible
result. Nothing after T5 starts until that path works end to end.

Each ticket is one branch, one PR, even working solo. The discipline is the
point — it keeps changes reviewable and gives you a history you can explain
in an interview.

---

## T1 — Scaffold

Create the Expo app, TypeScript, expo-router with a two-tab layout (Today,
History). Add the dependency list from CLAUDE.md and nothing else.

Done when: app runs on device, both tabs render placeholder text,
`npx tsc --noEmit` is clean.

## T2 — Database bootstrap

`src/db/index.ts` opens the database. `src/db/migrations.ts` holds an
ordered migration array and a runner that reads `schema_version` from
settings. Migration 1 creates all four tables and indexes.

Done when: app start creates the file, a second start is a no-op, and the
tables exist (verify by querying `sqlite_master`).

## T3 — Day boundary utility

`src/lib/day.ts`. Exports `localDateFor(date)` applying the 04:00 rule, and
`currentLocalDate()`.

Write unit tests first on this one. It is pure logic, it is the easiest
thing in the codebase to test, and every date bug downstream traces back
here. Cover: 03:59 belongs to the previous day, 04:00 to the current day,
midnight rollover, month and year boundaries.

Done when: tests pass and nothing else in the codebase reads a calendar date
directly.

## T4 — Session write path

`src/db/sessions.ts` with `startSession(bucket, label)` and
`endSession(id, elapsedSeconds)`. UUID generation, `local_date` via T3,
`completed` set against the threshold at insert.

Done when: called from a throwaway button, rows appear correctly.

## T5 — Session screen

Timer counting up, five-minute marker, stop button. Starts a session on
mount, ends it on stop. Navigates back to Today.

This is where `useEffect` with an interval appears — and where the cleanup
function matters, because an interval that is not cleared on unmount keeps
firing against an unmounted component.

Done when: a real 25-minute session can be run and lands in the database
with `completed = 1`.

**Stop here and use it for a few days before continuing.**

---

## T6 — Today screen

Shows the current pending task for today, a Start button, a skip, and the
day's completed count.

## T7 — Plan tomorrow

Four rows with optional labels, writes `planned_tasks` for tomorrow's date.
Reachable from Today.

## T8 — Task completion

Marking tasks done, both via a finished session and via a direct tap for
`applications`.

## T9 — Day rollover and grace

Runs on app open. For every elapsed day without a `day_records` row, write
one: `active` if a session completed, else `grace` if fewer than two used
this month, else `missed`. Must handle the app being closed for a week.

## T10 — Streak derivation

`src/hooks/useStreak.ts`. Walks back through `day_records`. Surfaces the
count and grace remaining.

## T11 — Month grid

The History screen grid: seven columns, shading by completed count, dashed
borders for grace. `useMemo` for the cell array — it rebuilds only when the
month's data changes, not on every render.

## T12 — Last-12-weeks strip

Compact row below the grid.

## T13 — Polish pass

Empty states, the first-run case where there is no history, and a check
that nothing crashes with zero rows in any table.
