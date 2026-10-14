[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE12 Build every room plate and write the manifest

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE12
Needs (already merged into `dev`): GE07, GE08, GE09, GE10, GE11
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One command that re-renders every room plate and writes `assets/art/rooms/manifest.json` which the game loads: `{ "office": {"file":"office.png","w":640,"h":360,"scale":2,"front":"office_front.png"}, "garage": {...} }`.

## Read first
- tests/run_room_office.sh, run_room_garage.sh, run_room_auction.sh, run_room_title.sh, run_room_desk.sh (the exact render + pixelbg + check commands for each room)
- tools/art/render_all.sh does not exist yet for cars: this script only handles rooms

## Files you may change (and nothing else)
- `tools/art/build_rooms.sh`
- `tests/run_build_rooms.sh`
- `assets/art/rooms/manifest.json`

## Steps
1. `tools/art/build_rooms.sh [room]` (sh, repo root): rooms are `office garage auction title ledger bookings`; with an argument it does only that room. For each room run the SAME render, pixelbg and check_room commands as its test script (copy them; office also renders the `--front` layer), writing PNGs to `assets/art/rooms/`. Print `OK <room>` or `FAIL <room>`; keep going; exit 1 if any failed.
2. At the end write the manifest with python3 (standard library only): for every png that exists read its width and height from the PNG header (`struct.unpack('>II', data[16:24])`) and write `{ id: {file, w, h, scale: 2} }` (plus `front` for office when `office_front.png` exists), keys sorted, 1-space indent. Print `MANIFEST <n> rooms`.
3. `tests/run_build_rooms.sh`: runs `sh tools/art/build_rooms.sh title` (just one room, fast) and requires `OK title` and `MANIFEST`; then validates that `assets/art/rooms/manifest.json` parses with python3 and every listed file exists and every entry has w 640, h 360, scale 2. Prints `BUILD ROOMS OK`. Run the full `sh tools/art/build_rooms.sh` once yourself and commit the resulting manifest.json.

## Acceptance (all must pass; exact commands)
- `sh tests/run_build_rooms.sh` prints `BUILD ROOMS OK`.
- `python3 -c "import json;d=json.load(open('assets/art/rooms/manifest.json'));print(sorted(d))"` prints the six ids ['auction', 'bookings', 'garage', 'ledger', 'office', 'title'].
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE12: Build every room plate and write the manifest`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
