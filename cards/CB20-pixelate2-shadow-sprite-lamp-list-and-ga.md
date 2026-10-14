[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB20 pixelate2: shadow sprite, lamp list and game mask

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB20
Needs (already merged into `dev`): CB16, CB17
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wire the shadow sprite, the lamp list and the game mask into pixelate2, so one call makes a finished, aligned sprite, shadow, mask and metadata. (Wear is NOT baked: the game weathers the sprite at run time from the mask, cards CC04 and CC21.)

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixelate2.py (CB15, CB16), tools/art/pixramp.py (CB14 `add_outlines`, CB17 helpers), docs/art/CARS_ALIGN.md (game mask encoding)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixelate2.py`
- `tests/run_pixelate2c.sh`
- `tests/pixelate2c_check.py`

## Steps
1. Add `--shadow-in <png>` and `--shadow-out <png>`: load the shadow render, take its alpha channel, area-average to the sprite size (same width/height as the car before the crop), `shadow_levels`, and write an RGBA PNG whose rgb is '#120a1e' where alpha > 0 and whose alpha is the level (0/40/90/150). Writing alpha levels needs `image.pixels.foreach_set` directly (pixelate.save_rgba thresholds alpha): write a `save_rgba_levels` helper. Add `--game-mask-out <png>`: `pixramp.game_mask(cls2, idx2)` from `add_outlines`, an RGBA PNG of the sprite's size.
2. The crop box is the UNION of the car sprite's bounding box and the shadow's bounding box, applied to ALL written files (sprite, shadow, game mask), so they have the same size and line up exactly. `--meta-out` additionally gets `"lamps": find_lamps(...)` in cropped sprite coordinates (add the 1 px outline offset and subtract the crop origin), `"mask": "<game mask file name>"` and `"shadow": "<shadow file name>"` (null without a shadow).
3. Create `tests/pixelate2c_check.py` / `tests/run_pixelate2c.sh` (reuse the synthetic 1600x800 fixture idea of CB16, add a lamp block of class lamp, a chrome block and a shadow render whose alpha is a soft ellipse): (a) the shadow file has the same size as the car file, its distinct alpha values are a subset of {0,40,90,150}, its rgb is '#120a1e' wherever alpha > 0; (b) the meta JSON has one `head` lamp whose x,y fall inside the sprite, and `mask`/`shadow` names; (c) the game mask has the sprite's size, alpha only 0 or 255, R only in 0..4, G <= 6; at every pixel with R == 1 the sprite's 8-bit rgb equals `paint_ramp('#C96F32')[G]` (8-bit sRGB, each channel within 1); pixels with R == 3 exist (the chrome block); the 1 px silhouette outline pixels have alpha 0 in the mask; (d) `--shadow-out` without `--shadow-in` exits non-zero. Print `PIXELATE2C TEST OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_pixelate2c.sh` prints `PIXELATE2C TEST OK`.
- `sh tests/run_pixelate2b.sh` still prints `PIXELATE2B TEST OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB20: pixelate2: shadow sprite, lamp list and game mask`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
