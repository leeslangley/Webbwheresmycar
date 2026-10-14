[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE21 Auction scene: hall plate, spotlight cone, bobbing crowd kept

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE21
Needs (already merged into `dev`): GE13, GE14, W65d
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The auction hall draws the Blender hall plate (curtains, stage, podium, dark lot board) when available. The lot picture area, buttons and hit areas stay exactly where they are; the bobbing crowd silhouettes stay code-drawn.

## Read first
- src/ui/scenes/auction.js (`drawHall(ctx, t)` and its call in draw)
- src/art/rooms.js, roomfx_light.js
- tests/scene_auction_a.test.mjs (how the auction scene is set up)

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction_plate.test.mjs`

## Steps
1. Split `drawHall(ctx, t)`: move the crowd loop (the `for (let i = 0; i < 16; i++)` silhouettes) into `function drawCrowd(ctx, t)` and call it at the end of `drawHall`. Add `function drawHallPlate(ctx, app, t)`: `app.rooms.draw(ctx, 'auction', {look: app.look || {x:0,y:0}});` then `sunShaft(ctx, [[640,0],[LAYOUT.picture.x + 180, LAYOUT.picture.y + LAYOUT.picture.h],[LAYOUT.picture.x + LAYOUT.picture.w - 180, LAYOUT.picture.y + LAYOUT.picture.h],[640,0]], t)` (import `sunShaft`, `vignette` from roomfx_light.js), `drawCrowd(ctx, t)`, `vignette(ctx, 1280, 720, 0.3)`.
2. In `draw` replace `drawHall(ctx, t);` by `if (app.rooms && app.rooms.has('auction')) { drawHallPlate(ctx, app, t); } else { drawHall(ctx, t); }`.
3. `tests/scene_auction_plate.test.mjs`: set up like tests/scene_auction_a.test.mjs; with a fake `app.rooms` one draw records `['draw','auction',...]` once, the crowd is drawn (at least 16 `arc` calls whose third argument is 13), and the old plank stage is not (no `fillRect` call with args `[120,100,1040,260]`); without rooms the old hall is drawn (exactly one `fillRect` call with args `[120,100,1040,260]`). `LAYOUT.picture` still deep-equals `{x:120,y:100,w:1040,h:260}`; tapping NEXT still works.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_auction'` shows PASS for all auction scene files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE21: Auction scene: hall plate, spotlight cone, bobbing crowd kept`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
