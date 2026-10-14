[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE08 Garage plate: strip lights, pegboard, bays

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE08
Needs (already merged into `dev`): GE03, GE04, GE06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Render the garage / stable background (docs/art/GE.md 'Garage'): cold strip-lit breeze-block workshop with a pegboard of tools across the top, roller shutter, tyres, oil drums, a filing cabinet and yellow parking bays painted on a concrete floor.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- docs/art/GE.md (screen zones, pipeline, palettes, lighting) and the reference prototype folder docs/art/ge_proto/ (scripts that already run and were looked at by a human: copy them and tidy, do not redesign)
- docs/art/ge_proto/roomkit2.py (functions `pegboard`, `strip_light`, `oil_drum`, `bay_marks` and the material names block, concrete floor)
- docs/art/ge_proto/room_garage.py
- tools/art/roomkit_shell.py, roomkit_furn.py, roomkit_props.py, pixelbg.py, check_room.py
- Command line: `--out <png>` (raw 1280x720 render), `--samples <n>` (default 64).

## Files you may change (and nothing else)
- `tools/art/roomkit_garage.py`
- `tools/art/room_garage.py`
- `tests/run_room_garage.sh`
- `assets/art/rooms/garage.png`

## Steps
1. `tools/art/roomkit_garage.py`: `make_materials_garage()` returning `block` (checker #6f7c76/#78857f scale 22), `conc` (noise #55575b/#6a6c70 scale 6), `peg`, `strip` (emissive #dff1ff strength 8), `drum`, `yellow`, `orange`; functions `pegboard(M, r, tools=8)`, `strip_light(M, r)`, `oil_drum(M, px, depth, h=0.9)`, `bay_marks(M, bays, d0=1.2, d1=3.2)` copied from the prototype.
2. `tools/art/room_garage.py` from the prototype `room_garage.py` (arguments `--out`, `--samples`; `transparent=False`; wall material = block, floor = conc): pegboard (40,30,1200,64) with 14 tools; three strip lights at x 200, 550, 900 (y 12, 180x12); roller door (60,150,300,300); filing cabinet (1150,300,90,190); two oil drums at 1090/0.6 and 1030/0.8; tyre stack at 470/0.9 with 4 tyres; bays (120,420),(480,780),(840,1140); three cold AREA lights at x 300, 650, 1000 (z 4.4, y -0.6, energy 260, #dff1ff) and a soft fill (energy 300).
3. `tests/run_room_garage.sh` (repo root): render to /tmp/ge08/garage_raw.png (samples 48), `pixelbg.py --width 640 --colors 80 --dither 0.2 --out assets/art/rooms/garage.png`, then `check_room.py -- assets/art/rooms/garage.png --size 640x360 --max-colors 80 --bright 150,10,200,50,120 --bright 400,560,500,100,40 --solid 0,0,1280,720` must print `ROOM OK` (tune the strip light energy by at most 30 percent if the bright checks fail; thresholds stay). Print `ROOM GARAGE OK`. Commit the PNG.

## Acceptance (all must pass; exact commands)
- `sh tests/run_room_garage.sh` prints `ROOM GARAGE OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE08: Garage plate: strip lights, pegboard, bays`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
