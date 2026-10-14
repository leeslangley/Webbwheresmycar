[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC21 Sprite wear: dirt, rust, dents, chrome pitting, cracked screen

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC21
Needs (already merged into `dev`): CC04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The weathering layers drawn onto a car sprite at run time from its game mask, for the wear states 0 mint, 1 worn, 2 tatty, 3 wreck (`wearState` in CC04). They replace the baked wear sprites of the first CB plan and the luminance wear of the first CC04. The fading of the paint itself is NOT here: the caller repaints with `paintRamp(fadeHex(hex, state))` (CC04).

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- src/art/sprite_paint.js (CC04: `splitMask`, `paintRamp`, `hashString`)

## Files you may change (and nothing else)
- `src/art/sprite_wear.js`
- `tests/sprite_wear.test.mjs`

## Steps
1. `src/art/sprite_wear.js`. `hash2(x, y, seed)`: `h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(seed, 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h & 0xffff) / 65536`. Blob random numbers: `s = (s * 1664525 + 1013904223) >>> 0` seeded with `seed`, `rnd(n) = (s >>> 8) % n` after advancing. `hf(y)` = 1 at the first row that holds a paint pixel (cls 1 or 2) and 0 at the last (`(bottom - y) / Math.max(1, bottom - top)`). Constants `DIRT = ['#5b4632','#3f3022']`, `RUST = ['#5c2a12','#9a4a1e','#c97a32']`, `PIT = '#6b5a48'`, `CRACK = '#bfe0ee'`. Every function below changes `px` (RGBA bytes) in place and returns it, does nothing for state 0 and never changes alpha or pixels of other classes.
2. `applyDirt(px, cls, step, w, h, state, seed)`: a paint pixel (cls 1 or 2) becomes dirt when `hf(y) < [0, 0.10, 0.24, 0.40][state] + (hash2(x, y, seed) - 0.5) * 0.10`; colour DIRT[0] when `step >= 3`, else DIRT[1]. `applyRust(...same)`: `n = [0,0,5,14][state]` blobs; candidates = paint pixels with `hf < 0.5` (none: do nothing); a blob picks `cand[rnd(cand.length)]`, radius `rnd(3) + 2` (state 2) or `rnd(3) + 3` (state 3); blob pixels = paint pixels with `d2 <= r*r + Math.floor(hash2 * 3)`, colour RUST[1], RUST[0] where `d2 <= (r-1)**2`, RUST[2] where `hash2 > 0.8`. `applyDents(..., ramp)` (`ramp` = `paintRamp` of the colour in use): state 3 only, 3 dents; pick a paint pixel `(x, y)`; for k 0..3 the pixel `(x + k, y + (k >> 1))` becomes `ramp[max(step - 2, 0)]` and the pixel below it `ramp[min(step + 2, 6)]`, only where both are paint. `applyPitting`: chrome pixels (cls 3) with `hash2 < [0, 0, 0.08, 0.18][state]` become PIT. `applyCrack`: state 3: take the median glass pixel (cls 4) `(cx, cy)`; for k -6..6 the pixel `(cx + k, cy + Math.floor(k / 2))` becomes CRACK when its cls is 4.
3. `wearLayers(px, cls, step, w, h, state, seed, ramp)` calls the five functions in the order dirt, rust, dents, pitting, crack and returns px. `tests/sprite_wear.test.mjs`: a 100x60 synthetic sprite: paint cls 1 rows 10..49 columns 10..89 (step 4, filled with `paintRamp('#C96F32')[4]`), chrome cls 3 rows 52..54, glass cls 4 rows 2..8 columns 20..60, transparent elsewhere. State 0 leaves the bytes equal. `hash2` is in [0,1), equal on two calls, and seeds 3 and 4 differ in at least 90 of 100 values. `applyDirt`: the fraction of dirt-coloured paint pixels is > 0 at state 1, strictly increases 1 < 2 < 3 and is between 0.25 and 0.55 at state 3; every dirt pixel has `hf < 0.46`. `applyRust`: state 2 makes at least one RUST[0] pixel, every rust pixel has `hf < 0.65`, state 3 makes more rust pixels than state 2. `applyDents` state 3 changes 4 to 24 pixels. `applyPitting` state 3 changes 8 to 30 percent of the chrome pixels, state 1 none. `applyCrack` state 3 makes 7 to 13 CRACK pixels, state 2 none. The same seed twice gives identical bytes, seeds 1 and 2 differ, and for every state alpha and every non-paint, non-chrome, non-glass pixel is unchanged.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep sprite_wear` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC21: Sprite wear: dirt, rust, dents, chrome pitting, cracked screen`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
