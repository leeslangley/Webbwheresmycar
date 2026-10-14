[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA05 Wheel arches cut into the body, with dark wheel wells

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA05
Needs (already merged into `dev`): CA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Real cars have arch openings with the wheel tucked inside. Cut an arch hole for every wheel from the dossier and put a dark well behind it.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DOSSIER_SPEC.md (`wheels`, `wheel_arch`: round|squared|flared|none-skirted|cycle-wing)

## Files you may change (and nothing else)
- `tools/art/parts/arches.py`
- `tests/run_ca05.sh`

## Steps
1. `tools/art/parts/arches.py`, `@stage('arches')`. First apply the body's modifiers: `body.data = bpy.data.meshes.new_from_object(body.evaluated_get(bpy.context.evaluated_depsgraph_get())); body.modifiers.clear()` (keep a helper `apply_modifiers(obj)`). Skip everything when `dossier['wheel_arch']` is `none-skirted` or `cycle-wing` (print `ARCH SKIP`). The wheel list can hold two entries with the same x (a three-wheeler): treat one wheel per UNIQUE x per side, and when the dossier has 3 wheels the unique-x front wheel gets NO side arches (print `ARCH SKIP trike front`).
2. For each unique wheel (x, r) and side s in (-1, 1): cutter `R = r*1.13 + 0.3`, cutter depth `0.30*width_units`, centre `lat = s*(w0 - depth/2 + 0.5)`, `y = r`, axis lat. `round`/`flared`: cylinder; `squared`: a box 2R wide, R+r high (bottom at y=0), with a Bevel modifier 1.2 units. Add each cutter as a Boolean modifier (operation DIFFERENCE, solver 'MANIFOLD' first and 'EXACT' if the result has no faces) on the body, apply it (`apply_modifiers`), then delete the cutter. If the result has zero faces, undo by keeping a copy of the mesh from before and print `ARCH BOOL FAILED`.
3. Wheel well liner: for every cut a dark disc `cyl('archwell_%d_%s', x, r, lat_inner, R*0.98, 0.4, 'lat', mats['dark'])` at the INNER end of the cut (`lat_inner = s*(w0 - depth + 0.2)`). `flared` style adds a paint half-ring lip: a circle of minor radius 0.45 spun 180 degrees with `bmesh.ops.spin` around the lat axis, upper half only, at the outer face. Print `ARCH OK n=<number of cuts>`.
4. Create `tests/run_ca05.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details tests/fixtures/details_ok.json plus `--body loft``), requires exit 0, `RENDERED`, `ARCH OK n=4` and exactly 4 `REPORT archwell_` lines; also `docs/cars/t1_robbin.json` (three wheels, `--details none --body loft`) prints `ARCH SKIP trike front` and `ARCH OK n=4`, and `body` verts after cutting are greater than before (print both counts in the stage and compare in the shell); prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca05.sh` prints `CA05 OK`.
- `sh tests/run_ca04.sh` still prints `CA04 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA05: Wheel arches cut into the body, with dark wheel wells`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
