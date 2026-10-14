[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD15 Seam audit: every scene and every full-screen effect covers the strips

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD15
Needs (already merged into `dev`): WD05, WD11, WD12, WD13, GU14, GU16, GU19, GE14
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A permanent numeric gate for the wide screen. Part A draws every scene on a 19.5:9 view and fails when a scene paints a translucent rectangle across exactly the stage width (0..1280) that does not reach the strips (the visible step at the stage edge). Part B checks the four full-screen effects that live in other cards (flash, day-change dim, vignette, TV-static wipe) really cover the strips. If a Part B check fails, a one-line edit listed in docs/art/WD.md was not applied to that card's module: apply it (it is one line) and say so. TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: last of the WD cards.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- tests/fakeapp.js (WD05: `makeApp(state)` has `app.view`), src/sim/newgame.js (`startGame(3)`), tests/fakectx.js
- src/ui/screenfx.js (GU14), src/ui/daychange.js (GU19), src/art/roomfx_light.js (GE14), src/ui/transitions2.js (GU16)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `tests/viewaudit.test.mjs`

## Steps
1. `tests/viewaudit.test.mjs`, Part A. Import `makeApp`, `startGame` and the scenes `titleScene, officeScene, garageScene, auctionScene, tvshopScene, bookingsScene, ledgerScene, advertsScene, settingsScene, endgameScene, newsScene` from their `src/ui/scenes/<name>.js` files (the export names are `<name>Scene`). Helper `seams(ctx)`: walk `ctx.calls`; remember the current `set:fillStyle` and `set:globalAlpha` values (default alpha 1) and keep a stack so `save` pushes both and `restore` pops them; for each `fillRect [x,y,w,h]` with `x <= 0 && x + w >= 1280 && h >= 100` compute the alpha (parse `rgba(r,g,b,a)` strings with a regex; any other fillStyle counts as alpha 1); it is a seam when (alpha < 1 or globalAlpha < 1) and NOT (x <= -140 and x + w >= 1420); return the list. For each scene: `const app = makeApp(startGame(3)); app.view = {...app.view, left: -140, right: 1420, stageX: 140, dx: 140, fullW: 1560, wide: true}; if (scene.enter) scene.enter(app, {}); const ctx = makeCtx(); scene.draw(ctx, app, 0);` inside try/catch (a scene that throws counts as `skipped`). Print `AUDIT scenes=11 ok=<n> skipped=<n> seams=<n>` and `test` requires skipped 0 (all eleven scenes draw with this setup today), seams 0, and prints the offending [scene id, rect, fillStyle] for any seam.
2. Part B (same file, separate tests; the wide numbers are 1560 wide): (1) flash: `const fx = makeScreenFx(); fxFlash(fx, '#D9483B', 180, 0, 0.8); const c = makeCtx(); fxBegin(c, fx, 0); fxEnd(c, fx, 0);` one `fillRect` with a fillStyle starting 'rgba(217,72,59,' has x <= -140 and x + w >= 1420. (2) day change: `drawDayChange(c, dayTimeline({day:1,cash:1000,rep:40,buzz:0},{day:2,cash:2400,rep:41,buzz:3}), 650, null)`: the first `fillRect` (fillStyle 'rgba(20,16,42,0.550)') has x <= -140 and x + w >= 1420. (3) vignette: `vignette(c, 1280, 720, 0.3)` fills a rect with x <= -140 and x + w >= 1420. (4) static wipe: `drawStaticWipe(c, {kind:'static', start:0, dur:400}, 200, function(){}, function(){}, 1560, 720)` makes exactly 49 * 23 = 1127 `fillRect` calls of size [32,32] (u 0.5 is full coverage) and the largest `x + 32` is at least 1560.
3. Every imported name is from the cards named in `needs`; if an import fails because a module is missing, finish with `STATUS: BLOCKED` naming it. Do not weaken a threshold. Part A must keep passing when later scenes are added: it only reads scenes through the `draw` function.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/viewaudit.test.mjs'` prints one line.
- `$JSC -m tests/viewaudit.test.mjs 2>&1 | grep 'AUDIT scenes=11 ok=11 skipped=0 seams=0'` prints one line (JSC as in `make test`; `make test` itself hides the output of passing files).
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Every file except the new test: a failing check is reported, and fixed by the one-line edits in docs/art/WD.md, not by editing scenes here.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD15: Seam audit: every scene and every full-screen effect covers the strips`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
