[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC05 Car variant cache (repainted, weathered sprites)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC05
Needs (already merged into `dev`): CC02, CC04, CC21
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the repainted and weathered sprite canvases on demand and keep the last 24, so drawing a car in a new colour or wear state costs one pixel pass, once.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- src/art/sprite_paint.js (CC04), src/art/sprite_wear.js (CC21), src/art/sprites.js (CC02: image(), maskImage(), meta())

## Files you may change (and nothing else)
- `src/art/carvariants.js`
- `tests/carvariants.test.mjs`

## Steps
1. `createVariants(env, sprites, max)` (max default 24; `env.makeCanvas(w,h)` returns a canvas with `getContext('2d')`). Returns `{get, light, stats}`. Internal `maskOf(key)`: when `sprites.maskImage(key)` exists, draw it on a canvas of the sprite size, `getImageData`, and `splitMask` it (CC04) into `{cls, step}`; cache per key.
2. `get(key, paintHex, wear)` returns `{img, w, h}` or null when `!sprites.has(key)`. `img` is the raw sprite image when `wear === 0` and (`paintHex` is falsy or equals `meta(key).paint` case-insensitively), OR when there is no mask. Otherwise draw the raw sprite on a canvas, `getImageData`, `target = fadeHex(paintHex || meta.paint, wear)`; unless `target` equals `meta.paint`, run `recolourPixels(data, cls, step, w, h, target)`; when `wear > 0` also `wearLayers(result, cls, step, w, h, wear, hashString(key), paintRamp(target))`; write the pixels with `putImageData` into a canvas and return it as `img`. Cache by `key + '|' + paintHex + '|' + wear` in a Map; on a hit re-insert the entry (LRU); when `size > max` delete the oldest.
3. `light(key)` returns a cached canvas (or null without mask) whose pixels are white `[255,255,255,255]` where the mask says paint (cls 1 or 2) with `step >= 5`, or chrome (cls 3) with the sprite's red channel >= 200, else transparent: the specular layer for the shine sweep. `stats()` returns `{cached, built}` (built counts pixel passes since creation).
4. `tests/carvariants.test.mjs` with fakes: a `makeCanvas` whose context implements `drawImage(img)` (copies `img.px`, a Uint8ClampedArray, into its buffer), `getImageData` (returns `{data: buffer}`), `createImageData`, `putImageData` (stores into `canvas.out`). Sprite `a` 8x4 with `meta.paint` '#C81E1E': rows 1..2 hold `paintRamp('#C81E1E')[step]` with steps 0..6 then 4 (so the 8 pixels cover every step), the fake mask image has R 1 and G = that step on those pixels (else all 0), row 3 holds one chrome pixel (R 3). Asserts: `get('a', '#C81E1E', 0).img` is the raw image (`built` still 0); `get('a','#1E4D2B',0)` has built === 1 and its `out` pixel with step 4 equals `paintRamp('#1E4D2B')[4]` plus alpha 255; asking again does not raise `built`; `get('a','#C81E1E',3)` raises `built` and some masked pixel differs from the raw one (dirt on the bottom paint row); a key without mask returns the raw image for any paint; with `max = 2`, asking for 3 different paints then the first again raises `built` (evicted), asking the most recent one does not; `get('zzz', ...)` is null; `light('a')` has white pixels exactly where step >= 5 and at the chrome pixel.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep carvariants` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC05: Car variant cache (repainted, weathered sprites)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
