[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD11 Title scene: stars, sky, road and dashes across the whole canvas

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD11
Needs (already merged into `dev`): WD05, GE23, CC18
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The title scene draws its night sky, stars, road strip and scrolling dashes across the full canvas (`app.view.left` to `app.view.right`) instead of only 0..1280, so the strips show a real sky and a moving road, not a smeared edge pixel (a dash crossing the edge column would flash a yellow streak). Buttons, LAYOUT and the car are unchanged. On a 16:9 view every existing call is identical. TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: after WD05 (fakeapp has `app.view`), GE23 and CC18 (both rewrite parts of title.js). If a quoted line below was changed by them, apply the same idea to the equivalent line and say so in your summary.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/scenes/title.js (as changed by GE23 and CC18: `starAt`, the sky gradient fill `ctx.fillRect(0, 0, app.w, ROAD_TOP)`, the road fill `ctx.fillRect(0, ROAD_TOP, app.w, ROAD_BOTTOM - ROAD_TOP)`, the dash loop `for (let x = start; x < app.w; x += period)`)
- tests/scene_title.test.mjs and tests/scene_title_plate.test.mjs (GE23) must stay green
- tests/fakeapp.js (WD05 added `app.view`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/scenes/title.js`
- `tests/scene_title_view.test.mjs`

## Steps
1. In `draw`, first line after the hit-list reset: `const left = app.view ? app.view.left : 0; const right = app.view ? app.view.right : app.w; const span = right - left;`. Change `starAt(i)` to `starAt(i, left, span)` returning `x: left + (i * 137 + 53) % span` (y unchanged); with left 0 and span 1280 the positions are identical to today. Change the sky fill to `ctx.fillRect(left, 0, span, ROAD_TOP)` and the road fill to `ctx.fillRect(left, ROAD_TOP, span, ROAD_BOTTOM - ROAD_TOP)`. The dash loop becomes `const start = left - ((t * speed) % period); for (let x = start; x < right; x += period)`.
2. In plate mode (GE23) the `app.rooms.draw(ctx, 'title', ...)` call and the lamp glows stay as they are (the wide plate already covers the strips; a narrow plate gets WD04's smear). Do not touch buttons, LAYOUT, the logo text or the car code.
3. `tests/scene_title_view.test.mjs` (fakectx, fakeapp, copy the draw/tap helpers of tests/scene_title.test.mjs): with the default view the sky fillRect is `[0,0,1280,640]` and the road fillRect is `[0,640,1280,80]`. With `app.view = {...app.view, left: -140, right: 1420, stageX: 140, wide: true}` (19.5:9, 1560x720): the sky fillRect is `[-140,0,1560,640]`, the road fillRect `[-140,640,1560,80]`; at t = 0 the first dash `fillRect` has x -140 and y 676, a dash with x >= 1280 exists, no dash starts below -140 - 100 or at x >= 1420; among the 40 star `fillRect` calls (2x2 with a white rgba fillStyle) at least one has x < 0 and at least one has x > 1280 and none has x < -140 or x > 1420 (stars are at -140 + (i*137+53) % 1560, giving x in [-140, 1367] with 5 below 0 and 3 above 1280). The NEW GAME button still works with the wide view: draw, then pointer down and up at the centre of LAYOUT.newGame records `['newGame']` on the fake app.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/scene_title_view.test.mjs'` prints one line.
- `make test 2>&1 | grep -E 'PASS tests/scene_title'` lists every title test file as PASS.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Buttons, LAYOUT, the car drawing, CC18 drive-by code, GE23 plate code.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD11: Title scene: stars, sky, road and dashes across the whole canvas`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
