[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V05 Blender car v2: lamps and plates

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V05
Needs (already merged into `dev`): V04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Headlamps from the dossier's `front.headlamps`, simple tail lamps, and number plates.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- tools/art/carlib.py and blender_car2.py
- docs/CAR_DOSSIER_SPEC.md (`front.headlamps`: count, shape, x, y, r, y_offset_from_centre)

## Files you may change (and nothing else)
- `tools/art/carlib.py`
- `tools/art/blender_car2.py`
- `tests/run_blender_car2e.sh`

## Steps
1. In `carlib.py` add `build_lamps(dossier, mats)`. Headlamps: read `h = dossier.get('front', {}).get('headlamps', {})` defensively (missing or not a dict: use count 2, shape round, x 47, y 17, r 2.6, y_offset 11). For each lamp (count 1: centre; 2: at +-y_offset; 4: pairs at +-y_offset and +-0.55*y_offset): `round` = a chrome torus ring (major radius r, minor 0.22*r, axis X) plus a flattened glass sphere lens (`#fff6c0`, emission strength 1.0, scaled 0.45 along X); `square` = a chrome box 2r wide with a lens box; `oval` = a scaled sphere; `pop-up` = a flat dark box lid (the lamps are hidden); `slanted` = a tilted box. Name them `headlamp_<i>`.
2. Tail lamps: two red boxes (`#d82020`, small emission 0.5) at `x = xmin + 0.5` (the smallest x of `side_profile`), at +-(width*0.38), height `y = 0.62 * (max y of the side_profile points with x < xmin + 6)`, size 1.5 x 4 x 3 units. Number plates: a white box (`#f4f4f0`) 1.2 x 12 x 4 units on the front and rear faces at `y` = 0.35 * the body height, centred. Call `build_lamps` from `blender_car2.py`.
3. Create `tests/run_blender_car2e.sh`: renders `dossier_ok.json` with `--report`; requires exit 0, `RENDERED`, at least 2 lines starting `REPORT headlamp_`, at least 2 starting `REPORT taillamp_` and 2 starting `REPORT plate_` (name your objects that way); also renders a copy of the fixture whose `front` is the empty object `{}` and requires exit 0 (defaults used); prints `BLENDER CAR2E OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2e.sh` prints `BLENDER CAR2E OK`.
- `sh tests/run_blender_car2d.sh` still prints `BLENDER CAR2D OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V05: Blender car v2: lamps and plates`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
