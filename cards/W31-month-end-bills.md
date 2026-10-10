[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W31 Month-end bills

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W31
Needs (already merged into `dev`): W25, W26, W30
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The monthly accounts: rent, running costs, garage lease, random faults, price drift, next auction and the bankruptcy check.

## Read first
- docs/DESIGN.md section 4.9 and 4.2 (exact rules)
- src/sim/carstats.js, src/sim/faultsim.js, src/sim/auction.js (prepareAuction), src/core/clock.js

## Files you may change (and nothing else)
- `src/sim/month.js`
- `tests/month.test.mjs`

## Steps
1. Create `src/sim/month.js` exporting `monthEnd(state, opts = {})`. It is called when a new month has just started, so the month that ENDED is the previous one: `ended = dateOf(state.day - 1)`. It returns and stores a report object `{month, monthName, rent, running, lease, total, cashAfter, newFaults}` where `month` and `monthName` describe the ended month.
2. Order: (1) `rent` = sum of `rentMonthly` of cars with `owned === false`; (2) `running` = sum of `runningCost(model, car)` of cars with `owned === true`; (3) `lease = 400`; `total = rent + running + lease`; `state.cash -= total`; (4) unless `opts.skipFaults` is true: for every car in the stable that has no fault, `f = rollFault(state, model, car, 0.5)`; if f: `applyFault`, `state.stats.faults++`, and push `model.name + ': ' + f.label` to `newFaults`; (5) `state.market.priceMult = clamp(roundTo(priceMult + (rand(state) - 0.5) * 0.06, 0.001), 0.85, 1.25)`; (6) `prepareAuction(state)`; (7) `cashAfter = state.cash`; store `state.lastMonthReport = report`; (8) bankruptcy: if `state.cash < -2000`, set `flags.gameOver = true`, `flags.won = false`, `flags.reason = 'bankrupt'`. Return the report.
3. Write `tests/month.test.mjs`. Build states with `newGameState(seed)` and hand-made cars (fields per DESIGN 4.3). With `skipFaults:true`: one owned `t2_serious` at condition 10 (running cost 460) + one rented car with `rentMonthly: 1000` + lease 400 gives `rent 1000`, `running 460`, `lease 400`, `total 1860` and cash 20000 -> 18140; `report.cashAfter === 18140`; empty stable gives total 400; rented cars do not pay running cost; owned cars pay no rent. Day handling: set `state.day = 32` -> report.month 1, monthName 'January'; day 60 -> month 2; day 335 -> 11 ('November'). Bankrupt: cash 1000 with a heavy stable so cash ends below -2000 -> `flags.gameOver` true and reason 'bankrupt'; cash ending at exactly -2000 is NOT bankrupt. Without skipFaults, over seeds 1..200 on a stable with one reliability-2 car at condition 0 at least 20 seeds produce a fault, and `stats.faults` equals the number of faults recorded across `newFaults`. `priceMult` stays between 0.85 and 1.25 over 200 repeated calls on one state. `state.auction.lots.length === 6` afterwards. Same seed gives the same report.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not call advanceDay. Do not edit auction.js (only import prepareAuction).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W31: Month-end bills`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
