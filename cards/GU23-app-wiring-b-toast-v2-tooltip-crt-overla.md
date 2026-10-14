[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU23 App wiring B: toast v2, tooltip, CRT overlay and safe insets in createApp

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU23
Needs (already merged into `dev`): GU17, GU18, GU21, GU22, WD03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Finish the app shell: toasts get an icon, slide-in and fade-out (same place on screen when settled); a tooltip slot; the CRT filter really turns on when the setting is on; `app.safe` exists with zero defaults.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/scenes.js and tests/scenes.test.mjs (the toast tests are at the end of the file)
- src/ui/overlays.js (GU18)
- src/ui/crt.js (GU17)
- src/ui/safearea.js (WD03: viewInsets, safeRect)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/scenes.js`
- `tests/scenes.test.mjs`
- `tests/app_overlays.test.mjs`

## Steps
1. In `src/ui/scenes.js`: `toast(text, ms, kind)`: push {text, until: now + dur, born: now, kind} (the old fields `text` and `until` keep their exact meaning, so `app.toasts[0].until` is still now + 2500 by default). In draw replace the toast loop by `drawToast2(ctx, live[i], nowMs, i, panel)` (import panel from './kit_draw.js'; drawToast2 from './overlays.js'). Add `safe: {top:0, right:0, bottom:0, left:0}` to the app object. Add `tooltip: makeTooltip()` and a method `hover(id, text, x, y)` that calls ttHover and stores {text, x, y} in app._tip (or clears it when id is null); at the end of draw (after toasts) when ttVisible(app.tooltip, now) and app._tip: drawTooltip(ctx, app._tip.text, app._tip.x, app._tip.y). Last of all in draw: when app.settings.crt === true call drawCrt(ctx, app.w, app.h, t).
2. Update the ONE existing test in `tests/scenes.test.mjs` named 'toast panel is 560 wide centred horizontally near y 640': the toast now slides in, so draw it settled: use `let n = 0; const app = createApp({now: () => n}); app.toast('hi'); n = 1000; ... app.draw(ctx, 0)` and keep the moveTo(370, 640) assertion. Change nothing else in that file. Then `tests/app_overlays.test.mjs`: app.toast('x') gives toasts[0] with keys text, until, born, kind (kind undefined) and until === now + 2500; app.toast('x', 500, 'good') has kind 'good'; a 'good' toast draws tick icon fillRects; at now = born the toast is drawn 40px lower (the panel path starts at moveTo(370, 680)) with globalAlpha 0 set; expired toasts are removed exactly as before; `app.safe` equals {top:0,right:0,bottom:0,left:0}; app.hover('btn','Buy it',640,300) then draw at now 0: no tooltip text; draw at now 400: 'Buy it' is drawn; app.hover(null) clears it; settings.crt true adds exactly one `stroke` from the CRT scanline path with strokeStyle 'rgba(0,0,0,0.1)' as the last stroke and false adds none; the other tests in scenes.test.mjs still pass.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/app_overlays.test.mjs'` prints one line.
- `make test 2>&1 | grep 'PASS tests/scenes.test.mjs'` prints one line.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Any scene file; the banner and HUD strip are drawn by scenes themselves (GU24), not by the app.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU23: App wiring B: toast v2, tooltip, CRT overlay and safe insets in createApp`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
