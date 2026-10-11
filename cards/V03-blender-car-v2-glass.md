[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V03 Blender car v2: glass

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V03
Needs (already merged into `dev`): V02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the windows (the greenhouse) as tinted glass inside the body.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- tools/art/carlib.py and blender_car2.py
- docs/CAR_DOSSIER_SPEC.md (`greenhouse`)

## Files you may change (and nothing else)
- `tools/art/carlib.py`
- `tools/art/blender_car2.py`
- `tests/run_blender_car2c.sh`

## Steps
1. In `carlib.py` add `build_glass(dossier, body_obj, mats)`: for each polygon from `polygons(dossier['greenhouse'])` call `extrude_polygon(poly, width, mats['glass'], 'glass%d' % i)` with `width = dossier['plan']['width_units'] * 0.86` (so the glass sits inside the narrower roof), then `finish_mesh` with a smaller bevel (0.4 * U). Add a glass material `make_mat('glass', hex_to_rgb('#a8d0e0'), roughness=0.03, alpha=0.32, blend='BLEND')` to the `mats` dict used by blender_car2.py (read how make_mat takes its arguments).
2. For `roof['type']` equal to `soft-top-up` also give the greenhouse polygons a dark fabric material (`#1c1c20`, roughness 0.9) instead of glass. Call `build_glass` from `blender_car2.py` after the body.
3. Create `tests/run_blender_car2c.sh`: renders `tests/fixtures/dossier_ok.json` with `--report`, requires exit 0, `RENDERED`, at least one `REPORT glass0` line whose dy is smaller than the `REPORT body` dy, and prints `BLENDER CAR2C OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2c.sh` prints `BLENDER CAR2C OK`.
- `sh tests/run_blender_car2.sh` prints `BLENDER CAR2 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V03: Blender car v2: glass`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
