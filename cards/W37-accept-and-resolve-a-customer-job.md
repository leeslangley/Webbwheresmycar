[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W37 Accept and resolve a customer job

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W37
Needs (already merged into `dev`): W32, W33, W26, W17
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The player puts a car on a customer's job. The job resolves at once with success, mishap, breakdown or disaster, with money, wear, reputation and funny text.

## Read first
- docs/DESIGN.md section 4.7 (exact rules) and 9.3 (sim/jobresolve.js)
- src/sim/jobsim.js, faultsim.js, carstats.js, advance.js, src/data/jobtypes.js (jobTypeOf, fillText), src/data/cars.js

## Files you may change (and nothing else)
- `src/sim/jobresolve.js`
- `tests/jobresolve.test.mjs`

## Steps
1. Create `src/sim/jobresolve.js` exporting `acceptJob(state, requestId, carId)` returning `{ok, msg, outcome}`. Failure (nothing changes, no day): unknown request ('No such booking'), unknown car, request expired (`expiresDay < state.day`), car not available (`!isAvailable`) ('That car is not fit to go out'), `effD < minDesirability`, `effR < minReliability`, `condition < minCondition` (each gives its own msg naming the shortfall).
2. Resolution order (use these exact draws): (1) `fault = rollFault(state, model, car, 1)`; (2) `r = rand(state)`: `r < 0.007` -> 'disaster'; `r < 0.057` -> 'mishap'; else 'success'; (3) if `fault && fault.severity === 'major'` the type becomes 'breakdown' (overrides the r result).
3. Effects. `wear` = `roundTo(job.wearMin + rand(state) * (job.wearMax - job.wearMin), 0.1)`. success: `cash += fee`, reputation +2 (+1 more if `effD >= minDesirability + 2`), `changeCondition(car, -wear)`, `jobsDone++`, `stats.jobsDone++`, text `fillText(pick(state, job.success), {customer, car: model.name})`. If a minor/medium fault was rolled on a success: `applyFault` it and append `' (Then the ' + fault.label + ' started.)'`. mishap: `cash += Math.round(fee * 0.6)`, reputation -1, `changeCondition(car, -wear * 2)`, `jobsDone++`, `stats.jobsDone++`, text from `job.mishap`; apply a minor/medium fault if rolled. breakdown: `cash += Math.round(fee * 0.25)`, reputation -4, `applyFault(car, fault)`, `stats.jobsFailed++`, `stats.faults++`, push 'breakdown' to `state.sit`, text: `model.name + ' broke down: ' + fault.label + '. ' + customer + ' is not impressed.'`. disaster: `changeCondition(car, -wear * 4)`, reputation -6, `stats.jobsFailed++`, push 'breakdown' to sit, then `d = randInt(state, 1, 3)`: 1 = apply a random major fault (`pick` from `faultsOfSeverity('major')`, cost scaled by TIER_MULT) , 2 = `cash -= Math.round(fee * 0.5)` compensation, 3 = `car.impoundedUntil = state.day + 3`; text `fillText(pick(state, job.disaster), ...)` plus a short suffix describing which d happened.
4. In every success/mishap case: if the fee paid is >= 2000 push 'bigwin' to `state.sit`. Remove the request from `state.requests`. Push the text to `state.pending`. Call `advanceDay(state)` last. Return `{ok:true, msg:text, outcome:{type, paid, wear, faultLabel}}`.
5. Write `tests/jobresolve.test.mjs` with a helper that builds a state plus one owned car of a chosen model and condition and a hand-made request (use real job type thresholds, e.g. `wedding` fee 1000). Find seeds by looping (seeds 1..20000, 1..60000 for disaster) until the desired outcome type appears. For success/mishap searches build the car as an owned `t2_zed` (D6 R6) at condition 10 and a `wedding` request (minD 6, minR 5, minCond 6, fee 1000). For breakdown/disaster searches build the car as `t3_lamborgonzo` at condition 2 and set the hand-made request thresholds `minDesirability`, `minReliability`, `minCondition` to 0 so the requirement checks pass. Tests: (a) failure cases leave a deep-equal state (stringify before/after) and day unchanged: bad request id, bad car id, expired request, car with fault, car too low desirability (use `t1_allergy` for a `concours` request), too low condition; (b) find a seed with outcome 'success': cash +fee exactly, reputation +2 or +3, request removed, car condition reduced by `outcome.wear`, day +1, `jobsDone` 1; (c) find 'mishap': cash +60% of fee (rounded), reputation -1; (d) find 'breakdown' using a car `t3_lamborgonzo` at condition 2 (R2): cash +25% of fee, rep -4, car has a fault, 'breakdown' consumed into the headline pipeline (just assert car.fault non-null and stats.jobsFailed 1); (e) find 'disaster' (loop up to 60000 seeds): reputation -6, outcome.type 'disaster', car condition dropped by 4*wear; (f) over 3000 seeds with a good car the proportions: success between 85% and 97%, mishap between 2% and 9%; (g) message contains no `{`; (h) deterministic for equal states.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No UI. Do not edit jobsim.js.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W37: Accept and resolve a customer job`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
