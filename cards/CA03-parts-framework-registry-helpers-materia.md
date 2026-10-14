[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA03 Parts framework: registry, helpers, materials and render hook

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA03
Needs (already merged into `dev`): V06, CA01, CA02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A plug-in system so each detail kind lives in its OWN file (so Spark cards never edit the same file at once): a registry, shared geometry helpers, the material set, and one hook in `blender_car2.py` that runs the whole thing when a details file exists.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/blender_car2.py and tools/art/carlib.py (as merged after V01-V06: read how the body, glass, wheels and lamps are built, and how --report works)
- docs/CAR_DETAILS_SPEC.md and tools/art/details.py (CA01), tools/art/surface.py (CA02)
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/__init__.py`
- `tools/art/parts/_common.py`
- `tools/art/parts/_mats.py`
- `tools/art/blender_car2.py`
- `tests/run_ca03.sh`

## Steps
1. `tools/art/parts/__init__.py`: `BUILDERS = {}`, `STAGES = {}`; decorators `register(kind)` (stores `fn(part, ctx, i)`) and `stage(name)` (stores `fn(ctx)`); `load_all()` imports every module of the package whose name does not start with `_` (pkgutil.iter_modules; a failing import prints `WARN parts.<name>: <error>` and continues); `build_all(ctx)`: calls `load_all()`, then STAGES in this order if present: `body`, `arches`, `windows`, `wheels`, `paint`, `cockpit`, `roof`; then for i, part in enumerate(details['parts']): look up BUILDERS[part['kind']] and call it inside try/except (print `WARN part <i> <kind>: <error>` on failure); then the per-car module (CA20 adds it: leave a no-op hook `run_car_module(ctx)`); then stage `finish`. `ctx` is a dict: scene, dossier, details, mats, surf (a `surface.Surface`), body (None until the body stage sets it), `mult(key)` (returns `details['caricature'][key]`, default 1.0).
2. `tools/art/parts/_common.py`: `U = 0.1`; `side_list(part)` -> [-1] near, [1] far, [-1, 1] both, [0] centre (default both when part.get('lat', 0) > 0 else centre); `part_name(kind, i, s)` -> `'%s_%d_%s' % (kind, i, {-1:'n', 1:'f', 0:'c'}[s])`; helpers that all take CAR coordinates (x, y height, lat) and sizes in units, link the object to the scene, set smooth shading and return the object: `box(name, x, y, lat, dx, dh, dl, mat)`, `cyl(name, x, y, lat, r, depth, axis, mat, seg=24)` (axis 'x', 'lat' or 'h'), `torus(name, x, y, lat, R, r, axis, mat)`, `sphere(name, x, y, lat, rx, rh, rl, mat)` (ellipsoid), `lathe(name, profile, x, y, lat, axis, mat, seg=32)` (profile = list of (radius, along-axis) revolved with `bmesh.ops.spin`).
3. `tools/art/parts/_mats.py`: `make_all(paint_rgb)` returns a dict of `carlib.make_mat` materials: paint (clearcoat), chrome (#e8e8ee metallic 1 roughness 0.08), glass (#a8d0e0 roughness 0.03), tyre (#101014 rough 0.9), black (#0c0c10 rough 0.5), dark (#05050a), whitewall (#f0ece0 rough 0.6), lamp_white (#fff6c0 emission 1.0), lamp_amber (#ff9a1a emission 0.8), lamp_red (#d82020 emission 0.5), plate_white (#f4f4f0), plate_yellow (#f2c418), brass (#b08a3a metallic 1 rough 0.3), leather (#6a2c20 rough 0.6), fabric (#1c1c20 rough 0.9), vinyl (#161616 rough 0.55), paint2 (copy of paint, colour overwritten by paint zones later), alloy (#c8ccd4 metallic 1 rough 0.25). Reuse carlib colour helpers (hex_to_rgb).
4. In `blender_car2.py` add `--details <json|auto>` (default `auto`: use `<dossier dir>/details/<dossier id>.json` when it exists, else none) and `--body slab|loft` (default `slab`). When details exist: validate with `details.validate` (print problems, continue), build `ctx`, call `parts.build_all(ctx)` INSTEAD of the V03 glass, V04 wheels and V05 lamp builders (keep them for dossiers without a details file) and make the V01/V02 slab body the fallback when no `body` stage is registered. Create `tests/run_ca03.sh`: renders `tests/fixtures/dossier_ok.json` with `--details tests/fixtures/details_ok.json --report`, requires exit 0 and `RENDERED`, then renders again with `--details none` (exit 0); then runs `/opt/homebrew/bin/blender --background --python-exit-code 1 --python-expr` that imports `parts`, registers a dummy kind and checks `BUILDERS`, `side_list({'lat':3})==[-1,1]`, `part_name('x',2,-1)=='x_2_n'`, and prints `PARTS FRAMEWORK OK`. Script prints `CA03 OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca03.sh` prints `CA03 OK`.
- the V06 test `sh tests/run_blender_car2f.sh` still prints `BLENDER CAR2F OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA03: Parts framework: registry, helpers, materials and render hook`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
