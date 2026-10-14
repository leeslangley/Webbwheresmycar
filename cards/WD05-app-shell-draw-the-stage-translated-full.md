[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD05 App shell: draw the stage translated, full-width transitions, CRT, strips

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD05
Needs (already merged into `dev`): GU23, WD02, WD04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`createApp` learns about `app.view`. On a 16:9 or 4:3 view (not wide) every drawn call stays EXACTLY as before. On a wide view the app clears the canvas, draws the scene stack, particles, toasts and tooltip translated by `view.dx` (stage coordinates, so no scene changes), runs transitions and the CRT overlay over the FULL canvas width, and fills the strips with `finishStrips`. Scene code keeps using `app.w` (1280) and `app.h` (720). TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: after GU22 and GU23 (this edits the draw() they wrote) and WD02, WD04. The one-line edits to GU14, GU16, GU19, GE14 listed in docs/art/WD.md are applied in the specs; WD15 checks them.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/scenes.js as changed by GU22 and GU23 (read all of it: `drawStack(list)`, `fxBegin`/`fxEnd`, the transition draw calls, `drawParticles`, the toast loop with `drawToast2`, `drawTooltip`, `drawCrt`, the `safe` field) and tests/scenes.test.mjs, tests/app_fx.test.mjs, tests/app_overlays.test.mjs (all must stay green)
- src/ui/view.js (WD02) and src/ui/smear.js (WD04)
- tests/fakeapp.js
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/scenes.js`
- `tests/app_view.test.mjs`
- `tests/fakeapp.js`

## Steps
1. In `src/ui/scenes.js` import `defaultView` from './view.js' and `finishStrips` from './smear.js'. In `createApp` make `const view = defaultView();` and add the fields `view: view`, `canvas: null` (boot sets it, tests set a plain {width,height}) and replace the `safe: {top:0, right:0, bottom:0, left:0}` field GU23 added by `safe: view.safe` (the same object, so `app.safe` and `app.view.safe` never differ).
2. In `draw(ctx, t)` at the top: `const view = app.view; const wide = view.wide === true;`. Background: when `wide` do `ctx.clearRect(0, 0, view.fullW, view.fullH)` INSTEAD of the existing ink fillRect (when not wide keep that fillRect line exactly as it is). Add a private `stageDraw(fn)`: when not wide just `fn()`; when wide `ctx.save(); ctx.translate(view.dx, 0); fn(); ctx.restore();`. Wrap in `stageDraw`: the normal `drawStack(app.stack)` call; the `drawFrom` and `drawTo` callbacks given to every transition draw function (so they become `() => stageDraw(() => drawStack(...))`) and pass `view.fullW, view.fullH` as the last two arguments (`w`, `h`) of `drawTransition`, `drawStaticWipe` and `drawPageTurn`; the `drawParticles` call; the whole toast loop; the tooltip draw. Do NOT wrap `fxBegin`/`fxEnd` (the shake moves the whole canvas, strips included). Right after the `fxEnd(...)` call and before the toasts add `if (wide) { finishStrips(ctx, view, PALETTE.ink, app.canvas); }`. Replace `drawCrt(ctx, app.w, app.h, t)` by `drawCrt(ctx, view.fullW, view.fullH, t)` and keep it outside `stageDraw` as the very last draw. `pointer` and `key` stay untouched: scenes receive stage coordinates exactly as boot passes them (x may be negative or above 1280).
3. `tests/fakeapp.js` (a test helper, keep every existing field): after the `app` object is built add `app.view = {fullW: 1280, fullH: 720, stageX: 0, stageW: 1280, dx: 0, left: 0, right: 1280, scale: 1, dpr: 1, ds: 1, wide: false, safe: {top: 0, right: 0, bottom: 0, left: 0}}; app.safe = app.view.safe;` before `return app`.
4. `tests/app_view.test.mjs` (fakectx; `createApp({now: () => n})` with a mutable clock; helper `viewFor(w, h, dpr)` = `makeView(fitLayout(w, h), dpr || 1, null)` applied with `setView(app.view, ...)`; one fake scene 'a' whose `draw(ctx, app, t)` does `ctx.fillRect(10, 20, 30, 40)` and whose `pointer(app, type, x, y)` stores its arguments). THREE ASPECTS. 16:9 (1280x720) and 4:3 (1024x768): draw makes the first call `fillRect [0,0,1280,720]` with fillStyle `PALETTE.ink`, and no `translate`, no `clearRect`, no `drawImage`, and the calls recorded around scene a are the same as before this card. 19.5:9 (1560x720, dpr 1; stageX 140, dx 140): the first call is `clearRect [0,0,1560,720]` and there is no `fillRect [0,0,1280,720]`; exactly one `translate [140,0]` occurs before scene a's `fillRect [10,20,30,40]` and a `restore` after it; `app.w` is 1280 and `app.h` is 720; with `app.canvas = {width:1560,height:720}` two `drawImage` calls follow ([canvas,140,0,1,720,0,0,140,720] and [canvas,1419,0,1,720,1420,0,140,720]) and the LAST `fillRect` of the frame is `[0,0,1560,720]` with fillStyle `PALETTE.ink` (the underlay), while without `app.canvas` there is no `drawImage` but the underlay is still drawn; save count equals restore count in all three views. Pointer: on the wide view `app.pointer('down', -50, 100)` reaches scene a as ('down', -50, 100) and `app.pointer('up', 1360, 5)` as ('up', 1360, 5).
5. More wide-view cases in the same file (19.5:9 1560x720). Transition: `app.go('a')`, `app.push('b', null, {transition: 'slide-left'})`, draw at n = 175 (progress 0.5, eased 0.875): `translate` calls contain [-1365,0] and [195,0] (w is 1560, not 1280) and every transition `clip` is `rect(0,0,1560,720)`; scene a and b are each drawn once, each inside its own `translate [140,0]`. CRT: `app.settings.crt = true` gives `createRadialGradient` args [780,360,252,780,360,1170] and a last-but-one `fillRect [0,0,1560,720]` (vignette) with the sweep rect `[0,yy,1560,80]` last, and no `translate` call lies between the last stage `restore` and the CRT `stroke` (the CRT is drawn at base transform over the full canvas). Toast: `app.toast('hi')` then draw at n = 1000: a `translate [140,0]` precedes the toast panel path that starts `moveTo(370, 640)`. Particles: `app.burst('confetti', 100, 100, 5)` then draw: 5 `fillRect` calls with height 6, preceded by `translate [140,0]`. Flash: `app.disaster()` then draw: a `fillRect` whose fillStyle starts with 'rgba(217,72,59,' exists (after the GU14 edit it is `[-144,0,1568,720]`: assert only that x <= -140 and x + w >= 1420, so the test also passes with the edit applied).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/app_view.test.mjs'` prints one line.
- `make test 2>&1 | grep -E 'PASS tests/(scenes|app_fx|app_overlays).test.mjs'` prints three lines (every earlier app test is unchanged and green).
- `grep -c 'finishStrips' src/ui/scenes.js` prints 2 (import plus one call).
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Every scene file; boot.js (WD06); any GU or GE module (their one-line edits are listed in docs/art/WD.md).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD05: App shell: draw the stage translated, full-width transitions, CRT, strips`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
