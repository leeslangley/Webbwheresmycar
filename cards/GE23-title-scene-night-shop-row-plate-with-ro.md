[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE23 Title scene: night shop row plate with road, lamps and stars behind

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE23
Needs (already merged into `dev`): GE13, GE14
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The title screen keeps its sky gradient and twinkling stars, and puts the Blender 'title' plate (shop row, lamp posts, pavement, wet road; transparent sky) over them, with warm lamp glows. The driving car and the scrolling road dashes stay code-drawn. Buttons and LAYOUT unchanged.

## Read first
- src/ui/scenes/title.js (draw: sky, stars, road strip, dashes, car)
- src/art/rooms.js, roomfx_light.js
- tests/scene_title.test.mjs

## Files you may change (and nothing else)
- `src/ui/scenes/title.js`
- `tests/scene_title_plate.test.mjs`

## Steps
1. In `draw`, after the stars loop: `const plate = !!(app.rooms && app.rooms.has('title'));` if plate: `app.rooms.draw(ctx, 'title', {look: app.look || {x:0,y:0}});` and skip the darkgrey road fill (`ctx.fillRect(0, ROAD_TOP, ...)`); else keep the old road fill. The dashed line loop and the car stay in both modes.
2. In plate mode, after the car is drawn and before the logo text: for x in [250, 700, 1180]: `lampGlow(ctx, x, 296, t)`. At the end of `draw` in plate mode: `vignette(ctx, 1280, 720, 0.3)`.
3. `tests/scene_title_plate.test.mjs`: with a fake `app.rooms` (records calls; has('title') true) a draw records `['draw','title',...]` once, three lamp glows (`set:globalCompositeOperation` `'lighter'` at least 3 times), the car is still drawn (the existing test shows how to see it); without rooms the old road is drawn (`fillRect` with y 640, w 1280, h 80 exists). Buttons: tapping the NEW GAME centre (down, redraw, up) still calls `app.newGame` (fakeapp records `['newGame']`).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_title'` shows PASS for all title scene files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE23: Title scene: night shop row plate with road, lamps and stars behind`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
