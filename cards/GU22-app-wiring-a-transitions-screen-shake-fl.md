[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU22 App wiring A: transitions, screen shake/flash and particles in createApp

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU22
Needs (already merged into `dev`): GU13, GU14, GU15, GU16, W47
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`createApp` learns to run transitions between screens, shake and flash on disasters, and draw particles, while behaving EXACTLY as before for any caller that does not use them.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/scenes.js (read all of it) and tests/scenes.test.mjs (every test must stay green)
- docs/SCENE_RULES.md
- src/ui/transitions.js, src/ui/transitions2.js, src/ui/screenfx.js, src/ui/particles.js (previous cards)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/scenes.js`
- `tests/app_fx.test.mjs`

## Steps
1. In `src/ui/scenes.js` import makeTransition/transDone/drawTransition from './transitions.js', drawStaticWipe/drawPageTurn from './transitions2.js', the screenfx functions and makeParticles/emit/updateParticles/drawParticles. In createApp add fields `fx: makeScreenFx()`, `particles: makeParticles(1)`, `transition: null`, `_lastDraw: null`. Add methods `shake(mag, ms)` (fxShake with app.now()), `flash(color, ms)`, `disaster()` (fxDisaster), `good()` (fxGood), `burst(kind, x, y, n)` (emit into app.particles). Change `push(id, params, opts)` and `go(id, params, opts)`: kind = opts && opts.transition !== undefined ? opts.transition : scene.enterTransition (a property wave-2 cards add to scenes; undefined for all existing scenes) ; when kind is a string and app.settings.fx !== false: BEFORE changing the stack, copy `from = app.stack.slice()`; do the normal change; then app.transition = {tr: makeTransition(kind, app.now()), from}. With no kind nothing changes at all.
2. In `draw(ctx, t)`: keep the background fill; now = app.now(); dt = _lastDraw === null ? 0 : min(100, now - _lastDraw); _lastDraw = now; fxBegin(ctx, app.fx, now) before the scenes and fxEnd after the scenes (before toasts); define a private `drawStack(list)` that does the existing 'start at the top-most non-overlay scene' loop for any stack array. When app.transition is set and not done: call the matching draw function (drawStaticWipe for 'static', drawPageTurn for 'pageturn', else drawTransition) with drawFrom = () => drawStack(app.transition.from) and drawTo = () => drawStack(app.stack); when done set app.transition = null and draw normally. Then updateParticles(app.particles, dt) and drawParticles(ctx, app.particles) after the scenes, before the toasts. In `pointer` and `key`: return without doing anything while app.transition is set and not done. Everything else (toast code included) stays untouched in this card.
3. `tests/app_fx.test.mjs` (a mutable clock: `let n = 0; createApp({now: () => n})`; register two tiny fake scenes that record draw calls): without a transition option go('a') then draw calls scene a's draw once and no translate/clip; `app.push('b', null, {transition:'slide-left'})` followed by draw at n = 175 (u 0.5) calls a's draw and b's draw once each, with translate [-1120,0] and [160,0] seen in ctx.calls; at n = 400 (done) only b is drawn and app.transition is null; pointer('down',1,1) during the transition does not reach scene b (b.pointer never called) and after it does; `scene.enterTransition = 'fade'` on b is honoured when no opts are given; with app.settings.fx === false no transition starts; 'static' and 'pageturn' go through their draw functions (the ctx shows 32x32 fillRects for static at u 0.25; a scale call for pageturn); app.disaster() at n=0 then draw at n=0 contains a fillRect [-144,0,1568,720] with a red 'rgba(217,72,59,' fillStyle; app.burst('confetti', 100, 100, 5) then draw at n = 0 and again at n = 100 shows 5 confetti fillRects of height 6 both times; dt is capped (a draw 5000 ms later moves particles by at most 100 ms of physics); the existing tests/scenes.test.mjs passes unchanged.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/app_fx.test.mjs'` prints one line.
- `make test 2>&1 | grep 'PASS tests/scenes.test.mjs'` prints one line (all existing app tests stay green).
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Toasts, CRT, banner and HUD (GU23); any scene file.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU22: App wiring A: transitions, screen shake/flash and particles in createApp`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
