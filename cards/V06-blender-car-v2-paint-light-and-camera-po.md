[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V06 Blender car v2: paint, light and camera polish

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V06
Needs (already merged into `dev`): V05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the paint read as the real colour and the car look glossy: colour management, lights, and a three-quarter view option.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- tools/art/carlib.py and blender_car2.py

## Files you may change (and nothing else)
- `tools/art/carlib.py`
- `tools/art/blender_car2.py`
- `tests/run_blender_car2f.sh`

## Steps
1. Paint colour: the base colour passed to `make_mat` must be the sRGB hex converted to LINEAR (`c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4` per channel) so a red car stays red: make `hex_to_rgb` do this conversion everywhere (check the other callers still look right: glass, chrome, tyre). Scene: `scene.view_settings.view_transform = 'Standard'`, `look = 'None'`, `exposure = -0.4`.
2. Lights in `setup_lights`: key AREA light energy 1500 size 3.5; rim light energy 700; add a cool-white 'sky strip' AREA light (size 8 x 1.5, energy 400) straight above the car; world strength 0.35. Paint: roughness 0.3, coat 1.0, coat roughness 0.03.
3. New flags for `blender_car2.py`: `--no-shadow` (do not create the shadow catcher) and `--view side|threequarter` (default `side`; `threequarter` rotates the camera 28 degrees around the car's vertical axis, still orthographic and framed from the bounding box). Update `tests/run_blender_car2.sh` is NOT needed; create `tests/run_blender_car2f.sh`: renders the fixture with `--view threequarter --no-shadow` and with `--color '#b02a2a'`, both exit 0 with `RENDERED`; with `--color '#12345g'` exits non-zero with a clear message; prints `BLENDER CAR2F OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2f.sh` prints `BLENDER CAR2F OK`.
- `sh tests/run_blender_car2e.sh` still prints `BLENDER CAR2E OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V06: Blender car v2: paint, light and camera polish`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
