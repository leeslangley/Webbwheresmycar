[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W53c Dave the mechanic

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W53c
Needs (already merged into `dev`): W48, W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark's sidekick, Dave 'Spanner' Dobbs: a stocky mechanic in overalls leaning on the garage door with a mug of tea.

## Read first
- docs/DESIGN.md section 5 and 7.3
- src/art/common.js (blink, pulse)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.
- All coordinates below are LOCAL units (1 unit = 1 pixel at scale 1). The figure's origin (0,0) is the seat position at the bottom centre; negative y is UP. Dave is about 210 high: his head is drawn around (0,-168). The caller (the wrapper in a later card) does `ctx.translate(x,y); ctx.scale(s,s)`; this card's function does NOT translate or scale.

## Files you may change (and nothing else)
- `src/art/characters_dave.js`
- `tests/dave.test.mjs`

## Steps
1. Create `src/art/characters_dave.js` exporting `drawDave(ctx, x, y, s, t)` (x,y = bottom centre of the figure; this function does the translate/scale itself: `ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(0.105);` (about 6 degrees lean, rotate AFTER scale) ... `ctx.restore();`). Imports `blink` from `./common.js`. Local drawing, in this order, with `bob = Math.sin(t*1.1) * 1.2`:
1. Legs: two rectangles `fillRect(-26,-70,22,70)` and `fillRect(4,-70,22,70)` colour `#2f5d9e`; boots `fillRect(-30,-8,28,8)` and `fillRect(2,-8,28,8)` colour `#222222`.
2. Torso (overalls): polygon (-36,-72), (36,-72), (32,-140+bob), (-32,-140+bob) colour `#2f5d9e`; bib: `fillRect(-18,-130+bob,36,40)` colour `#3a6fb5`; two straps as lines from (-18,-130+bob) to (-24,-146+bob) and (18,-130+bob) to (24,-146+bob), stroke `#2f5d9e` width 6; shirt sleeves showing at the sides: `fillRect(-46,-140+bob,12,36)` and `fillRect(34,-140+bob,12,36)` colour `#d9d2c0`; a grease smudge: ellipse at (-8,-100+bob) radii 7 and 4 colour `rgba(20,20,20,0.45)`.
3. Head (centre (0,-168+bob)): face ellipse radii 24 and 27 colour `#e8bf98`; flat cap: a half-ellipse (colour `#444444`) over the top plus a peak `fillRect(-4,-176+bob,34,6)`; big moustache: two ellipses at (-9,-158+bob) and (9,-158+bob) radii 11 and 5 colour `#5a3b24`; eyes: dark circles radius 2.2 at (-9,-170+bob) and (9,-170+bob), replaced by short lines when `blink(t, 3.3)`; nose: ellipse (0,-164+bob) radii 4 and 5 colour `#d8a67e`.
4. Mug held in the right hand: hand ellipse at (50,-110+bob) radii 8 and 7 colour `#e8bf98`; mug `fillRect(46,-134+bob,16,20)` colour `#e8e0cc` with a handle arc; three steam wisps: for i in 0..2 stroke `rgba(255,255,255,` + (0.5 - i*0.12) + `)` width 2 along a short wavy line going up from (54+i*5, -138+bob) with x offsets `Math.sin(t*2 + i)*3` at three heights.
2. Write `tests/dave.test.mjs` (makeCtx, count, anySet): runs for t = 0, 1.3, 3.2 without throwing and save/restore balanced; `rotate` is called once with an argument near 0.105 (use `near`); the first `translate` call args are `[x, y]` and the first `scale` call args `[s, s]` for `drawDave(ctx, 1000, 510, 1.5, 0)` (expect `[1000, 510]` and `[1.5, 1.5]`); overalls colour `#2f5d9e` and cap colour `#444444` are assigned; blink: the call log at t = 3.25 (blink true: `blink(3.25, 3.3)` is true) differs from t = 1; the log at t = 0 differs from t = 1.3 (steam and bob move); the moustache colour `#5a3b24` is assigned.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No Mark, no speech bubble.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W53c: Dave the mechanic`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
