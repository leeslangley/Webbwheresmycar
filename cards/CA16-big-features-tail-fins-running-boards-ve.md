[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA16 Big features: tail fins, running boards, vents and scoops, racks

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA16
Needs (already merged into `dev`): CA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The silhouette-defining extras of classic cars. Registers `fin`, `running_board`, `vent`, `rack`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/features.py`
- `tests/run_ca16.sh`

## Steps
1. `tools/art/parts/features.py`: `@register('fin')`: on each rear wing edge, a tapered blade from `x` to `x2` (tip at `x2` toward the tail), base on the wing top `y`, rising `h` units, thickness `thick`, lateral position `surf.half_width(x, y) - thick`; built from a bmesh triangle/quad prism (blade: triangle rising to the tip; fin: quad with a swept back edge; rocket: blade plus a red cone lamp 1.2 radius at the tip). Name `fin_<i>_<s>`.
2. `@register('running_board')`: a flat box from `x` to `x2`, `w` wide, 0.6 thick at height `y`, `lat = s*(half_width(x, y)+w/2-0.3)`, material black (rubber) / chrome / paint, with a chrome edge strip on the outer edge. `@register('vent')`: `where` side = `n` louvres: thin dark boxes `w` x 0.3 spaced `h/n` apart on the flank; bonnet / boot / engine_lid = louvres on the top (`y = surf.top(x)`), lying across the lid; `scoop` = a wedge (box with one end raised `h`, open dark face) on the bonnet; `bulge` = an ellipsoid raised 1.2 on the bonnet; `gill` = `n` slanted chrome slits; `grille_rect` = a dark box with 4 chrome bars. Names `vent_<i>_<s>`, louvres `vent_<i>_<s>_<k>`.
3. `@register('rack')`: roof = a rail frame of 2 long thin chrome boxes (x to x2, at lat +-w/2, 1.2 high on posts) and `bars` cross bars; boot = same on the boot lid. Names `rack_<i>_c`. Create `tests/run_ca16.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_features.json` (create it: dossier_ok, 1 fin x -35 x2 -50 y 26 h 6, 1 running_board x -20 x2 20 y 5, 1 vent side n 5 x -48 x2 -42 y 14, 1 vent bonnet scoop, 1 rack roof)`), requires exit 0, `RENDERED`, at least 2 `REPORT fin_`, 2 `REPORT running_board_`, 6 `REPORT vent_` and 1 `REPORT rack_` line; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca16.sh` prints `CA16 OK`.
- `sh tests/run_ca04.sh` still prints `CA04 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA16: Big features: tail fins, running boards, vents and scoops, racks`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
