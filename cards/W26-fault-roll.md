[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W26 Fault roll

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W26
Needs (already merged into `dev`): W25, W11, W09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Decide whether a car develops a fault, how bad it is and what it costs to fix.

## Read first
- docs/DESIGN.md section 4.6 (exact formulas) and 9.3 (sim/faultsim.js)
- src/sim/carstats.js, src/data/faults.js, src/core/rng.js

## Files you may change (and nothing else)
- `src/sim/faultsim.js`
- `tests/faultsim.test.mjs`

## Steps
1. Create `src/sim/faultsim.js` exporting `rollFault(state, model, car, mult = 1)` returning `null` or `{faultId, label, cost, severity}`. It does NOT modify the car.
2. Step 1: `p = clamp(0.02 + (1 - effR(model, car) / 10) * 0.35, 0.02, 0.60) * mult`. If `!chance(state, p)` return null.
3. Step 2: severity = `weighted(state, [{w: Math.max(20, 70 - (10 - c) * 5), s: 'minor'}, {w: 25 + (10 - c) * 2, s: 'medium'}, {w: 5 + (10 - c) * 3, s: 'major'}])` where `c = car.condition`.
4. Step 3: fault = `pick(state, faultsOfSeverity(severity))`. Cost = `roundTo(fault.baseCost * TIER_MULT[model.tier], 10)`. Return `{faultId: fault.id, label: fault.label, cost, severity}`.
5. Also export `applyFault(car, fault)`: sets `car.fault = {faultId: fault.faultId, label: fault.label, cost: fault.cost}` and returns the car.
6. Write `tests/faultsim.test.mjs`: (a) determinism: same seed same results for 50 rolls; (b) a model with reliability 10 at condition 10 (make a fake model `{reliability:10, tier:1}` and car `{condition:10}`) over 5000 rolls on seed 3 gives between 60 and 150 faults; (c) fake model `{reliability:2, tier:1}` with `{condition:0}` over 5000 rolls gives between 1600 and 1900 faults; (d) with `mult` 0 there are never faults over 500 rolls; (e) loop seeds 1..60000 with the (c) model/car until a roll with `faultId === 'gearbox'` appears; its cost must be 3200 for `tier:1`, and (same search) 11200 for a `tier:3` model; assert the search found one within the loop; (f) at condition 10 the severity mix over 3000 faulting rolls (use reliability 1 model so faults are frequent) has `major` below 12%; at condition 0 it has `major` above 25%; (g) costs are always multiples of 10; (h) `applyFault` sets the fields and does not share the object with the input fault.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No day advance, no cash changes, no log messages.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W26: Fault roll`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
