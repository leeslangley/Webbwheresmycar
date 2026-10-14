[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB04 Fixed-scale studio camera

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB04
Needs (already merged into `dev`): CB02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One orthographic camera with a FIXED pixels-per-metre, so every car is drawn at the same pixel density (a 3.5 m car is smaller than a 5.5 m car) and the ground point is always at the same pixel (the sprite anchor).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Blender 5.2 facts already checked: `ShaderNodeMix` with `data_type='RGBA'` has inputs[0]=Factor, inputs[6]=A, inputs[7]=B and outputs[2]=Result; `Light.size_y` works for `shape='RECTANGLE'`; `obj.visible_camera` (bool) hides an object from the camera but it still casts shadows; `scene.render.dither_intensity = 0.0` stops Blender adding noise to 8-bit PNGs (needed for exact mask values); a Boolean modifier solver must be 'EXACT' or 'MANIFOLD' (not 'FAST').
- tools/art/cbrig.py (CB02)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/cbrig.py`
- `tests/cb_cam_test.py`

## Steps
1. In `cbrig.py` add constants `VIEWS = {'s':(0.0,6.0),'q':(25.0,10.0),'front':(90.0,4.0),'r':(-25.0,10.0)}` (yaw degrees, pitch degrees; s = pure side, nose to the right, the DEFAULT HERO view of every car (Lee, 14 Oct 2026); q = front three-quarter, nose toward the camera and to the right, an extra view; front = head-on; r = rear three-quarter, QA only, tail toward the camera and to the left) and `CANVAS_W, CANVAS_H = 1600, 800`, `PX_PER_M = 192` (= 48 sprite pixels per metre x 4 supersampling), `ORIGIN_PX = (800, 680)` (where world point (0,0,0), the car's centre on the ground, lands, measured from the top-left).
2. Add `setup_fixed_camera(scene, view)` (exit 2 with a message for an unknown view): ORTHO camera, `ortho_scale = CANVAS_W / PX_PER_M`, resolution 1600x800 at 100 percent. With yaw `ya`, pitch `p` (radians): target `T = (0, 0, 1.25 / cos(p))`; camera location `T + 20 * (sin(ya)*cos(p), -cos(ya)*cos(p), sin(p))`; aim with `carlib.look_at`; link to the scene and set `scene.camera`. Name the camera `cbcam`; when the scene already has a camera of that name, re-aim and reuse it (card CB10 renders several views from one scene). Add `project(scene, point)` returning (px, py) pixel coordinates from the top-left using `bpy_extras.object_utils.world_to_camera_view` (py = (1 - y) * CANVAS_H).
3. Write `tests/cb_cam_test.py` (Blender, no render needed): for view 's': `project((0,0,0))` is within 1.0 px of (800,680); `project((1,0,0))` x is 800+192 within 1.0; `project((0,0,1))` y is 680 - 192*cos(6 deg) within 1.0. View 'q': `project((1,0,0))` dx from the origin is 192*cos(25 deg) within 1.0 and `project((0,1,0))` has dx = +192*sin(25 deg) within 1.0 (the nose side of the car, +x, is to the right and nearer the camera). View 'front': `project((0,1,0))` dx is +192 within 1.0. View 'r': `project((0,1,0))` dx is -192*sin(25 deg) within 1.0. Calling `setup_fixed_camera` twice leaves exactly one camera object. A bad view name exits non-zero. Print `CB CAM OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_cam_test.py 2>&1 | tail -1` prints `CB CAM OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB04: Fixed-scale studio camera`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
