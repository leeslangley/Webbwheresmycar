[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W38 Auction bidding and sales

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W38
Needs (already merged into `dev`): W30, W33, W34
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Second half of the auction: consign your own cars, bid against computer bidders, and settle everything when the player attends auction day.

## Read first
- docs/DESIGN.md section 4.10 (exact rules) and 9.3 (sim/auction.js)
- src/sim/auction.js (existing: prepareAuction, lotView, revealStat), src/sim/advance.js, src/sim/carstats.js, src/core/clock.js

## Files you may change (and nothing else)
- `src/sim/auction.js`
- `tests/auction_bids.test.mjs`

## Steps
1. ADD to the existing `src/sim/auction.js` (do not change what is there). Export `consignCar(state, carId, reserve)`: owned car, not already consigned, `reserve` a non-negative integer, `isAuctionDay(state.day)` must be FALSE (consigning happens before the auction day) -> push `{carId, reserve}` to `state.auction.consigned`, return `{ok:true,msg}`; else `{ok:false,msg}`. No day passes. Export `unconsign(state, carId)` removing the entry (`{ok:false}` if absent).
2. Export `bidStep(lot)` = `Math.max(50, roundTo(lot.reserve * 0.05, 10))` and `minBid(lot)` = `lot.currentBid === 0 ? lot.reserve : lot.currentBid + bidStep(lot)`.
3. Export `placeBid(state, lotId, steps)`: only valid on auction day (`isAuctionDay(state.day)`), `steps` is 1 or 3. Refuse (`ok:false`, nothing changes) when: lot missing; `lot.leader === 'player'` ('You are already winning'); `bid = minBid(lot) + (steps - 1) * bidStep(lot)`; `cash < bid`; or `(number of cars) + (number of lots with leader 'player')` >= `garageSlots`. Otherwise: `best = Math.max(...lot.ceilings)`; if `best >= bid + bidStep(lot)` then `lot.currentBid = bid + bidStep(lot)`, `lot.leader = 'ai'`, return `{ok:true, msg:'Outbid! The bid is now ...', outbid:true}`; else `lot.currentBid = bid`, `lot.leader = 'player'`, return `{ok:true, msg:'You lead at ...', outbid:false}`. No day passes.
4. Export `attendAuction(state)`: refuse unless `isAuctionDay(state.day)` and not already attended this day (track with `state.auction.attendedDay === state.day`). Then settle in this order: (1) every consigned car: `price = Math.round(marketValue(state, model, car) * (0.85 + 0.40 * rand(state)))` ; if `price >= reserve`: sold -> fee `Math.round(price * 0.08)`, `cash += price - fee`, remove the car from `state.cars` and from `consigned`, `stats.carsSold++`, `stats.bestAuctionSale = Math.max(stats.bestAuctionSale, price)`, result string 'Sold X for £price (fee £fee)'; else result 'X failed to meet its reserve' and the car stays (remove from consigned); (2) every lot with `leader === 'player'`: if `cash >= currentBid` and there is a free slot: buy it (new owned car with `paid: currentBid`, lot condition, `boughtDay`) and `cash -= currentBid`, `stats.carsBought++`, result 'You won X for £...'; otherwise result 'You could not pay for X' and `reputation -= 2` (clamped at 0). Remove all lots after settling; (3) set `state.auction.lastResults` to the result strings and push each to `state.pending`; set `attendedDay`; call `advanceDay(state)`; return `{ok:true, msg, results}`.
5. Write `tests/auction_bids.test.mjs` using `fresh(seed)` (newGameState + initShop + prepareAuction) and setting `state.day = 24` for auction-day cases: consign refused on auction day, accepted on day 20, duplicate refused, non-owned (rented) car refused; unconsign works; `minBid`/`bidStep` exact for a hand-made lot (`reserve 10000` -> step 500; `reserve 400` -> step 50); placeBid refused off auction day, with steps 2, with too little cash, when already leading; when all AI ceilings are below the bid (set `lot.ceilings = [1,1,1]`) the player leads at `bid`; when a ceiling is huge (`[999999,1,1]`) the AI outbids and the lot's leader is 'ai' with `currentBid = bid + step`; steps 3 bids three steps above the minimum; slot limit counts leading lots; `attendAuction` refused off auction day and a second time on the same day (the day will already have advanced, so also test the guard by setting `state.day` back and `attendedDay`); settle: a winning player lot appears in `state.cars` with `paid === currentBid`, cash reduced by it, `stats.carsBought` incremented; a consigned `t2_serious` condition 10 sells for between 0.85 and 1.25 of 22000 (when reserve 0), cash rises by `price - fee`, `stats.bestAuctionSale` set, car removed; reserve 999999 -> car stays and unsold; `lots` empty afterwards and the day advanced by 1; results appear in `today.events`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `ls tests/auction_lots.test.mjs` still exists and still passes (it is part of `make test`).

## Out of scope (do not touch)
- Do not change prepareAuction, lotView or revealStat behaviour.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W38: Auction bidding and sales`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
