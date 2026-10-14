[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB10 blender_car2: views, mask and shadow outputs

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB10
Needs (already merged into `dev`): CB05, CB06, CB09, CA05, CA06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One Blender run builds the car ONCE (the boolean cuts are slow) and writes, for every requested view, the colour render, the material mask and the shadow; a numeric check proves the glass, tyres and chrome are visible.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/blender_car2.py (CB09), tools/art/cbrig.py (`setup_fixed_camera`, `render_mask`, `render_shadow`), tools/art/cbmat.py (`MASK_RGB`)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/blender_car2.py`
- `tests/run_blender_car2h.sh`
- `tests/cb_fractions.py`

## Steps
1. Add `--views <list>` (comma list of q,s,front,r; only with `--rig studio`; it replaces `--view`) and `--mask <png>` / `--shadow-out <png>`. In `--out`, `--mask` and `--shadow-out` the text `{v}` is replaced by the view name (more than one view and no `{v}`: exit 2). Order: build the car once; for each view: `setup_fixed_camera` (it reuses the camera), colour render to `--out`, then `cbrig.render_mask`, then `cbrig.render_shadow`; print `RENDERED <path>`, `MASKED <path>`, `SHADOWED <path>` per file. `--mask` or `--shadow-out` without `--rig studio`: exit 2 with a message.
2. Create `tests/cb_fractions.py` (Blender python; argument after `--`: a mask PNG path): load with 'Non-Color', classify the pixels with alpha >= 0.5 to the nearest colour of `cbmat.MASK_RGB`, print one line `FRACTIONS paint=0.644 chrome=.. glass=.. tyre=.. wall=.. lamp=.. trim=.. tail=.. paint2=.. opaque=<count>` (fractions of opaque pixels, 3 decimals).
3. Create `tests/run_blender_car2h.sh` (sh): render `docs/cars/t1_chimp.json` (it has no details file yet: CA03 then uses `details.empty`) with `--rig studio --views s,q --samples 8 --out /tmp/cb10_{v}.png --mask /tmp/cb10_{v}_m.png --shadow-out /tmp/cb10_{v}_sh.png`; require the six files and the six `RENDERED`/`MASKED`/`SHADOWED` lines for each of s and q; run `cb_fractions.py` on `/tmp/cb10_s_m.png` and with python3 parse the FRACTIONS line: paint between 0.40 and 0.80, glass >= 0.08, tyre + wall >= 0.025, chrome >= 0.02, opaque pixel count between 50000 and 400000; for q only require opaque between 50000 and 400000. Print `BLENDER CAR2H OK`. (Bounds from a hand test on t1_chimp with openings cut: paint 0.64, glass 0.19, tyre 0.035, chrome 0.058.)

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2h.sh` prints `BLENDER CAR2H OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB10: blender_car2: views, mask and shadow outputs`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
