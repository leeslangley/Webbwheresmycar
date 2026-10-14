[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU20 iPhone safe areas: logical insets and boot hookup

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU20
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the 1280x720 canvas respect notches and the home indicator: CSS `env(safe-area-inset-*)` -> logical-pixel insets after the letterbox is taken into account, published as `app.safe`, plus a physical-size helper for the text-size audit.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/canvas.js (`fitLayout(winW, winH)` -> {scale, offX, offY, viewW, viewH}; `LOGICAL_W/H`)
- src/boot.js (`bootGame`, `reapply`) and tests/boot.test.mjs (its fake window and document: they have NO getComputedStyle, so every new call must be guarded)
- index.html (already has viewport-fit=cover)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/safearea.js`
- `src/boot.js`
- `index.html`
- `tests/safearea.test.mjs`

## Steps
1. `src/ui/safearea.js` imports fitLayout, LOGICAL_W, LOGICAL_H from './canvas.js'. Export `logicalInsets(winW, winH, css)`: css = {top, right, bottom, left} in CSS pixels (missing -> 0). layout = fitLayout(winW, winH); each side: logical = Math.max(0, cssInset - letterboxOnThatSide)/layout.scale where the letterbox is offX for left and right and offY for top and bottom; return {top, right, bottom, left} (numbers, 0 when none). Export `safeRect(insets)` -> {x: left, y: top, w: 1280 - left - right, h: 720 - top - bottom}. Export `physicalPx(px, scale)` = px*scale (CSS px of a logical size) and `minLogicalPx(cssMin, scale)` = Math.ceil(cssMin/scale).
2. `index.html`: inside the existing `<style>` add `:root { --sai-t: env(safe-area-inset-top, 0px); --sai-r: env(safe-area-inset-right, 0px); --sai-b: env(safe-area-inset-bottom, 0px); --sai-l: env(safe-area-inset-left, 0px); }`. `src/boot.js`: add a function `readCssInsets(win, doc)` that, only when `typeof win.getComputedStyle === 'function'` and `doc.documentElement` exists, reads the four custom properties with `getPropertyValue('--sai-t')` etc. and parseFloat (NaN -> 0), else returns all zeros; after `createApp` and inside `reapply()` set `app.safe = logicalInsets(win.innerWidth, win.innerHeight, readCssInsets(win, doc))` (app is created after the first reapply: set it right after createApp too). Do not change anything else in boot.js.
3. `tests/safearea.test.mjs`: iPhone landscape 852x393 with css {top:0,right:59,bottom:21,left:59}: layout scale 393/720 = 0.5458333, viewW 698.67, offX 76.67; left/right insets are 0 (59 < 76.67) and bottom is 21/0.5458333 = 38.4733 (within 1e-3), top 0; a window 667x375 with all css 0 gives all zeros; a 1280x720 window with css {top:20,...:0} gives top 20; a window with no letterbox 1280x720 and left 50 gives left 50; missing css keys count as 0; safeRect({top:0,right:0,bottom:38.4733,left:0}) is {x:0,y:0,w:1280,h:681.5267} within 1e-3; physicalPx(22, 0.5458333) is 12.0083 within 1e-3; minLogicalPx(12, 0.5458333) is 22 and minLogicalPx(9, 0.5458333) is 17. Boot: in tests/boot.test.mjs style (do NOT edit that file; write one new test inside tests/safearea.test.mjs that imports bootGame and builds the fake window/canvas/document like boot.test.mjs does by copying its helper functions) check that after bootGame the returned app has `safe` with the four zero fields, and that adding `win.getComputedStyle = () => ({ getPropertyValue: (n) => n === '--sai-b' ? '21px' : '0px' })` and `documentElement: {}` on the fake doc gives safe.bottom close to 38.47 for innerWidth 852 and innerHeight 393 (fake devicePixelRatio 1).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/safearea.test.mjs'` prints one line.
- `make test 2>&1 | grep 'PASS tests/boot.test.mjs'` prints one line (existing boot tests stay green).
- `grep -c 'safe-area-inset' index.html` prints 4.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Any scene (they read app.safe in wave 2); src/ui/canvas.js.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU20: iPhone safe areas: logical insets and boot hookup`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
