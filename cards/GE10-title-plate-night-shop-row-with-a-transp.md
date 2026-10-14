[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE10 Title plate: night shop row with a transparent sky

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE10
Needs (already merged into `dev`): GE03, GE04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Render the title-screen background (docs/art/GE.md 'Title'): a terrace of four lit shops with brick fronts and glowing windows, three lamp posts, pavement and wet road at night. The upper sky stays TRANSPARENT: the game draws gradient and twinkling stars behind it.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- docs/art/GE.md (screen zones, pipeline, palettes, lighting) and the reference prototype folder docs/art/ge_proto/ (scripts that already run and were looked at by a human: copy them and tidy, do not redesign)
- docs/art/ge_proto/roomkit2.py (`shop_front`, `lamppost`, brick/road/pave materials)
- docs/art/ge_proto/room_title.py
- tools/art/roomlib.py (`set_view(tilt, floor_py)`)
- tools/art/pixelbg.py, check_room.py
- Command line: `--out <png>` (raw 1280x720 render), `--samples <n>` (default 64).

## Files you may change (and nothing else)
- `tools/art/roomkit_title.py`
- `tools/art/room_title.py`
- `tests/run_room_title.sh`
- `assets/art/rooms/title.png`

## Steps
1. `tools/art/roomkit_title.py`: `make_materials_title()` (brick checker #6b3a30/#7a4438 scale 40, `road` #23232e rough 0.25, `pave` checker #3a3a46/#444452, `lampglow` emissive #ffc66e strength 10, `shopwin` emissive #ffb050 strength 1.1, `black`, `oakdark`); functions `shop_front(M, px0, px1, h_m, window_mat='shopwin', depth=0.0)` and `lamppost(M, px, depth, h=3.6)` (returns the lamp position) copied from the prototype (with the two window mullions).
2. `tools/art/room_title.py` from the prototype: `set_view(8.0, 640.0)` BEFORE `setup_camera`; `transparent=True`; road box y -9..1, pavement box y -2.6..-0.6 height 0.12; shop fronts (0,330) h 2.4, (330,760) h 2.0, (760,1100) h 2.6, (1100,1400) h 2.2 (low roofs: the title text sits above them); lamp posts at x 250, 700, 1180 depth 1.6, each with a warm point light (energy 900, #ffb15c); a cool moon SUN light (energy 1.6, #9db4ff) and world colour #1b1a3a strength 0.6.
3. `tests/run_room_title.sh`: render (samples 48) to /tmp/ge10/title_raw.png, `pixelbg.py --width 640 --colors 80 --dither 0.2 --out assets/art/rooms/title.png`, `check_room.py -- ... --size 640x360 --max-colors 80 --hole 0,0,1280,200 --solid 0,560,1280,60 --warm 80,520,200,50,20` must be `ROOM OK`. Print `ROOM TITLE OK`. Commit the PNG. The three lamp bulbs must land near screen (250,296), (700,296), (1180,296) (+-10 px): print `PROJ lamp0..2` using `R.project` on the returned positions and require it.

## Acceptance (all must pass; exact commands)
- `sh tests/run_room_title.sh` prints `ROOM TITLE OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE10: Title plate: night shop row with a transparent sky`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
