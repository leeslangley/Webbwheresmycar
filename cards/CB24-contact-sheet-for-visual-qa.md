[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB24 Contact sheet for visual QA

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB24
Needs (already merged into `dev`): CB21
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One picture of every car (the default side view first; sprite on a dark-purple floor with its shadow) so the planner and the Sonnet QA loop can look at all 31 cars at once and send fix notes. The file is NOT called contact_sheet.py: card GC19 owns that name for the characters.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixelate.py (`load_rgba`/`save_rgba` pattern), the file naming of CB21 (`<id>.png`, `<id>_sh.png`, `<id>.meta.json`)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/carsheet.py`
- `tests/run_carsheet.sh`

## Steps
1. Create `tools/art/carsheet.py` (Blender python). Arguments `-- --dir assets/art/cars --out build/art/sheet.png [--scale 2] [--bg #4b5873] [--cols 4] [--variant s|q|m|f|r] [--ids a,b]`. Variants: `s` (default, the side view) = `<id>.png`, `q` = `<id>_q.png`, `m` = `<id>_m.png`, `f` = `<id>_f.png`, `r` = `<id>_r.png` (the rear QA view: use `--dir build/art/qa`). Ids: `--ids`, else every `<id>` that has `<dir>/<id>.meta.json` (variant `r`: every `<id>_r.png`), sorted. Cell size = the biggest sprite's size times scale plus a 12 px margin; draw the shadow first (`<id>_sh.png` for s, `<id>_q_sh.png` for q, none for the others), alpha-blended, then the sprite, nearest-neighbour upscaled by `scale`; cells in `cols` columns on the background colour (sRGB hex written as is); a missing variant file leaves the cell as plain background. No text drawing.
2. Print `SHEET OK n=<cars drawn> size=<w>x<h> out=<path>`; no cars found: print a message and exit 2. Output via the same RGBA PNG writing as pixelate.py.
3. Create `tests/run_carsheet.sh`: Blender fixture (inline in the shell script via a heredoc written to /tmp) creating 3 fake cars in `/tmp/cs_dir` (`a.png` 20x10, `b.png` 30x12, `c.png` 25x25, each with a `.meta.json` containing `{}` and a `_sh.png` of the same size with alpha 90); run with `--cols 2 --scale 2`; require `SHEET OK n=3` and that the PNG size is exactly `(2 * (cellw) )` wide and `(2 * cellh)` tall where cell = 30*2+12 by 25*2+12 plus no outer margin (check with `file`); `--variant q` on this folder (no `_q.png` files) draws plain cells and still prints `SHEET OK n=3`; `--ids zzz` gives `n=0` and exit 2. Print `CARSHEET OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_carsheet.sh` prints `CARSHEET OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB24: Contact sheet for visual QA`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
