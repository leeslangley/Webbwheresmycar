[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V04 Blender car v2: wheels

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V04
Needs (already merged into `dev`): V03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the wheels from the dossier's `wheels` list, with a different rim for each `style`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- tools/art/carlib.py and blender_car2.py
- docs/CAR_DOSSIER_SPEC.md (`wheels`: x, r, style)

## Files you may change (and nothing else)
- `tools/art/carlib.py`
- `tools/art/blender_car2.py`
- `tests/run_blender_car2d.sh`

## Steps
1. In `carlib.py` add `build_wheels(dossier, mats)`. `width = plan.width_units`. For each wheel `w` (read `w['x']`, `w['r']`, `w.get('style','steel')`) and each side `s` in (-1, +1) (when the dossier has 3 wheels, the single front or rear wheel in the list whose `x` is unique is placed ONLY at y=0): tyre = cylinder (axis along Y) radius `r*U`, depth `max(2.2, 0.8*r)*U`, at `x=w.x*U, y=s*(width/2 - depth_in_units/2 - 0.4)*U, z=r*U`, tyre material, with a Bevel (0.5 U) modifier; rim = a cylinder radius `0.62*r*U`, depth a little more than the tyre, material `chrome`; style `wire`: add 24 thin spokes (cylinders radius 0.05*r*U) rotated around the Y axis; `alloy`: 5 box spokes; `knockoff`: a cone centre nut in chrome; `steel`/anything else: a hub disc in chrome with a small dark centre. Name the objects `tyre_<i>_<side>` and `rim_<i>_<side>`.
2. Add `build_wheels` to the call sequence in `blender_car2.py` (after the glass) and make `mats` contain `tyre` (`#101014`, roughness 0.9) and `chrome` (`#e8e8ee`, metallic 1.0, roughness 0.08).
3. Create `tests/run_blender_car2d.sh`: renders `tests/fixtures/dossier_ok.json` with `--report`; requires exit 0, `RENDERED`, and exactly 4 lines starting `REPORT tyre_` (2 wheels x 2 sides) for that fixture; prints `BLENDER CAR2D OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2d.sh` prints `BLENDER CAR2D OK`.
- `sh tests/run_blender_car2c.sh` still prints `BLENDER CAR2C OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V04: Blender car v2: wheels`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
