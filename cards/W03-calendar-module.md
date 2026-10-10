[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W03 Calendar module

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W03
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pure calendar maths for a 365-day year: turn a day number into month and day, find month starts and auction days.

## Read first
- docs/DESIGN.md section 4.1, 4.10 and 9.3 (core/clock.js)

## Files you may change (and nothing else)
- `src/core/clock.js`
- `tests/clock.test.mjs`

## Steps
1. Create `src/core/clock.js` exporting `MONTH_NAMES` (January..December), `MONTH_LENGTHS` = `[31,28,31,30,31,30,31,31,30,31,30,31]`, `DAYS_IN_YEAR = 365`, `AUCTION_DAY_OF_MONTH = 24`.
2. Export `dateOf(day)` returning `{month, dayOfMonth, monthName}` (month is 1-12). Throw `RangeError('day out of range')` if `day` is not an integer in 1..365.
3. Export `dayOfYearStart(month)` (day number of the 1st of that month, month 1-12; throws RangeError otherwise), `isMonthStart(day)` (true when dayOfMonth is 1), `isAuctionDay(day)` (true when dayOfMonth is 24), `daysLeftInMonth(day)` (days remaining AFTER today, so Jan 31 gives 0, Jan 1 gives 30).
4. Write `tests/clock.test.mjs`. Exact checks: month start days for months 1..12 are `[1,32,60,91,121,152,182,213,244,274,305,335]`; `dateOf(1)` is Jan 1; `dateOf(31)` is January 31; `dateOf(32)` is February 1; `dateOf(59)` is February 28; `dateOf(60)` is March 1; `dateOf(365)` is December 31; `dateOf(0)`, `dateOf(366)`, `dateOf(1.5)` throw; `isMonthStart` is true for exactly 12 days in 1..365; `isAuctionDay` is true for exactly 12 days, the first being 24 and the last 358; `daysLeftInMonth(1)` is 30, `daysLeftInMonth(31)` is 0, `daysLeftInMonth(365)` is 0; sum of MONTH_LENGTHS is 365.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c '^export' src/core/clock.js` prints `9`.

## Out of scope (do not touch)
- No leap years. No time zones. No Date object.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W03: Calendar module`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
