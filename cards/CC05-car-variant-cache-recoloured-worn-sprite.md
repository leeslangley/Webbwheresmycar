[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC05 Car variant cache (recoloured, worn sprites)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC05
Needs (already merged into `dev`): CC02, CC04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the recoloured and weathered sprite canvases on demand and keep the last 24, so drawing a car in a new colour or wear state costs one 1 ms pixel pass, once.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/art/sprite_paint.js (CC04)
- src/art/sprites.js (CC02: image(), maskImage(), meta())

## Files you may change (and nothing else)
- `src/art/carvariants.js`
- `tests/carvariants.test.mjs`

## Steps
1. `createVariants(env, sprites, max)` (max default 24; `env.makeCanvas(w,h)` returns a canvas with `getContext('2d')`). Returns `{get, light, stats}`. Internal `maskOf(key)`: when `sprites.maskImage(key)` exists, draw it on a canvas of the sprite size, `getImageData`, and build a `Uint8ClampedArray(w*h)` with 255 where `alpha >= 128 && red >= 128` else 0; cache per key.
2. `get(key, paintHex, wear)` returns `{img, w, h}` or null when `!sprites.has(key)`. `img` is the raw sprite image when `wear === 0` and (`paintHex` is falsy or equals `meta(key).paint` case-insensitively) OR when there is no mask. Otherwise: draw the raw sprite on a canvas, `getImageData`, run `recolourPixels(data, mask, w, h, meta.paint, paintHex)` (skip when paint matches) then `wearPixels(result, mask, w, h, wear, hashString(key))`, write it with `putImageData` into a canvas and return that canvas as `img`. Cache by `key + '|' + paintHex + '|' + wear` in a Map; on a hit re-insert the entry (LRU); when `size > max` delete the oldest.
3. `light(key)` returns a cached canvas (or null without mask) whose pixels are white `[255,255,255,255]` where the mask is 255 AND `lum(pixel) >= 0.8 * lum(meta.paint)`, else transparent: the specular layer for the shine sweep. `stats()` returns `{cached, built}` (built counts pixel passes since creation).
4. `tests/carvariants.test.mjs` with fakes: a `makeCanvas` whose context implements `drawImage(img)` (copies `img.px`, a Uint8ClampedArray, into its buffer), `getImageData` (returns `{data: buffer}`), `createImageData`, `putImageData` (stores into `canvas.out`). Sprite `a` 8x4 with paint `#C81E1E`, mask all 255 for rows 1..2. Asserts: `get('a', '#C81E1E', 0).img` is the raw image (`built` still 0); `get('a','#1E4D2B',0)` has built===1 and its `out` pixel at a masked ramp pixel is `[30,77,43,255]` +-1; asking again does not increase `built`; a key with no mask returns the raw image for any paint; with `max = 2`, asking for 3 different paints then the first again increases `built` (evicted), asking the most recent one does not; `get('zzz', ...)` is null; `light('a')` has white pixels only at highlight pixels.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep carvariants` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC05: Car variant cache (recoloured, worn sprites)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
