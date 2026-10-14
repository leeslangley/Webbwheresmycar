[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC04 Sprite paint: palette-swap recolour and wear states

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC04
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The pure pixel maths that turns ONE rendered car sprite into any paint colour and any of 4 wear states, using the body-paint mask. This replaces rendering N paint variants (decision with numbers in docs/art/CC.md). Works on `Uint8ClampedArray` RGBA data, so it runs under jsc.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- tools/art/pixelate.py (the outline pixels are the touching colour times 0.30)

## Files you may change (and nothing else)
- `src/art/sprite_paint.js`
- `tests/sprite_paint.test.mjs`

## Steps
1. `hexToRgb('#rrggbb')` returns `[r,g,b]` (throws on bad input); `lum(r,g,b)` = 0.299r+0.587g+0.114b. `recolourPixels(px, mask, w, h, baseHex, targetHex)` returns a NEW `Uint8ClampedArray` (px untouched). `mask` is a `Uint8ClampedArray(w*h)` where 255 means body paint. Let `Lb = max(1, lum(base))`. For every pixel with alpha > 0 and mask 255, with colour c and L = lum(c): if `L <= Lb` then out = target * (L / Lb) per channel, else `t = (L - Lb) / (255 - Lb)` and out = target + (255 - target) * t; round; alpha unchanged. Outline tint: an opaque, UNmasked pixel that has at least one 4-neighbour with mask 255 and `L < 0.45 * Lb` is treated exactly like a masked pixel (so the dark outline around the body takes the new paint's dark tone). All other pixels copy through.
2. `wearState(cond)`: `cond >= 8` -> 0, `>= 5` -> 1, `>= 2.5` -> 2, else 3 (`NaN` or undefined -> 0). Export `WEAR_NAMES = ['mint','worn','tatty','wreck']` and `hashString(s)` (FNV-1a 32 bit, `>>> 0`).
3. `wearPixels(px, mask, w, h, state, seed)` returns a NEW array; state 0 returns an exact copy. Find the opaque bounding box rows `top`..`bottom`, `H = bottom - top + 1`. Only masked pixels change, alpha never changes. (a) fade: `f = [0,0.10,0.24,0.38][state]`, `d = [0,0.04,0.10,0.16][state]`: c' = lerp(c, grey(lum c), f) * (1 - d). (b) dirt: state >= 1 and `y >= top + 0.72*H`: multiply by `1 - 0.06 * state`. (c) rust: state >= 2: `n = state === 2 ? 6 : 14` blotches. Random numbers come from a LCG `s = (s * 1664525 + 1013904223) >>> 0` seeded with `seed >>> 0`. Candidates are masked pixels with `y >= top + 0.55*H` (skip if none); a blotch is the chosen pixel plus 3 neighbours at offsets in -2..2 (only if masked), colour `RUST[(s >>> 8) % 3]` with `RUST = [[107,45,20],[138,59,23],[168,80,30]]`. (d) primer: state 3 only: choose one masked pixel with `y < top + 0.5*H`, colour the masked pixels of the 6x4 block starting there `[139,143,147]`.
4. `tests/sprite_paint.test.mjs`: build a 100x40 synthetic sprite: rows 10..34 opaque, mask 255 for x 5..94 and rows 12..30, paint ramp pixels `[200,30,30]` (base `#C81E1E`), a few `[255,235,235]` highlight pixels, `[60,5,5]` shadow pixels, one unmasked chrome pixel `[230,230,230]`, transparent elsewhere. Asserts: recolour to the SAME hex returns identical bytes for masked ramp pixels (within 1); recolour to `#1E4D2B`: the `[200,30,30]` pixel becomes `[30,77,43]` (+-1), highlight pixel has all channels greater than the target's and less than or equal to 255, shadow pixel luminance < target luminance, chrome pixel and every alpha unchanged, input array not mutated; target `#1C1C1C` black car: no channel above 255 and none NaN. wearState(9)=0, (5)=1, (4.9)=2, (2.4)=3, (0)=3, (NaN)=0. Wear: state 0 equals input; for state 3 count pixels equal to a RUST colour: at least 20; at least 12 pixels equal `[139,143,147]`; every unmasked pixel and every alpha unchanged; same seed gives identical output (compare every byte), seed 1 vs seed 2 differ in at least one byte; state 2 has fewer rust pixels than state 3.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep sprite_paint` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC04: Sprite paint: palette-swap recolour and wear states`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
