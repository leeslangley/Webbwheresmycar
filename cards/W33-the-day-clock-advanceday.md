[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W33 The day clock: advanceDay

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W33
Needs (already merged into `dev`): W26, W27, W28, W29, W31, W32
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The heart of the game: every player action ends by calling advanceDay, which moves the calendar forward one day and runs everything that happens overnight.

## Read first
- docs/DESIGN.md section 4.1, 4.7, 4.8, 4.9, 9.3, 9.4
- src/sim/carstats.js, shop.js, news.js, endgame.js, month.js, jobsim.js, src/core/clock.js, src/core/rng.js, src/core/state.js

## Files you may change (and nothing else)
- `src/sim/advance.js`
- `tests/advance.test.mjs`

## Steps
1. Create `src/sim/advance.js` exporting `advanceDay(state)`. If `state.flags.gameOver` is already true, return immediately (nothing changes).
2. Steps in this exact order: (1) for every car, `changeCondition(car, -idleDecay(modelOf(car.modelId)))`; (2) `state.buzz = Math.max(0, roundTo(state.buzz * 0.9, 0.1))`; (3) `state.day += 1`; (4) `events = [...state.pending]`, `sit = [...state.sit]`, then `state.pending = []`, `state.sit = []`; `monthReport = null`; (5) if `state.day > 365`: set `state.today = {day: state.day, headline: '', events, monthReport: null}`, call `checkEnd(state)` and return (no more steps); (6) if `isMonthStart(state.day)`: `monthReport = monthEnd(state)`, push `'Month end: bills of ' + money(monthReport.total)` plus one event per new fault into `events`, push 'monthend' into `sit`; (7) `expireRequests(state)`; `generateRequests(state)`; if requests were added push `'The phone rings: new booking request(s)!'`; (8) if `shouldRefresh(state.day)`: `refreshShop(state)` and push `'New cars on the TV!'`; (9) `newPlates = evaluatePlates(state)`: for each push `'GOLD NUMBER PLATE won: ' + PLATE_INFO[key].name + '!'`; (10) situations: add `'broke'` if cash < 1000, `'rich'` if cash > 50000, `'fullgarage'` if `cars.length >= garageSlots`, `'emptygarage'` if no cars, `'auctionday'` if `isAuctionDay(state.day)`; (11) `headline = chooseHeadline(state, sit, {car: name of a random car in the stable or undefined, customer: customer of a random open request or undefined, cash: state.cash})`; (12) `state.today = {day: state.day, headline, events, monthReport}`; (13) `checkEnd(state)`.
3. Also export `startOfDayFlags(state)` returning `{isAuctionDay: isAuctionDay(state.day), isMonthStart: isMonthStart(state.day), daysLeftInYear: 365 - state.day}` (a tiny helper for the UI).
4. Write `tests/advance.test.mjs` with `newGameState(7)` plus `initShop` and `prepareAuction` called first: (a) one advance from day 1 gives day 2, `today.day === 2`, `today.headline` non-empty, `monthReport` null; (b) from day 31 one advance gives day 32 with `monthReport.monthName === 'January'` and cash reduced by 400 for an empty stable; (c) buzz 100 -> 90 after one advance; buzz 0.4 -> 0.4*0.9=0.36 -> rounds to 0.4 (assert it stays >= 0 and <= 0.4); (d) a car with condition 5 loses idleDecay (for `t1_maurice`: 0.022, after rounding to 0.01 -> 4.98); (e) `pending` strings appear in `today.events` and `pending` is empty afterwards; (f) the `sit` array is emptied; (g) calling advanceDay 365 times from day 1 gives day 366, `flags.gameOver === true`, `reason` is 'year-end' (use a rich state: set cash to 1000000 and skip assertion on bankrupt; to avoid bankruptcy and early win set `reputation` 0 and no cars); a further call changes nothing (day stays 366); (h) requests never exceed 6 over 100 advances; (i) the shop gets refreshed on day 8 (`shop.refreshedDay === 8`); (j) determinism: two identical states advanced 100 days are deep-equal; (k) `startOfDayFlags` for day 24 has isAuctionDay true; day 32 isMonthStart true.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit any imported module. No player actions here.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W33: The day clock: advanceDay`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
