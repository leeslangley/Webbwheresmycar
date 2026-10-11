[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W65d Auction your lots, leave and settle

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W65d
Needs (already merged into `dev`): W65c
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The panel of the player's consigned cars, and leaving to settle the sales.

## Read first
- docs/DESIGN.md section 4.10
- src/sim/auction.js (lotView, revealStat, placeBid, minBid, bidStep, attendAuction, AUCTION_REVEAL_COST, STATS)
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/ui/scenes/auction.js (from the last card)

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_d.test.mjs`

## Steps
1. In `draw` add a small panel `YOUR LOTS` listing each consigned car (name and reserve) or `Nothing consigned` and a primary button `LEAVE & SETTLE` at `LAYOUT.leave`. Tapping it calls `app.act(() => attendAuction(app.state))`; show nothing else afterwards (the app handles the day).
2. BACK and Escape: if the player currently leads any lot toast `You are winning a lot. Settle first` and do NOT pop; otherwise pop.
3. Write `tests/scene_auction_d.test.mjs` (day 24, `startGame(8)`): with `ceilings=[1,1,1]` on lot 1 and a placed bid, LEAVE & SETTLE (down, redraw, up) leaves the won car in `state.cars` and the day at 25; BACK while leading toasts the message and records no `pop`; BACK with no lead pops; a consigned car shows in YOUR LOTS (use `consignCar`).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_auction_d` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W65d: Auction your lots, leave and settle`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
