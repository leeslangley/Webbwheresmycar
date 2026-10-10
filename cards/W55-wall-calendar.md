[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W55 Wall calendar

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W55
Needs (already merged into `dev`): W48, W43, W44, W03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The calendar on the wall: shows the current month, crosses off every past day, circles today, and shows DAY n of 365 in big letters. This is how the player sees time passing.

## Read first
- docs/DESIGN.md section 4.1 and 5 (wall calendar)
- src/core/clock.js (dateOf, MONTH_LENGTHS, MONTH_NAMES)
- src/art/common.js, src/ui/theme.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/calendar.js`
- `tests/calendar_art.test.mjs`

## Steps
1. Create `src/art/calendar.js` exporting `drawWallCalendar(ctx, r, day, t, crossAnim = 1)` where `r = {x,y,w,h}`, `day` is 1..365 (clamp 366 to 365), `crossAnim` is 0..1 (progress of the scribble crossing out the previous day). It returns `{crossed, cells, monthName}`.
2. Design: a paper calendar hanging by a nail: red header band (month name in UPPER CASE, title font), a thin spiral binding, below it a small line `DAY <n> of 365` (title font, ink) and then a 7-column grid of the days of the month. Weekday for the 1st of the month: day-of-year 1 is a Monday; so the weekday index of any day-of-year d is `(d - 1) % 7` (0 = Monday). Week header letters `M T W T F S S`. Grid cell size from the rect width.
3. Cells for days before today in this month get a red X (two strokes, `PALETTE.bad`, lineWidth 3); the most recent crossed day's X is drawn with its two strokes only up to `crossAnim` (first stroke fraction `min(1, crossAnim*2)`, second `max(0, crossAnim*2-1)`); today's cell is circled (`PALETTE.good`, stroke 3, ellipse that pulses ±1px with `pulse(t,1.5)`); future days plain; day-of-month numbers drawn in each cell (body font). `crossed` = number of crossed cells (= dayOfMonth - 1), `cells` = days in the month. The first day cell is offset by the weekday of the month's first day. If the first day-of-month is today (dayOfMonth 1) nothing is crossed.
4. Write `tests/calendar_art.test.mjs`: day 1 returns `{crossed:0, cells:31, monthName:'January'}` and texts include `JANUARY`, `DAY 1 of 365`, and `1`; day 24 returns `crossed:23`; day 32 (Feb 1) returns `crossed:0, cells:28, monthName:'February'`; day 59 returns `crossed:27`; day 365 returns `crossed:30, cells:31, monthName:'December'` and text `DAY 365 of 365`; day 366 is treated as 365; `crossAnim = 0` draws fewer `lineTo`/`stroke` calls than `crossAnim = 1` for day 10; texts for day 10 contain all numbers 1..31 as strings; deterministic (same args same log); `save`/`restore` balanced.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No click handling.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W55: Wall calendar`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
