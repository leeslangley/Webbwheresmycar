[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE17 Office scene: draw the plate, chairs, lights and sky

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE17
Needs (already merged into `dev`): GE13, GE14, GE15, GE16, GU24
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The office hub draws the Blender plate when `app.rooms` has it, and falls back to the old vector room otherwise (all existing tests keep passing). Live things (TV picture, calendar, phone, laptop, newspaper, kettle, Mark, Dave, speech bubble, HUD) are still code-drawn on top.

## Read first
- src/ui/scenes/office.js (the draw function)
- src/art/rooms.js, src/art/roomfx_light.js, src/art/roomfx_world.js, src/art/officelayout.js (OFFICE and OFFICE_FX)
- tests/scene_office.test.mjs and tests/fakeapp.js (how a fake app is built)

## Files you may change (and nothing else)
- `src/ui/scenes/office.js`
- `tests/scene_office_plate.test.mjs`

## Steps
1. In `draw`, replace the single `drawOfficeStatic(ctx, t)` call with: `const rooms = app.rooms; const look = app.look || {x:0,y:0}; const plate = !!(rooms && rooms.has('office'));` if plate: `drawSky(ctx, OFFICE.window, 10, t, look); rooms.draw(ctx, 'office', {look}); drawOfficeLabels(ctx);` else `drawOfficeStatic(ctx, t)`. Keep the TV screen, calendar, desk props, kettle, characters and bubble code exactly as it is.
2. Add `function drawOfficeLabels(ctx)` in the scene file (copy the `centreText` helper idea from src/art/office.js): `CLASSIC CAR` ('title' 8px, PALETTE.ink) at (posterCx, 208); `AUCTION` ('title' 12px, PALETTE.cream) at (posterCx, 183); `24th of every month` ('body' 12px, PALETTE.ink) at (posterCx, 284); `LEDGER` ('title' 8px, PALETTE.ink) at (ledgerCx, 270); `WORKSHOP` ('title' 10px, PALETTE.ink) at (boardCx, 185); `GARAGE` ('title' 12px, PALETTE.cream) at (signCx, 161). (Coordinates are baselines; centre text.)
3. After the characters and bubble and BEFORE `drawHud`, in plate mode only: `rooms.drawFront(ctx, 'office', {look})` (the chairs, over Mark and Dave); `lampGlow(ctx, OFFICE_FX.lamp.x, OFFICE_FX.lamp.y, t)`; `tvGlow(ctx, OFFICE_FX.tvGlow, t)`; `sunShaft(ctx, OFFICE_FX.sunQuad, t)`; `drawDust(ctx, OFFICE_FX.dustRect, t, 24)`; `vignette(ctx, 1280, 720, 0.35)`; `grain(ctx, 1280, 720, t, 60)`. The hotspot glow hints stay after this and before the HUD.
4. `tests/scene_office_plate.test.mjs` (fakectx + fakeapp, `startGame(3)`): with `app.rooms = {calls: [], has: id => id === 'office', draw(ctx, id, o) {this.calls.push(['draw', id, o]);}, drawFront(ctx, id, o) {this.calls.push(['front', id, o]);}}` one `officeScene.draw` gives `rooms.calls` of length 2 in the order draw then front, both for 'office'; the drawn texts (`texts(ctx)`) contain each of `AUCTION`, `LEDGER`, `WORKSHOP`, `GARAGE` exactly once, and also `WEBB TV`; `set:globalCompositeOperation` was set to `'lighter'`. With NO `app.rooms` the draw still works and the same four labels appear (from the old painter). Tapping the TV centre still pushes `tvshop` in plate mode (down, redraw, up).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_office'` shows PASS for both scene_office files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE17: Office scene: draw the plate, chairs, lights and sky`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
