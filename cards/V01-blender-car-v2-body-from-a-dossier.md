[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V01 Blender car v2: body from a dossier

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V01
Needs (already merged into `dev`): A02, R00
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A new Blender car builder that reads one car dossier JSON and builds the painted body shell from its `side_profile`. Later cards add shape, glass, wheels and lights.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- docs/CAR_DOSSIER_SPEC.md (the dossier format) and tests/fixtures/dossier_ok.json (a valid example)
- tools/art/blender_car.py (the old builder: copy its helpers; it cannot be imported because it runs main() on import)

## Files you may change (and nothing else)
- `tools/art/carlib.py`
- `tools/art/blender_car2.py`
- `tests/run_blender_car2.sh`

## Steps
1. Create `tools/art/carlib.py` (no code runs on import). Copy these from `tools/art/blender_car.py` unchanged: `U = 0.1`, `hex_to_rgb`, `set_socket`, `make_mat`, `look_at`, `extrude_part` (rename it `extrude_polygon(pts, width, mat, name)`). Add `load_dossier(path)` (json.load; print a clear message and `sys.exit(2)` when the file is missing, is not JSON or lacks `id`, `side_profile`, `plan`, `wheels`) and `polygons(greenhouse)` (a list of [x,y] pairs becomes `[pairs]`; a list of lists stays). Also copy the world, lights, camera and render blocks of `main()` in blender_car.py into functions `setup_world(scene)`, `setup_lights(scene)`, `setup_camera(scene, w, h)` (it frames from the bounding box of all mesh objects), `render(scene, out, w, h)`.
2. Create `tools/art/blender_car2.py`: arguments after `--`: `--dossier <json>`, `--out <png>`, `--color <#rrggbb>` (default: the first `typical_paint` entry), `--w` (1024), `--h` (512), `--report` (flag). Bad arguments print a clear message and `sys.exit(2)` (guard every `argv[i+1]`). Steps: `bpy.ops.wm.read_factory_settings(use_empty=True)`; build the paint material with `make_mat` (metallic 0, roughness 0.25, coat 1.0); build the body with `extrude_polygon(d['side_profile'], d['plan']['width_units'], paint, 'body')`; add the shadow catcher plane like blender_car.py; call the setup functions; render; print `RENDERED <out>`. With `--report` also print one line per mesh object (skip the shadow catcher): `REPORT <name> dx=<..> dy=<..> dz=<..>` in car units (Blender metres * 10, from `obj.dimensions`).
3. Create `tests/run_blender_car2.sh` (sh): runs the script on `tests/fixtures/dossier_ok.json` with `--out /tmp/b01.png --report`, requires exit 0, the text `RENDERED`, a `REPORT body` line, and that `file /tmp/b01.png` says `1024 x 512`; runs it with `--dossier /nonexistent.json` and requires a non-zero exit and the word `dossier` in the message; prints `BLENDER CAR2 OK` at the end. Do NOT add it to `make test` (Blender is slow).

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2.sh` prints `BLENDER CAR2 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V01: Blender car v2: body from a dossier`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
