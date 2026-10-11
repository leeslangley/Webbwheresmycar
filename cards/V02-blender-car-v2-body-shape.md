[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V02 Blender car v2: body shape

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V02
Needs (already merged into `dev`): V01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the body look like a car body and not an extruded slab: narrower nose, tail and roof, rounded edges.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- tools/art/carlib.py and blender_car2.py (from V01)
- docs/CAR_DOSSIER_SPEC.md (the `plan` fields)

## Files you may change (and nothing else)
- `tools/art/carlib.py`
- `tools/art/blender_car2.py`
- `tests/fixtures/dossier_taper.json`
- `tests/run_blender_car2b.sh`

## Steps
1. In `carlib.py` add `shape_body(obj, plan)` called by `blender_car2.py` right after the body is built and BEFORE any modifier is added. With the mesh data (`obj.data.vertices`): let `xmin,xmax,zmin,zmax` be the vertex extents and `t = (x - xmin)/(xmax - xmin)` (0 at the tail, 1 at the nose). Scale each vertex `y` by `f = 1.0`; then `if t < 0.25: f *= 1 - (1 - tail_pct/100) * (0.25 - t)/0.25`; `if t > 0.75: f *= 1 - (1 - nose_pct/100) * (t - 0.75)/0.25` where `tail_pct = plan['tail_width_pct']`, `nose_pct = plan['nose_width_pct']` (default 100 when missing). Tumblehome: let `h = (z - zmin)/(zmax - zmin)`; if `h > 0.55` multiply `f` by `1 - k` with `k = {'low':0.04,'medium':0.10,'high':0.18}[plan.get('tumblehome','medium')]`.
2. After shaping add a Bevel modifier (width `1.2 * U`, segments 4) and a Subdivision Surface modifier (levels 1, render levels 2) to the body and set smooth shading on all polygons (as the old `extrude_polygon` did; move those lines out of `extrude_polygon` into a function `finish_mesh(obj)` and call it).
3. Create `tests/fixtures/dossier_taper.json` = a copy of `dossier_ok.json` with id `dossier_taper`, `plan.nose_width_pct` 80, `plan.tail_width_pct` 90, `plan.tumblehome` `high`. Write `tests/run_blender_car2b.sh`: renders `dossier_taper.json` with `--report` to /tmp/v02.png; requires exit 0, `RENDERED`, and a `REPORT body` line whose `dy` is at most `plan.width_units + 0.5` and at least `0.8 * plan.width_units` (read the file with python3), and whose `dx` is within 3 units of 100; prints `BLENDER CAR2B OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2b.sh` prints `BLENDER CAR2B OK`.
- `sh tests/run_blender_car2.sh` still prints `BLENDER CAR2 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V02: Blender car v2: body shape`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
