[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA19 Soft tops: hood up, hood folded, vinyl roof variant

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA19
Needs (already merged into `dev`): CA18
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Convertibles in two states: hood UP (a fabric dome following the greenhouse outline) and hood DOWN (a folded fabric bag behind the seats under a tonneau). Registered as the `roof` stage.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults (`roof`)
- tools/art/carlib.py (`extrude_polygon`, `finish_mesh`)

## Files you may change (and nothing else)
- `tools/art/parts/roofs.py`
- `tests/run_ca19.sh`

## Steps
1. `tools/art/parts/roofs.py`, `@stage('roof')`, by `details['roof']['variant']`: `hard` and `open` do nothing. `soft_up`: take the union outline of all `windows` polygons (convex hull of their points, python only: monotone chain), `carlib.extrude_polygon(hull, 0.9*width_units, mats['fabric'], 'hood')`, scale lat by the tumblehome (Y scale 0.92 about centre), Bevel 1.0, Subsurf 1; add a small rear window: the window objects stay (glass) but are shrunk to the rear 22% of the hull length: build a thin glass box at the rear end of the hood named `hood_rearwindow`. `soft_down`: a fabric box (name `hood_folded`) from `fold_x0` to `fold_x1`, 0.8*width wide, 4 high, rounded (Bevel 1.0), sitting on the rear deck at `y = surf.top(mid)` plus a tonneau: a thin cover (0.5 thick) over the rear of the cockpit. `vinyl`: apply the black `vinyl` material to the roof-zone faces (re-use CA17's `paint` zone with region roof if present, else do nothing).
2. Print `ROOF <variant> OK`. Create `tests/run_ca19.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_roof_up.json` and `details_roof_down.json` (create both from the CA18 fixture: roof.variant soft_up with the greenhouse window, and soft_down with fold_x0 -30 fold_x1 -12)`), requires exit 0, `RENDERED`, `ROOF soft_up OK` with a `REPORT hood` line whose dx is between 40 and 70 (units) and `ROOF soft_down OK` with a `REPORT hood_folded` line; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca19.sh` prints `CA19 OK`.
- `sh tests/run_ca18.sh` still prints `CA18 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA19: Soft tops: hood up, hood folded, vinyl roof variant`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
