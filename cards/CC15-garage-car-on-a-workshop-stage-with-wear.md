[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC15 Garage: car on a workshop stage with wear and fault

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC15
Needs (already merged into `dev`): CC01, CC07, CC08, CC11, W60
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The garage detail panel shows the selected car on a workshop stage: its real condition shows as a wear state (mint, worn, tatty, wreck), a faulty car steams, and the selection is published so the office HUD can show it.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/ui/scenes/garage.js (drawDetail, LAYOUT, how selId is set in enter, row tap and keys)
- tests/scene_garage.test.mjs
- src/art/modelcar.js, src/art/stage.js, src/art/pixelscale.js
- tests/fakecarart.js (from CC07): installFakeCarArt() / uninstallFakeCarArt() give scene tests sprite-like drawImage calls

## Files you may change (and nothing else)
- `src/ui/scenes/garage.js`
- `tests/scene_garage.test.mjs`

## Steps
1. Imports as in the TV shop card (drawModelCar, drawStage, makeTracker, driveIn; drop drawCar, carBounds, paintOf). `LAYOUT.stage = { x: 496, y: 154, w: 728, h: 230 }`. `garageScene.tr = makeTracker()` in `enter`. In `drawDetail` replace the `scale`/`drawCar` lines with: `g = drawStage(ctx, LAYOUT.stage, 'garage', t); el = tr.update(car.id, t); dx = driveIn(el, 0.7, 700);` then (clipped to the stage rect) `drawModelCar(ctx, model.id, g.centerX + dx, g.groundY, 2, {cond: car.condition, t, slot:{w: LAYOUT.stage.w - 24, h: g.groundY - LAYOUT.stage.y - 6}, bob: el > 0.7, reflect: true, shine: false, fault: !!car.fault})`.
2. Text: delete the quip label at `D.y + 56` and instead draw it as the last line of the right-hand column, after the fault line: `label(ctx, model.quip, rx, ty, {size: 22, font: 'body', color: PALETTE.darkgrey, maxW: D.w - 400})`. The model name label stays at `D.y + 14`. `drawDetail` needs `tr` (pass it from draw). The stats, buttons and hit handling stay exactly as they are.
3. Publish the selection: at the end of `draw` set `app.selectedCarId = this.selId;` (a field on app, never on app.state).
4. Tests (keep all existing ones; fix only assertions that the moved quip breaks): with fake art, a car with condition 9 draws one `drawImage` with id ending `|0` (wear 0) and a car with condition 3 id ending `|2`; a car with `fault` set makes at least 5 `fillRect` calls colour starting `rgba(235,235,235,` (steam); `app.selectedCarId` equals the selected car id after a draw; uninstall art: no `drawImage`, name text still drawn; the sprite rect lies inside `LAYOUT.stage`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_garage` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC15: Garage: car on a workshop stage with wear and fault`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
