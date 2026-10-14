[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB23 Sprite checker v2: palette budget, outline and shadow rules

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB23
Needs (already merged into `dev`): CB14
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A checker the planner and the QA loop run on every sprite: colour budget per sprite, hard alpha, an unbroken dark outline, and the exact alpha levels of shadow sprites.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/check_sprite.py (same style: one result line, exit 2 on failure)
- tools/art/pixramp.py (`OUTLINE`)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/check_sprite2.py`
- `tests/run_check_sprite2.sh`

## Steps
1. Create `tools/art/check_sprite2.py` (Blender python). Usage `-- <png> [--max-colors 32] [--shadow]`. Car mode (default): load with 'Non-Color'; alpha must be 0 or 255 everywhere; the number of distinct opaque rgb values must be <= max colors (default 32); EVERY opaque pixel that has a 4-neighbour outside the image or transparent must be exactly '#120a1e' (255*round) EXCEPT pixels of the image border ring if the sprite touches the border (report them as `edge_touch`); count `paint_like` = distinct colours (the metric the planner uses to see banding). Print `SPRITE2 OK size=WxH colors=N outline=<count of silhouette pixels> edge_touch=<n>`; failure: `SPRITE2 FAIL <reason>` and exit 2.
2. Shadow mode (`--shadow`): every pixel's alpha must be in {0,40,90,150}; every pixel with alpha > 0 must have rgb exactly (18,10,30); print `SPRITE2 OK shadow size=WxH levels=<n distinct alpha values>`.
3. Create `tests/run_check_sprite2.sh`: use a Blender fixture file `tests/check_sprite2_fixture.py` (add it to your files) to write `/tmp/cs2_good.png` (10x10 opaque block with a '#120a1e' ring of 1 px, 6 inner colours), `/tmp/cs2_bad_outline.png` (same, one ring pixel '#ff0000'), `/tmp/cs2_many.png` (40 distinct inner colours), `/tmp/cs2_shadow_good.png` and `/tmp/cs2_shadow_bad.png` (an alpha of 60). Require: good passes (`SPRITE2 OK`, colors 7); bad_outline exits 2 and says `outline`; many exits 2 with `--max-colors 32` but passes with `--max-colors 40`; shadow good passes with `--shadow`, shadow bad exits 2. Print `CHECK SPRITE2 OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_check_sprite2.sh` prints `CHECK SPRITE2 OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB23: Sprite checker v2: palette budget, outline and shadow rules`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
