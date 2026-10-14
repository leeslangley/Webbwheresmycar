[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC16 Render body frames: pose files to raw Blender renders

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC16
Needs (already merged into `dev`): GC09, GC11, GC12, GC14, GC15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Turn a pose file into raw (not yet pixelated) frame PNGs of the BODY (head hidden) at 4x supersampling, plus a `frames.json` with, for each frame, where the neck pivot lands in the final 144x144 frame and where the wrists are in world units.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- tools/art/poselib.py
- tools/art/mark_rig.py and tools/art/dave_rig.py (build_*_rig, apply_pose, joint_world, set_group_visible)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)

## Files you may change (and nothing else)
- `tools/art/render_frames.py`

## Steps
1. Create `tools/art/render_frames.py`; arguments `--char mark|dave --poses <json> --out-dir <dir> [--clip <name>] [--limit <n>] [--check]`. Load the spec for the character, the pose file (`json.load`), and expand every clip (or only `--clip`) with `poselib.expand_clip(clip, doc['defaults'])`. `--check` stops after expansion and prints `FRAMES PLAN n=<total frames>` (no Blender scene is built, so it runs fast; the script may still be started with Blender). Build the rig once (`mark_rig.build_mark_rig()` or `dave_rig.build_dave_rig()`), hide the `head` group and show the `body` group; Mark: show the `chair` group always; Dave: show the `stool` group only when the pose file view is 'back'.
2. Camera: `w = h = spec['frames']['world']['w'] * spec['render']['supersample']` (576); `setup_char_scene(scene, doc['view'], tuple(frames.world.center), frames.world.ortho, w, h)` once, then per frame `apply_pose`, `render_png(scene, out_dir/<char>_<clip>_<NN>.png)` (NN = zero padded index, 2 digits).
3. `frames_<stem>.json` where `<stem>` is the pose file name without `.json` (written at the end into `--out-dir`, a list in render order): `{"id": "<char>_<clip>_<NN>", "clip", "index", "angle": <poselib.head_angle(frame['head'], view)>, "neck": [px, py], "wrist_L": [x,y,z], "wrist_R": [x,y,z], "head_world": [x,y,z]}`. `neck` = the head empty's world position projected with `bpy_extras.object_utils.world_to_camera_view(scene, camera, Vector)` -> `(u, v)`; `px = round(u * 144)`, `py = round((1 - v) * 144)` (144 is the final frame size from the spec, not the supersampled size).
4. Print `FRAMES OK n=<frames rendered>`. Test run (output stays in /tmp): `--char mark --poses docs/characters/poses_mark_front_a.json --out-dir /tmp/gc16 --clip idle` writes 6 PNGs of 576x576 and a json with 6 entries; for Mark idle frame 0 the `neck` x must be 72 +- 2 and y between 70 and 80 (z 1.12 maps to 72 + (1.17 - 1.12) * 64 = 75). With `--char dave --poses docs/characters/poses_dave_front.json --clip idle` frame 0: x between 78 and 88 (the 6 degree lean moves the neck 0.165 units = 10.6 px right of 72) and y between 28 and 38 (z 1.57 maps to 72 + (0.95 - 1.57) * 64 = 32).

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/render_frames.py -- --char mark --poses docs/characters/poses_mark_front_a.json --out-dir /tmp/gc16 --clip idle` prints `FRAMES OK n=6` and writes `/tmp/gc16/mark_idle_00.png` (576 x 576, check with `file`).
- `python3 -c "import json;d=json.load(open('/tmp/gc16/frames_poses_mark_front_a.json'));print(len(d), d[0]['neck'])"` prints 6 and a neck x between 70 and 74.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC16: Render body frames: pose files to raw Blender renders`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
