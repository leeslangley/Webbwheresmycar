[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC09 Mark rig: assemble the model and apply poses

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC09
Needs (already merged into `dev`): GC05, GC06, GC07, GC08
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Assemble Mark from the module pieces into one joint hierarchy and provide `apply_pose(rig, frame)` so any pose-table frame becomes a posed model, with groups so a renderer can hide the head (body frames) or the body (head sprites).

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- tools/art/poselib.py (JOINTS, HANDS, conventions)
- tools/art/mark_head.py, mark_hair.py, charface.py, mark_torso.py, chararms.py (function signatures)

## Files you may change (and nothing else)
- `tools/art/mark_rig.py`

## Steps
1. Create `tools/art/mark_rig.py` with `build_mark_rig(spec=None, outfit=None)`: loads mark.json when `spec` is None; `clear_scene()`; mats = `make_mats(palette, flat=('pupil',))`; Empties: `root` at origin, `tilt` (child of root), `chest` at (0,0,0.3) child of tilt, `head` at `neck_pivot` child of chest with scale `head_scale`; torso/chair parts attach to `tilt` / `root` respectively; arms: `build_arm(spec, mats, chest, 'L', sleeve_key)` and 'R' ('navy' for suit, 'hood' for hoodie; skin 'skin'), hands built inside; both hands get all four props via `build_prop` (hidden by default). Head parts: `build_head`, `build_hair`, `build_glasses` on the head pivot. Legs do not exist (Mark sits behind the desk). Return `rig = {'spec', 'mats', 'joints': {name: empty for root tilt chest head shoulder_L shoulder_R elbow_L elbow_R wrist_L wrist_R}, 'hands': {'L': hand, 'R': hand}, 'props': {'L': {name: [objs]}, 'R': {...}}, 'groups': {'head': [head, hair, glasses parts], 'torso': [jacket, shirt, tie or hoodie parts, shoulders, neck], 'arms': [arms, hands, props], 'body': torso + arms, 'chair': [chair parts]}}`.
2. `apply_pose(rig, frame)`: `frame` is a full dict as produced by `poselib.expand_clip` (all joints present). For `root` set `joints['root'].location = tuple(frame['root'])`; for every other joint present set `rotation_euler = tuple(radians(v) for v in frame[name])` (mode 'XYZ'); `set_hand_shape` for 'L' and 'R' from `frame['hand_L']`, `frame['hand_R']` (default 'relaxed'); props: for each side show only the prop named in `frame['prop_L']` / `frame['prop_R']` (default 'none') with `set_visible`; call `bpy.context.view_layer.update()` at the end. `joint_world(rig, name)` -> (x, y, z) of the empty's `matrix_world.translation`. `set_group_visible(rig, group, shown)` uses `set_visible` on the group's objects. `face` is NOT applied here (the head renderer builds faces).
3. Numeric rig test in `main()` (`--test`): neutral pose (all zeros): `joint_world(rig,'wrist_R')` z must be within 0.02 of 0.98-0.42-0.38 = 0.18 and x within 0.02 of 0.45; pose `shoulder_R=[-90,0,0]` -> wrist_R y within 0.03 of -0.80 and z within 0.03 of 0.98; pose `shoulder_R=[0,-150,0]` -> wrist z greater than 1.55; pose `head=[20,0,0]` -> the head empty's world z is unchanged (rotation about its own pivot) and a probe object (a sphere the test parents to the head empty at local (0,0,0.4)) moves toward -Y by more than 0.05. Print `RIG OK` or `RIG FAIL <what>` and exit 2.
4. `main()` also supports `--pose-json '<json frame>' --view front|back --hide head --out <png>` that applies the frame over the all-zero full dict, hides the named group and renders a 144x144 frame with `setup_char_scene(scene, view, (0,1.17), 2.25, 144, 144)`; run once with `{"shoulder_R":[0,-150,0],"hand_R":"fist"}` (hands up) with and without `--hide head` and check both write 144x144 PNGs.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/mark_rig.py -- --test` prints `RIG OK` and exits 0.
- `... -- --pose-json '{"shoulder_R":[0,-150,0],"hand_R":"fist"}' --view back --hide head --out /tmp/gc09.png` exits 0 and `file /tmp/gc09.png` says `144 x 144`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC09: Mark rig: assemble the model and apply poses`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
