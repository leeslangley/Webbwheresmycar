[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA10 Rear lamps: round, rectangular, vertical, cat-eye, fin, wrap-round

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA10
Needs (already merged into `dev`): CA03, CA02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The tail lamp is the other half of a classic's identity. Registers `taillamp`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/lamps_rear.py`
- `tests/run_ca10.sh`

## Steps
1. `tools/art/parts/lamps_rear.py`: `@register('taillamp')`: size `w` (along lat), `h` (height), placed at `(x, y, lat)`, set on the surface: lamp x = `max(part x, xmin+0.2)`. Shapes: `rect` = chrome frame box (w+0.5, h+0.5, depth 0.7) + red lens box (w, h, depth 0.8, `lamp_red`); `round` = chrome torus R w/2 + red lens sphere flattened to 0.4 deep; `vertical` = same as rect with w and h swapped when w > h; `cat_eye` = ellipsoid red lens (rl w/2, rh h/2) pointing up-outward (rotate 25 degrees about the x axis) with a chrome rim; `fin` = a tall narrow red box (w, h*1.8) following the fin tip: bottom red lens plus a small amber top segment (`lamp_amber`, height h*0.35); `wrap` = a red box that wraps the rear corner: width w and an extra side box on the flank 0.6*w long at `lat = surf.half_width(x, y)`.
2. Add a `ctx['mult']('eyes')`-free size (tail lamps are NOT scaled by the caricature factor). Names `taillamp_<i>_<s>`, lens `taillamp_<i>_<s>_lens`. If the part has no `side` (both) and `lat` is 0 print `WARN taillamp centre` and still build one.
3. Create `tests/run_ca10.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_lamps_rear.json` (create it: one taillamp part per shape (6 shapes) at x -50, y 14, lat 8, w 3, h 2, with y values 14 to 24 so they stack)`), requires exit 0, `RENDERED`, at least 12 `REPORT taillamp_` lines (6 shapes x 2 sides) and no `WARN` line; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca10.sh` prints `CA10 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA10: Rear lamps: round, rectangular, vertical, cat-eye, fin, wrap-round`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
