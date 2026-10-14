[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE11 Desk plates: ledger and bookings (top-down desk with lamp)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE11
Needs (already merged into `dev`): GE03, GE04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two quiet desk-top backgrounds seen from above (docs/art/ge_proto/room_desk.py): the ledger on a green leather desk with a brass lamp, and the bookings desk (dark wood) with a big cream telephone and a notepad. The screens draw opaque panels over most of this, so keep both plates calm and dark; the lamp pool and props show in the margins.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- docs/art/GE.md (screen zones, pipeline, palettes, lighting) and the reference prototype folder docs/art/ge_proto/ (scripts that already run and were looked at by a human: copy them and tidy, do not redesign)
- docs/art/ge_proto/room_desk.py (variant `ledger` works; `news` shows the wood variant)
- tools/art/roomkit_shell.py, pixelbg.py, check_room.py
- Command line: `--out <png>` (raw 1280x720 render), `--samples <n>` (default 64).

## Files you may change (and nothing else)
- `tools/art/room_desk.py`
- `tests/run_room_desk.sh`
- `assets/art/rooms/ledger.png`
- `assets/art/rooms/bookings.png`

## Steps
1. `tools/art/room_desk.py` from the prototype, arguments `--out <png> --variant ledger|bookings [--samples N]` (bad variant: message and exit 2). `set_view(62.0, 20.0)`; opaque render. Ledger: green leather top #2b5a3c, open red ledger book (two pages, cream paper) at screen (560,420), brass banker's lamp with green shade at (150,200) with a warm point light (energy 500), calculator at (1150,250), mug with tea at (1100,560). Bookings: dark planks top (`tex_mat` planks #4a2c18/#6b4528), a cream telephone made of boxes (base 1.1x0.8x0.25 m, handset box on top, black dial cylinder) at screen (1180,130), a yellow notepad at (150,520), the same lamp and mug.
2. Print `PROJ lamp_bulb x y` using `project` on the lamp bulb position; it must be within 12 px of (190,135).
3. `tests/run_room_desk.sh`: for each variant render (samples 48) to /tmp/ge11/<v>_raw.png, `pixelbg.py --width 640 --colors 64 --dither 0.2 --out assets/art/rooms/<v>.png`, then `check_room.py -- assets/art/rooms/<v>.png --size 640x360 --max-colors 64 --warm 100,160,200,120,10 --calm 900,500,300,150,25 --solid 0,0,1280,720` must be `ROOM OK` for both (tune lamp energy by at most 30 percent; thresholds stay). Print `ROOM DESK OK`. Commit both PNGs.

## Acceptance (all must pass; exact commands)
- `sh tests/run_room_desk.sh` prints `ROOM DESK OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE11: Desk plates: ledger and bookings (top-down desk with lamp)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
