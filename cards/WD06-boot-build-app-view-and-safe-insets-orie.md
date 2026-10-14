[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD06 Boot: build app.view and safe insets, orientation re-fit, DESIGN.md

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD06
Needs (already merged into `dev`): WD01, WD02, WD03, W68d, GE24, CC10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Connect the new layout to the running game in the browser and the iPhone WKWebView: after every layout (start, resize, orientation change) `app.view` (and `app.safe`, the same object as `app.view.safe`) is refreshed IN PLACE, the canvas is handed to the app for strip filling, and iOS gets a second re-fit 250 ms after rotation (innerWidth is stale during the rotation event). Pointer code needs NO change: `toLogical` already returns stage coordinates. ORDER: after W68d (it rewrites boot.js). boot.js is also edited by GE24 and CC10; the `needs` fix the order W68d, GE24, CC10, WD06, WD14 (one at a time, each edit is local). WD05 may merge before or after this card.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/boot.js (as changed by W68d, and CC10 / GE24 when merged): `applyLayout`, `layoutInfo`, `reapply`, `createApp`, `onPointer`
- tests/boot.test.mjs (copy its helpers `makeWindow`, `makeCanvas`, `makeDocument`, `makeEvent` into the new test file; do NOT edit boot.test.mjs)
- src/ui/view.js (WD02) and src/ui/safearea.js (WD03)
- docs/DESIGN.md lines 28, 345 and 357

## Files you may change (and nothing else)
- `src/boot.js`
- `tests/boot_view.test.mjs`
- `docs/DESIGN.md`

## Steps
1. `src/boot.js`: import `{ defaultView, makeView, setView }` from './ui/view.js' and `{ viewInsets, readCssInsets }` from './ui/safearea.js'. Near the top of `bootGame` add `let appRef = null;` and `function currentView() { return makeView(layoutInfo.layout, layoutInfo.dpr, viewInsets(layoutInfo.layout, readCssInsets(win, doc))); }`. Inside `reapply()`, right after `layoutInfo = applyLayout(canvas, win);`, add `if (appRef) { setView(appRef.view, currentView()); }`. Right after the app object exists (after the `createApp(...)` or `createGame(...)` call W68d uses; `createGame` returns an app built by `createApp`) add: `appRef = app; if (!app.view) { app.view = defaultView(); } app.canvas = canvas; setView(app.view, currentView()); app.safe = app.view.safe;`. Leave the pointer handlers, `toLogical` use, key handler and everything else exactly as they are.
2. Still in boot.js: the existing `win.addEventListener('orientationchange', reapply);` becomes `win.addEventListener('orientationchange', function () { reapply(); if (typeof win.setTimeout === 'function') { win.setTimeout(reapply, 250); } });` (the fake window in the tests has no setTimeout, so the guard matters).
3. `docs/DESIGN.md` three edits. Line 28 `- Logical canvas 1280x720 (16:9), always scaled to fit with letterbox bars. Landscape only; portrait shows a "turn your phone sideways" card.` becomes `- Logical canvas 720 high and 1280 to 1568 wide (the device aspect: 16:9 desktop and iPad letterbox top and bottom, a 19.5:9 iPhone fills the whole screen). A 1280x720 STAGE sits in the middle; every control and all text live on the stage, the strips either side only show background art. Landscape only; portrait shows a "turn your phone sideways" card.` Line 345 `ui/canvas.js:   LOGICAL_W=1280  LOGICAL_H=720  fitLayout(winW,winH)->{scale,offX,offY,viewW,viewH}` becomes `ui/canvas.js:   LOGICAL_W=1280 (stage)  LOGICAL_H=720  fitLayout(winW,winH)->{scale,offX,offY,viewW,viewH,fullW,fullH,stageX,stageW}  toLogical -> STAGE coords (x < 0 or > 1280 = a strip)  ui/view.js: app.view`. Line 357: after `audio:{play(name)}` add `, view:{fullW,fullH,stageX,stageW,dx,left,right,wide,safe}, safe` and add one sentence after the line: `w and h stay 1280 and 720 (the stage); scenes never read fullW except to draw background art into the strips.`
4. `tests/boot_view.test.mjs` with the copied helpers (`makeWindow` gains an optional third parameter `dpr` and a `getComputedStyle` field set by the test). Phone: window 852x393, dpr 3, `getComputedStyle = () => ({getPropertyValue: (n) => ({'--sai-b':'21px','--sai-l':'59px','--sai-r':'59px'})[n] || ''})`, `documentElement: {}` on the doc: after `bootGame` `app.view.fullW` is 1564, `stageX` 142, `wide` true, `safe.left` 0, `safe.bottom` near 38.4733 (1e-3), `app.safe === app.view.safe`, `app.canvas === canvas`, and `parseFloat(canvas.style.height)` is near 393 (1e-6). Resize: remember `const v = boot.app.view;` set `win.innerWidth = 1280; win.innerHeight = 720;` call every `win.handlers.resize` function: `boot.app.view === v`, `v.fullW` 1280, `v.wide` false, `v.safe === boot.app.safe`. Orientation: a window with a `setTimeout` recorder: dispatching `orientationchange` records exactly one timer with delay 250 and calling its function re-fits; a window without setTimeout does not throw. Pointer (register a spy scene `{id:'spy', pointer(app,type,x,y){log.push([type,x,y]);}}` and `app.go('spy')`): window 1560x720 dpr 1: pointerdown at client (140,360) logs ['down',0,360]; at (100,360) logs x -40; at (1500,360) logs x 1360; window 1280x720: client (100,360) logs x 100; window 2560x1080 (bars of 104 css px): client (50,500) logs nothing (null).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/boot_view.test.mjs'` prints one line.
- `make test 2>&1 | grep 'PASS tests/boot.test.mjs'` prints one line (existing boot tests unchanged).
- `grep -c 'Logical canvas 720 high' docs/DESIGN.md` prints 1.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/scenes.js (WD05); index.html and safearea.js (WD03); any scene.
- boot code owned by other cards: only the lines named above change.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD06: Boot: build app.view and safe insets, orientation re-fit, DESIGN.md`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
