[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE19 Garage scene: plate, flickering strip lights, dust

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE19
Needs (already merged into `dev`): GE13, GE14, GE15, W60
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The garage draws the Blender garage plate when `app.rooms` has it (old gradient room as fallback). LAYOUT and hit areas stay unchanged.

## Read first
- src/ui/scenes/garage.js (`drawRoom(ctx, app)` and where draw calls it)
- src/art/rooms.js, roomfx_light.js, roomfx_world.js
- tests/scene_garage.test.mjs (how the garage scene is set up with a bought car)

## Files you may change (and nothing else)
- `src/ui/scenes/garage.js`
- `tests/scene_garage_plate.test.mjs`

## Steps
1. Add `function drawGaragePlate(ctx, app, t)`: `app.rooms.draw(ctx, 'garage', {look: app.look || {x:0,y:0}});` then for i, x in [290, 640, 990]: `glow(ctx, x, 18, 150, '#dff1ff', 0.22 * flicker(t, i * 2.1, 0.18))` (import `glow`, `flicker`, `vignette`, `grain` from roomfx_light.js and `drawDust` from roomfx_world.js); then `drawDust(ctx, {x:0,y:100,w:1280,h:400}, t, 24)`, `vignette(ctx, 1280, 720, 0.3)`.
2. In `draw` replace `drawRoom(ctx, app);` by `if (app.rooms && app.rooms.has('garage')) { drawGaragePlate(ctx, app, t); } else { drawRoom(ctx, app); }`. Nothing else in the file changes.
3. `tests/scene_garage_plate.test.mjs`: build the app and state the way tests/scene_garage.test.mjs does; with a fake `app.rooms` (as in GE17: records calls, `has` true for 'garage') one draw records a single `['draw','garage',...]` call and `set:globalCompositeOperation` was set to `'lighter'` three times or more; without `app.rooms` the draw still works and `createLinearGradient` was called (old room). Tap rule check: down on LAYOUT.back centre, redraw, up -> `app.calls` has `['pop']`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_garage'` shows PASS for all garage scene files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE19: Garage scene: plate, flickering strip lights, dust`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
