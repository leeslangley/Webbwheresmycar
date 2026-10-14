[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB21 Pixel stage: all sprites for one car

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB21
Needs (already merged into `dev`): CB20, CB10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One Blender call that turns the raw renders of ONE car into every game sprite (views, densities, masks, shadows, metadata), with the file names of docs/art/CARS_ALIGN.md.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixelate2.py (CB15-CB20: call its `main(argv)` in a loop, or refactor a `process(...)` function out of it)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixelate_all.py`
- `tests/run_pixelate_all.sh`

## Steps
1. Create `tools/art/pixelate_all.py` (Blender python): arguments `--id <car id> --raw build/art/raw --out assets/art/cars --color <hex> [--color2 <hex>] [--finish solid|metallic] [--qa-out build/art/qa]`. Raw inputs per view v in s, q, front: `<raw>/<id>_<v>.png`, `<raw>/<id>_<v>_mask.png`, `<raw>/<id>_<v>_sh.png`; the optional view r has the first two. Missing raw file: print the name and exit 2.
2. Outputs in `--out` (10 PNGs): view s (side), profile hero: `<id>.png`, `<id>_mask.png`, `<id>_sh.png` (the DEFAULT sprite of the car); view q, profile hero: `<id>_q.png`, `<id>_q_mask.png`, `<id>_q_sh.png` (extra); view s, profile mini: `<id>_m.png`, `<id>_m_mask.png` (no shadow); view front, profile face: `<id>_f.png`, `<id>_f_mask.png` (no shadow). When view r exists write its hero sprite to `<qa-out>/<id>_r.png` (QA only, never in assets). Write `<out>/<id>.meta.json` = `{"s": {...}, "q": {...}, "m": {...}, "f": {...}}`; each block holds the CB16/CB20 meta plus `"view"`, `"file"`, `"paint"` (the colour, lowercase), `"paint2"` (or null), `"finish"`; `lamps` is [] for m and f.
3. Create `tests/run_pixelate_all.sh`: render `tests/fixtures/dossier_ok.json` with `blender_car2.py --rig studio --samples 8 --views s,q,front,r --out /tmp/pa/dossier_ok_{v}.png --mask /tmp/pa/dossier_ok_{v}_mask.png --shadow-out /tmp/pa/dossier_ok_{v}_sh.png`; run pixelate_all into `/tmp/pa_out` (`--raw /tmp/pa --qa-out /tmp/pa_qa`); require the 10 files and `/tmp/pa_qa/dossier_ok_r.png`; that `dossier_ok.png` and `dossier_ok_q.png` pass `check_sprite.py --max-colors 32`, `dossier_ok_m.png` and `dossier_ok_f.png` pass `--max-colors 28`; that `dossier_ok_m.png` is narrower than `dossier_ok.png`; that every `_mask.png` has the size of its sprite; and that `dossier_ok.meta.json` has the 4 keys, each with `file w h ax ay ppm mask`. Print the elapsed seconds of the pixel stage on a line `PIXEL STAGE SECONDS <n>` and `PIXELATE ALL OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_pixelate_all.sh` prints `PIXELATE ALL OK` (it also prints the seconds; report them).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB21: Pixel stage: all sprites for one car`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
