[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD09 Room checker: --wide option (rectangles in stage px, negative x allowed)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD09
Needs (already merged into `dev`): GE03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Teach the numeric room checker about wide plates: `--wide 144` means the plate covers screen x -144..1424, so `--solid -144,0,144,720` is the whole left strip. Without `--wide` nothing changes. ORDER: after GE03. WD10 uses it.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- tools/art/check_room.py (GE03: the option loop, `sx, sy = w / 1280.0, h / 720.0`, the `x0, y0, rw, rh = ...` line)
- tests/run_pixelbg.sh (GE03: how it makes a synthetic PNG with `blender --background --python-expr` and how it checks the checker's exit code 2: copy both methods)
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy; no PIL.

## Files you may change (and nothing else)
- `tools/art/check_room.py`
- `tests/run_check_room_wide.sh`

## Steps
1. `tools/art/check_room.py`: add the default `'--wide': '0'` to the `opts` dict (the existing key/value loop already accepts it). After `ew, eh` is computed set `bleed = int(opts['--wide'])` and replace `sx, sy = w / 1280.0, h / 720.0` by `sx, sy = w / float(1280 + 2 * bleed), h / 720.0`. In the per-check line use `x0 = int((v[0] + bleed) * sx)` (instead of `int(v[0] * sx)`); the other three numbers of that line stay. Update the usage comment at the top to mention `[--wide <bleed px>]` and that rectangles are screen px of the 1280 stage (x may be negative with --wide).
2. `tests/run_check_room_wide.sh` (sh, repo root): make a synthetic 784x360 opaque PNG with Blender numpy (`a[:,:,3]=1; a[:,:,1]=0.6; a[:,:72,:3]=(1,0,0); a[:,712:,:3]=(0,0,1)`: red left 72 columns, blue right 72 columns, green-ish between) saved to /tmp/wd09_syn.png (rows are bottom-up in Blender, but every row is the same).
3. Require `ROOM OK` from `check_room.py -- /tmp/wd09_syn.png --size 784x360 --max-colors 8 --wide 144 --warm -144,0,144,720,100 --cold 1280,0,144,720,100 --solid -144,0,1568,720`. Require exit code 2 and `ROOM FAIL` from the same file with `--wide 144 --cold -144,0,144,720,100` (the left strip is red, not blue). Require that WITHOUT `--wide` the old behaviour holds: `--size 784x360 --max-colors 8 --solid 0,0,1280,720` is `ROOM OK`. Print `CHECKROOM WIDE OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_check_room_wide.sh` prints `CHECKROOM WIDE OK`.
- `sh tests/run_pixelbg.sh` still prints `PIXELBG OK` (GE03's own test, if it is merged).
- `grep -c "'--wide'" tools/art/check_room.py` prints 1 or more.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- tools/art/pixelbg.py and the room scripts.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD09: Room checker: --wide option (rectangles in stage px, negative x allowed)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
