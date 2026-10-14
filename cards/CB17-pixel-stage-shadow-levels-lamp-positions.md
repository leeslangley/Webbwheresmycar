[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB17 Pixel stage: shadow levels, lamp positions and game mask

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB17
Needs (already merged into `dev`): CB12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Three pure helpers: turn the shadow render into a 4-level one-colour shadow sprite; find the headlamp and tail lamp pixels so the game can add additive glow (bloom) at night; and build the GAME MASK, the picture that tells the game which pixels are paint (and which ramp step), chrome or glass so it can repaint and weather the car at run time.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixramp.py (CB11, CB12), docs/art/CARS_ALIGN.md (section 'Game mask')
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixramp.py`
- `tests/pixramp_extra_test.py`

## Steps
1. Add `shadow_levels(alpha)`: `alpha` is a float (h,w) array 0..1 already area-averaged to the sprite size; returns uint8 (h,w) with values 0, 40, 90 or 150 using thresholds: alpha > 0.75 -> 150, > 0.35 -> 90, > 0.08 -> 40, else 0. The shadow sprite colour is always `OUTLINE` ('#120a1e'); the writer is in CB20.
2. Add `find_lamps(cls, opaque, min_px=2)` -> list of dicts `{'x': float, 'y': float, 'r': float, 'kind': 'head'|'tail'}`: 4-neighbour connected components (write a small flood fill, no scipy) of pixels with class 5 (lamp -> kind 'head') or class 7 (tail -> kind 'tail') that are opaque; skip components smaller than `min_px`; x,y = centroid (1 decimal, sprite pixel units, pixel centres at +0.5), r = `max(1.0, sqrt(area / pi))` rounded to 0.5; sorted by (kind, x). Add `game_mask(cls2, idx2)` -> uint8 (h,w,4) from the padded maps of `add_outlines` (CB14): class 0 (paint) -> R 1, class 8 (paint2) -> R 2, class 1 (chrome) -> R 3, class 2 (glass) -> R 4, all with A 255; G = `idx2` for R 1 and 2, else 0; B 0; every other pixel (0,0,0,0).
3. Write `tests/pixramp_extra_test.py` (Blender): a 2x10 alpha array whose first row is 0.9, 0.5, 0.2, 0.05, 0.0, 0.76, 0.75, 0.35, 0.08, 0.081 (second row all 0): the first output row is exactly [150,90,40,0,0,150,90,40,0,40] (0.75 is NOT > 0.75, 0.35 not > 0.35, 0.08 not > 0.08) and the second row is all 0; dtype uint8. A 10x10 class map with a 2x2 lamp block at rows 2..3, columns 7..8, a single tail pixel at row 5, column 1, and a 3-pixel tail line at row 8, columns 1..3: `find_lamps` returns one head with x 8.0, y 3.0 (centroid), r 1.0 and one tail (the 3-pixel line, x 2.5, y 8.5, r 1.0), the single tail pixel is skipped. `game_mask` on a 2x3 `cls2` [[-1,0,8],[1,2,5]] with `idx2` [[-1,3,5],[0,0,0]] gives pixels (0,0,0,0), (1,3,0,255), (2,5,0,255) / (3,0,0,255), (4,0,0,255), (0,0,0,0). Print `PIXRAMP EXTRA OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_extra_test.py 2>&1 | tail -1` prints `PIXRAMP EXTRA OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB17: Pixel stage: shadow levels, lamp positions and game mask`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
