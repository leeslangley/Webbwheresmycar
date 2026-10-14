[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC17 Pixel stage for characters: one shared palette per character, dither, outline

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC17
Needs (already merged into `dev`): GC02, A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Turn a folder of raw character renders into pixel sprites so that EVERY frame of one character uses the SAME palette (the old per-image quantiser gives each frame its own colours, which makes an animation shimmer). Ordered dither on the grid, a dark outline INSIDE the frame (no growth), alpha only 0 or 255.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/pixelate.py (reuse its functions by `import pixelate`: load_rgba, downscale, kmeans, nearest, apply_dither, save_rgba, srgb_to_linear, linear_to_srgb, parse_hex)
- tools/art/check_sprite.py
- docs/characters/mark.json and docs/characters/dave.json (card GC02)

## Files you may change (and nothing else)
- `tools/art/charpix.py`

## Steps
1. Create `tools/art/charpix.py`; arguments `--in-dir <raw dir> --out-dir <dir> --w <final w> --h <final h> --palette <palette.json> [--build-palette] [--colors 32] [--dither 0.18] [--outline #14102a] [--outline-px 1] [--glob '*.png']`. Palette JSON is `{"colors": ["#rrggbb", ...]}`. With `--build-palette`: load every matching raw PNG (`pixelate.load_rgba`), downscale each to (w, h) with `pixelate.downscale`, pool ALL opaque pixels (alpha >= 0.5) of all images (subsample every 3rd pixel when the pool is above 400000 pixels), `pixelate.kmeans(pool, colors)`, write the palette sorted by luminance (hex from the linear centres via `linear_to_srgb`).
2. Mapping: for each raw PNG: downscale, `pixelate.apply_dither(rgb, dither)`, assign each opaque pixel the nearest palette colour (`pixelate.nearest`, palette converted back to linear), alpha 1 where opaque else 0. Outline (do NOT use `pixelate.add_outline`, it grows the image): `ring` = transparent pixels that touch an opaque pixel (4-neighbourhood), repeated `outline_px` times, inside the same w x h array; set ring pixels to the outline colour with alpha 1. The outline colour is added to the palette output (palette entries + 1). Write PNG with `pixelate.save_rgba` to `out_dir/<same file name>`.
3. Report: print `CHARPIX OK n=<files> w=<w> h=<h> palette=<colours> max_used=<largest colour count in any single output incl. outline>`. Exit 2 with `CHARPIX FAIL <reason>` when a margin rule is broken: no opaque (pre-outline) pixel may lie within `outline_px` pixels of the frame border (it would lose its outline): count violators and fail when more than 0.
4. Test with the renders from card GC16 or, if they are not available, six synthetic frames you make with numpy in a /tmp helper: render with GC16's command for Mark idle, then `--build-palette --colors 32 --w 144 --h 144`, then run again without `--build-palette`. Also verify with a /tmp numpy check that the union of colours across all six outputs is at most 33 and that every output colour is in palette.json plus the outline colour.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/charpix.py -- --in-dir /tmp/gc16 --out-dir /tmp/gc17 --w 144 --h 144 --palette /tmp/gc17_pal.json --build-palette --colors 32` prints `CHARPIX OK n=6 w=144 h=144` and `file /tmp/gc17/mark_idle_00.png` says `144 x 144`.
- `/opt/homebrew/bin/blender --background --python tools/art/check_sprite.py -- /tmp/gc17/mark_idle_03.png --max-colors 33` prints `SPRITE OK` with `alpha01=True`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC17: Pixel stage for characters: one shared palette per character, dither, outline`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
