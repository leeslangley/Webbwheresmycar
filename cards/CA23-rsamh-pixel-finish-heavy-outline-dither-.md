[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA23 RSAMH pixel finish: heavy outline, dither shadows, punchy palette

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA23
Needs (already merged into `dev`): V07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The old game's art had thick black outlines, flat saturated colour and ordered-dither shading. Add a finishing pass after `pixelate.py` that gives every car sprite that comic look (still HD, still glossy underneath), so it reads at portrait size on the HUD.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/pixelate.py (A04: arguments, linear-colour handling) and tools/art/check_sprite.py
- docs/art/RSAMH_STYLE.md (section 'The grammar', point 5)

## Files you may change (and nothing else)
- `tools/art/rsamh_finish.py`
- `tests/run_ca23.sh`

## Steps
1. `tools/art/rsamh_finish.py` (Blender python with numpy, same loading approach as pixelate.py): args `--in <png> --out <png> --outline 2 --punch 1.25 --dither 0.5 --colors 28`. Steps on the RGBA array: (1) saturation boost: convert to HSV per pixel, `s = min(1, s*punch)`, `v = v ** 0.92`; (2) shadow dither: for pixels whose luminance is in the lowest 30% of the sprite and where `(x + y) % 2 == 0` and the dither strength > 0, darken by 14% (checkerboard); (3) inner contour: a pixel is darkened by 35% when its right or lower neighbour is opaque and its luminance is more than 0.22 higher than the neighbour's (a selective inner line); (4) outer outline: grow the opaque mask by `--outline` pixels (4-neighbour dilation repeated), fill the new pixels with near-black `#0b0816`; the output is `2*outline` pixels wider and taller; (5) re-quantise to `--colors` colours with the same k-means method as pixelate.py (import it or copy the function) keeping the outline colour fixed; alpha stays 0 or 255 only.
2. `tests/run_ca23.sh`: runs `blender --background --python tools/art/pixelate.py -- --in assets/art/preview/roadster_flat.png --out /tmp/rf_px.png --width 320 --colors 24`, then `rsamh_finish.py` on it to `/tmp/rf_fin.png`; a `--python-expr` check reads both PNGs with numpy and requires: output width = input width + 4 and height + 4, unique colours <= 28 (opaque pixels), alpha values only {0,255}, count of pixels equal to `#0b0816` at least 200, and mean saturation of opaque non-outline pixels at least 8% higher than the input; prints `CA23 OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca23.sh` prints `CA23 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA23: RSAMH pixel finish: heavy outline, dither shadows, punchy palette`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
