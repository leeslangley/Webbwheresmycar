[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA21 Camera views: front three-quarter hero, front face, rear three-quarter

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA21
Needs (already merged into `dev`): CA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
RSAMH is all about big faces. The game sprites should show the car from the FRONT three-quarter (nose toward the viewer, so lamps and grille read as eyes and mouth), plus a pure front 'portrait' view for the HUD, plus a rear three-quarter for QA.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/blender_car2.py and tools/art/carlib.py `setup_camera` (as merged after V06: its `--view side|threequarter` option)

## Files you may change (and nothing else)
- `tools/art/blender_car2.py`
- `tests/run_ca21.sh`

## Steps
1. Extend `--view` to `side` (azimuth 0), `front34` (azimuth +35), `rear34` (azimuth -35), `front` (azimuth +90), `threequarter` (keep V06's behaviour). In `carlib.setup_camera` use `azimuth` (degrees): `cam.location = (20*sin(a), -20*cos(a), zc + pitch_drop)`, still orthographic, still `look_at((0, 0, zc))`. The car faces +X, so +azimuth swings the camera toward the nose.
2. Framing: for any azimuth, set `ortho_scale` from the projection of the bounding box corners onto the camera right/up axes (compute with the camera's rotation matrix: `cam.matrix_world.to_3x3().inverted() @ (corner - target)`), take the max extents with a 10% margin, and keep the aspect ratio of `--w/--h`. For `front` the default output size is 512x512 unless `--w/--h` are given (implement as: when --view front and neither flag was passed, use 512x512).
3. `tests/run_ca21.sh`: renders `dossier_ok.json` in `side`, `front34`, `rear34` and `front` with `--report`, requires exit 0 and `RENDERED` each, and for each output uses `/opt/homebrew/bin/blender --background --python-expr` with numpy to read the PNG alpha and check that the non-transparent bounding box is at least 55% of the image width (side, front34, rear34) or at least 40% of the height for `front`, and not touching any image edge; prints `CA21 OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca21.sh` prints `CA21 OK`.
- `sh tests/run_blender_car2f.sh` still prints `BLENDER CAR2F OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA21: Camera views: front three-quarter hero, front face, rear three-quarter`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
