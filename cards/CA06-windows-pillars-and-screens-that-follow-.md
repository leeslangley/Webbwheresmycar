[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA06 Windows, pillars and screens that follow the body surface

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA06
Needs (already merged into `dev`): CA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
V03 hides glass inside a solid slab. Make the glass lie on the curved cabin: each window polygon of the details file becomes a glass pane cut from the body shell, with chrome or black frames, and paint pillars between panes.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- tools/art/carlib.py (`extrude_polygon`)

## Files you may change (and nothing else)
- `tools/art/parts/windows.py`
- `tests/fixtures/details_windows.json`
- `tests/run_ca06.sh`

## Steps
1. `tools/art/parts/windows.py`, `@stage('windows')`. For each polygon `poly` in `details['windows']` (it is never empty: CA02 `default_details` fills it from the dossier greenhouse): build a prism with `carlib.extrude_polygon(poly, 2*width_units, glass_mat, 'prism')` (full width), duplicate the body into `shell` scaled by `(1.0, 1.008, 1.004)` about its origin (Blender scale on Y and Z), Boolean INTERSECT (EXACT) the prism with the shell, apply, name the result `window_<k>`, material `ctx['mats']['glass']` unchanged (CB01 makes it opaque dark glass, which reads best at sprite size; never use transparency). Delete prism and shell. If the intersection is empty print `WARN window_<k> empty` and continue.
2. Pillars: for each `{poly, lat_from}` in `details['pillars']`: two prisms (one per side) extruded between `lat_from*w0` and `w0*1.2` instead of full width (write `extrude_polygon_range(poly, lat0, lat1, mat, name)` in this file using bmesh like carlib), intersected with a shell scaled `(1.0, 1.012, 1.006)`, material paint, named `pillar_<k>_n` / `_f`. Frames: for each window also add a thin chrome (or black or paint per `details['window_frame']`) rim: the same intersection with a prism built from the polygon offset OUTWARD by 0.35 units (use the simple vertex-normal offset of the polygon), minus nothing: render order is frame first, glass on top (frame shell scale 1.0, 1.006, 1.003), named `frame_<k>`.
3. `tests/fixtures/details_windows.json`: version 2, id dossier_ok, belt_y 26.5, one window = the greenhouse of dossier_ok, one pillar `{"poly": [[-12,26.5],[-10,29],[-9,29],[-11,26.5]], "lat_from": 0.8}`, no parts. Create `tests/run_ca06.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details tests/fixtures/details_windows.json plus `--body loft``), requires exit 0, `RENDERED`, a `REPORT window_0` line whose dy is greater than 0.7*(`plan.width_units`) and smaller than `plan.width_units`, a `REPORT pillar_0_n` line and a `REPORT frame_0` line; also `docs/cars/t1_chimp.json` with `--body loft` and no details file (the default is used) shows at least one `REPORT window_` line; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca06.sh` prints `CA06 OK`.
- `sh tests/run_ca05.sh` still prints `CA05 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA06: Windows, pillars and screens that follow the body surface`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
