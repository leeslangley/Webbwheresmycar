[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W30 Auction lots and stat reveal

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W30
Needs (already merged into `dev`): W25, W09, W02, W03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First half of the auction: generate the six lots for the month with hidden stats and hidden bidder ceilings, show a safe 'view' of a lot, and let the player pay to reveal stats.

## Read first
- docs/DESIGN.md section 4.10 (exact rules) and 9.3 (sim/auction.js)
- src/sim/carstats.js, src/data/cars.js, src/core/clock.js, src/core/rng.js

## Files you may change (and nothing else)
- `src/sim/auction.js`
- `tests/auction_lots.test.mjs`

## Steps
1. Create `src/sim/auction.js`. Export `prepareAuction(state)`: sets `state.auction.month = dateOf(state.day).month`, `state.auction.lots` = 6 new lots, `state.auction.lastResults = []`, and keeps `state.auction.consigned` as it is. A lot: `{lotId: 'A' + state.nextId++, modelId, condition, reserve, revealCount: 0, revealed: {desirability:false, maintenance:false, reliability:false, condition:false}, currentBid: 0, leader: 'house', ceilings: [c1,c2,c3]}`. Tier mix per lot: weighted 40/40/20 for tiers 1/2/3; no two lots share a model; condition uniform 2.0-9.0 via `roundTo(2 + 7 * rand(state), 0.1)`; `reserve = roundTo(marketValue at that condition (use priceMult from state) * 0.7, 10)`; `ceilings` = three values each `Math.round(marketValue * (0.70 + 0.50 * rand(state)))` where marketValue is the car's market value at that condition.
2. Export `AUCTION_REVEAL_COST = 150`, `STATS = ['desirability','maintenance','reliability','condition']`.
3. Export `lotView(state, lotId)`: returns `null` if the lot does not exist, else `{lotId, modelId, name, year, archetype, estLow, estHigh, revealed, values, reserve, currentBid, leader, revealCount}` where `estLow = roundTo(marketValue(at condition 5.0) * 0.65, 10)` and `estHigh = roundTo(marketValue(at condition 5.0) * 1.35, 10)` and `values` has ONLY the revealed stats (desirability, maintenance, reliability from the model; condition from the lot). Hidden stats must be absent from the returned object (no key). The view must never include `ceilings`, and never the true `condition` unless revealed.
4. Export `revealStat(state, lotId, stat)`: returns `{ok:false, msg}` (no state change) when the lot is missing, stat is not in `STATS`, already revealed, `revealCount >= 2` ('Max 2 reveals per lot'), or `cash < 150`. Otherwise cash -= 150, set the flag, `revealCount++`, return `{ok:true, msg}`. It does not advance the day.
5. Write `tests/auction_lots.test.mjs`: for seeds 1..30: 6 lots; unique models; unique lotIds; condition 2.0-9.0 with at most one decimal; reserve is a multiple of 10 and positive; 3 ceilings each positive integers; revealed all false; `lotView` has no `ceilings` key and no `values.condition` before reveal; after `revealStat(..., 'condition')` the view's values.condition equals the lot condition and cash dropped by exactly 150; a third reveal is refused with unchanged cash; a repeated reveal of the same stat is refused; invalid stat refused; with cash 100 refused; `prepareAuction` keeps `auction.consigned` entries; two states with the same seed produce identical lots; estLow < estHigh.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No bidding, no consigning, no day advance (card W38 does those, in the same file; do not add stubs for them).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W30: Auction lots and stat reveal`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
