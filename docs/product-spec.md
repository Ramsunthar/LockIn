# LockIn — product spec (v1)

## Problem

Procrastination and doom-scrolling are displacing career work: AWS
certification study, LeetCode practice, portfolio projects, and job
applications. The blocker is not knowing what to do. It is starting, and
the guilt loop that unearned leisure creates.

## Hypothesis being tested

If starting costs five minutes instead of twenty-five, and the day's work is
chosen the night before, daily starts will increase. If leisure is framed as
earned, guilt will decrease and avoidance with it.

v1 exists to test this cheaply. If it fails, no backend work was wasted.

## The four buckets

Fixed, not configurable:

| Bucket | Covers |
|---|---|
| `study` | AWS certs, Full Stack Open, courses |
| `dsa` | LeetCode and algorithm practice |
| `project` | Portfolio project work |
| `applications` | Job applications sent |

## Core rules

**Starting.** The primary button says "Start 5 minutes". The timer runs past
five and keeps going until stopped. Five minutes is the commitment; 25 is
what usually happens.

**Completion.** A session is complete at 25 minutes of elapsed time. Below
that it is abandoned. The threshold is frozen per session at insert time, so
changing it later does not rewrite history.

**Abandoned sessions.** Written to the database with `completed = 0`, but
never surfaced in the UI. The data is useful later for understanding when
quits happen; showing it would make the app feel like surveillance.
This is reversible — if it turns out to feel bad, stop writing them.

**One task at a time.** The Today screen shows a single task with a Start
button, not a list. Choosing between four options is the moment the day
dies. A skip rotates to the next task.

**Night planning.** Tomorrow's tasks are set the evening before. Morning-self
does not get a vote.

**Day boundary.** 04:00 local. A session at 01:30 belongs to the previous
day. Using midnight would break the streak mid-work-session.

**Streak.** A day counts if at least one session completed. Not all four
buckets. The streak protects the floor; good days are shown through grid
shading instead.

**Grace days.** Two per calendar month, spent automatically on a missed day.
The user does not choose when. A third miss in the same month resets the
streak. Grace days render as dashed squares, visibly different from
completed days.

**Shading.** Four levels by completed session count: 0 empty, 1 light,
2–3 medium, 4+ dark.

## Screens (v1)

**Today.** Current task with Start button, the day's completed count, and a
small streak number. Nothing else.

**Session.** Timer, elapsed time, the five-minute marker, a stop button.
No navigation away.

**History.** Streak count, grace days remaining, month grid, legend, and a
compact last-12-weeks strip.

**Plan tomorrow.** Four rows, one per bucket, each with an optional text
label. Reachable from Today.

## Deferred (v1.5 and v2)

- Token / leisure permission system (v1.5 — cheap, it is a counter)
- Wordle-style weekly share string (v1.5)
- Certificate hour tracking against an estimate (v1.5)
- Backend, auth, sync (v2)
- GitHub, WakaTime, LeetCode auto-import (v2)

## Explicitly rejected

Avatars, pets, loot, XP, levels, badges, leaderboards, friend feeds,
configurable buckets, mood tracking, water reminders. The app should be
usable in under ten seconds a day outside of sessions.
