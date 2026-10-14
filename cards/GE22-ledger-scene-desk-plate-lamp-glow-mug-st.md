[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE22 Ledger scene: desk plate, lamp glow, mug steam

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE22
Needs (already merged into `dev`): GE13, GE14, GE15, W64b, W64
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The ledger/workshop screen draws the Blender 'ledger' desk plate (when available) behind its panels, with the lamp glow and a little mug steam. LAYOUT and hit areas stay unchanged.

## Read first
- src/ui/scenes/ledger.js (`draw` start)
- src/art/rooms.js, roomfx_light.js, roomfx_world.js
- tests/scene_ledger.test.mjs

## Files you may change (and nothing else)
- `src/ui/scenes/ledger.js`
- `tests/scene_ledger_plate.test.mjs`

## Steps
1. At the very start of the drawing part of `draw` (after `const scene = this;`), add: `if (app.rooms && app.rooms.has('ledger')) { app.rooms.draw(ctx, 'ledger', {look: app.look || {x:0,y:0}}); lampGlow(ctx, 190, 135, t); steamPuffs(ctx, 1100, 548, t, 4); }` (imports from `../../art/roomfx_light.js` and `../../art/roomfx_world.js`). At the end of `draw`, in plate mode only: `vignette(ctx, 1280, 720, 0.25)`.
2. `tests/scene_ledger_plate.test.mjs`: with a fake `app.rooms` (records calls; has('ledger') true) one draw records `['draw','ledger',...]` once, at least 4 `arc` calls with a radius between 4 and 14 exist (the steam), `set:globalCompositeOperation` `'lighter'` at least once; without it the draw still works; both tabs still draw (enter with `{tab:'workshop'}`); BACK pops after down, redraw, up.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_ledger'` shows PASS for all ledger scene files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE22: Ledger scene: desk plate, lamp glow, mug steam`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
