[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA03 Parts framework: registry, helpers, materials and render hook

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA03
Needs (already merged into `dev`): V06, CA01, CA02, CB01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A plug-in system so each detail kind lives in its OWN file (so Spark cards never edit the same file at once): a registry, shared geometry helpers, the material set, and one hook in `blender_car2.py` that runs the whole thing (also for a car that has no details file yet).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/blender_car2.py and tools/art/carlib.py (as merged after V01-V06: read how the body, glass, wheels and lamps are built, and how --report works)
- docs/CAR_DETAILS_SPEC.md and tools/art/details.py (CA01), tools/art/surface.py (CA02), tools/art/cbmat.py (CB01: `make_all`, `MASK_CLASS`)
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `tools/art/parts/__init__.py`
- `tools/art/parts/_common.py`
- `tools/art/parts/_mats.py`
- `tools/art/blender_car2.py`
- `tests/run_ca03.sh`

## Steps
1. `tools/art/parts/__init__.py`: `BUILDERS = {}`, `STAGES = {}`; decorators `register(kind)` (stores `fn(part, ctx, i)`) and `stage(name)` (stores `fn(ctx)`); `load_all()` imports every module of the package whose name does not start with `_` (pkgutil.iter_modules; a failing import prints `WARN parts.<name>: <error>`); `build_all(ctx)`: calls `load_all()`, then STAGES in this order if present: `body`, `arches`, `windows`, `wheels`, `paint`, `cockpit`, `roof`; then for i, part in enumerate(details['parts']): look up BUILDERS[part['kind']] and call it inside try/except (print `WARN part <i> <kind>: <error>` on failure); then the per-car module (CA20 adds it: leave a no-op hook `run_car_module(ctx)`); then stage `finish`. `ctx` is a dict: scene, args, dossier, details, mats, surf (a `surface.Surface`), body (None until the body stage sets it), `mult(key)` (returns `details['caricature'][key]`, default 1.0).
2. `tools/art/parts/_common.py`: `U = 0.1`; `side_list(part)` -> [-1] near, [1] far, [-1, 1] both, [0] centre (default both when part.get('lat', 0) > 0 else centre); `part_name(kind, i, s)` -> `'%s_%d_%s' % (kind, i, {-1:'n', 1:'f', 0:'c'}[s])`; helpers that all take CAR coordinates (x, y height, lat) and sizes in units, link, smooth-shade and return the object: `box(name, x, y, lat, dx, dh, dl, mat)`, `cyl(name, x, y, lat, r, depth, axis, mat, seg=24)` (axis 'x', 'lat' or 'h'), `torus(name, x, y, lat, R, r, axis, mat)`, `sphere(name, x, y, lat, rx, rh, rl, mat)` (ellipsoid), `lathe(name, profile, x, y, lat, axis, mat, seg=32)` (profile = list of (radius, along-axis) revolved with `bmesh.ops.spin`).
3. `tools/art/parts/_mats.py`: `make_all(hexs, finish='solid', hex2=None)` returns `cbmat.make_all(hexs, finish, hex2 or '#ffffff')` (keys paint, paint2, glass, chrome, tyre, whitewall, lamp, trim, tail; `cbmat` lives in tools/art) PLUS these keys. Every material name must be a key of `cbmat.MASK_CLASS`, because the mask pass classifies by name: `black`, `dark`, `vinyl`, `fabric`, `leather` are the SAME object as `trim`; `lamp_white` is `lamp`, `lamp_red` is `tail`; new `carlib.make_mat` materials named like their key: `alloy` ('#c8ccd4' metallic 1 roughness 0.25), `brass` ('#b08a3a' metallic 1 roughness 0.3), `lamp_amber` ('#ff9a1a' emission 0.8), `plate_white` ('#f4f4f0' roughness 0.5), `plate_yellow` ('#f2c418' roughness 0.5).
4. In `blender_car2.py` add `--details <json|auto|none>` (default `auto`: `<dossier dir>/details/<dossier id>.json` when it exists, else `surface.default_details(dossier)` from CA02) and `--body slab|loft` (default `slab`; card CB09 makes `loft` the default for the studio rig). Unless `--details none`: validate a real file with `details.validate` (print problems, continue), build `ctx` (`args` = the parsed arguments, `mats` from `_mats.make_all(hex, 'solid', details['paint'].get('colour2'))`; card CB09 later passes the finish and colour2 flags), call `parts.build_all(ctx)` INSTEAD of the V03 glass, V04 wheels and V05 lamp builders (these run only with `--details none`); the V01/V02 slab body is the fallback when no `body` stage is registered.
5. Create `tests/run_ca03.sh`: renders `tests/fixtures/dossier_ok.json` with `--details tests/fixtures/details_ok.json --report`, requires exit 0 and `RENDERED`; again with `--details none` (exit 0) and with the default (no details file for dossier_ok: exit 0); then a `--python-expr` run (Blender, as above) that imports `parts`, registers a dummy kind and checks `BUILDERS`, `side_list({'lat':3})==[-1,1]`, `part_name('x',2,-1)=='x_2_n'`, that every key of `_mats.make_all('#C96F32')` is a key of `cbmat.MASK_CLASS` and that `_mats.make_all('#C96F32')['black']` is the object `['trim']`, and prints `PARTS FRAMEWORK OK`. Script prints `CA03 OK`.

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
