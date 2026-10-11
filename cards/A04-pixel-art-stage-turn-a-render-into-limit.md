[Project: Webbwheresmycar]
# Task: [GLM-SPARK] Sparks-alias-glm-5.3-flash A04 Pixel-art stage: turn a render into limited-palette pixel art

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: A04
Needs (already merged into `dev`): A02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (Sparks-alias-glm-5.3-flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The step that makes it HD PIXEL ART: take a large transparent render and turn it into a small sprite with hard pixel edges, a limited colour palette and a crisp dark outline. Written as Blender-python scripts because Blender's Python already has numpy and image loading (PIL is not available).

## Read first
- docs/ART_BIBLE.md (the PIXEL STAGE section)
- assets/art/preview/roadster_flat.png (input to test with; it is a 1024x512 transparent RGBA render)
- Blender 5.2 is installed at `/opt/homebrew/bin/blender`. Run scripts headless like this: `/opt/homebrew/bin/blender --background --python tools/art/<script>.py -- <args>` (everything after the lone `--` goes to your script; read it with `sys.argv[sys.argv.index('--') + 1:]`). Blender's built-in Python has `bpy`, `bmesh`, `mathutils` and `numpy` but NOT PIL. You cannot see images: judge by numbers (file exists, PNG size, pixel counts via `bpy.data.images` and numpy) and let the planner inspect the pictures.

## Files you may change (and nothing else)
- `tools/art/pixelate.py`
- `tools/art/check_sprite.py`
- `assets/art/preview/roadster_px.png`
- `assets/art/preview/roadster_px_x4.png`

## Steps
1. Create `tools/art/pixelate.py`. Arguments after `--`: `--in <png>`, `--out <png>`, `--width <int>` (target sprite width in pixels, default 384; the height follows the aspect ratio), `--colors <int>` (default 24), `--outline <#rrggbb or auto>` (default auto), `--dither <float>` (default 0.0), `--scale <int>` (if given, ALSO write `<out without .png>_x<scale>.png`, the same sprite enlarged by that whole number with nearest-neighbour). Load the input with `bpy.data.images.load`, get pixels as a numpy float array `(h, w, 4)` (note Blender stores rows bottom-to-top: flip vertically), work with numpy only.
2. Algorithm: (1) AREA-AVERAGE downscale to the target size (average each block of source pixels; use numpy reshape/mean after cropping so the block size is an integer: choose the crop so `(src_w // block) == width`; if the input width is not an exact multiple, first resize with simple box-filter weighting; keep it simple and deterministic), working in PREMULTIPLIED alpha so edges stay clean. (2) Hard alpha: a pixel is opaque if its alpha >= 0.5, else fully transparent; opaque pixels get the un-premultiplied colour. (3) Palette: k-means in linear RGB on the opaque pixels with `--colors` clusters, a deterministic initialisation (sort pixels by luminance and take evenly spaced samples), 12 iterations, then replace every opaque pixel with its cluster centre; with `--dither` > 0 apply an ordered 4x4 Bayer threshold to the luminance before assigning clusters (strength = the dither value, 0 means none). (4) Outline: every transparent pixel that touches (4-neighbourhood) an opaque pixel becomes an outline pixel; with `--outline auto` its colour is the touching opaque pixel's palette colour multiplied by 0.30 (a darker shade), otherwise the given colour; the outline adds one pixel all round so the output image is `width + 2` by `height + 2` pixels (pad with 1 transparent pixel before step 4). (5) Convert back to sRGB 8-bit, flip vertically back for saving, write RGBA PNG with `bpy` (create `bpy.data.images.new(..., alpha=True)`, set `.pixels` from the flattened float array, `.file_format = 'PNG'`, `.filepath_raw`, `.save()`). Alpha in the output must be exactly 0 or 255.
3. Create `tools/art/check_sprite.py` (run with Blender like the others: `blender --background --python tools/art/check_sprite.py -- <png> [--max-colors N]`): loads the PNG and prints exactly one line `SPRITE OK size=<w>x<h> colors=<n> alpha01=<True|False>` where `colors` is the number of distinct RGB values among opaque pixels and `alpha01` is True when every alpha value is 0 or 255; it exits with a non-zero status (call `sys.exit(2)`) and prints `SPRITE FAIL ...` when `--max-colors` is given and exceeded or when alpha01 is False.
4. Run it on the existing render and commit the results: `/opt/homebrew/bin/blender --background --python tools/art/pixelate.py -- --in assets/art/preview/roadster_flat.png --out assets/art/preview/roadster_px.png --width 320 --colors 24 --scale 4` (this writes `roadster_px.png` and `roadster_px_x4.png`).

## Acceptance (all must pass; exact commands)
- The pixelate command above exits 0; `file assets/art/preview/roadster_px.png` says `PNG image data, 322 x <h>, 8-bit/color RGBA` (322 = 320 + 2 outline pixels) and `file assets/art/preview/roadster_px_x4.png` says width 1288.
- `/opt/homebrew/bin/blender --background --python tools/art/check_sprite.py -- assets/art/preview/roadster_px.png --max-colors 30` exits 0 and prints a line `SPRITE OK size=322x... colors=<n> alpha01=True` with n at most 30 (24 palette colours plus the outline colours).
- Run pixelate with `--colors 12` into /tmp/px12.png and check it with `--max-colors 20`: passes. Run check_sprite on the original 1024x512 render `roadster_flat.png` with `--max-colors 30`: it must FAIL (exit non-zero) because the render has thousands of colours.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to blender_car.py (card A03 owns it). No game code.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `A04: Pixel-art stage: turn a render into limited-palette pixel art`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
