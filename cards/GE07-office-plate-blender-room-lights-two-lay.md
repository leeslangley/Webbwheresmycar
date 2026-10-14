[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE07 Office plate: Blender room, lights, two layers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE07
Needs (already merged into `dev`): GE03, GE05, GE06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Render the office hub tableau (see docs/art/GE.md 'Office') as two pixel-art layers: `office.png` (the whole room, window opening transparent so the game can draw a moving sky behind it, TV screen near-black) and `office_front.png` (only the two swivel chairs, drawn OVER the characters who sit in them seen from behind).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- docs/art/GE.md (screen zones, pipeline, palettes, lighting) and the reference prototype folder docs/art/ge_proto/ (scripts that already run and were looked at by a human: copy them and tidy, do not redesign)
- docs/art/ge_proto/room_office.py (the assembly script: layout rects, props and the four lights are all in it)
- tools/art/pixelbg.py and tools/art/check_room.py (GE03)
- Command line: `--out <png>` (raw 1280x720 render), `--samples <n>` (default 64).

## Files you may change (and nothing else)
- `tools/art/room_office.py`
- `tests/run_room_office.sh`
- `assets/art/rooms/office.png`
- `assets/art/rooms/office_front.png`

## Steps
1. Create `tools/art/room_office.py` from the prototype: imports `roomlib`, `roomkit_shell`, `roomkit_furn`, `roomkit_props`; arguments `--out <png> [--samples N] [--front]`; same layout constants WINDOW, POSTER, BOARD, TV_HOUSING, TV_SCREEN, TV_CAB, CABINET, GARAGE, KETTLE_TABLE, DESK, LAMP_X; the same props, bunting, four lights (sun through the blinds #ffe2b8 energy 2.6, warm desk lamp point light #ffab55 energy 360, cool TV area light #78b4ff energy 260, soft fill #ffe6c8 energy 500) and the layer logic (`--front` renders only objects whose name starts with `c_`; the default pass hides them). The prototype's final `PROJ` prints for the named objects can stay. `setup_render(..., transparent=True)`. Print `RENDERED <out>`.
2. `tests/run_room_office.sh` (sh, repo root, `mkdir -p assets/art/rooms /tmp/ge07`): back pass `... room_office.py -- --out /tmp/ge07/office_raw.png --samples 64`, then `... pixelbg.py -- --in /tmp/ge07/office_raw.png --out assets/art/rooms/office.png --width 640 --colors 96 --dither 0.22`; front pass with `--front`, then pixelbg with `--colors 32 --out assets/art/rooms/office_front.png`.
3. Then check the back plate: `check_room.py -- assets/art/rooms/office.png --size 640x360 --max-colors 96 --hole 40,275,60,38 --solid 600,100,100,40 --dark 482,196,286,210,16 --warm 330,300,120,60,30 --calm 0,0,1280,90,12 --bright 300,500,300,100,60` and require `ROOM OK`. (If a number fails, tune the matching light energy or colour in room_office.py by at most 30 percent and render again; do not edit the thresholds.) Check the front plate: `--size 640x360 --max-colors 32 --hole 0,0,1280,300 --solid 530,410,50,40` must be `ROOM OK`. Print `ROOM OFFICE OK`.
4. Both PNGs are committed (about 100 to 250 KB each). Say in your summary: the `colors=` and `lum=` numbers that check_room printed. The planner looks at the pictures afterwards.

## Acceptance (all must pass; exact commands)
- `sh tests/run_room_office.sh` prints `ROOM OFFICE OK`.
- `file assets/art/rooms/office.png assets/art/rooms/office_front.png` shows two PNGs of `640 x 360`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE07: Office plate: Blender room, lights, two layers`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
