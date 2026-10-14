[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC20 Customer builder: heads, skin tones, hair styles, hats, accessories

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC20
Needs (already merged into `dev`): GC01, GC06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A catalogue of modular customer parts (heads, 6 skin tones, 8 hair styles, 10 headwear pieces, 6 accessories, simple torsos) built from functions, so customer variety comes from data, not from new modelling. Customers are drawn as varied, inclusive, comedic characters; text never assigns them a gender, so the builder has body build and clothing options, not 'male/female'.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- tools/art/charface.py (build_face and the 80x80 head convention)
- tools/art/mark_head.py (how a head is built from a sphere)
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)

## Files you may change (and nothing else)
- `tools/art/customerlib.py`

## Steps
1. Create `tools/art/customerlib.py` with `SKIN = ['#f6d3b3','#e8bf98','#d49a72','#b57a58','#8c5a43','#5e3b2c']`, `HAIR_COLOURS = ['#2a1d14','#5a3b24','#8a5a2a','#c9a05a','#d9d2c0','#a83a2a','#4a6fb5','#6aa84f']` and `build_customer(person, mats_extra=None)` where `person` = {`skin`: index 0..5, `hair`: style name, `hair_col`: index 0..7, `head`: 'round'|'long'|'wide', `hat`: name or None, `acc`: list of names, `top`: outfit name, `top_col`: '#rrggbb', `build`: 'slim'|'average'|'broad', `x`: world x offset (for groups), `face`: expression name}. It builds in world space at x offset: head `sphere` radii by shape (round (0.25,0.23,0.28), long (0.22,0.22,0.32), wide (0.29,0.25,0.26)) at (x, 0, 1.43) times scale 1.3 about the neck (pivot (x,0,1.12), same convention as the Mark rig), torso `rbox` scaled by build (slim 0.74, average 0.84, broad 0.98 wide) in `top_col`, shoulders, neck, ears, nose, and a face from `charface.build_face(person_spec, mats, pivot, face)` (build a small spec dict `face`/`head` like mark.json so the face builder works).
2. Hair styles (each a function adding spheres/capsules/rboxes, colour `HAIR_COLOURS[hair_col]`): `none` (bald), `short` (cap of 14 small spheres), `bob` (cap + two side slabs), `curls` (28 curls like Mark's hair), `bun` (cap + a bun sphere on top), `quiff` (cap + tilted rbox front), `long` (cap + two long capsules to the shoulders), `mohawk` (a row of 7 spheres along the crown). Headwear: `tophat`, `bowler`, `veil` (a white ring + translucent-looking white disc), `tiara` (small gold spheres on a ring), `party_hat` (cone), `hard_hat`, `chef_hat` (cylinder + puffy sphere), `beret`, `crown_wig` (large white curls wig), `mayor_hat` (tricorne: three rboxes). Accessories: `glasses_round`, `glasses_square`, `moustache_big`, `beard`, `sunglasses`, `earrings`, `bowtie`, `sash` (a diagonal rbox), `badge`, `headphones`. Tops: `suit`, `dress`, `hoodie`, `apron`, `tux`, `robe` (colours from `top_col`; each adds one or two extra rboxes over the base torso). All parts are attached to a per-person parent empty and returned in `parts`.
3. Test `main()` (`--spec "<json person>" --out <png> --report`): render a 96x96 bust with `setup_char_scene(scene,'front',(x,1.40),1.6,96,96)`; `--report` prints `CUSTOMER parts=<n> head_dx=<w>`. Run these three people and check numbers: `{"skin":3,"hair":"curls","hair_col":1,"head":"round","hat":null,"acc":["glasses_round"],"top":"suit","top_col":"#2f5d9e","build":"average","x":0,"face":"happy"}` (head_dx 0.62..0.74), a `long` head with `tophat` and `moustache_big`, and a `wide` head with `veil` and `tiara`. All three must exit 0 and the PNGs must be 96 x 96. Unknown names raise ValueError.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/customerlib.py -- --spec '{"skin":3,"hair":"curls","hair_col":1,"head":"round","hat":null,"acc":["glasses_round"],"top":"suit","top_col":"#2f5d9e","build":"average","x":0,"face":"happy"}' --out /tmp/gc20.png --report` prints `CUSTOMER parts=` and `head_dx=` between 0.62 and 0.74.
- `file /tmp/gc20.png` says `96 x 96`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC20: Customer builder: heads, skin tones, hair styles, hats, accessories`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
