[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA15 Number plates and exhaust pipes

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA15
Needs (already merged into `dev`): CA03, CA02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
British plates (white front, yellow rear, with a thin black border and fake lettering stripes) and the exhaust styles. Registers `plate`, `exhaust`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/plates_exhaust.py`
- `tests/run_ca15.sh`

## Steps
1. `tools/art/parts/plates_exhaust.py`: `@register('plate')`: `w`, `h` units; front at `x = surf.xmax - 0.2`, rear at `surf.xmin + 0.2` (face the right way: a thin box 0.4 deep), colour white (`plate_white`) or yellow (`plate_yellow`) from `part['colour']` (rear default yellow); a black border (4 thin boxes 0.25) and 6 black 'letter' bars (box 0.5 wide x 0.45*h high) evenly spaced at 70% of the width, so the plate reads as lettering from far away. Names `plate_<i>_<end>` (REPORT line needed).
2. `@register('exhaust')`: end pipe at `x = surf.xmin - 0.8` going forward under the body: chrome cylinder (axis x) radius `r`, length 4, with a dark inner disc; `round` one pipe at `lat = s*part['lat']` (default near side); `oval` = a pipe scaled 1.5 wide; `twin` = two pipes at lat +-3.5; `quad` = four pipes at lat +-2.5 and +-6 with `y` 1 unit apart; `sidepipe` = a long chrome pipe along the sill, x from -22 to 20, `y = 4.5`, lat = `surf.half_width(0, 5) + 1.2`, with three small chrome clamps. Names `exhaust_<i>_<k>`.
3. Create `tests/run_ca15.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_plates.json` (create it: dossier_ok, plates front white and rear yellow, exhausts round, twin, quad and sidepipe)`), requires exit 0, `RENDERED`, 2 `REPORT plate_` lines with dy within 1 of 12, and at least 8 lines starting `REPORT exhaust_` (1+2+4+1 pipes); prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca15.sh` prints `CA15 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA15: Number plates and exhaust pipes`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
