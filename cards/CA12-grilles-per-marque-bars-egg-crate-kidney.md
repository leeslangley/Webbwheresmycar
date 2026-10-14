[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA12 Grilles per marque: bars, egg-crate, kidney, shield, mesh

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA12
Needs (already merged into `dev`): CA03, CA02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The grille is the mouth of the classic's face. A recessed dark opening, a chrome surround and the bars or mesh inside. Registers `grille`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/grilles.py`
- `tests/run_ca12.sh`

## Steps
1. `tools/art/parts/grilles.py`: `@register('grille')`: `w = part['w']*ctx['mult']('mouth')`, `h = part['h']*ctx['mult']('mouth')`, at `(x, y)`, lat 0 (`end` front: sits on the nose face at `x = surf.xmax - 0.6`; `end` rear: at `x = surf.xmin + 0.6`). Always: a black recess box (dx 0.8, h, w) and, when `surround` is chrome/black/paint, a frame of four thin boxes (0.5 thick) around it in that material, with Bevel 0.15. Style `none` builds only the recess (rear-engine cars use `none`).
2. Style content, all in chrome, at the front of the recess: `horizontal_bars` = `bars` boxes (dh 0.35) evenly spaced; `vertical_bars` = `bars` boxes (dl 0.35); `egg_crate` = both, 6 x 4; `slat_panel` = 9 thin slanted boxes (rotate 30 degrees about the lat axis); `oval_mesh` = an ellipsoid frame (torus scaled h/w) with a cross-hatch of 5 thin boxes; `kidney` = two small oval frames side by side (each w/2.2 wide) with vertical bars inside; `shield` = a V-shaped frame: top edge w, tapering to 0.4*w at the bottom (use 4 rotated boxes) with 5 vertical bars of decreasing height.
3. Names `grille_<i>_c`, bars `grillebar_<i>_<k>`. Create `tests/run_ca12.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_grilles.json` (create it: dossier_ok, one grille per style, 7 styles, stacked at y 8 to 26 and w 8, h 2.4 with `end` front)`), requires exit 0, `RENDERED`, at least 7 `REPORT grille_` lines and at least 30 `REPORT grillebar_` lines; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca12.sh` prints `CA12 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA12: Grilles per marque: bars, egg-crate, kidney, shield, mesh`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
