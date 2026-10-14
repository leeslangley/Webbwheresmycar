[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA08 Wheels v2: wire, knock-off, alloy and spare wheels

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA08
Needs (already merged into `dev`): CA07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The classic wheel styles: wire wheels with a knock-off spinner, five-spoke alloys, and the spare wheel kinds (boot lid, rear door, side well, bonnet).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- tools/art/parts/wheels_a.py (CA07: `wheel_parts`, the tyre lathe)

## Files you may change (and nothing else)
- `tools/art/parts/wheels_b.py`
- `tools/art/parts/spare.py`
- `tests/run_ca08.sh`

## Steps
1. `tools/art/parts/wheels_b.py`: `wheel_parts_extra(ctx, w, s, cfg, tyre_d)` for `wire`: rim = chrome torus (R 0.62r, minor 0.07r); hub = chrome cylinder r 0.16r; 36 spokes, each a thin chrome cylinder (radius 0.025r, running from hub radius 0.16r out to rim radius 0.62r) placed in two interleaved sets of 18, the sets tilted +8 and -8 degrees toward the lat direction so they read as cross-laced; names `spoke_<n>_<s>_<k>`. `knockoff`: wire plus a chrome 3-ear spinner (cylinder r 0.2r depth 0.1r plus a 3-bladed box 0.5r long) named `spinner_<n>_<s>`. `alloy`: disc r 0.62r in alloy material with 5 spokes (boxes 0.5r x 0.14r) over a dark disc, hub cap r 0.2r chrome.
2. `tools/art/parts/spare.py`: `@register('spare')` builds a spare wheel: tyre lathe from `wheels_a` (reuse) for radius `r` at the given x, y, lat: `mount == 'boot'` = upright against the tail, axis x; `rear_door` = upright on the rear face, axis x, at x = xmin + 1.5; `side_well` = a recess-like wheel in the front wing, axis lat, `side` both, lat = surf.half_width(x, y)-1; `bonnet` = lying flat (axis h) on the bonnet; `rear_wing` = axis lat on the rear wing. With `cover: true` add a body-coloured disc cover (paint) 0.2 thick over the face. Names `spare_<i>_<s>`, `sparecover_<i>_<s>`.
3. Create `tests/run_ca08.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details a copy of tests/fixtures/details_ok.json made by the script with `wheel.style` `wire` (and a second copy `knockoff`, a third `alloy`) plus one `spare` part (mount rear_door, x -50, y 12, r 7)`), requires exit 0, `RENDERED`, for `wire`: at least 100 lines starting `REPORT spoke_`; for `knockoff`: 4 `REPORT spinner_` lines; for `alloy`: exit 0; all three show a `REPORT spare_0_c` line; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca08.sh` prints `CA08 OK`.
- `sh tests/run_ca07.sh` still prints `CA07 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA08: Wheels v2: wire, knock-off, alloy and spare wheels`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
