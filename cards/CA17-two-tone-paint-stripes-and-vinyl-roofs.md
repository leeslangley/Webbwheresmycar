[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA17 Two-tone paint, stripes and vinyl roofs

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA17
Needs (already merged into `dev`): CA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Period two-tone schemes (white roof on a red Mini, contrasting sweep spears, bonnet and racing stripes, black vinyl roof) by giving body faces a second material. A car has ONE second paint colour, `paint.colour2`: the render shows it as material `paint2` and the pixel stage turns it into its own ramp (card CB13). Registered as the `paint` stage.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/parts/__init__.py and tools/art/parts/_common.py (from CA03): the registry `register(kind)`, the helper signatures `box`, `cyl`, `torus`, `sphere`, `lathe`, `side_list(part)`, `part_name(kind, i, s)`, and `ctx` (dict: scene, dossier, details, mats, surf, body, mult)
- docs/CAR_DETAILS_SPEC.md (from CA01): the part fields and defaults (`paint`: `colour2`, `finish`, `zones`)

## Files you may change (and nothing else)
- `tools/art/parts/paintzones.py`
- `tests/run_ca17.sh`

## Steps
1. `tools/art/parts/paintzones.py`, `@stage('paint')`: read `details['paint']['zones']`. A zone has `use` `paint2` (material `ctx['mats']['paint2']`, already coloured from `paint.colour2` by `_mats.make_all`) or `vinyl` (material `ctx['mats']['vinyl']`). Append each material the zones need (once) to the body mesh's material list and give the zone's faces that slot. Face centre in car units: x = cx*10, y = cz*10, lat = cy*10, taken from the body mesh BEFORE the Subsurf (assign on the base mesh; modifiers keep slots). Skip the stage silently with no zones. A `paint2` zone without `paint.colour2`: print `WARN paint2 colour missing` and use `vinyl` instead.
2. Region tests (a face joins the zone when): `roof` = centre y > `surf.belt+0.5` and face normal z > 0.2 or the face is above the belt; `above_y` = y > zone.y; `below_y` = y < zone.y; `band` = zone.y <= y <= zone.y2; `bonnet_stripe` = |lat| < w/2 and normal z > 0.5 and x between x0 and x1; `centre_stripe` = same as bonnet_stripe but x0..x1 can span the whole car. Later zones win.
3. Create `tests/run_ca17.sh`: for each fixture it renders with `--report` (dossier `tests/fixtures/dossier_ok.json`, `--details `tests/fixtures/details_paint.json` (create it: dossier_ok, `paint` = `{"colour2": "#eae6dd", "zones": [a roof zone `use` paint2, a centre_stripe zone w 4 x0 -45 x1 45 `use` vinyl]}`)`), requires exit 0, `RENDERED`, a `PAINT zones=2 faces=<n>` line printed by the stage with n > 20, and `len(body.data.materials)` printed as `PAINT slots=3`; prints the OK line named in Acceptance.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca17.sh` prints `CA17 OK`.
- `sh tests/run_ca04.sh` still prints `CA04 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA17: Two-tone paint, stripes and vinyl roofs`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
