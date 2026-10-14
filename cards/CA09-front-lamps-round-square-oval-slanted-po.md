[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA09 Front lamps: round, square, oval, slanted, pop-up, quad

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA09
Needs (already merged into `dev`): CA03, CA02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Headlamps and small front lamps per marque: the lamp type is what makes a classic's face. Registers `headlamp` and `lamp`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/lamps_front.py`
- `tests/run_ca09.sh`

## Steps
1. `tools/art/parts/lamps_front.py`: `@register('headlamp')`: `r = part['r'] * ctx['mult']('eyes')`; position `(x, y, lat)` for each side from `side_list`; the lamp sits on the nose: set its lateral so the outer edge is inside the body: `lat = min(lat, surf.half_width(x, y) - 0.6*r)`. Shapes: `round` = chrome bezel torus (R r, minor 0.2r, axis x) + lens `sphere` (rx 0.45r, rh r*0.92, rl r*0.92) in `lamp_white`; `square` = chrome box 2r x 1.6r (dh, dl) + lens box inset; `oval` = ellipsoid bezel (rh 0.75r, rl 1.1r) + lens; `slanted` = oval rotated 20 degrees (Euler about the x axis) leaning back toward the middle (outer end higher); `popup` = closed: flat body-coloured box 2r x 1.4r x 0.5r flush with the deck (material paint) and `open: true` = the lid tilted up 60 degrees with a round lamp behind; `quad` = two round lamps (r*0.6 each) stacked vertically 1.3r apart inside one chrome surround box. Bezel material: chrome / paint / black from `part['bezel']`.
2. `@register('lamp')` by `role`: sidelamp (lens white) / indicator (lens amber, `rect` default box 2.2 x 1.2) / foglamp (round chrome rim + white lens) / driving (like foglamp r 1.6) / reverse (white small) / reflector (red disc, no emission). Lens spheres use the lamp materials (`lamp_white`, `lamp_amber`, `lamp_red`). All objects named `headlamp_<i>_<s>` for headlamps and `lamp_<i>_<s>` for lamps (extra pieces `headlamp_<i>_<s>_lens`).
3. Create `tests/run_ca09.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_lamps_front.json` (create it: dossier_ok, belt_y 26.5, 7 headlamp parts, one per shape: round, square, oval, slanted, popup, popup with open true, quad, at x 47, y 16, lat 11 and r 2.4 with different x offsets of -2 each so they do not overlap, plus 3 `lamp` parts)`), requires exit 0, `RENDERED`, at least 28 lines starting `REPORT headlamp_` (7 headlamp parts, both sides, bezel plus lens) and at least 6 lines starting `REPORT lamp_`; every one of those lines has a positive dy; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca09.sh` prints `CA09 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA09: Front lamps: round, square, oval, slanted, pop-up, quad`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
