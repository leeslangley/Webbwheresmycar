[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC18 Title drive-by of real classic cars

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC18
Needs (already merged into `dev`): CC01, CC07, W57
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The title screen drive-by shows six real catalogue cars, big (2x pixels), one every 9 seconds, with a speed streak and exhaust puff, instead of four generic red shapes.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/ui/scenes/title.js (CAR_ARCHETYPES and the drawCar call)
- tests/scene_title.test.mjs
- src/art/modelcar.js (measureModelCar, drawModelCar)
- tests/fakecarart.js (from CC07): installFakeCarArt() / uninstallFakeCarArt() give scene tests sprite-like drawImage calls

## Files you may change (and nothing else)
- `src/ui/scenes/title.js`
- `tests/scene_title.test.mjs`

## Steps
1. Replace `CAR_ARCHETYPES` with `DRIVE_CARS = ['t1_cooker','t2_spyder','t3_dinosore','t1_chimp','t3_cloudy','t2_eclair']`, `PERIOD = 9`. `idx = Math.floor(t / PERIOD) % DRIVE_CARS.length`; `m = measureModelCar(id, 2, {})`; `carX = -m.w / 2 + ((t % PERIOD) / PERIOD) * (1280 + m.w)` (the car enters fully off-screen and leaves fully off-screen). Draw `drawModelCar(ctx, id, carX, 668, 2, {cond: 10, t, bob: true, reflect: false})` and, behind it, three speed streaks: `fillRect(carX - m.w/2 - 20 - i*34, 668 - 14 - i*10, 24 + i*10, 3)` colour `rgba(255,255,255,0.35 - i*0.1)` for i = 0..2. Keep the road, stars, logo and buttons exactly as they are. Export `DRIVE_CARS`.
2. Remove the unused `drawCar` import. Keep `LAYOUT` and all button code.
3. Tests: keep all. Add with fake art (L 200x70): at t=0 the drawn image id starts with `t1_cooker|` and its right edge is at most 0 + 1 (off-screen left, since the car starts at x = -w/2 and w = 400); at t=4.5 the image centre is within 2 px of 640 (it is mid-screen at half the period); at t=9.2 the id starts with `t2_spyder|`; uninstalled art: no `drawImage` and the old code-drawn path still draws (`arc` calls present); button texts unchanged.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_title` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC18: Title drive-by of real classic cars`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
