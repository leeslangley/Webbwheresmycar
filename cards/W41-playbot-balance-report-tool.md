[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W41 Playbot balance report tool

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W41
Needs (already merged into `dev`): W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A measuring tool (no tuning yet): runs two bots over many seeds and prints a balance report so we can later tune prices and odds with real numbers. A first review found the naive bot never completes a job (cheap cars cannot meet job requirements), so this tool needs a SMART bot too.

## Read first
- tests/playthrough.test.mjs (the naive bot policy; copy its `bot` function into the tool as `naiveBot`, do not import from tests)
- docs/DESIGN.md section 4 (all rules) and 4.11

## Files you may change (and nothing else)
- `tools/playbot.mjs`
- `Makefile`

## Steps
1. Create `tools/playbot.mjs` (run with `jsc -m`; imports from `../src/...`). It has two policies, each a function `(state) -> result` that performs exactly ONE action and returns it; the loop ends at `state.flags.gameOver` or after 400 actions.
2. `naiveBot` = a verbatim copy of the policy in `tests/playthrough.test.mjs`.
3. `smartBot` policy, in this exact order: (1) if `isAuctionDay(state.day)` -> `attendAuction`. (2) If the stable has no cars: among the sale listings with `price <= state.cash - 1500` choose the one with the highest score `effD(model, listing) + effR(model, listing)` (use the listing as the `car` argument: it has `condition`), tie-break by lower price; `buyCar` it; if none qualifies, `waitDay`. (3) If any car has a fault and `cash >= fault.cost + 300`: `fixFault` on it. (4) If any car has condition < 8 and `cash >= fullServiceCost + 600` (full service cost = `Math.round(150 + basePrice * 0.008)`) and no open request is currently acceptable: `serviceCar(state, carId, 'full')` on the lowest-condition car. (5) If any open request can be done by an available car (all of effD >= minDesirability, effR >= minReliability, condition >= minCondition, `isAvailable`): `acceptJob` with the highest-fee such request and the best (highest effD+effR) qualifying car. (6) If `cash > 6000` and `buzz < 15`: `advertise(state, 'paper')` when cash < 12000, else `advertise(state, 'magazine')`. (7) If `cash > 40000` and the stable has fewer cars than garageSlots: buy the sale listing with the highest `effD+effR` that costs <= cash - 15000 (if any). (8) otherwise `waitDay`. If any action returns `ok:false`, fall back to `waitDay`.
4. For each policy run seeds 1..100 (`startGame(seed)` then loop) and print, per policy, a block of EXACTLY these 17 lines (numbers filled in; averages with 1 decimal; counts are numbers of seeds): `POLICY naive` or `POLICY smart`, `SEEDS 100`, `WON n`, `YEAR_END n`, `BANKRUPT n`, `AVG_NETWORTH x`, `AVG_JOBS_DONE x`, `AVG_JOBS_FAILED x`, `AVG_ADS x`, `AVG_FAULTS x`, `AVG_CARS_BOUGHT x`, `AVG_FINAL_REP x`, `PLATES_FATCAT n`, `PLATES_STABLE n`, `PLATES_HOUSEHOLD n`, `PLATES_HAMMER n`, `FIRST_BANKRUPT_DAY_AVG x` (average day of the bankruptcies, or `0.0` if none). Plates count = plate true at game end. Print the `naive` block first, then the `smart` block, and nothing after them. Use `netWorth` from `src/sim/endgame.js` for the net worth.
5. In the `Makefile` add a target `playbot` running `$(JSC) -m tools/playbot.mjs` and mark it `.PHONY`.

## Acceptance (all must pass; exact commands)
- `make playbot | grep -c '^POLICY '` prints `2`.
- `make playbot | grep -c '^SEEDS 100'` prints `2`.
- `make playbot | tail -17 | head -1` prints exactly `POLICY smart` (the last 34 lines are the two blocks, nothing printed after them).
- `make playbot | grep -c '^[A-Z_]* '` prints `34` (17 lines x 2 policies: the POLICY lines also match the pattern).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to any src file or number. Measuring only. Paste BOTH 17-line blocks into your summary so the planner can tune.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W41: Playbot balance report tool`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
