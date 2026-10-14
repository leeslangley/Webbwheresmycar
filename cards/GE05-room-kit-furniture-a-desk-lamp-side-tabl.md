[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE05 Room kit: furniture A (desk, lamp, side table, cabinet, chair)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE05
Needs (already merged into `dev`): GE04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Furniture props as functions that place themselves by screen-pixel rectangles, so the 3D room lines up with the game's hit areas.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- tools/art/roomlib.py and tools/art/roomkit_shell.py
- docs/art/ge_proto/roomkit.py ('furniture A' section)

## Files you may change (and nothing else)
- `tools/art/roomkit_furn.py`
- `tests/run_roomkit_furn.sh`

## Steps
1. Create `tools/art/roomkit_furn.py` with `desk(M, px0, px1, depth=0.9, h=1.0)`, `desk_lamp(M, px, depth, h_desk=1.08, shade='green')` (returns the bulb position tuple), `side_table(M, px0, px1, d0=0.15, d1=0.65, h=0.85)`, `filing_cabinet(M, r, drawers=3)`, `swivel_chair(M, px, depth, seat_mat)` copied from the prototype. Object names must stay: desk_top, desk_l, lamp_bulb, st_top, st_l, cab, and chair parts `c_stem c_base c_seat c_back` (the office render hides or shows chairs by the `c_` prefix).
2. Create `tests/run_roomkit_furn.sh` (sh, repo root): Blender `--python-expr`: reset, `setup_camera`, `M=make_materials()`, `desk(M,40,410)`, `desk_lamp(M,388,0.4)`, `side_table(M,815,945)`, `filing_cabinet(M,(960,250,100,235))`, `swivel_chair(M,555,1.9,R.mat('c','#5a2c4d',0.7))`; for each named object print `PROJ <name> x0 x1 y0 y1` (rounded min and max of `R.project(sc, obj.matrix_world @ v.co)` over its vertices).
3. Require (each within +-3 px): desk_top x 40..410, y 378..411; desk_l y max 505; lamp_bulb y centre (mean of min and max) 328; st_top x 810..950, y 396..416; cab x 960..1060, y 250..502; c_back x 521..589, y 392..465. Print `ROOMKIT FURN OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_roomkit_furn.sh` prints `ROOMKIT FURN OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE05: Room kit: furniture A (desk, lamp, side table, cabinet, chair)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
