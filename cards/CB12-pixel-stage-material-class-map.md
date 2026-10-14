[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB12 Pixel stage: material class map

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB12
Needs (already merged into `dev`): CB01, CB11
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Turn the full-size mask image into one material class per sprite pixel by majority vote (no coloured fringes at wheel arches).

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixramp.py (CB11), tools/art/cbmat.py (`MASK_RGB`), tools/art/pixelate.py (`box_weights`: reuse the idea, do not import)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixramp.py`
- `tests/pixramp_class_test.py`

## Steps
1. In `pixramp.py` add `CLASS_NAMES = ['paint','chrome','glass','tyre','wall','lamp','trim','tail','paint2']` and `MASK_FILE = {...}` = the same 9 colours as `cbmat.MASK_RGB` written as float triples value/255 (copy the table; the test below asserts the two agree).
2. Add `class_map(mask_rgba, out_w, out_h)`: `mask_rgba` is a (h,w,4) float array of RAW file values 0..1 (no colour conversion), top row first. For every source pixel with alpha >= 0.5 find the nearest class colour (squared distance); build a one-hot (h,w,9) array; area-average it down to (out_h,out_w,9) with the box weights as in pixelate.py (`box_weights` logic: each destination pixel covers `src/dst` source pixels, partial overlaps weighted); the class of a destination pixel is the argmax of that average; return an int array (out_h,out_w) and also a bool array `opaque` (out_h,out_w) = the area-averaged alpha >= 0.5.
3. Write `tests/pixramp_class_test.py` (Blender, imports `cbmat` too to compare tables: `cbmat` imports carlib which imports bpy, fine): assert `MASK_FILE[k] == tuple(v/255 for v in cbmat.MASK_RGB[k])` for the 9 names. Synthetic 40x40 mask: left 20 columns class paint (255,0,0), right 20 columns glass (0,0,255), alpha 1; `class_map(...,10,10)` -> columns 0-4 are 0 and columns 5-9 are 2. A mask where one 4x4 source block is 10 paint pixels and 6 chrome pixels maps to paint; a block with alpha 0 everywhere has opaque False. A pure tail colour (0,0,0) with alpha 1 maps to class 7. Print `PIXRAMP CLASS OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_class_test.py 2>&1 | tail -1` prints `PIXRAMP CLASS OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB12: Pixel stage: material class map`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
