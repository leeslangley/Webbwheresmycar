[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W35 Garage actions: service and repair

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W35
Needs (already merged into `dev`): W33, W25
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The workshop actions: quick tinker, full service, fix a fault, full restoration. Each costs money and one day.

## Read first
- docs/DESIGN.md section 4.5 (exact costs and effects) and 9.3 (sim/garage.js)
- src/sim/advance.js, carstats.js, src/data/cars.js

## Files you may change (and nothing else)
- `src/sim/garage.js`
- `tests/garage.test.mjs`

## Steps
1. Create `src/sim/garage.js`. Each function returns `{ok, msg}`; on failure NOTHING changes and no day passes; on success push a message to `state.pending` and call `advanceDay(state)` last. Unknown car id -> `{ok:false, msg:'No such car'}`.
2. `serviceCar(state, carId, kind)`: `kind` is `'quick'` or `'full'` (else `{ok:false}`). Quick cost `Math.round(40 + basePrice * 0.002)`, effect `changeCondition(car, +1.0)`. Full cost `Math.round(150 + basePrice * 0.008)`, effect `+2.5` and `lastServiceDay = state.day`. Neither fixes a fault. Refuse when cash is short ('Not enough money') or when condition is already 10 ('Already perfect').
3. `fixFault(state, carId)`: refuse if no fault ('Nothing to fix'); cost = `car.fault.cost`; success sets `fault = null` and `changeCondition(car, +0.5)`.
4. `restoreCar(state, carId)`: cost `Math.max(1200, Math.round(basePrice * 0.06))`; sets condition to 10 and fault to null and `lastServiceDay = state.day`. Refuse if condition is already 10 and there is no fault.
5. Write `tests/garage.test.mjs`: use `t2_serious` (basePrice 22000): quick cost 84, full cost 326, restore cost 1320; `t1_allergy` (3500): restore cost 1200 (minimum applies). Checks: quick on condition 5 -> 6.0 and cash down by exact cost; full at 8.0 -> 10 (clamped) and `lastServiceDay` set; full at 10 refused; quick/full leave an existing fault in place; fixFault clears fault, cost equals fault.cost, condition +0.5; fixFault with no fault refused and day unchanged; restore sets 10 and clears fault; insufficient cash refused with the day unchanged; every success adds exactly 1 day; messages land in `today.events`; unknown car refused; bad kind refused.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit actions.js.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W35: Garage actions: service and repair`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
