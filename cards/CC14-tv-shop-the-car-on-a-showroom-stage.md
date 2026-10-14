[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC14 TV shop: the car on a showroom stage

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC14
Needs (already merged into `dev`): CC01, CC07, CC08, W59b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
In the TV shop detail panel the car becomes the star: a head-on showroom stage with the real classic car sprite (or the code-drawn fallback), drive-in when the selection changes, idle bob, reflection and a glossy shine sweep.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/ui/scenes/tvshop.js (drawDetail, LAYOUT)
- tests/scene_tvshop_draw.test.mjs
- src/art/modelcar.js, src/art/stage.js, src/art/pixelscale.js
- tests/fakecarart.js (from CC07): installFakeCarArt() / uninstallFakeCarArt() give scene tests sprite-like drawImage calls

## Files you may change (and nothing else)
- `src/ui/scenes/tvshop.js`
- `tests/scene_tvshop_draw.test.mjs`

## Steps
1. Imports: `drawModelCar` (modelcar.js), `drawStage` (stage.js), `makeTracker, driveIn` (pixelscale.js); remove the `drawCar` and `paintOf` imports. Add `LAYOUT.stage = { x: 632, y: 168, w: 596, h: 232 }` (exported via LAYOUT). `tvshopScene.tr = makeTracker()` in `enter`; `drawDetail(ctx, listing, t)` gets the tracker as a 4th argument (pass `this.tr` from draw).
2. `drawDetail` new order: panel; model name label as now (title font 22, y = D.y + 16); stage: `const g = drawStage(ctx, LAYOUT.stage, 'showroom', t); const el = tr.update(listing.id, t); const dx = driveIn(el, 0.7, 640);` then `drawModelCar(ctx, model.id, g.centerX + dx, g.groundY, 2, {cond: listing.condition, t, slot: {w: LAYOUT.stage.w - 24, h: g.groundY - LAYOUT.stage.y - 6}, bob: el > 0.7, reflect: true, shine: el > 0.7})` clipped to the stage rect (`save; rect; clip; ... restore`) so a driving-in car does not leave the stage.
3. Move the text below the stage: stat bars start at `y = 408` with pitch 32 (label size 24 at `D.x + 20`, bar at `D.x + 180, y + 4`, width 400, height 20): STYLE 408, UPKEEP 440, GRIT 472, CONDITION 504 (same texts and colours as now); the quip becomes one line `label(ctx, model.year + '. ' + model.quip, D.x + 20, 536, {size: 24, maxW: D.w - 40})`; for rentals `Owner: ...` at y 566 size 24. Remove the old `paragraph` quip call. Nothing else changes (hits, buttons, rows).
4. Update `tests/scene_tvshop_draw.test.mjs`: keep every assertion that still applies (the quip text is now `YEAR. QUIP` on one line: adjust that one assertion). Add: with fake art installed the detail draw makes exactly one `drawImage` whose image id starts with the selected model id and whose rect lies inside `LAYOUT.stage`; after `uninstallFakeCarArt()` there is no `drawImage` and the draw still contains the model name; the stage clip rect equals `LAYOUT.stage`; after `scene.enter`, a draw at t=0 puts the car centre left of the stage centre (drive-in), and a second draw at t=1 on the same scene and listing (after the 0.7 s drive-in) puts its centre at `LAYOUT.stage.x + LAYOUT.stage.w/2` within 1 px.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_tvshop` shows PASS for both tvshop test files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC14: TV shop: the car on a showroom stage`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
