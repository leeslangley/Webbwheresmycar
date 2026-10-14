[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC19 Character manifest, contact sheets and the one-command render script

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC19
Needs (already merged into `dev`): GC16, GC17, GC18
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Glue: one shell command renders and pixelates every Mark and Dave sprite into assets/art/characters/, a manifest tells the game what exists, and a contact-sheet tool draws everything on one PNG so the visual QA pass can look at 40 frames at once.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/render_frames.py, render_heads.py, charpix.py (arguments, output names, frames.json)
- docs/characters/*.json
- src/art/sprites.js (the car manifest idea: ids are file names without .png)

## Files you may change (and nothing else)
- `tools/art/build_manifest.py`
- `tools/art/contact_sheet.py`
- `tools/art/render_chars.sh`

## Steps
1. Create `tools/art/render_chars.sh <mark|dave|all> [--fast]` (sh, `set -e`, run from the repo root). For each character use the work dir `/tmp/chars_<name>/raw`: run `render_frames.py` once per pose file of that character (mark: poses_mark_front_a, poses_mark_front_b, poses_mark_back; dave: poses_dave_front, poses_dave_back), then `render_heads.py`, all into raw; then run `charpix.py` three times, each with `--build-palette` and its own palette file `/tmp/chars_<name>/<group>_palette.json`, output to `assets/art/characters/` (create it): group body frames (`--glob '<name>_*_[0-9][0-9].png'`, `--w 144 --h 144`), group heads (`--glob '<name>_head_*.png'`, `--w 80 --h 80`), group busts (`--glob '<name>_bust_*.png'`, `--w 96 --h 96`). `--fast` passes `--limit 2` to the render scripts. Print `RENDER_CHARS DONE <name> files=<count of PNGs written for that name>`.
2. Create `tools/art/build_manifest.py` (python3 standard library only). `python3 tools/art/build_manifest.py [--customers <customers_frames.json>]` reads every `/tmp/chars_<name>/raw/frames_*.json` for name in mark, dave (skip missing), the pose files (fps, loop, hold, view per clip) and the PNG file list in assets/art/characters, and writes `assets/art/characters/manifest.json`: `{"version":1,"scale":{"world":2,"bust":2},"characters":{"mark":{"frame":{"w":144,"h":144},"head":{"w":80,"h":80,"pivot":[40,66]},"clips":{"idle":{"view":"front","fps":3,"loop":true,"hold":0,"frames":[{"id":"mark_idle_00","neck":[72,75],"angle":"fwd"}]}},"heads":{"neutral":{"fwd":"mark_head_fwd_neutral"}},"head_back":"mark_head_back","bust":{"w":96,"h":96},"busts":{"neutral":"mark_bust_neutral"}},"dave":{}},"customers":{}}`. Only ids whose PNG exists are listed (clip frames with a missing PNG are dropped). `--customers` reads a json `{"cust_<job>_v<k>": {"w":..,"h":..}}` (as written by render_customers.py) and fills `customers[<job>] = {"variants": n, "w", "h", "ids": [sorted ids]}` (parse the id with the regex `^cust_(.+)_v(\d+)$`, only ids whose PNG exists); without `--customers` an existing `customers` block in the old manifest is kept. Print `MANIFEST OK clips=<n> frames=<n> heads=<n> busts=<n> customers=<n>`.
3. Create `tools/art/contact_sheet.py` (Blender python with numpy): arguments `--dir assets/art/characters --prefix mark_idle --cols 6 --scale 3 --out <png> [--bg #2b2550]`: loads every PNG whose name starts with the prefix, in name order, pastes them in a grid (nearest-neighbour scaled by `--scale`, background colour filled, 4 px gaps) and writes the sheet; `--composite`: instead load `manifest.json`, and for each frame of the clip named by `--prefix` (e.g. `mark_idle`) paste the head sprite (`heads.neutral.<frame angle>` or `head_back`) onto the body frame so the head pivot pixel sits on the frame's neck pixel, then grid them. Prints `SHEET OK n=<count> size=<w>x<h>`.
4. Test: `sh tools/art/render_chars.sh mark --fast` completes; then `python3 tools/art/build_manifest.py` prints `MANIFEST OK` with clips>0; `/opt/homebrew/bin/blender --background --python tools/art/contact_sheet.py -- --dir assets/art/characters --prefix mark_idle --cols 6 --scale 3 --out /tmp/gc19.png` prints `SHEET OK`. Do NOT commit the generated `assets/art/characters/*.png` of the --fast run (git checkout them away); commit only the three scripts.

## Acceptance (all must pass; exact commands)
- `sh tools/art/render_chars.sh mark --fast` ends with `RENDER_CHARS DONE mark files=` and `python3 tools/art/build_manifest.py` prints `MANIFEST OK`.
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/contact_sheet.py -- --dir assets/art/characters --prefix mark_idle --cols 6 --scale 3 --out /tmp/gc19.png` prints `SHEET OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC19: Character manifest, contact sheets and the one-command render script`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
