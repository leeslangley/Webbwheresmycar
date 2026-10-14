[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA07 Wheels v2: round tyre, dished steel rim, hubcap, whitewall

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA07
Needs (already merged into `dev`): CA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wheels that read as real wheels: a tyre with rounded shoulders, a dished steel rim with a chrome hubcap, optional whitewall and trim ring. Registered as the `wheels` stage (replaces the V04 wheels for dossiers with a details file).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults (top-level `wheel` block)
- tools/art/carlib.py (V04 `build_wheels`: copy its rule for 3-wheelers: a wheel whose x is unique in a 3-wheel list is placed only at lat 0)

## Files you may change (and nothing else)
- `tools/art/parts/wheels_a.py`
- `tests/run_ca07.sh`

## Steps
1. `tools/art/parts/wheels_a.py` with `@stage('wheels')` and a function `wheel_parts(ctx, w, lat_sign, wheel_cfg)` (module level, reused by CA08 for the other styles): for each dossier wheel `w` (x, r) and side: tyre = `lathe` of the profile `[(0.62r, -d/2), (0.88r, -d/2), (r, -d*0.35), (r, d*0.35), (0.88r, d/2), (0.62r, d/2)]` with `d = max(2.2, 0.8*r)` (radius, along lat), material tyre, name `tyre_%d_%s` (REPORT lines are needed: `tyre_<n>_<s>`), centred `lat = s*(w0 - d/2 - 0.4)` (a unique-x wheel in a 3-wheel list: lat 0, one wheel), `y = r`. Multiply r by `ctx['mult']('wheels')` for the whole wheel.
2. Rim for style `steel` / `disc` / `spoked` (spoked = steel with 8 round holes: 8 small dark discs r 0.12r on a circle 0.4r): a lathe of `[(0.62r, d*0.4), (0.6r, d*0.2), (0.45r, -d*0.15), (0.2r, -d*0.15), (0.2r, d*0.45)]` in material chrome when `wheel.hub == 'chrome'`, else paint; hubcap = chrome dome lathe radius `hubcap_r` (default 0.45r) height 0.18r, name `hubcap_<n>_<s>`; `whitewall: true` adds a whitewall ring (lathe flat ring radius 0.7r..0.9r, thickness d*0.7, material whitewall) just inside the tyre face; `trim_ring: true` adds a thin chrome torus (R 0.62r, minor 0.06r) at the rim lip.
3. Style defaults when the details file has no `wheel` block: the dossier's first wheel `style`. Styles `wire` / `knockoff` / `alloy` are handled by the next card CA08: here call `wheel_parts_extra(...)` only if the module `wheels_b` is importable (try/except ImportError) and otherwise fall back to `steel`. Print `WHEELS n=<count>`.
4. Create `tests/run_ca07.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details tests/fixtures/details_ok.json plus `--body loft``), requires exit 0, `RENDERED`, exactly 4 `REPORT tyre_` lines, 4 `REPORT hubcap_` lines, and the `WHEELS n=4` line; a copy of the fixture with `wheel` = `{"style":"steel","whitewall":true,"trim_ring":true,"hub":"chrome"}` also exits 0 and prints at least 4 `REPORT whitewall_` lines (name the ring objects `whitewall_<n>_<s>`); prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca07.sh` prints `CA07 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA07: Wheels v2: round tyre, dished steel rim, hubcap, whitewall`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
