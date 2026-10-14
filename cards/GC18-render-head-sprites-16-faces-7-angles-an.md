[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC18 Render head sprites (16 faces, 7 angles) and bust portraits

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC18
Needs (already merged into `dev`): GC06, GC09, GC10, GC11
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Render the head layer that the game composites on top of every body frame (faces are swapped for blinking, talking and moods), and the head-and-shoulders bust portraits for the speech banner, the news and the dialogue.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- tools/art/mark_rig.py, dave_rig.py, charface.py, poselib.py (HEAD_ANGLES)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)

## Files you may change (and nothing else)
- `tools/art/render_heads.py`

## Steps
1. Create `tools/art/render_heads.py`; arguments `--char mark|dave --out-dir <dir> [--only heads|busts] [--limit <n>]` (`--limit n` caps the head sprites and the busts at n each). Build the rig (as render_frames.py) and hide the groups `body`, `chair` and `stool`; the rig's `head` group (head, hair or cap, moustache, glasses) stays visible; the rig builds no face parts, the face is built per sprite by this script. Head sprites: raw size `w*supersample` = 320 x 320 (head frame 80 x 80, supersample 4). The camera centre is `(0, neck_pivot_z + 26/64)` (so the neck pivot lands at pixel row 40 + 26 = 66 of the 80 px frame at 64 px per unit: `frames.head.pivot_px` = (40, 66)); `setup_char_scene(scene, 'front', that centre, frames.head.ortho, 320, 320)`. Assert it: project the head empty with `world_to_camera_view`, convert to pixels of the 80 x 80 frame and print `HEAD PIVOT px=(<x>,<y>)`; x must be within 1 of 40 and y within 2 of 66, otherwise exit 2.
2. Faces at angle `fwd`: for each of the 16 face names in expressions.json: set the head empty rotation to `HEAD_ANGLES['fwd']`, build the face with `charface.build_face`, render `<char>_head_fwd_<face>.png`, delete the face parts. Core faces at every other angle (`tilt_l tilt_r down up turn_l turn_r`): the 7 faces `neutral blink happy talk_A talk_E talk_O talk_M` -> `<char>_head_<angle>_<face>.png` (42 files). The back of the head: rotate the head empty by (0,0,180) and render WITHOUT a face as `<char>_head_back.png` (hair or cap seen from behind). Total head files per character: 16 + 42 + 1 = 59.
3. Busts: per face in `spec['bust_faces']`: show the `head` and `torso` groups, hide `arms`, `chair` and `stool`, `setup_char_scene(scene, 'front', tuple(frames.bust.center), frames.bust.ortho, 96*4, 96*4)` (384 x 384), build the face, render `<char>_bust_<face>.png`, delete the face. Mark 8 busts, Dave 6.
4. Prints `HEADS OK heads=<n> busts=<m>`. Test: `--char mark --out-dir /tmp/gc18 --limit 3` writes 3 files of 320 x 320 and prints HEAD PIVOT with x within 1 of 40; a full run (`--only busts`) writes 8 PNGs of 384 x 384 for Mark and 6 for Dave. Use the final names above exactly; the manifest builder (GC19) relies on them.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/render_heads.py -- --char mark --out-dir /tmp/gc18 --limit 3` prints `HEAD PIVOT px=` with x within 1 of 40 and `HEADS OK heads=3`.
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/render_heads.py -- --char dave --out-dir /tmp/gc18d --only busts` prints `HEADS OK heads=0 busts=6`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC18: Render head sprites (16 faces, 7 angles) and bust portraits`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
