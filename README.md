# LockIn

A local-first focus tracker for beating procrastination. Built with Expo and
React Native.

Starting is the hard part, not the work. LockIn asks for five minutes,
picks the task for you the night before, and shows a single button. Finished
sessions fill a GitHub-style grid and feed a streak that survives two missed
days a month.

## Why it exists

Built to solve a specific problem: doom-scrolling and gaming displacing
certification study, LeetCode practice, portfolio work, and job
applications. Existing habit apps either overwhelm with RPG mechanics or
reward logging rather than starting. This one does neither.

## Core mechanics

- **Five-minute start.** The commitment is five minutes; the timer keeps
  running past it. A session counts as complete at 25 minutes.
- **One task at a time.** Tomorrow's four tasks are chosen the evening
  before. The home screen shows one of them and a Start button, never a
  list.
- **Four fixed buckets.** Study, DSA, Project, Applications. Not
  configurable, by design.
- **Streaks with grace.** A day counts if one session completes. Two grace
  days per month are spent automatically, so one bad week does not erase
  three good months.
- **Activity grid.** Month view shaded by session count, with a rolling
  12-week strip.
- **4am day boundary.** A session at 1:30am belongs to the day you think it
  does.

## Stack

Expo (React Native) · TypeScript · expo-router · expo-sqlite · date-fns

No backend, no accounts, no network calls. All data stays on the device.

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on an Android device.

## Documentation

- [`docs/product-spec.md`](docs/product-spec.md) — scope, rules, screens
- [`docs/data-model.md`](docs/data-model.md) — schema and the reasoning
  behind it
- [`docs/tickets.md`](docs/tickets.md) — ordered work queue

## Roadmap

**v1.5** — earned-leisure token system, Wordle-style weekly share string,
certification hour tracking.

**v2** — backend and sync, with automatic session import from GitHub,
WakaTime, and LeetCode so coding time logs itself.

## Licence

MIT
