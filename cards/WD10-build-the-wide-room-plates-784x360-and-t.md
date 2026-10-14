[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD10 Build the wide room plates (784x360) and their manifest

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD10
Needs (already merged into `dev`): GE12, WD08, WD09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One command that renders every room plate on the 1568x720 frame, pixelates it to 784x360 and writes `assets/art/rooms/wide/<id>.png` plus `assets/art/rooms/wide/manifest.json`, which WD07's loader reads before the narrow manifest. Narrow plates (GE12's `assets/art/rooms/*.png`) stay untouched, so nothing of GE12 or its tests changes. ORDER: after GE12 (all room scripts exist), WD08, WD09. The planner looks at the pictures afterwards; the strips are generated, not designed, so QA may ask for per-room tweaks (a prop standing within 20 px of the old edge gets stretched).

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- tools/art/build_rooms.sh and tests/run_build_rooms.sh (GE12: copy its structure, loop and manifest writer) and the room test scripts tests/run_room_office.sh, run_room_garage.sh, run_room_auction.sh, run_room_title.sh, run_room_desk.sh (the exact render, pixelbg and check_room commands per room)
- tools/art/roomwide.py (WD08) and tools/art/check_room.py (WD09: `--wide 144`)
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy; no PIL.

## Files you may change (and nothing else)
- `tools/art/build_rooms_wide.sh`
- `tests/run_build_rooms_wide.sh`
- `assets/art/rooms/wide/manifest.json`

## Steps
1. `tools/art/build_rooms_wide.sh [room]` (sh, repo root, `mkdir -p assets/art/rooms/wide /tmp/wd10`; rooms `office garage auction title ledger bookings`; with an argument only that room). For each room render with the wide driver using the SAME room script, arguments and sample count as its GE test script: `$BLENDER --background --python-exit-code 1 --python tools/art/roomwide.py -- tools/art/room_<x>.py --out /tmp/wd10/<id>_raw.png --samples 48` (ledger and bookings use `room_desk.py` with `--variant ledger` or `--variant bookings`; office also renders `--front` into `/tmp/wd10/office_front_raw.png`). Then `$BLENDER --background --python tools/art/pixelbg.py -- --in <raw> --out assets/art/rooms/wide/<id>.png --width 784 --colors <C> --dither <D>` with: office 96 0.22 (front plate `office_front.png`: 32 colours), garage 80 0.2, auction 96 0.22, title 80 0.2, ledger 64 0.2, bookings 64 0.2.
2. After each pixelbg run `check_room.py -- <png> --size 784x360 --wide 144 --max-colors <C>` plus these strip checks (stage px): office, garage, auction, ledger, bookings: `--solid -144,0,144,720 --solid 1280,0,144,720` (both strips fully opaque); title: `--hole -144,0,144,200 --hole 1280,0,144,200 --solid -144,560,144,60 --solid 1280,560,144,60` (open sky, shops and road continue); office front plate: `--size 784x360 --wide 144 --max-colors 32 --hole -144,0,1568,300`. Print `OK <room>` or `FAIL <room>`; keep going; exit 1 if any failed. Do not change thresholds; if a strip check fails report which room and the numbers (STATUS: BLOCKED), because that means a room script has a gap the driver cannot stretch.
3. At the end write `assets/art/rooms/wide/manifest.json` with python3 (standard library only, same as GE12): for every `<id>.png` that exists read width and height from the PNG header and write `{id: {file, w, h, scale: 2}}` plus `front` for office when `office_front.png` exists; keys sorted, 1-space indent. Print `MANIFEST <n> rooms`.
4. `tests/run_build_rooms_wide.sh`: run `sh tools/art/build_rooms_wide.sh title` and require `OK title` and `MANIFEST`; then validate with python3 that every entry of the manifest has w 784, h 360, scale 2 and its file exists next to the manifest. Print `BUILD ROOMS WIDE OK`. Run the FULL `sh tools/art/build_rooms_wide.sh` once yourself and commit the six or seven PNGs (about 100 to 250 KB each) and the manifest; paste the `colors=` and `size=` numbers check_room printed per room into your summary.

## Acceptance (all must pass; exact commands)
- `sh tests/run_build_rooms_wide.sh` prints `BUILD ROOMS WIDE OK`.
- `python3 -c "import json;d=json.load(open('assets/art/rooms/wide/manifest.json'));print(sorted(d))"` prints the six ids ['auction', 'bookings', 'garage', 'ledger', 'office', 'title'].
- `python3 -c "import json;d=json.load(open('assets/art/rooms/wide/manifest.json'));print(set((v['w'],v['h']) for v in d.values()))"` prints {(784, 360)}.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- assets/art/rooms/*.png and assets/art/rooms/manifest.json (GE12's narrow plates stay as they are).
- Room scripts and roomlib.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD10: Build the wide room plates (784x360) and their manifest`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
