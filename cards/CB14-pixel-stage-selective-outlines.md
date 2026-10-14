[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB14 Pixel stage: selective outlines

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB14
Needs (already merged into `dev`): CB13
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Heavy dark outlines like the 1989 game, but selective: a 1 px silhouette outline, inner lines between paint and glass/tyre, and NO outline across chrome or lamps so highlights stay crisp. It also returns the padded class and step maps that the game mask (CB17, CB20) is made from.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixramp.py (CB11-CB13), tools/art/pixelate.py (`add_outline` pads by 1 px: same convention)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixramp.py`
- `tests/pixramp_outline_test.py`

## Steps
1. Add `add_outlines(out, cls, idx, opaque, color, color2=None)` -> `(rgb, alpha, cls2, idx2)`, all padded by 1 pixel on every side (sizes h+2, w+2). Silhouette: every transparent pixel 4-neighbour to an opaque pixel becomes `OUTLINE` (linear) with alpha 1. `cls2` and `idx2` are `cls` and `idx` shifted by the padding; `cls2` is -1 on every outline pixel and every transparent pixel.
2. Inner lines: an opaque pixel of class paint or paint2 that has an opaque 4-neighbour of a DIFFERENT class (any class, chrome included, so chrome gets a dark frame on the paint side) is set to step 0 of its own ramp (`paint_ramp(color)[0]`, or of `color2` for paint2) and its `idx2` becomes 0; an opaque pixel of class glass or wall that has an opaque 4-neighbour of a different class is set to glass ramp step 0. Chrome, lamp, tail, trim and tyre pixels are NEVER changed, so highlights stay crisp. Use the ORIGINAL classes for all decisions (a changed pixel must not influence its neighbour).
3. Write `tests/pixramp_outline_test.py` (Blender): a 12x12 sprite, paint block 2..9 x 2..9 (idx 4) with a chrome 3x3 at rows 4..6, columns 4..6, plus a glass strip (2 rows by 3 columns) in rows 3..4, columns 7..9. Assert: output is 14x14; the whole ring around the opaque bounding box is `OUTLINE` with alpha 1 and everything beyond is alpha 0; the paint pixels directly beside the chrome block are `paint_ramp(color)[0]` (inner line) with `idx2` 0 but the chrome pixels are unchanged; pixels of the paint block that touch only paint are unchanged with `idx2` 4; the glass pixels touching paint are the first glass colour; `cls2` is -1 on the ring, 0 on plain paint pixels and 1 on chrome pixels. Print `PIXRAMP OUTLINE OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_outline_test.py 2>&1 | tail -1` prints `PIXRAMP OUTLINE OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB14: Pixel stage: selective outlines`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
