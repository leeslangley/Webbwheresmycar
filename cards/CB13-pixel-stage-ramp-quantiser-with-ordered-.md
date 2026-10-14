[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB13 Pixel stage: ramp quantiser with ordered dither

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB13
Needs (already merged into `dev`): CB11, CB12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The core of the look: every material pixel is snapped to its material's ramp; paint uses the render only for the shading, so the colour is exact; a light 4x4 ordered dither softens the bands (the RSAMH look).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Pixel-stage constants (all cards CB11-CB20 use exactly these): paint ramp multipliers MULT=[0.10,0.20,0.38,0.65,1.0,1.5,2.3]; shadow tint weights SW=[0.35,0.28,0.18,0.08,0,0,0] toward '#2a1a5c'; highlight weights HW=[0,0,0,0,0,0.20,0.55] toward cream '#fff2cc' (toward white '#ffffff' instead when the base colour's linear luma >= 0.5); outline colour '#120a1e'.
- tools/art/pixramp.py (CB11, CB12), tools/art/pixelate.py (`BAYER4`, `nearest`)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixramp.py`
- `tests/pixramp_quant_test.py`

## Steps
1. Add `bayer4()` (the 4x4 matrix of pixelate.py as floats, minus 0.5 so it is centred on 0). Add `quantise(rgb, opaque, cls, color, color2=None, dither=0.5, steps=(0,1,2,3,4,5,6), glass_dither=0.3)` -> `(out, idx)`: `rgb` (h,w,3) LINEAR area-averaged render colour, `opaque` bool, `cls` int class map, `color` the paint hex, `color2` hex for class 8 (paint2; if None paint2 pixels use `color`). `out` (h,w,3) linear, `idx` (h,w) int with the ramp step index (0..6) for paint and paint2 pixels and -1 elsewhere.
2. Paint and paint2 (each with its own ramp from `paint_ramp` and its own median): `r = ln(max(luma, 1e-5) / median_luma_of_that_class)`; step boundaries `bnd[j] = (ln MULT[j] + ln MULT[j+1]) / 2`; `bw = mean(diff(ln MULT))`; `i = searchsorted(bnd, r + bayer4[y%4, x%4] * dither * bw)` clipped to 0..6; if `steps` omits some indices, snap `i` to the nearest allowed index (so the mini sprite can use fewer shades). Other classes use `fixed_ramp(name)`: `s = linear_to_srgb(luma)`; chrome edges [0.10,0.25,0.50,0.72,0.92] (6 steps, the top step is pure white); every other class: edges = `linspace(p2, p99, k+1)[1:-1]` of the class's own `s` values (p2/p99 = 2nd and 99th percentile); add `bayer4 * 0.08 * glass_dither` to `s` before `searchsorted` for glass and tyre only (dither 0 for chrome, lamp, trim, tail, wall). Classes with fewer than 4 pixels are skipped (left black).
3. Write `tests/pixramp_quant_test.py` (Blender): a 32x64 array whose paint luma ramps from 0.02 to 0.8 across columns (colour = '#C96F32' linear scaled), cls all 0, opaque all True. With `dither=0`: at most 7 distinct output colours; every output colour is a row of `paint_ramp('#C96F32')`; the pixel at the median luma has idx 4 and equals `paint_ramp(...)[4]`; idx is non-decreasing along each row. With `dither=0.5` the number of pixels whose idx differs from the dither-0 result is between 2 and 45 percent. With `steps=(1,3,4,5,6)` only those indices occur. A chrome class patch (cls 1) of grey pixels whose sRGB value is 0.99 (convert to linear for the input) maps to pure white; with sRGB value 0.05 it maps to the first chrome colour. Print `PIXRAMP QUANT OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_quant_test.py 2>&1 | tail -1` prints `PIXRAMP QUANT OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB13: Pixel stage: ramp quantiser with ordered dither`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
