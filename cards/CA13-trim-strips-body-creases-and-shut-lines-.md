[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA13 Trim strips, body creases and shut lines that follow the body

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA13
Needs (already merged into `dev`): CA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Chrome sill and waist strips, pressed body creases, and the door, bonnet and boot shut lines: thin ribbons that hug the curved flank. Registers `strip`, `crease`, `shutline`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.
- tools/art/surface.py (`half_width`)

## Files you may change (and nothing else)
- `tools/art/parts/trim.py`
- `tests/run_ca13.sh`

## Steps
1. `tools/art/parts/trim.py`: helper `ribbon(name, pts, thick, height, mat)` where `pts` is a list of (x, y, lat) car-coordinate points; it builds a bmesh strip: for each point a short vertical quad of `height` units centred on y, pushed outward by `thick` along lat (sign of lat); consecutive points joined (so it is a thin band hugging the surface). Helper `flank_points(surf, x0, x1, y, s, step=2.0)` -> points `(x, y, s*(surf.half_width(x, y) + 0.05))` every `step` units. `@register('strip')` = chrome (or black / paint2) ribbon, `thick 0.35`, `height h`, named `strip_<i>_<s>`; `role` window uses `window_frame` colour. `@register('crease')` = `thick depth+0.05`, `height 0.3`, material `paint2` lightened (or the paint itself) named `crease_<i>_<s>`.
2. `@register('shutline')`: for a `path` [[x,y],...] on the flank: resample each segment every 1.5 units, `lat = s*(half_width(x,y)+0.03)`, ribbon `thick 0.1`, `height 0.28`, material `dark`, name `shutline_<i>_<s>`. If `across_x` is set, add a second ribbon across the top at that x: points from lat -L to +L every 2 units, `y = surf.top(across_x) - 0.05` and L = `surf.half_width(across_x, top-1)*0.9` (a bonnet or boot lid edge), named `shutline_<i>_top`.
3. Create `tests/run_ca13.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_trim.json` (create it: dossier_ok, 1 strip `sill` x -34..34 y 6, 1 strip `waist` x -30..22 y 26.5, 1 crease x -40..40 y 20, 2 shutlines (a door path [[8,26.5],[8,7]] and a bonnet path [[24,26.5],[24,8]] with across_x 24))`), requires exit 0, `RENDERED`, at least 4 `REPORT strip_` lines, 2 `REPORT crease_` lines and at least 5 lines starting `REPORT shutline_` (door 2 sides, bonnet 2 sides, bonnet top 1); prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca13.sh` prints `CA13 OK`.
- `sh tests/run_ca04.sh` still prints `CA04 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA13: Trim strips, body creases and shut lines that follow the body`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
