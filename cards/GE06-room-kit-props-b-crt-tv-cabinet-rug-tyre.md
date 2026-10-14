[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE06 Room kit: props B (CRT TV, cabinet, rug, tyres, plant, roller door)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE06
Needs (already merged into `dev`): GE04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The second set of reusable props: the big cream CRT television whose screen is left near-black for the game to draw on, the TV cabinet with a video recorder, rug, tyre stack, potted plant and the garage roller door.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- tools/art/roomlib.py and tools/art/roomkit_shell.py
- docs/art/ge_proto/roomkit.py ('furniture B' section)

## Files you may change (and nothing else)
- `tools/art/roomkit_props.py`
- `tests/run_roomkit_props.sh`

## Steps
1. Create `tools/art/roomkit_props.py` with `crt_tv(M, housing, screen)`, `tv_cabinet(M, r, vhs=True)`, `rug(M, px0, px1, d0, d1)`, `tyre_stack(M, px, depth, n=3)`, `potted_plant(M, px, depth)`, `roller_door(M, r, ribs=8)` copied from the prototype. Object names stay: tv_body, tv_bez, tv_scr, tv_cab, rug, gd, gd_sign.
2. Create `tests/run_roomkit_props.sh` (sh, repo root): Blender `--python-expr` builds `crt_tv(M,(450,170,350,262),(482,196,286,210))`, `tv_cabinet(M,(452,432,346,60))`, `rug(M,430,850,0.7,2.9)`, `tyre_stack(M,1200,1.0)`, `potted_plant(M,1070,0.5)`, `roller_door(M,(1086,182,158,306))` and prints `PROJ <name> x0 x1 y0 y1` as in GE05 for tv_scr, tv_body, tv_cab, rug, gd.
3. Require (+-3 px): tv_scr x 482..768, y 196..407; tv_body x 450..800, y 170..446; tv_cab x 452..798, y 432..507; rug x 430..850, y 497..560; gd x 1086..1244, y 182..490. Print `ROOMKIT PROPS OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_roomkit_props.sh` prints `ROOMKIT PROPS OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE06: Room kit: props B (CRT TV, cabinet, rug, tyres, plant, roller door)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
