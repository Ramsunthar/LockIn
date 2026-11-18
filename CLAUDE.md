# LockIn

Local-first Expo app for beating procrastination. Single user, no accounts,
no backend in v1. Built by one person as a portfolio project.

Full product spec: `docs/product-spec.md`
Data model and schema rationale: `docs/data-model.md`
Work queue: `docs/tickets.md`

## Stack

- Expo (React Native), TypeScript
- expo-router for navigation
- expo-sqlite for storage
- date-fns for date maths
- React Context + useReducer for shared state (no Redux, no Zustand)

## Commands

```
npx expo start          # dev server
npx expo start --android
npx tsc --noEmit        # typecheck
npm test                # jest
```

## Scope rules

v1 is deliberately small. These are OUT and must not be added without the
owner explicitly asking:

- Any backend, API, auth, or user accounts
- Auto-sync from GitHub, WakaTime, or LeetCode
- Avatars, pets, loot, XP, badges, levels
- Leaderboards, friend feeds, follower counts, in-app social anything
- Configurable buckets (the four are fixed)
- Settings screens beyond what a ticket calls for

If a change needs one of the above to work, stop and say so rather than
building a partial version.

## Conventions

- IDs are client-generated UUIDs, never auto-increment integers
- All timestamps stored as ISO 8601 UTC strings
- The day boundary is 04:00 local, not midnight. Never call `new Date()`
  and read the calendar date directly — always go through
  `src/lib/day.ts`
- Derived values (streak, shading level, per-bucket counts) are computed on
  read, never stored. The one exception is `day_records`, see data-model.md
- SQL lives in `src/db/`, never inline in components
- Components are presentational; data access goes through hooks in
  `src/hooks/`

## Working style

- Build vertical slices, not horizontal layers. One path working end to end
  beats three half-built layers
- One ticket at a time. Finish and verify before starting the next
- Ask before adding a dependency. The dependency list above is the whole list
- Explain React concepts when they come up — the owner is learning React
  alongside this project, so a brief note on why a hook or pattern is used is
  wanted, not noise
- Prefer boring solutions. This codebase should be readable in six months
