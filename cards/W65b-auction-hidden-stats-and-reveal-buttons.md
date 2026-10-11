[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W65b Auction hidden stats and reveal buttons

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W65b
Needs (already merged into `dev`): W65a
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Show the four stats as ??? until the player pays 150 to reveal them (max 2 per lot).

## Read first
- docs/DESIGN.md section 4.10
- src/sim/auction.js (lotView, revealStat, placeBid, minBid, bidStep, attendAuction, AUCTION_REVEAL_COST, STATS)
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/ui/scenes/auction.js (from the last card)

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_b.test.mjs`

## Steps
1. In `draw` add four stat rows `STYLE`, `UPKEEP`, `GRIT`, `CONDITION` (the `STATS` order) at the `LAYOUT.reveals` y positions. Each shows `???` in grey until revealed in `lotView`, else the value with a `bar`. Next to each hidden row draw a button `REVEAL <money(150)>`. The car picture now uses the revealed condition if known, else 6.
2. Tapping REVEAL calls `revealStat(app.state, lotId, stat)` DIRECTLY (no `app.act`: it costs no day) and toasts the returned `msg`. Add the hit ids `reveal0`..`reveal3`.
3. Write `tests/scene_auction_b.test.mjs` (day 24, `startGame(8)`): hidden stats show `???` and the lot's true condition number text does not appear anywhere in `texts(ctx)`; tapping the first REVEAL (down, redraw at other `t`, up) deducts 150 and shows that stat's value instead of `???`; the third reveal on one lot is refused with the toast from the sim (read `revealStat` for its exact message); reveal with cash 100 toasts the sim message and changes nothing.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_auction_b` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W65b: Auction hidden stats and reveal buttons`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
