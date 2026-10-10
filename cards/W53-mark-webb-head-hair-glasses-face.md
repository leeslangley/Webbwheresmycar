[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W53 Mark Webb head: hair, glasses, face

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W53
Needs (already merged into `dev`): W48, W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First part of the hero character: Mark Webb's head. He is an affectionate cartoon caricature of Lee's friend: big tousled wavy light-brown hair, round dark-rimmed glasses, light stubble, wide surprised eyes, lopsided half-smile.

## Read first
- docs/DESIGN.md section 5 and 7.3 (Mark's look)
- src/art/common.js (blink, circle, pulse)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.
- All coordinates below are LOCAL units (1 unit = 1 pixel at scale 1). The figure's origin (0,0) is the seat position at the bottom centre; negative y is UP. The head is drawn around (0,-132). The caller (the wrapper in a later card) does `ctx.translate(x,y); ctx.scale(s,s)`; this card's function does NOT translate or scale.

## Files you may change (and nothing else)
- `src/art/characters_mark.js`
- `tests/mark_head.test.mjs`

## Steps
1. Create `src/art/characters_mark.js` exporting `drawMarkHead(ctx, t, mood = 'normal')` (imports `blink`, `circle` from `./common.js`). It draws, in this order (use `ctx.save()` at the start and `ctx.restore()` at the end):
1. Neck: `fillRect(-9, -108, 18, 16)` colour `#e2b88f`.
2. Ears: filled ellipses (`ctx.ellipse`) at (-26,-130) and (26,-130), radii 5 and 8, colour `#f1c9a5`.
3. Face: ellipse at (0,-132), radii 26 and 31, colour `#f1c9a5`.
4. Stubble: 14 tiny circles (radius 0.8, colour `rgba(60,40,30,0.35)`) at x = -16 + i*2.4 (i = 0..13), y = -104 + Math.abs(Math.sin(i*1.7))*5.
5. Hair (colour `#8a6a46`): filled circles at these (x, y, r): (-24,-150,10), (-14,-160,11), (0,-165,12), (14,-160,11), (24,-150,10), (-28,-138,8), (28,-138,8), (-8,-170,8), (10,-171,8), (-2,-152,9); then 6 darker strand arcs (colour `#5a3b24`, stroke width 2, no fill) at (-18,-158,r6), (-6,-166,r7), (8,-166,r6), (18,-156,r6), (-26,-146,r5), (26,-146,r5), each an `arc` from angle 3.6 to 5.4.
6. Eyes: white circles (`#ffffff`) of radius 4.2 at (-11,-132) and (11,-132). Pupils: dark circles (`#1a1a22`) of radius 2 at x offset `Math.sin(t*0.7)*1.5` from each eye centre. When `blink(t, 4)` is true instead draw each eye as a short horizontal line (stroke `#1a1a22`, width 2) from x-4 to x+4 at y -132 and NO white/pupil circles.
7. Glasses: stroke `#1a1a22`, lineWidth 2.6, no fill: circles of radius 9.5 at (-11,-132) and (11,-132); bridge line (-1.5,-133) to (1.5,-133); two arm lines from (-20.5,-132) to (-26,-131) and (20.5,-132) to (26,-131). Lens glint: white arcs (`rgba(255,255,255,0.7)`, lineWidth 1.2) of radius 6 from angle 3.6 to 4.4 centred on each lens.
8. Eyebrows (stroke `#5a3b24`, width 2.2): 'normal' = arched and raised: quadratic curve from (-19,-146) via (-11,-152) to (-3,-146) and mirrored on the right; 'worried' = inner ends raised: lines (-19,-143) to (-4,-149) and (19,-143) to (4,-149); 'happy' = low gentle arc: (-19,-143) via (-11,-146) to (-3,-143) and mirrored.
9. Nose: stroke `#c9996f`, width 1.6: line (0,-130) to (2,-122) then (2,-122) to (-1,-121).
10. Mouth (stroke `#8a3b2b`, width 2): 'normal' = lopsided half-smile: quadraticCurveTo from (-8,-111) control (2,-106) to (9,-114); 'happy' = wide smile: from (-11,-112) control (0,-100) to (11,-112) plus fill of the lower lens shape `#ffffff`; 'worried' = small flat line (-6,-110) to (6,-111).
2. Write `tests/mark_head.test.mjs` (makeCtx, count, anySet, reset): for each mood in normal, happy, worried at t = 0 and t = 2 no throw and `count(ctx,'save') === count(ctx,'restore')`; at least 20 `arc`/`ellipse` calls in total; skin colour `#f1c9a5` is assigned to fillStyle; glasses colour `#1a1a22` is assigned to strokeStyle with lineWidth 2.6 (`anySet(ctx,'lineWidth',2.6)`); blink: at t = 3.95 the white eye fill `#ffffff` is NOT assigned to fillStyle, while at t = 1 it is; moods differ: the call logs (JSON.stringify of `ctx.calls`) of normal vs worried vs happy at the same t are pairwise different; the logs at t = 0 and t = 2 differ (pupils move) for the same mood.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No body, no translate/scale, no `drawMark` wrapper (cards W53b and W53e). Do not edit other files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W53: Mark Webb head: hair, glasses, face`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
