[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA20 Per-car Blender modules for the truly unique features

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA20
Needs (already merged into `dev`): CA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Some features need real geometry no generic part gives (a Mini's external door hinges, a Reliant's single fork wheel, a Beetle's spare in the nose, a DeLorean's gullwings later). Add a loader that runs `tools/art/cars/<id>.py` if it exists, plus one example module.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- tools/art/parts/__init__.py (`run_car_module(ctx)` is a no-op hook from CA03)

## Files you may change (and nothing else)
- `tools/art/parts/carmodule.py`
- `tools/art/cars/__init__.py`
- `tools/art/cars/t1_cooker.py`
- `tests/run_ca20.sh`

## Steps
1. `tools/art/cars/__init__.py` empty. `tools/art/parts/carmodule.py`: `@stage('finish')` is NOT used; instead replace the no-op `run_car_module` in `parts/__init__.py` by calling `parts.carmodule.run(ctx)` (edit only that line: allowed here). `run(ctx)`: `id = ctx['dossier']['id']`; if `tools/art/cars/<id>.py` exists, `importlib.import_module('cars.' + id)` (add `tools/art` to sys.path first) and call `module.build(ctx)` in try/except (print `WARN carmodule <id>: <error>`, continue); print `CARMODULE <id> OK` on success, nothing when there is no module.
2. `tools/art/cars/t1_cooker.py`: `build(ctx)`: external door hinges on each side: two chrome boxes (0.8 x 2.2 x 0.9) at the door front edge x 24.3, `y` 13 and 22, `lat = s*(surf.half_width(24.3, y)+0.3)` named `hinge_<k>_<s>`; and two round driving lamps (chrome rim + white lens, r 2.0) on the grille at x 49.4, y 12, lat +-8 (named `cooperlamp_<s>`). Use the `_common` helpers (`box`, `torus`, `sphere`) and `ctx['mats']`.
3. `tests/run_ca20.sh`: renders `docs/cars/t1_cooker.json` with `--details tests/fixtures/details_ok.json` (the module runs because details are loaded; the id inside the details file need not match) and requires `CARMODULE t1_cooker OK`, 4 `REPORT hinge_` lines and 2 `REPORT cooperlamp_` lines; a render of `dossier_ok.json` prints no `CARMODULE`; prints `CA20 OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca20.sh` prints `CA20 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA20: Per-car Blender modules for the truly unique features`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
