[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC04 Sprite paint: repaint a car from its game mask

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
The pure pixel maths that repaints ONE rendered car sprite in any colour. No guessing from luminance: every paint pixel of a sprite is exactly one of the 7 ramp colours of the car's paint, and the game mask says which ramp step each pixel is, so repainting is a table lookup into the ramp of the new colour (rules and mask encoding: CARS_ALIGN.md). Works on `Uint8ClampedArray` RGBA data, so it runs under jsc.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- tools/art/pixramp.py `paint_ramp` (card CB11) is the Python original of `paintRamp` if it is already merged; the formula is written out below

## Files you may change (and nothing else)
- `src/art/sprite_paint.js`
- `tests/sprite_paint.test.mjs`

## Steps
1. `hexToRgb('#rrggbb')` -> `[r,g,b]` (throws on bad input), `rgbToHex([r,g,b])` -> lowercase hex. `paintRamp(hex)` -> 7 arrays `[r,g,b]` (integers 0..255): `MULT=[0.10,0.20,0.38,0.65,1.0,1.5,2.3]`, `SW=[0.35,0.28,0.18,0.08,0,0,0]`, `HW=[0,0,0,0,0,0.20,0.55]`. If the largest sRGB channel of the colour is below 32/255 use '#202028' instead. In linear light (to linear `c/12.92` or `((c+0.055)/1.055)**2.4`; back `12.92 c` or `1.055 c**(1/2.4) - 0.055`, then round to 8 bit) with `b` the base: for step i `c = clamp(b * MULT[i], 0, 1)`; shadow tint toward '#2a1a5c' that keeps the luma: `c = c + (tint * (luma(c) / luma(tint)) - c) * SW[i]` (luma = 0.2126 r + 0.7152 g + 0.0722 b); highlight `c = c * (1 - HW[i]) + top * HW[i]` where `top` is white when luma(b) >= 0.5, else cream '#fff2cc'; clamp. Step 4 is the base colour.
2. `fadeHex(hex, level)`: mix the colour toward '#b8aa96' by `[0, 0.12, 0.30, 0.50][level]`, rounded per channel (level 0..3, else throw). `wearState(cond)`: `cond >= 8` -> 0, `>= 5` -> 1, `>= 2.5` -> 2, else 3 (`NaN` or undefined -> 0). Export `WEAR_NAMES = ['mint','worn','tatty','wreck']` and `hashString(s)` (FNV-1a 32 bit, `>>> 0`).
3. `splitMask(maskPx, w, h)` -> `{cls: Uint8Array(w*h), step: Uint8Array(w*h)}` from the game mask's RGBA bytes: `cls = R` and `step = G` where alpha is 255, else 0 (cls 1 paint, 2 second paint, 3 chrome, 4 glass). `recolourPixels(px, cls, step, w, h, hex, hex2)` returns a NEW `Uint8ClampedArray` (px untouched): a pixel with cls 1 becomes `paintRamp(hex)[step]`; a pixel with cls 2 becomes `paintRamp(hex2)[step]` only when `hex2` is given; alpha and every other pixel copy through.
4. `tests/sprite_paint.test.mjs`: `paintRamp('#C96F32')` as hex equals ['#3e203d','#59304e','#7c4458','#a25a53','#c96f32','#f4a36f','#ffd3a3'] and `paintRamp('#1E4D2B')` equals ['#0a121d','#111d27','#172c2f','#1b3d31','#1e4d2b','#808d6c','#c6c6a1'] (every channel within 1; these are the Python values of card CB11, never change them); `paintRamp('#101010')[4]` is '#202028'; `paintRamp('#ffffff')` has non-decreasing luma. A 6x2 synthetic sprite: four cls-1 pixels holding `paintRamp('#C96F32')[s]` for steps 0, 2, 4, 6, one cls-2 pixel (step 3), one chrome pixel [230,230,230] (cls 3), one transparent pixel. Recolour to '#1E4D2B': the four paint pixels equal rows 0, 2, 4, 6 of the target ramp exactly; the cls-2 pixel is unchanged without `hex2` and equals `paintRamp(hex2)[3]` with it; chrome and every alpha unchanged; the input array is not mutated; recolouring to '#C96F32' returns identical bytes; target '#000000' gives bytes within 0..255. `fadeHex('#C96F32', 0)` is '#c96f32', level 3 is '#c08c64', level 4 throws. `wearState`: 9 -> 0, 5 -> 1, 4.9 -> 2, 2.4 -> 3, 0 -> 3, NaN -> 0.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep sprite_paint` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC04: Sprite paint: repaint a car from its game mask`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
