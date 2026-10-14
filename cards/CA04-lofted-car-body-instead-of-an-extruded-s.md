[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA04 Lofted car body instead of an extruded slab

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA04
Needs (already merged into `dev`): CA02, CA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Replace the extruded side-view slab with a lofted body: cross-sections along the length (rounded sills, shoulders, tumblehome, crowned roof and bonnet, rounded nose and tail) so wings and roof read as curved metal. Registered as the `body` stage, chosen with `--body loft`.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- tools/art/surface.py (CA02: `Surface.ring(x, n)`, `top`, `bottom`)
- tools/art/carlib.py (`make_mat`, `finish_mesh`)

## Files you may change (and nothing else)
- `tools/art/parts/body_loft.py`
- `tests/run_ca04.sh`

## Steps
1. `tools/art/parts/body_loft.py`: `@stage('body')` function that does nothing unless `ctx['args']['body'] == 'loft'` (CA03 puts the parsed args in ctx; if `ctx.get('args')` is missing treat as slab). Stations: `N = 56`, `xs[i] = xmin + (xmax-xmin)*(0.5 - 0.5*cos(pi*i/(N-1)))` (dense at both ends). For each station `ring = surf.ring(x, 14)` -> right half (lat, y); build the full section as vertices `(x*U, lat*U, y*U)` for the right half and `(x*U, -lat*U, y*U)` mirrored, sharing the two centre points. bmesh quads between neighbouring stations (wind the faces so normals point outward: call `bmesh.ops.recalc_face_normals`); close both ends with one n-gon face each.
2. Create the object `body` with material `ctx['mats']['paint']`, add Subsurf (levels 1, render 2) and set smooth shading. Set `ctx['body'] = obj`. Print `LOFT stations=56 verts=<n>`.
3. Make the nose and tail round in plan: that is already in `Surface.taper` (end rounding). Do NOT add extra code for it. Instead add a check inside the stage: after building, compare `obj.dimensions` (Blender units) with the profile: `dimensions.x*10` within 3 of `xmax-xmin`, `dimensions.z*10` within 1.5 of `max(top)` and print `LOFT CHECK OK` or `LOFT CHECK BAD <numbers>`.
4. Create `tests/run_ca04.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details tests/fixtures/details_ok.json plus `--body loft``), requires exit 0, `RENDERED`, `LOFT CHECK OK`, a `REPORT body` line with dx within 3 of 100, dy at most `plan.width_units+0.5` and at least `0.8*plan.width_units`, and the same for `docs/cars/t1_chimp.json` (no details file: use `--details none --body loft`); prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca04.sh` prints `CA04 OK`.
- `sh tests/run_ca03.sh` still prints `CA03 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA04: Lofted car body instead of an extruded slab`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
