[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W29 Goals, net worth and ranks

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W29
Needs (already merged into `dev`): W25, W05, W03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Net worth, the four Gold Number Plates, the final score, ranks and the check for the end of the game.

## Read first
- docs/DESIGN.md section 4.11 (exact rules) and 9.3 (sim/endgame.js)
- src/sim/carstats.js (marketValue)
- src/core/state.js, src/data/cars.js

## Files you may change (and nothing else)
- `src/sim/endgame.js`
- `tests/endgame.test.mjs`

## Steps
1. Create `src/sim/endgame.js`. Export `netWorth(state)` = `state.cash` + sum of `marketValue(state, modelOf(c.modelId), c)` for cars with `owned === true` (rented cars count 0).
2. Export `PLATE_INFO` = `{fatcat:{name:'Fat Cat', text:'Net worth £100,000'}, stable:{name:'Stable Boy', text:'Own 6 cars at once'}, household:{name:'Household Name', text:'Reputation 85'}, hammer:{name:'Hammer Time', text:'Sell a car at auction for £100,000'}}`.
3. Export `evaluatePlates(state)`: for each plate not yet won, set it true when its condition holds (fatcat: netWorth >= 100000; stable: owned cars count >= 6; household: reputation >= 85; hammer: `state.stats.bestAuctionSale >= 100000`). Plates never go back to false. Returns the array of plate keys newly won in this call (in the order fatcat, stable, household, hammer).
4. Export `finalScore(state)` = `netWorth(state) + 5000 * (number of true plates) + 100 * state.reputation` (integer). Export `rankOf(score)`: score < 0 'Pavement Pete'; < 30000 'Learner Driver'; < 80000 'Weekend Mechanic'; < 150000 'Gearbox Guru'; < 300000 'Concours Champion'; otherwise 'Legend of the Lay-by'.
5. Export `checkEnd(state)`: if `state.flags.gameOver` already true return. If all four plates are true: set `flags.gameOver = true`, `flags.won = true`, `flags.reason = 'won'`. Else if `state.day > 365`: `gameOver = true`, `won = false`, `reason = 'year-end'`.
6. Write `tests/endgame.test.mjs` with `newGameState`: new game netWorth is 20000; adding one owned `t2_serious` at condition 10 (build a car object by hand with the fields from DESIGN 4.3) adds 22000; a rented car adds 0; fatcat triggers when cash is set to 100000; `evaluatePlates` returns `['fatcat']` once then `[]` on the next call and plates stay true after cash drops; stable plate needs 6 owned cars (5 is not enough, rented ones do not count); household at reputation 85 (84 no); hammer when bestAuctionSale is 100000 (99999 no); finalScore for a fresh game with reputation 40 is 24000; rankOf boundaries: -1 -> Pavement Pete, 0 -> Learner Driver, 29999 -> Learner Driver, 30000 -> Weekend Mechanic, 80000 -> Gearbox Guru, 150000 -> Concours Champion, 300000 -> Legend of the Lay-by; checkEnd: day 365 not over; day 366 -> gameOver with reason 'year-end' and won false; all four plates true -> won true reason 'won'; calling checkEnd again does not change reason.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No UI text beyond PLATE_INFO. No day advancing.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W29: Goals, net worth and ranks`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
