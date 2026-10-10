[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W34 Buy, rent, sell actions

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W34
Needs (already merged into `dev`): W33, W27
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The money actions in the game: buy or rent from the TV, return a rental, sell to a dealer, buy a garage slot, wait a day. Each successful action ends by calling advanceDay.

## Read first
- docs/DESIGN.md section 4.3, 4.4, 4.1 and 9.3 (sim/actions.js, return convention)
- src/sim/advance.js, shop.js, carstats.js, src/data/cars.js, src/core/format.js

## Files you may change (and nothing else)
- `src/sim/actions.js`
- `tests/actions.test.mjs`

## Steps
1. Create `src/sim/actions.js`. Every function returns `{ok, msg}`. On failure (`ok:false`) NOTHING changes (no cash, no cars, no day). On success it pushes a message string to `state.pending` and calls `advanceDay(state)` last.
2. `buyCar(state, listingId)`: listing must exist with `mode === 'sale'`; `cars.length < garageSlots` else msg 'No free garage slot'; `cash >= price` else 'Not enough money'. Success: new car `{id:'c'+state.nextId++, modelId, owned:true, owner:null, rentMonthly:0, paid:price, condition:listing.condition, fault:null, lastServiceDay:state.day, jobsDone:0, boughtDay:state.day, impoundedUntil:0, rentedAtCondition:null}`; cash -= price; remove the listing; `stats.carsBought++`; pending `'Bought the ' + name + ' for ' + money(price)`.
3. `rentCar(state, listingId)`: listing mode must be 'rent'; same slot and cash checks (cash >= first month's rent). Car has `owned:false, owner:listing.owner, rentMonthly:price, paid:0, rentedAtCondition:listing.condition`. Pays one month's rent now; removes the listing; pending `'Rented the ' + name + ' from ' + owner`.
4. `returnRental(state, carId)`: car must exist with `owned === false`. Damage fee = `Math.round(Math.max(0, rentedAtCondition - condition) * 0.02 * model.basePrice)`; needs `cash >= fee` else 'Cannot afford the damage fee'. Removes the car, pays the fee, pending message with the fee.
5. `sellToDealer(state, carId)`: owned cars only; refuse if the car id is in `state.auction.consigned` entries (`{carId, reserve}`) with msg 'Withdraw it from the auction first'. Price = `roundTo(marketValue(state, model, car) * 0.6, 10)`. Cash += price; remove car; `stats.carsSold++`; pending message.
6. `buySlot(state)`: cost 3000; max 8 slots (refuse at 8 with 'Garage is full-size already'); cash check; `garageSlots++`.
7. `waitDay(state)`: always ok; pending 'You put the kettle on. Nothing happens. Lovely.'; advanceDay.
8. Write `tests/actions.test.mjs` with a helper `fresh(seed)` = `newGameState` + `initShop` + `prepareAuction`. Tests: buying the first affordable sale listing: cash drops by exactly its price, `cars.length === 1`, listing removed from the shop, day is 2, car fields as specified; buying with `cash = 0` -> `ok:false`, day still 1, cars empty, listing still there; garage limit: with 3 cars a 4th buy is refused with day unchanged; unknown listing id refused; renting: pays first rent, car `owned:false`; wrong mode (buy a rent listing) refused; returnRental: damage fee exact for a hand-made case (rentedAtCondition 7, condition 5, `t2_serious` basePrice 22000 -> fee 880); returning with no damage costs 0 and the car is gone; sellToDealer exact price for `t2_serious` condition 10 -> 13200; selling a rented car refused; selling a consigned car refused; stats counters; buySlot works until 8 slots then refuses; each successful action advances `state.day` by exactly 1; each failed action leaves a deep-equal copy of the state (compare `JSON.stringify` before and after); waitDay advances one day; `state.today.events` contains the action message after a success.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Servicing and repairs belong to W35. Auctions to W38.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W34: Buy, rent, sell actions`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
