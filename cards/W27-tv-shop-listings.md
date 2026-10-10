[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W27 TV shop listings

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W27
Needs (already merged into `dev`): W25, W10, W09, W02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Create and refresh the list of cars for sale or rent that appears on Mark's TV set.

## Read first
- docs/DESIGN.md section 4.4 (exact rules) and 9.3 (sim/shop.js)
- src/sim/carstats.js (valueFactor)
- src/data/cars.js, src/data/owners.js, src/core/rng.js

## Files you may change (and nothing else)
- `src/sim/shop.js`
- `tests/shop.test.mjs`

## Steps
1. Create `src/sim/shop.js`. A listing is `{listingId, modelId, mode, price, condition, owner, blurb}`; `listingId` is `'L' + state.nextId++`. Define a local `BLURBS` array of 10 short funny sales-pitch strings (e.g. `One careful owner and four careless ones.`).
2. Export `makeListing(state, opts = {})` with `opts` keys `mode` ('sale'|'rent'), `tier` (1|2|3), `maxPrice` (only for sale: the final price must be <= this), `excludeModelIds` (array). Order of random draws: (1) mode = `opts.mode` or 60% sale / 40% rent via `chance`; (2) tier = `opts.tier` or weighted 50/35/15; (3) model = `pick` from the catalogue cars of that tier not in `excludeModelIds` (retry the whole pick up to 20 times when `maxPrice` is set and the price is too high; if still impossible, throw `Error('makeListing: no car fits')`); (4) condition: uniform 3.0-8.0 (tier 3: uniform 3.0-7.0) rounded to 0.1 with `roundTo(x, 0.1)`; (5) price: sale = `Math.round(model.basePrice * valueFactor({condition}) * state.market.priceMult * (0.9 + 0.2 * rand(state)))`; rent = `Math.round(model.baseRent * (0.9 + 0.2 * rand(state)))`; (6) `owner` is `ownerName(state)` for rent, otherwise `null`; (7) blurb = `pick(state, BLURBS)`.
3. Export `initShop(state)`: sets `state.shop.listings` to 8 listings and `refreshedDay` to `state.day`. It must contain at least 3 sale listings with price <= 14000 (make these first with `{mode:'sale', tier:1, maxPrice:14000}`), at least 2 rent listings of tier 2 or 3 (make these next with `{mode:'rent', tier: 2 or 3}` using `randInt`), then 3 random listings. No two listings share a `modelId` (pass `excludeModelIds`).
4. Export `shouldRefresh(day)` = `day > 1 && day % 7 === 1`. Export `refreshShop(state)`: remove `n = randInt(state, 1, 3)` random listings, then add `n` new listings (no duplicate modelIds with the remaining ones), set `refreshedDay = state.day`. The list length stays the same as before.
5. Write `tests/shop.test.mjs` with `state = newGameState(seed)` from `../src/core/state.js`: (a) over seeds 1..50, `initShop` gives 8 listings, >=3 sale <=14000, >=2 rent with tier >=2, no duplicate modelIds, all prices positive integers, rent listings have a string owner and sale listings have owner null, condition between 3.0 and 8.0 with at most 1 decimal; (b) sale price lies within +-10% of `round(basePrice * valueFactor(cond))` (the 0.9-1.1 band, allow +-1 for rounding); (c) rent price lies within 0.9-1.1 of baseRent (+-1); (d) `shouldRefresh`: false for 1, true for 8, 15, 22, false for 7 and 9; (e) `refreshShop` keeps 8 listings, keeps unique models, changes at least 1 listing id, sets refreshedDay; (f) listingIds are unique across 20 refreshes; (g) `makeListing` with `{mode:'sale', maxPrice:6000}` always returns price <= 6000 over 100 calls; (h) deterministic for the same seed.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No buying or renting (later card). Do not edit data files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W27: TV shop listings`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
