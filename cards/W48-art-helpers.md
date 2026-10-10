[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W48 Art helpers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W48
Needs (already merged into `dev`): W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Small drawing helpers shared by all the code-drawn art: rounded polygons, gradients, wheels, shadows, rust, smoke, and two animation timing helpers.

## Read first
- docs/ART_SPEC.md (rendering recipe)
- src/ui/theme.js (shade, rgba, PALETTE)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/common.js`
- `tests/art_common.test.mjs`

## Steps
1. Create `src/art/common.js`. `roundedPoly(ctx, pts, r)`: `pts` is an array of `[x,y]`, at least 3. Begin a path: `moveTo` the midpoint of the last and first point; then for each point i, `arcTo(p_i.x, p_i.y, mid(p_i, p_{i+1}).x, mid(p_i, p_{i+1}).y, r)`; then `closePath()`. It builds the path only (the caller fills/strokes). Throws `Error('roundedPoly: need 3 points')` otherwise.
2. `vgrad(ctx, y0, y1, top, bottom)`: `createLinearGradient(0, y0, 0, y1)`, `addColorStop(0, top)`, `addColorStop(1, bottom)`, returns it.
3. `circle(ctx, x, y, r)`: `beginPath(); arc(x, y, r, 0, Math.PI * 2)` (path only).
4. `wheel(ctx, cx, cy, r, t, dim = false)`: draw a tyre (`#15151a` circle radius r), a rim (`#c9ccd2` circle radius r*0.62), a hub (`#6a6e78` radius r*0.2); unless `dim`, five spokes: `moveTo/lineTo` lines from the hub to the rim edge at angles `t * 6 + k * 2 * Math.PI / 5`, strokeStyle `#8b8f99`, lineWidth r*0.08. When `dim` is true use `shade(...)` to darken all colours by 40% and skip spokes. Uses fill/stroke calls only.
5. `groundShadow(ctx, cx, cy, rx, ry, alpha = 0.35)`: ellipse filled with `rgba('#000000', alpha)` (use `ctx.ellipse`).
6. `rustBlotch(ctx, x, y, r)`: save; `globalAlpha = 0.55`; fill two overlapping circles of colour `#8a4b1f` (radius r and r*0.6 offset by r*0.4); restore.
7. `smokePuff(ctx, x, y, t, k = 1)`: three grey circles `rgba(160,160,160,0.5)` of radii `6k, 9k, 12k` at `x - 8k - i*10k`, `y - i*7k + Math.sin(t*2 + i) * 2k`.
8. `blink(t, period = 4, dur = 0.15)` returns true when `(t % period) >= period - dur`. `pulse(t, period)` returns `0.5 + 0.5 * Math.sin(2 * Math.PI * t / period)`.
9. Write `tests/art_common.test.mjs` with `makeCtx`: roundedPoly with 4 points calls `arcTo` 4 times, `moveTo` once, `closePath` once; with 2 points throws; the `moveTo` args are the midpoint of last and first; `vgrad` returns an object with 2 stops `[0,top]`, `[1,bottom]`; `circle` records one `arc`; `wheel` with dim false makes 5 `lineTo` calls for spokes, with dim true makes none, and always draws at least 3 `arc` calls; `groundShadow` calls `ellipse`; `rustBlotch` sets `globalAlpha` to 0.55 and uses `#8a4b1f`; smokePuff draws 3 arcs; `blink(3.9, 4, 0.15)` true, `blink(3.8, 4, 0.15)` false, `blink(7.95)` true; `pulse(0, 2)` is 0.5 (near) and `pulse(0.5, 2)` is 1 (near).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not create car or character drawing code (other cards).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W48: Art helpers`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
