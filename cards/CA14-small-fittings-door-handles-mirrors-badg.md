[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA14 Small fittings: door handles, mirrors, badges, wipers, aerial, fuel cap

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA14
Needs (already merged into `dev`): CA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The small bright details that make a car look finished and period-correct. Registers `handle`, `mirror`, `badge`, `wiper`, `aerial`, `fuelcap`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/fittings.py`
- `tests/run_ca14.sh`

## Steps
1. `tools/art/parts/fittings.py`: `@register('handle')`: at `(x, y)` on each side, `lat = s*(surf.half_width(x, y)+0.1)`; styles: `flap` = chrome box 2.5 x 0.5 x 0.6 (dx len, dh, dlat) with a small dark keyhole disc; `push` = a chrome pill (ellipsoid 1.2 x 0.9 x 0.5) with a black button; `bar` = a chrome horizontal bar `len` long standing off 0.8 on two stubs; `lever` = a chrome lever angled 20 degrees up; `boot` = a chrome flap on the rear face (use end = rear, lat 0, `x = surf.xmin + 0.4`); `knob` = a small chrome sphere. Names `handle_<i>_<s>`.
2. `@register('mirror')`: styles `round` (chrome disc r `size` on a 3-unit stalk, on the wing top), `rect` (black rectangle), `door` (chrome rectangle on a short arm at the door front, `lat = half_width + 2.5`), `wing` (round on the front wing, stalk 4 high); `@register('badge')`: `end` front: on the nose face at `x = surf.xmax - 0.2`, lat 0; rear: on the tail at `x = surf.xmin + 0.2`; side: on the flank; shapes disc (cylinder r size, depth 0.3, colour per `colour`: chrome, red `#c8201e`, blue `#1e4fa0`, gold `#d9a520`, black), bar (box 3*size x 0.8*size), shield (a disc scaled 0.8 wide, 1.1 high), wings (a thin chrome box 4*size wide with two sloped end boxes), script (a thin chrome box 3*size long, 0.5*size high: a stand-in for lettering). `@register('wiper')`: n arms, each a black box `len` long, 0.3 thick, resting at -10 degrees from horizontal on the windscreen base at `(x, y)`, lat spaced 0.28*half_width apart. `@register('aerial')`: black thin cylinder, `len` high, tilted 12 degrees back, with a chrome tip sphere. `@register('fuelcap')`: chrome disc r on the flank (one side by default).
3. Names `mirror_<i>_<s>`, `badge_<i>_<s>`, `wiper_<i>_c`, `aerial_<i>_<s>`, `fuelcap_<i>_<s>`. Create `tests/run_ca14.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_fittings.json` (create it: dossier_ok, 2 handles (flap, bar), 1 mirror door both, 3 badges (front disc red, rear script, side shield), 1 wiper n 2, 1 aerial, 1 fuelcap near)`), requires exit 0, `RENDERED`, at least 4 `REPORT handle_`, 2 `REPORT mirror_`, 3 `REPORT badge_` lines, 1 `REPORT wiper_`, 1 `REPORT aerial_`, 1 `REPORT fuelcap_` line; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca14.sh` prints `CA14 OK`.
- `sh tests/run_ca04.sh` still prints `CA04 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA14: Small fittings: door handles, mirrors, badges, wipers, aerial, fuel cap`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
