[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W50c Car drawer wear: rust and smoke

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W50c
Needs (already merged into `dev`): W50b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Last third of the car drawer: poor condition shows on the car (rust patches and an exhaust smoke puff).

## Read first
- docs/ART_SPEC.md (rendering recipe, step 7)
- src/art/cardraw.js (existing from W50 and W50b: build on it)
- src/art/common.js (rustBlotch, smokePuff)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/cardraw.js`
- `tests/cardraw_wear.test.mjs`

## Steps
1. Edit `src/art/cardraw.js` (import `rustBlotch` and `smokePuff` from `./common.js`; keep all existing behaviour and exports). In `drawCar`, just BEFORE the final `ctx.restore()` (inside the car-unit coordinate system) add: `if (o.cond < 4) { rustBlotch(ctx, -30, 12, 2.2); rustBlotch(ctx, 4, 9, 1.8); rustBlotch(ctx, 32, 13, 2.0); }` and `if (o.cond < 2) { smokePuff(ctx, p.tail.x - 2, p.tail.y - 6, o.t, 0.18); }` (the smoke size factor 0.18 is in car units).
2. Write `tests/cardraw_wear.test.mjs` (makeCtx, anySet, count): for EVERY archetype: with `cond: 10` the colour `#8a4b1f` is never assigned to fillStyle; with `cond: 3` it is assigned (rust) and the smoke colour `rgba(160,160,160,0.5)` is NOT assigned; with `cond: 1` both are assigned; with `cond: 4` neither is assigned (boundary: 4 is not poor); with `cond: 2` rust yes, smoke no (boundary: smoke needs cond below 2); `count(ctx,'arc')` for `cond: 1` is larger than for `cond: 10` (rust circles and smoke circles add arcs); save/restore stay balanced at every condition; drawing at `t = 0` and `t = 1` with `cond: 1` gives different call logs (the smoke wobbles).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `tests/cardraw.test.mjs` and `tests/cardraw_finish.test.mjs` still pass.

## Out of scope (do not touch)
- Do not change the shapes, wheels or finish code (only add the two wear blocks).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W50c: Car drawer wear: rust and smoke`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
