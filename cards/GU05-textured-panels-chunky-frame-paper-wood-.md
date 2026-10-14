[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU05 Textured panels: chunky frame, paper, wood plank, enamel sign

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU05
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The panel recipes of the new look: pixel-stepped corners, 3px ink edge, hard drop shadow, top-left highlight and bottom-right shade, then a material on top (paper grain, wood planks with grain streaks, enamel sign with rivets and gloss). Pure fillRect recipes with exact coordinates so tests can check them.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/panels2.js`
- `tests/panels2.test.mjs`

## Steps
1. `src/ui/panels2.js` imports `COLOR` from './tokens.js'. Export `chunkyRect(ctx, x, y, w, h, fill, cut = 3)`: set `ctx.fillStyle = fill` once, then exactly three fillRects in this order: (x+cut, y, w-2*cut, h), (x, y+cut, w, h-2*cut), (x+1, y+1, w-2, h-2). Export `chunkyPanel(ctx, x, y, w, h, opts)`: opts {fill: COLOR.paper, edge: COLOR.ink, bw: 3, cut: 3, shadow: 4, hi: true}. Order: (1) when shadow > 0: chunkyRect(x+shadow, y+shadow, w, h, 'rgba(0,0,0,0.35)', cut); (2) chunkyRect(x, y, w, h, edge, cut); (3) chunkyRect(x+bw, y+bw, w-2*bw, h-2*bw, fill, Math.max(1, cut-1)); (4) when hi: fillStyle 'rgba(255,255,255,0.35)' then fillRect(x+bw+cut, y+bw, w-2*bw-2*cut, 2) and fillRect(x+bw, y+bw+cut, 2, h-2*bw-2*cut); fillStyle 'rgba(0,0,0,0.22)' then fillRect(x+bw+cut, y+h-bw-2, w-2*bw-2*cut, 2) and fillRect(x+w-bw-2, y+bw+cut, 2, h-2*bw-2*cut). Return the content rect {x: x+bw+4, y: y+bw+4, w: w-2*(bw+4), h: h-2*(bw+4)}.
2. Export `grain(ctx, x, y, w, h, color, density, seed)`: n = Math.floor(w*h*density); s = seed >>> 0; fillStyle = color once; repeat n times: s = (Math.imul(s, 1664525) + 1013904223) >>> 0; px = x + (s % (w-2)); s = (Math.imul(s, 1664525) + 1013904223) >>> 0; py = y + (s % (h-2)); ctx.fillRect(px, py, 2, 2). Export `paperPanel(ctx, x, y, w, h, opts)`: chunkyPanel with fill COLOR.paper (opts may override fill, edge, shadow); then grain over the returned content rect with color 'rgba(20,16,42,0.06)', density 1/500, seed ((x*31 + y*17) & 0xffff); return the content rect.
3. Export `woodPanel(ctx, x, y, w, h, opts)`: chunkyPanel with fill COLOR.wood; then with the content rect c: planks = Math.ceil(c.h/28); for k = 1..Math.floor((c.h-1)/28): fillStyle COLOR.woodDark, fillRect(c.x, c.y + 28*k, c.w, 2); for every plank p in 0..planks-1 and j in 0..2: sx = hash from (p*7+j+1) using the same LCG as grain (one step from seed p*7+j+1), fillStyle COLOR.woodGrain, fillRect(c.x + (sx % (c.w-40)), c.y + 28*p + 6 + j*8, 24 + (sx % 32), 1). Require c.w > 40 (else skip the streaks). Return c. Export `enamelSign(ctx, x, y, w, h, opts)`: opts {color: COLOR.enamelRed, text: null, textColor: '#FFFFFF'}: chunkyPanel with fill = color; a cream keyline '#F4E9C8' as four 2px fillRects inset 10 (top (x+10,y+10,w-20,2), bottom (x+10,y+h-12,w-20,2), left (x+10,y+10,2,h-20), right (x+w-12,y+10,2,h-20)); four rivets as `ctx.arc(cx, cy, 2.5, 0, Math.PI*2)` + fill with COLOR.rivet at (x+7,y+7), (x+w-7,y+7), (x+7,y+h-7), (x+w-7,y+h-7); a gloss polygon filled 'rgba(255,255,255,0.12)': moveTo (x+bw,y+bw), lineTo (x+w*0.55,y+bw), lineTo (x+w*0.25,y+h-bw), lineTo (x+bw,y+h-bw), closePath, fill (bw = 3). When opts.text is set: font '16px "Press Start 2P", monospace', textAlign 'center', textBaseline 'middle', fillStyle textColor, fillText at (x+w/2, y+h/2). Return the content rect.
4. `tests/panels2.test.mjs`: chunkyRect(ctx,10,10,100,50,'#f00',3) -> exactly 3 fillRect calls equal to [13,10,94,50], [10,13,100,44], [11,11,98,48] in that order; chunkyPanel(ctx,10,20,100,60) -> 13 fillRect calls in total, the first is [17,24,94,60] (the shadow), and it returns {x:17,y:27,w:86,h:46}; with {shadow:0} 10 calls; grain(ctx,0,0,200,90,'#000',1/600,5) -> exactly 30 fillRect calls, each [px,py,2,2] with 0<=px<=198, 0<=py<=88, and calling it twice gives identical call lists; paperPanel(ctx,10,20,100,60) -> 13 + Math.floor(86*46/500) = 20 fillRects; woodPanel(ctx,10,20,100,100) -> chunkyPanel's 13 + 3 plank lines (h 86 -> floor(85/28)) + 12 streaks = 28 fillRects, and the plank lines are the fillRects with fillStyle COLOR.woodDark; enamelSign(ctx,0,0,200,80,{text:'GARAGE'}) -> exactly 4 `arc` calls, one fillText 'GARAGE' at (100,40), a closePath; for each of the four panels every fillRect and arc lies inside [x-1, x+w+5] x [y-1, y+h+5] (the 4px shadow is the farthest thing drawn).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/panels2.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/kit_draw.js (GU21 wires the panels in).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU05: Textured panels: chunky frame, paper, wood plank, enamel sign`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
