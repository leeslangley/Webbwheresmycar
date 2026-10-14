[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA22 Contact sheet: every car, three views, one picture for QA

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA22
Needs (already merged into `dev`): CA21, V07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Spark cards cannot see images; the Sonnet QA pass can. One command renders chosen cars in side, front34 and front views and tiles them into one PNG, so a whole fleet can be judged in one look.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/render_all.sh (V07) and tools/art/pixelate.py (A04, its arguments)
- tools/art/blender_car2.py (`--view` from CA21)

## Files you may change (and nothing else)
- `tools/art/montage.py`
- `tools/art/contact_sheet.sh`
- `tests/run_ca22.sh`

## Steps
1. `tools/art/montage.py` (Blender python, numpy only): `blender --background --python tools/art/montage.py -- --out sheet.png --cols 3 --cell 320x200 --bg '#2a2150' a.png b.png ...`: read each PNG with `bpy.data.images.load`, scale to fit the cell keeping aspect (nearest neighbour with numpy index maths), alpha-composite over the background colour in a grid with 8 px gutters, write RGBA PNG. Missing file: leave an empty cell and print `WARN missing <path>`.
2. `tools/art/contact_sheet.sh <out.png> <car id>...` (sh): for each id renders `docs/cars/<id>.json` three times to `/tmp/cs/<id>_{side,front34,front}.png` (`--w 640 --h 320`, `--view`), then runs montage with 3 columns (one row per car). Prints `SHEET <out> <n> cars`. `tests/run_ca22.sh` runs it for `dossier_ok` (copy `tests/fixtures/dossier_ok.json` into `docs/cars/` first and delete it afterwards) and requires the output PNG to exist, to be larger than 20000 bytes (`wc -c`) and that `file` reports PNG image data; prints `CA22 OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca22.sh` prints `CA22 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA22: Contact sheet: every car, three views, one picture for QA`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
