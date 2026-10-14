[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC11 Dave body, legs, overalls and rig

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC11
Needs (already merged into `dev`): GC08, GC10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Dave's stocky body (blue overalls, cream shirt sleeves, brass buttons, oil stain, boots) with legs, and the same `build_dave_rig` / `apply_pose` interface as Mark's rig, plus the stool he sits on in the back view.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- tools/art/mark_rig.py (copy its structure, joint names, apply_pose, joint_world, set_group_visible)
- tools/art/chararms.py
- tools/art/poselib.py

## Files you may change (and nothing else)
- `tools/art/dave_rig.py`

## Steps
1. Create `tools/art/dave_rig.py` with `build_dave_rig(spec=None)`. Empties as in Mark's rig plus legs: `root` (origin on the floor under the feet), `tilt` (child of root; the lean against the door is a rotation of `tilt` about Y), `chest` at (0,0,1.0) child of tilt, `head` at neck_pivot (0,0,1.58) child of chest, scale `head_scale`. Torso (parent `tilt`): `rbox(torso_center, torso_size, 0.14, mats['overalls'], 'torso')`; bib `rbox((0,-0.265,1.12),(0.5,0.06,0.46),0.02, mats['bib'],'bib')`; two straps `capsule`s from (+-0.2,-0.26,1.35) to (+-0.26,-0.08,1.52) radius 0.035 overalls_dark; two brass buttons `sphere`s at (+-0.2,-0.29,1.33) radius 0.025 material `brass`; an oil stain `sphere((-0.1,-0.30,1.05),(0.07,0.01,0.05), mats['stain'])`. Arms: `build_arm(spec, mats, chest, 'L'|'R', 'sleeve', cuff_key=None)` (cream shirt sleeves, skin hands). Legs: Empties `hip_L/R` at (+-hip_x, 0, hip_z) children of `tilt`, `knee_L/R` at local (0,0,-thigh) children of the hip; thigh `capsule` radius 0.14 and shin `capsule` radius 0.12 in `overalls`; a boot `rbox((0,-0.07,-shin-0.04),(0.2,0.34,0.14),0.04, mats['boot'])` attached to the knee. Head parts from `dave_head`: `build_head`, `build_cap`, `build_moustache`.
2. Stool for the back view: `build_stool`: seat `rbox((0,0,0.50),(0.6,0.6,0.08),0.03, mats['stool'])`, three legs as `capsule`s from (+-0.2,+-0.2,0.5) to (+-0.3,+-0.3,0.0) (use 4 legs). Group `stool` hidden unless the pose asks (the renderer shows it for the back view). `apply_pose(rig, frame)`, `joint_world`, `set_group_visible` behave exactly as in mark_rig.py but handle all 14 joints of `poselib.JOINTS` (including `hip_*`, `knee_*`).
3. Props: both hands may hold `mug` or `spanner` (built by `chararms.build_prop`). Return `rig` with groups `head`, `torso` (overalls, bib, shirt parts, legs and boots), `arms` (arms, hands, props), `body` (torso + arms), `stool` and the `props` table, as in Mark's rig.
4. Numeric test (`--test`): neutral pose: `joint_world(rig,'wrist_R')` z within 0.02 of 1.45-0.40-0.36 = 0.69; pose `tilt=[0,6,0]` -> the head empty's world x within 0.03 of 1.58*sin(6 degrees) = 0.165; seated pose `root=[0,0,-0.42], hip_L=[-90,0,0], knee_L=[90,0,0]` -> `joint_world(rig,'knee_L')` within 0.05 of (-0.2, -0.36, 0.20) (hip at z 0.62-0.42 = 0.20, thigh pointing forward) and a probe Empty the test parents to `knee_L` at local (0,0,-0.36) has world z within 0.05 of -0.16 (the shin points straight down again). Print `DAVE RIG OK` or `DAVE RIG FAIL <what>` and exit 2. Also `--pose-json`, `--view`, `--hide`, `--out` options exactly like mark_rig.py, rendering `setup_char_scene(scene, view, (0,0.95), 2.25, 144, 144)`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/dave_rig.py -- --test` prints `DAVE RIG OK` and exits 0.
- `... -- --pose-json '{"tilt":[0,6,0],"prop_R":"mug"}' --out /tmp/gc11.png` exits 0 and `file /tmp/gc11.png` says `144 x 144`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC11: Dave body, legs, overalls and rig`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
