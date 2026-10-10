[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W42 Canvas fit and pointer mapping

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W42
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Scale the fixed 1280x720 game canvas to any window (desktop or iPhone) with letterbox bars, and convert screen pointer coordinates back to game coordinates.

## Read first
- docs/DESIGN.md section 3 and 9.7 (ui/canvas.js)

## Files you may change (and nothing else)
- `src/ui/canvas.js`
- `tests/canvas.test.mjs`

## Steps
1. Create `src/ui/canvas.js`. Export `LOGICAL_W = 1280`, `LOGICAL_H = 720`.
2. `fitLayout(winW, winH)`: throws `RangeError` if either is <= 0. `scale = Math.min(winW / 1280, winH / 720)`; `viewW = 1280 * scale`; `viewH = 720 * scale`; `offX = (winW - viewW) / 2`; `offY = (winH - viewH) / 2`. Returns `{scale, offX, offY, viewW, viewH}`.
3. `toLogical(layout, clientX, clientY)`: `x = (clientX - offX) / scale`, `y = (clientY - offY) / scale`; return `{x, y}` or `null` when x < 0, x > 1280, y < 0 or y > 720.
4. `isPortrait(winW, winH)` = `winH > winW`.
5. `applyLayout(canvas, win)`: `win` has `innerWidth`, `innerHeight`, `devicePixelRatio`. `layout = fitLayout(innerWidth, innerHeight)`; `dpr = Math.min(3, win.devicePixelRatio || 1)`. Set `canvas.style.position = 'absolute'`, `canvas.style.left = offX + 'px'`, `canvas.style.top = offY + 'px'`, `canvas.style.width = viewW + 'px'`, `canvas.style.height = viewH + 'px'`, `canvas.width = Math.round(viewW * dpr)`, `canvas.height = Math.round(viewH * dpr)`. Get `ctx = canvas.getContext('2d')`, call `ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)`. Return `{layout, dpr, ctx}`.
6. Write `tests/canvas.test.mjs`: fitLayout(1280,720) -> scale 1, offsets 0; (2560,1440) -> scale 2; (1000,1000) -> scale 0.78125, viewH 562.5, offY 218.75, offX 0; (844,390) (iPhone landscape) -> scale 0.65937... check with `near` 1e-4 that scale equals 390/720 and offX is (844 - 1280*390/720)/2; (0,100) throws; toLogical at the centre of a letterboxed layout gives (640,360); a point inside the black bar gives null; isPortrait(390,844) true, (844,390) false, (500,500) false; applyLayout with fake canvas `{style:{}, getContext(){return fakeCtx}}` and a fake ctx that records `setTransform` args: for win 1280x720 dpr 2 -> canvas.width 2560, height 1440, setTransform args `[2,0,0,2,0,0]`; dpr 5 is capped at 3.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c 'document\|window\.' src/ui/canvas.js` prints `0`.

## Out of scope (do not touch)
- No DOM access other than the canvas object passed in.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W42: Canvas fit and pointer mapping`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
