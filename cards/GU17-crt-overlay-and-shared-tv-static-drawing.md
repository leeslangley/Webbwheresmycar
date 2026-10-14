[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU17 CRT overlay and shared TV-static drawing

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU17
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The CRT filter the Settings toggle promises (it exists only as a setting today): scanlines in ONE path, a vignette, a slow rolling brightness bar; plus one shared `drawStatic` for TV screens.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/art/props.js (`drawTvStatic`, the office TV; it stays as it is)
- src/ui/scenes/settings.js (the CRT toggle writes app.settings.crt)

## Files you may change (and nothing else)
- `src/ui/crt.js`
- `tests/crt.test.mjs`

## Steps
1. `src/ui/crt.js`. No DOM, no `Math.random`, no `Date`: time comes in as a `nowMs` argument, randomness from a seeded integer hash. Export `drawCrt(ctx, w, h, t, opts)`: opts {scan: 0.10, vignette: 0.45, sweep: true}. (1) scanlines: ctx.beginPath(); for (y = 0; y < h; y += 3) { moveTo(0, y+1); lineTo(w, y+1); } lineWidth 1; strokeStyle `rgba(0,0,0,${scan})`; ONE stroke call (for h 720 exactly 240 moveTo and 240 lineTo). (2) vignette: g = ctx.createRadialGradient(w/2, h/2, h*0.35, w/2, h/2, w*0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vignette})`); fillStyle g; fillRect(0, 0, w, h). (3) when sweep: yy = ((t*0.12) % 1)*(h+80) - 80; g2 = createLinearGradient(0, yy, 0, yy+80) with stops 0 'rgba(255,255,255,0)', 0.5 'rgba(255,255,255,0.04)', 1 'rgba(255,255,255,0)'; fillStyle g2; fillRect(0, yy, w, 80).
2. Export `staticLevel(i, j, frame, seed)` = ((Math.imul(i + 1, 73856093) ^ Math.imul(j + 1, 19349663) ^ Math.imul(frame + 1, 83492791) ^ Math.imul(seed + 1, 2654435761)) >>> 10) % 4. Export `STATIC_GREYS` = ['#101010','#505050','#A0A0A0','#F0F0F0']. Export `drawStatic(ctx, x, y, w, h, t, opts)`: opts {cell: 8, seed: 1, fps: 20}; frame = Math.floor(t*fps); cols = Math.ceil(w/cell), rows = Math.ceil(h/cell); for each cell fillStyle STATIC_GREYS[staticLevel(i,j,frame,seed)], fillRect(x + i*cell, y + j*cell, Math.min(cell, w - i*cell), Math.min(cell, h - j*cell)) (cells at the edge are cut so nothing leaves the rectangle). Return cols*rows.
3. `tests/crt.test.mjs`: drawCrt(ctx,1280,720,0) -> exactly 240 `moveTo` and 240 `lineTo`, exactly one `stroke`, strokeStyle 'rgba(0,0,0,0.1)'; createRadialGradient args [640,360,252,640,360,960] with stops [[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,0.45)']]; exactly two fillRects: the vignette [0,0,1280,720] and the sweep [0,yy,1280,80] with yy = -80 at t=0; at t=1/0.12 (a full cycle) yy is again -80 within 1e-6; with {sweep:false} only 1 fillRect; with {scan:0.2} strokeStyle 'rgba(0,0,0,0.2)'. staticLevel returns 0..3 for 1000 cells and all four values occur; same arguments same value; a different frame changes at least 50 of 100 cells. drawStatic(ctx,10,20,278,206,0,{cell:8}) returns 35*26 = 910, makes 910 fillRects, the last cell is cut: width 278-34*8 = 6 and height 206-25*8 = 6; no fillRect leaves [10,288] x [20,226]; at t = 0.04 (frame 0) and t = 0.06 (frame 1) the fillStyle sequences differ.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/crt.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/art/props.js, settings.js (wiring is GU23).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU17: CRT overlay and shared TV-static drawing`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
