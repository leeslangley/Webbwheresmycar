[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W65a Auction hall, lot header and browsing

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W65a
Needs (already merged into `dev`): W45, W46, W47, W50c, W40, W38
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The auction hall picture, the current lot and moving between the 6 lots.

## Read first
- docs/DESIGN.md section 4.10
- src/sim/auction.js (lotView, revealStat, placeBid, minBid, bidStep, attendAuction, AUCTION_REVEAL_COST, STATS)
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/art/cardraw.js (drawCar), src/data/paint.js (paintOf), src/core/clock.js (isAuctionDay)

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_a.test.mjs`

## Steps
1. Create `src/ui/scenes/auction.js` exporting `auctionScene` (id `'auction'`) and `LAYOUT = {prev:{x:40,y:300,w:60,h:80}, next:{x:1180,y:300,w:60,h:80}, picture:{x:120,y:100,w:1040,h:260}, reveals:[{x:60,y:390,w:280,h:50},{x:60,y:446,w:280,h:50},{x:60,y:502,w:280,h:50},{x:60,y:558,w:280,h:50}], bid1:{x:700,y:520,w:260,h:64}, bid3:{x:980,y:520,w:260,h:64}, leave:{x:700,y:600,w:540,h:70}, back:{x:40,y:650,w:200,h:50}}`. `enter`: if `!isAuctionDay(state.day)` toast `The auction is only on the 24th` and `app.pop()`; else `this.lotIndex = 0`.
2. `draw`: wooden stage, a spotlight cone on the lot, a gavel icon, a crowd of silhouettes along the bottom. Text: `LOT n/6`, the car name (title font 22px), the year, `Estimate <money> to <money>`, and the car drawn with `drawCar` in the `paintOf` colour (condition 6 for now). Use `lotView(state, lotId)` for the lot data (read its return shape). PREV/NEXT buttons and Left/Right keys change `lotIndex` with wrap-around; BACK and Escape call `app.pop()`.
3. Write `tests/scene_auction_a.test.mjs` using `startGame(8)` with `state.day = 24` and `prepareAuction(state)` if the sim needs it (read src/sim/auction.js): first lot name appears; NEXT changes the name; PREV wraps to lot 6; on day 10 `enter` toasts `The auction is only on the 24th` and records `['pop']`; tap rule test (down, redraw, up) on NEXT fires once.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_auction_a` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W65a: Auction hall, lot header and browsing`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
