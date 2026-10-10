[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W25 Car stats and condition maths

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W25
Needs (already merged into `dev`): W09, W02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
All the formulas that turn a car's condition into effective desirability, reliability, value and running cost.

## Read first
- docs/DESIGN.md section 4.3 (formulas) and 9.3 (sim/carstats.js)
- src/data/cars.js (modelOf, CARS)
- src/core/rng.js (roundTo, clamp)

## Files you may change (and nothing else)
- `src/sim/carstats.js`
- `tests/carstats.test.mjs`

## Steps
1. Create `src/sim/carstats.js`. A `model` is a catalogue entry; a `car` is a stable instance with a numeric `condition` (0-10). Import `roundTo`, `clamp` from `../core/rng.js`.
2. Export `effD(model, car)` = `model.desirability * (0.40 + 0.06 * car.condition)`; `effR(model, car)` = `model.reliability * (0.30 + 0.07 * car.condition)`; `maintMult(car)` = `1 + (10 - car.condition) * 0.08`; `valueFactor(car)` = `0.50 + 0.05 * car.condition` (this function must also work on any object with a `condition`, e.g. a shop listing); `marketValue(state, model, car)` = `Math.round(model.basePrice * valueFactor(car) * state.market.priceMult)`; `runningCost(model, car)` = `Math.round(model.maintenance * (60 + model.basePrice * 0.0025) * maintMult(car))`; `idleDecay(model)` = `0.01 + (10 - model.reliability) * 0.002`.
3. Export `changeCondition(car, delta)`: `car.condition = clamp(roundTo(car.condition + delta, 0.01), 0, 10)`; returns the new condition.
4. Export `isAvailable(state, car)`: true when `car.fault` is null AND `car.impoundedUntil <= state.day` (treat a missing impoundedUntil as 0).
5. Write `tests/carstats.test.mjs` using real catalogue rows via `modelOf`. Exact checks (use `near` eps 1e-9 for floats): `t2_serious` (D5 M4 R5, price 22000): runningCost at condition 10 is 460, at condition 5 is 644, at condition 0 is 828; marketValue with priceMult 1 at condition 10 is 22000, at 5 is 16500, at 0 is 11000; with priceMult 1.2 and condition 10 is 26400. `t1_maurice` (D3 M2 R4): effD at condition 10 is 3, at 0 is 1.2; effR at condition 10 is 4, at condition 5 is 2.6; idleDecay is 0.022. `t3_aston` (D10 R5): effD at condition 5 is 7; effR at 10 is 5. maintMult(10)=1, maintMult(0)=1.8. valueFactor works on `{condition: 4}` giving 0.7. changeCondition clamps: from 9.5 +2 gives 10; from 0.3 -1 gives 0; from 5 + 0.123 gives 5.12. isAvailable: no fault and no impound -> true; with a fault -> false; `impoundedUntil` = day + 1 -> false; `impoundedUntil` = day -> true.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c '^export' src/sim/carstats.js` prints `9`.

## Out of scope (do not touch)
- Only these 9 exports. No randomness, no state mutation except changeCondition on the car.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W25: Car stats and condition maths`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
