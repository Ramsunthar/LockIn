# LockIn — data model

Storage: `expo-sqlite`. Four tables. No `users` table — single user, local
device. No `streaks` table — derived.

## Governing principle

Store what happened. Derive what it means.

Stored aggregates drift from their source and then disagree with the UI.
The streak, shading levels, and per-bucket counts are all computed on read.
At a few thousand rows this costs microseconds.

## sessions

Append-only event log. One row per Start press.

```sql
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,
  bucket          TEXT NOT NULL,
  label           TEXT,
  started_at      TEXT NOT NULL,
  ended_at        TEXT,
  actual_seconds  INTEGER NOT NULL DEFAULT 0,
  completed       INTEGER NOT NULL DEFAULT 0,
  local_date      TEXT NOT NULL
);
CREATE INDEX idx_sessions_local_date ON sessions(local_date);
```

`id` — client-generated UUID. Auto-increment integers collide the moment a
second device exists. Costs nothing now, saves a migration in v2.

`bucket` — one of `study | dsa | project | applications`. A CHECK constraint
is optional; the TypeScript union type is the real guard.

`local_date` — denormalised from `started_at`, deliberately. Computed once
at insert via `src/lib/day.ts`. Two reasons: the grid queries by date range
constantly, and the 04:00 boundary rule should live in exactly one place.

`completed` — stored, not derived from `actual_seconds`. Freezes the
judgement made under the rules in force at the time.

## planned_tasks

```sql
CREATE TABLE planned_tasks (
  id        TEXT PRIMARY KEY,
  for_date  TEXT NOT NULL,
  bucket    TEXT NOT NULL,
  label     TEXT,
  status    TEXT NOT NULL DEFAULT 'pending',
  position  INTEGER NOT NULL
);
CREATE INDEX idx_planned_for_date ON planned_tasks(for_date);
```

Separate from `sessions` because a plan exists before any work does, and
because not everything is a timer session — sending an application is a tap.
Both routes mark a task done.

`position` gives the "next task" a stable order. Without it, row order is
whatever SQLite returns, which is not guaranteed.

## day_records

The one materialised table.

```sql
CREATE TABLE day_records (
  local_date  TEXT PRIMARY KEY,
  status      TEXT NOT NULL
);
```

`status` is `active | grace | missed`.

Grace days cannot be derived. Whether a miss consumed grace depends on how
many were already used that month, which is a sequential, stateful decision
against a limited resource. Recomputing it later would retroactively
reshuffle which days got grace, and squares would change colour.

Written once per day by the rollover routine, which runs on app open and
backfills any days missed while the app was closed.

Rule: derive when the calculation is pure; materialise when it depends on
history and consumes a limited resource.

## settings

```sql
CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
```

Values are JSON strings. Key-value rather than typed columns so a new
preference is an insert, not a migration.

Initial keys: `day_boundary_hour` (4), `completion_seconds` (1500),
`plan_reminder_time` ("21:30").

## Derived values

| Value | How |
|---|---|
| Current streak | Walk back from today through `day_records`, count until `missed` |
| Grace used this month | Count `grace` rows in the current calendar month |
| Shading level | Completed sessions on that `local_date`, bucketed 0 / 1 / 2–3 / 4+ |
| Today's progress | Completed sessions grouped by bucket for today's `local_date` |

## Migrations

Hand-rolled. A `schema_version` row in `settings`, and an ordered array of
migration functions in `src/db/migrations.ts`. Run on app start, apply any
with a version above the stored one.

Crude, but a migration library is more machinery than four tables justify.
