[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU16 Screen transitions B: TV-static wipe and newspaper page-turn

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU16
Needs (already merged into `dev`): GU15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two more transitions: the TV-static wipe (for the Webb TV shop) and the page-turn (for the newspaper), as pure draw functions with the same (ctx, tr, nowMs, drawFrom, drawTo) signature as GU15.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/transitions.js (GU15: makeTransition, transProgress)

## Files you may change (and nothing else)
- `src/ui/transitions2.js`
- `tests/transitions2.test.mjs`

## Steps
1. `src/ui/transitions2.js` imports transProgress from './transitions.js' and EASE from './tokens.js'. Export `staticCells(cols, rows, coverage, frame)` -> array of {i, j, level}: for j in 0..rows-1 and i in 0..cols-1 compute hash h = (Math.imul(i + 1, 73856093) ^ Math.imul(j + 1, 19349663) ^ Math.imul(frame + 1, 83492791)) >>> 0; the cell is included when (h % 1000)/1000 < coverage; level = (h >>> 10) % 4. Export `STATIC_COLORS` = ['#101010','#505050','#A0A0A0','#F0F0F0'].
2. Export `drawStaticWipe(ctx, tr, nowMs, drawFrom, drawTo, w = 1280, h = 720)`: u = transProgress; u >= 1 -> drawTo() only. Else draw the scene (drawFrom when u < 0.5, else drawTo), then the static: coverage = 1 - Math.abs(2*u - 1) (0 at the ends, 1 in the middle), frame = Math.floor(nowMs/50); cells = staticCells(Math.ceil(w / 32), 23, coverage, frame) (32px cells: 1280/32 = 40 columns at the default w, 720/32 = 22.5 -> 23 rows; the app passes the full canvas width on a wide phone screen, docs/art/WD.md); for each cell fillStyle STATIC_COLORS[level], fillRect(i*32, j*32, 32, 32). Export `drawPageTurn(ctx, tr, nowMs, drawFrom, drawTo, w = 1280, h = 720)`: u >= 1 -> drawTo() only. Else drawTo() first (underneath); e = EASE.inOutQuad(u); sx = 1 - e; save; beginPath; rect(0, 0, w, h); clip; scale(sx, 1); drawFrom(); restore (the old page squashes toward the left spine); then the page-edge shadow: edgeX = sx*w; fillStyle `rgba(0,0,0,${(0.3*(1-u)).toFixed(3)})`, fillRect(edgeX, 0, 24, h); and a light edge fillStyle 'rgba(255,247,220,0.8)', fillRect(edgeX - 3, 0, 3, h).
3. `tests/transitions2.test.mjs`: staticCells(40,23,0,5) is empty; staticCells(40,23,1,5) has all 920 cells (every (h % 1000)/1000 < 1) and every level is 0..3; same arguments twice give identical arrays; coverage 0.5 gives between 400 and 520 cells (statistical: 920*0.5=460); a different frame gives a different cell list. drawStaticWipe at u 0.5 (tr = {kind:'static', start:0, dur:400}, nowMs 200): drawFrom is NOT called (u < 0.5 is false at exactly 0.5, so drawTo is called), exactly 920 fillRects of size [32,32] with colours in STATIC_COLORS; at u 0.25: drawFrom called once, drawTo not, and the number of 32x32 fillRects is between 380 and 540 (coverage 0.5); at u 0 no static fillRect at all; u >= 1 only drawTo; with w = 1560 (explicit last arguments 1560, 720) at u 0.5 there are exactly 49 * 23 = 1127 fillRects of size [32,32]. drawPageTurn at u 0.5 (e 0.5, sx 0.5): drawTo then drawFrom each once, exactly one scale call [0.5, 1], the shadow fillRect [640, 0, 24, 720] with fillStyle 'rgba(0,0,0,0.150)', the light edge fillRect [637,0,3,720]; at u 0.1 sx = 1 - inOutQuad(0.1) = 1 - 0.02 = 0.98 (assert the scale arg within 1e-9); u >= 1 only drawTo with no scale call.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/transitions2.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Wiring into the app (GU22) and the news scene.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU16: Screen transitions B: TV-static wipe and newspaper page-turn`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
