[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC07 Mark torso, suit, shirt, tie and the office chair

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC07
Needs (already merged into `dev`): GC01, GC02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark's body above the desk: navy suit jacket with lapels, cream shirt, red tie, shoulders; the hoodie alternative; and the maroon office chair behind him (seen from the back in the 'watching the telly' pictures).

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- docs/art/GC.md section 'Mark likeness'

## Files you may change (and nothing else)
- `tools/art/mark_torso.py`

## Steps
1. Create `tools/art/mark_torso.py` with `build_torso(spec, mats, root)`. All world positions (no scaling). `outfit = spec['body']['outfit']` ('suit' or 'hoodie'). Jacket body: `rbox(torso_center, torso_size, 0.12, mats['navy'], 'torso')`; two shoulder `sphere`s at (+-shoulder_x, 0, shoulder_z) radii (0.15,0.17,0.15) navy; shirt: a flattened cone/prism: a `rbox((0,-0.215,0.92),(0.30,0.04,0.40),0.02, mats['shirt'],'shirt')`; lapels: two `rbox`es size (0.14,0.05,0.42) bevel 0.015 navy_dark at (+-0.14,-0.22,0.88) rotated about Y by +-14 degrees (`rotation_euler[1] = radians(+-14)`) and about Z by 0 (suit only); tie: `rbox((0,-0.245,0.84),(0.07,0.025,0.36),0.01, mats['tie'],'tie')` plus a knot `sphere((0,-0.245,1.0),(0.04,0.025,0.035), mats['tie'])` (suit only). Hoodie (instead of lapels and tie): torso material `hood`, tee panel `rbox((0,-0.225,0.9),(0.26,0.03,0.30),0.01, mats['hood_tee'])`, a hood ring `ring((0,0.02,1.05),0.20,0.07, mats['hood'],'hood')` flattened with scale (1,1,0.7), two drawstrings `capsule`s from (+-0.05,-0.23,1.0) to (+-0.06,-0.235,0.82) radius 0.012 shirt colour.
2. Chair: `build_chair(spec, mats, root)`: backrest `rbox((0,0.32,0.80),(0.95,0.14,0.85),0.07, mats['chair'],'chair_back')`, headrest `rbox((0,0.32,1.34),(0.5,0.12,0.22),0.05, mats['chair'],'chair_head')`, two armrests: `capsule((+-0.55,-0.05,0.58),(+-0.55,0.30,0.58),0.045, mats['chair_dark'],'arm_rest')`, a post `capsule((0,0.1,-0.4),(0,0.1,0.2),0.05, chair_dark)`. Return `{'parts': [...]}` for each builder; both attach every object to `root` with `attach` (the rig passes an empty).
3. Test `main()` (`--out`, `--report`, `--view front|back`, `--outfit suit|hoodie` overriding the spec): clear scene, build torso and chair on an empty at the origin, `setup_char_scene(scene, view, (0, 1.17), 2.25, 144, 144)`, render. `--report` prints `TORSO dx=<..> dz=<..> parts=<n>` where dx/dz are the world bounding box of the torso object. Required: dx between 0.80 and 0.90, dz between 1.0 and 1.2 (they come from the spec numbers; a failure means the spec was ignored). Render both outfits and both views to /tmp.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/mark_torso.py -- --out /tmp/gc07.png --report` prints `TORSO dx=` between 0.80 and 0.90 and exits 0.
- `... -- --out /tmp/gc07h.png --outfit hoodie --report` also exits 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC07: Mark torso, suit, shirt, tie and the office chair`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
