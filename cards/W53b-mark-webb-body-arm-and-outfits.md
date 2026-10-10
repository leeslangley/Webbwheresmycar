[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W53b Mark Webb body, arm and outfits

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W53b
Needs (already merged into `dev`): W53
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Second part of Mark: his jacketed body behind the desk, the tapping hand, two outfits, and the public `drawMark` function that puts head and body together.

## Read first
- docs/DESIGN.md section 5 and 7.3
- src/art/characters_mark.js (existing from W53: build on it, do not rewrite drawMarkHead)
- src/art/common.js (pulse)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.
- All coordinates below are LOCAL units (1 unit = 1 pixel at scale 1). The figure's origin (0,0) is the seat position at the bottom centre; negative y is UP. The head is drawn around (0,-132). The caller (the wrapper in a later card) does `ctx.translate(x,y); ctx.scale(s,s)`; this card's function does NOT translate or scale.

## Files you may change (and nothing else)
- `src/art/characters_mark.js`
- `tests/mark_body.test.mjs`

## Steps
1. Edit `src/art/characters_mark.js` (keep `drawMarkHead` exactly as it is). Add and export `drawMarkBody(ctx, t, outfit = 'denim')` and `drawMark(ctx, x, y, s, t, mood = 'normal', outfit = 'denim')`.
2. `drawMarkBody` (save/restore around it) draws, with `bob = Math.sin(t*1.6)*1.5`: shoulders and torso: a polygon filled with the jacket colour from (-52,-92+bob) via (-58,-60) and (-50,0) to (50,0), then (58,-60) and (52,-92+bob), closed with a curve across the top at y -96+bob (use `moveTo`/`lineTo`/`quadraticCurveTo`). Outfit 'denim': jacket `#232f4a`, tee `#f4e9c8`; outfit 'hoodie': jacket `#6a1f2b`, tee `#e8d44a`. Tee: a V-shaped panel in the middle: polygon (-14,-94+bob), (14,-94+bob), (0,-56+bob). Ringer neckline (denim only): stroke `#14102a`, width 3 along (-14,-94+bob) to (0,-84+bob) to (14,-94+bob). Collar: two small triangles in the jacket colour (shade 20% lighter) at the neck. Seam lines: strokes `rgba(0,0,0,0.3)` width 1.5 from (-30,-80) to (-34,-10) and (30,-80) to (34,-10). Hoodie only: a zip line from (0,-56+bob) to (0,0) stroke `#d9c6a0` width 2 and a drawstring pair of small lines at the neck.
3. Right arm resting on the desk: upper arm from the shoulder (46,-88+bob) to the elbow (74,-40) (stroke the jacket colour, lineWidth 22, lineCap round) then forearm from the elbow to the wrist at (100,-34); hand: ellipse at (108,-34 - tap) radii 11 and 7 colour `#f1c9a5` where `tap = Math.max(0, Math.sin(t*5)) * 3`; four short finger lines (stroke `#e2b88f`, width 2.5) fanning from the hand.
4. `drawMark(ctx, x, y, s, t, mood, outfit)`: `ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawMarkBody(ctx, t, outfit); drawMarkHead(ctx, t, mood); ctx.restore();`.
5. Write `tests/mark_body.test.mjs` (makeCtx, count, anySet): `drawMarkBody` runs for both outfits at t = 0, 1.3, 3.95 without throwing and save/restore balanced; denim assigns `#232f4a` and `#f4e9c8` to fillStyle and never `#6a1f2b`; hoodie assigns `#6a1f2b` and `#e8d44a` and never `#232f4a`; the two outfits give different call logs; body logs differ between t = 0 and t = 0.4 (breathing/tap); `drawMark(ctx, 640, 440, 1, 0)` makes the first `translate` call args `[640, 440]` and the first `scale` call args `[1, 1]`, and its log contains both the head skin colour `#f1c9a5` and the jacket colour; `drawMark(ctx, 0, 0, 2, 0)` has first scale args `[2, 2]`; moods change the output of `drawMark` (normal vs worried logs differ); unknown outfit names fall back to 'denim' (same log as denim).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `tests/mark_head.test.mjs` from W53 still passes unchanged.

## Out of scope (do not touch)
- No Dave, no speech bubble (other cards).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W53b: Mark Webb body, arm and outfits`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
