[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE20 Bookings scene: desk plate and lamp glow

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE20
Needs (already merged into `dev`): GE13, GE14
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The bookings screen draws the Blender 'bookings' desk plate (when available) behind its panels, with the lamp glow. LAYOUT and hit areas stay unchanged.

## Read first
- src/ui/scenes/bookings.js (the start of `draw`)
- src/art/rooms.js, roomfx_light.js
- tests/scene_bookings.test.mjs (how the scene is set up)

## Files you may change (and nothing else)
- `src/ui/scenes/bookings.js`
- `tests/scene_bookings_plate.test.mjs`

## Steps
1. At the very start of the drawing part of `draw` (after the hit list is built, before the header), add: `if (app.rooms && app.rooms.has('bookings')) { app.rooms.draw(ctx, 'bookings', {look: app.look || {x:0,y:0}}); lampGlow(ctx, 190, 135, t); }` (import `lampGlow` from `../../art/roomfx_light.js`).
2. At the very end of `draw` add, in plate mode only, `vignette(ctx, 1280, 720, 0.25)`.
3. `tests/scene_bookings_plate.test.mjs`: with a fake `app.rooms` (records calls, has('bookings') true) one draw records `['draw','bookings',...]` once and `set:globalCompositeOperation` `'lighter'` at least once; without it the draw still works; BACK still pops (down, redraw, up on LAYOUT.back centre).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_bookings'` shows PASS for all bookings scene files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE20: Bookings scene: desk plate and lamp glow`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
