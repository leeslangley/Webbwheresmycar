[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC13 Office: car on the telly and HUD car portrait

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC13
Needs (already merged into `dev`): CC11, CC12, W58
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Show the cars in the office: the owned cars cycle on the Webb TV, and a framed portrait of the selected (or current) car sits in the room as the HUD car slot. Static telly and 'Tap me to shop!' stay when there is no car.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- docs/art/RSAMH_STYLE.md
- src/ui/scenes/office.js (the TV block that calls drawTvStatic)
- src/art/officelayout.js
- tests/scene_office.test.mjs
- src/art/tvcar.js and src/art/carportrait.js

## Files you may change (and nothing else)
- `src/ui/scenes/office.js`
- `src/art/officelayout.js`
- `tests/scene_office.test.mjs`

## Steps
1. `officelayout.js`: add `hudCar: { x: 560, y: 586, w: 200, h: 116 }` to `OFFICE` (one constant: when a HUD relayout card lands, move only this rect; it sits on the floor below the desk).
2. `office.js`: in the TV block, compute `cars = state.cars` (owned or rented, all of them). Call `const shown = drawTvCar(ctx, OFFICE.tvScreen, cars, t);`. When `shown` is true skip `drawTvStatic` and the 'WEBB TV' and 'Tap me to shop!' captions; when false keep the existing static and captions exactly as now (call `drawTvStatic` only in that branch). Before the HUD strip call add `drawHudCar(ctx, OFFICE.hudCar, state.cars, app.selectedCarId, t);`. Add the tap hotspot: a hit `hudcar` on `OFFICE.hudCar` that calls `app.push('garage')` (use the id the scene already uses for the garage hotspot).
3. `tests/scene_office.test.mjs`: keep all tests. Add (fake art installed, state from the existing helper with `state.cars = [car1]`): drawing the office makes at least 2 `drawImage` calls whose image ids start with the car's modelId (TV and portrait); with `state.cars = []` there are no `drawImage` calls with such ids and the text `Tap me to shop!` is drawn; tapping the centre of `OFFICE.hudCar` (down then draw then up) calls `push` garage when the garage hotspot id is the one used.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_office` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC13: Office: car on the telly and HUD car portrait`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
