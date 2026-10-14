[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC17 Bookings: car thumbnails in the strip

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC17
Needs (already merged into `dev`): CC07, W62
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The bookings phone's car strip shows the small thumbnail sheet (crisp 1x pixels) with the right wear state and a faulty or blocked car clearly marked.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/ui/scenes/bookings.js (the car strip loop with drawCar, LAYOUT.carW)
- tests/scene_bookings.test.mjs
- src/art/modelcar.js
- tests/fakecarart.js (from CC07): installFakeCarArt() / uninstallFakeCarArt() give scene tests sprite-like drawImage calls

## Files you may change (and nothing else)
- `src/ui/scenes/bookings.js`
- `tests/scene_bookings.test.mjs`

## Steps
1. Import `drawModelCar`; drop `drawCar`. Replace the call with `drawModelCar(ctx, model.id, x + w / 2, y + h - 40, 1, {cond: car.condition, sheet: 'S', slot: {w: w - 16, h: 64}, fault: !!car.fault && block === null})`. Keep the name label, the condition/block text, the greying and the selection outline unchanged (the `block` variable is computed after the draw today: compute `carBlock(...)` BEFORE the draw call and reuse it).
2. Add a 3 px `PALETTE.bad` bar under the car (`fillRect(x + 8, y + h - 36, w - 16, 3)`) for blocked cars only, drawn before the grey wash.
3. Tests: keep all. Add with fake art: two owned cars (conditions 10 and 3) make two `drawImage` calls with ids ending `_s|undefined|0` and `_s|undefined|2` and each rect lies inside its card rect `{x: L.cars.x + i*L.carW + 6, ...}`; a car with `fault` set draws steam fillRects; uninstalled art draws no `drawImage`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_bookings` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC17: Bookings: car thumbnails in the strip`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
