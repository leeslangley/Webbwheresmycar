[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W65c Auction bidding

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W65c
Needs (already merged into `dev`): W65b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The current bid, who leads, and the two bid buttons.

## Read first
- docs/DESIGN.md section 4.10
- src/sim/auction.js (lotView, revealStat, placeBid, minBid, bidStep, attendAuction, AUCTION_REVEAL_COST, STATS)
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/ui/scenes/auction.js (from the last card)

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_c.test.mjs`

## Steps
1. In `draw` add text `Bid: <money or none>`, the leader (`You`, `Rival bidder` or `Nobody`), and `Min next <money>`, from `lotView`/`minBid`. Buttons `BID +1 <money>` (at `LAYOUT.bid1`) and `BID +3 <money>` (at `LAYOUT.bid3`): the amounts come from `minBid` and `bidStep` (read them in the sim). A few crowd paddles wave (vary with `t`) when the player leads.
2. Tapping a bid button calls `placeBid(app.state, lotId, 1)` or `placeBid(app.state, lotId, 3)` DIRECTLY (no `app.act`) and toasts the returned `msg`. Hit ids `bid1`, `bid3`.
3. Write `tests/scene_auction_c.test.mjs` (day 24, `startGame(8)`): set the lot's `ceilings = [1,1,1]` so the player always leads, tap BID +1 (down, redraw, up) and expect the `Bid:` text to change and the leader text `You`; BID +3 raises the bid by 3 steps; a bid with too little cash toasts the sim message.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_auction_c` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W65c: Auction bidding`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
