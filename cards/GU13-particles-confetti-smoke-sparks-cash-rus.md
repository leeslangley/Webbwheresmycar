[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU13 Particles: confetti, smoke, sparks, cash, rust flakes

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU13
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A deterministic particle engine with five kinds from a data table, for endgame confetti, exhaust smoke, breakdown sparks, cash showers on sales and rust flakes on faults.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/art/common.js (`smokePuff`, for the existing smoke look)

## Files you may change (and nothing else)
- `src/ui/particles.js`
- `tests/particles.test.mjs`

## Steps
1. `src/ui/particles.js`. No DOM, no `Math.random`, no `Date`: time comes in as a `nowMs` argument, randomness from a seeded integer hash. Private seeded generator: `next(ps)` = mulberry32-style on ps.seed using Math.imul (`ps.seed = (ps.seed + 0x6D2B79F5) | 0; let z = Math.imul(ps.seed ^ (ps.seed >>> 15), 1 | ps.seed); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296`) and `rr(ps, lo, hi)` = lo + (hi-lo)*next(ps). Export `makeParticles(seed = 1)` -> {seed, list: []} and `liveCount(ps)` = ps.list.length. Export const `MAX_PARTICLES` = 300. Export `KINDS`: confetti {colors:['#E8B923','#D9483B','#3FAE49','#70A4B2','#6F3D86','#FFFFFF'], life:[1800,2600], vx:[-160,160], vy:[-420,-180], g:420}; smoke {life:[1200,1900], vx:[-14,14], vy:[-70,-30], g:-6, r0:6, r1:22}; sparks {colors:['#FFD27A','#FFFFFF'], life:[300,550], speed:[200,420], g:600}; cash {life:[1100,1600], vx:[-90,90], vy:[-380,-220], g:700}; rust {colors:['#8A4B26','#5A2E14'], life:[900,1400], vx:[-50,50], vy:[-80,0], g:500}.
2. Export `emit(ps, kind, x, y, n)`: for each of n: stop silently when liveCount >= MAX_PARTICLES; draw random numbers IN THIS ORDER: life, then (sparks: angle = rr(0, 2*PI) and speed, vx = cos*speed, vy = sin*speed; others: vx then vy), then colour index (kinds with colors; floor(next*len)), then a phase = rr(0, 6.28); push {kind, x, y, vx, vy, age:0, life, color, phase}. Export `updateParticles(ps, dtMs)`: for every particle age += dtMs; vy += g*dtMs/1000; x += vx*dtMs/1000; y += vy*dtMs/1000; then remove those with age >= life (stable order). Export `drawParticles(ctx, ps)`: u = age/life. confetti: w = 2 + 4*Math.abs(Math.cos(age*0.02 + phase)); fillStyle color; fillRect(x, y, w, 6) (one fillRect). smoke: radius = r0 + (r1-r0)*u; fillStyle `rgba(200,200,210,${(0.5*(1-u)).toFixed(3)})`; beginPath, arc(x, y, radius, 0, 2*PI), fill (one arc + one fill). sparks: fillStyle color; fillRect(x, y, 3, 3). cash: fillStyle '#14102A', fillRect(x-4, y-4, 8, 8); fillStyle '#E8B923', fillRect(x-3, y-3, 6, 6) (two fillRects). rust: fillStyle color; fillRect(x, y, 4, 4). Alpha for confetti/sparks/cash/rust: when u > 0.8 wrap that particle in save, globalAlpha = (1-u)/0.2, restore.
3. `tests/particles.test.mjs`: makeParticles(1) -> liveCount 0; emit confetti n=10 -> 10; updateParticles(ps, 3000) -> 0; two engines with the same seed and the same emit calls have JSON-identical `list` (also after updateParticles(ps, 100)); different seeds differ; emit n=500 sparks gives exactly 300 (MAX_PARTICLES); every confetti colour is one of the 6 listed; sparks speed: hypot(vx,vy) between 200 and 420 (within 1e-6); after emit of 1 cash at (100,100) and updateParticles(ps,100) x moves by vx*0.1 and vy changed by +70 (g 700*0.1) before moving; drawParticles for 10 confetti makes exactly 10 fillRects of height 6 and width between 2 and 6; 4 cash particles make 8 fillRects (4 of size [8,8]); 3 smoke make 3 arcs; a particle with age/life 0.9 draws inside save/restore with globalAlpha 0.5 (within 1e-9).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/particles.test.mjs'` prints one line.
- `grep -nE 'Math.random|Date' src/ui/particles.js` prints nothing.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Wiring into the app (GU22).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU13: Particles: confetti, smoke, sparks, cash, rust flakes`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
