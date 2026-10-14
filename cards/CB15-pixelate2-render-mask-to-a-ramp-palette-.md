[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB15 pixelate2: render + mask to a ramp-palette sprite

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB15
Needs (already merged into `dev`): CB12, CB13, CB14
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The new command-line pixel stage: a colour render plus its Blender class mask (`--mask`, from CB05) in, a pixel-art sprite out, replacing the free k-means palette. (The separate game mask the game recolours is added in CB20.)

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixelate.py (reuse its `load_rgba`, `save_rgba`, `downscale`, `add_outline` import: `import pixelate` from the same folder)
- tools/art/pixramp.py (CB11-CB14), tools/art/check_sprite.py
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixelate2.py`
- `tests/pixelate2_fixture.py`
- `tests/run_pixelate2.sh`

## Steps
1. Create `tools/art/pixelate2.py` (Blender python, `main(argv)` like pixelate.py). Arguments after `--`: `--in <png> --mask <png> --out <png> --width <int> --color <#rrggbb> [--color2 <#rrggbb>] [--dither 0.5] [--steps 0,1,2,3,4,5,6] [--scale <int>]`. Bad or missing arguments: a clear message, exit 2 (same style as pixelate.py `parse_args`; guard every `argv[i+1]`).
2. Pipeline: `src = pixelate.load_rgba(in)`; `out_h = round(src_h * width / src_w)`; `rgb, alpha = pixelate.downscale(src, width, out_h)`; the mask is read RAW (write a small `load_raw_rgba(path)`: like load_rgba but without the srgb-to-linear step); `cls, opaque = pixramp.class_map(mask, width, out_h)`; `out, idx = pixramp.quantise(rgb, opaque, cls, color, color2, dither, steps)`; `rgb2, a2, cls2, idx2 = pixramp.add_outlines(out, cls, idx, opaque, color, color2)`; `pixelate.save_rgba(out, dstack(rgb2, a2))`; with `--scale N` also write `<out>_xN.png` nearest-neighbour. Print `PIXELATE2 OK out=<path> size=<w>x<h> colors=<n>`.
3. Create `tests/pixelate2_fixture.py` (Blender python): writes `/tmp/px2_in.png` (200x100 RGBA, a paint ellipse with a horizontal brightness gradient 0.3..0.9 in sRGB orange, a chrome disc, a glass rectangle, transparent elsewhere) and `/tmp/px2_mask.png` with the exact class colours of `cbmat.MASK_RGB` (raw values, alpha 0/255) for the same shapes, using `bpy.data.images.new` + `.pixels.foreach_set` + save.
4. Create `tests/run_pixelate2.sh`: run the fixture, then pixelate2 with `--width 100 --color '#C96F32' --out /tmp/px2_out.png`; require exit 0 and `PIXELATE2 OK`; run `check_sprite.py /tmp/px2_out.png --max-colors 24` (must print `SPRITE OK`); a Blender python one-liner file `tests/pixelate2_check.py` (add it to your files) that loads the output and asserts: size 102x52, every silhouette pixel is '#120a1e', and at least 5 of the 7 colours of `paint_ramp('#C96F32')` (as 8-bit sRGB) occur; a missing `--mask` makes pixelate2 exit non-zero. The shell script ends by printing `PIXELATE2 TEST OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_pixelate2.sh` prints `PIXELATE2 TEST OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB15: pixelate2: render + mask to a ramp-palette sprite`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
