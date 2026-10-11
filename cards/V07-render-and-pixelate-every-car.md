[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash V07 Render and pixelate every car

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: V07
Needs (already merged into `dev`): V06, A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One command that renders every dossier in docs/cars/ and turns each render into a pixel-art sprite.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and numbers (the `--report` flag below).
- tools/art/pixelate.py (from card A04: read its arguments)
- tools/art/blender_car2.py

## Files you may change (and nothing else)
- `tools/art/render_all.sh`
- `.gitignore`
- `tests/run_render_all.sh`

## Steps
1. Create `tools/art/render_all.sh` (sh): `mkdir -p build/art/raw assets/art/cars`; for every `docs/cars/*.json`: take the id from the file name, take the first `typical_paint` colour (use `python3 -c` to print it), run `blender_car2.py` with `--out build/art/raw/<id>.png`, then run `pixelate.py` on it with `--width 320 --colors 24 --out assets/art/cars/<id>.png`; print `OK <id>` per car or `FAIL <id>` and keep going; at the end write `assets/art/cars/manifest.json` with python3: a JSON object `{ "<id>": {"file": "<id>.png", "w": <width>, "h": <height>} }` (read the PNG size with `file`) for every sprite that exists; exit 1 if any car failed. An optional first argument limits it to that one car id.
2. Add `build/` to `.gitignore` (create the file if needed; keep existing lines).
3. Create `tests/run_render_all.sh`: runs `sh tools/art/render_all.sh dossier_ok` after copying `tests/fixtures/dossier_ok.json` to `docs/cars/dossier_ok.json`, requires `OK dossier_ok`, that `assets/art/cars/dossier_ok.png` exists and `manifest.json` lists it, then DELETES those three test files again (use `rm -f`; run this script yourself, it is allowed because it is your test) and prints `RENDER ALL OK`. Do not commit the test sprite.

## Acceptance (all must pass; exact commands)
- `sh tests/run_render_all.sh` prints `RENDER ALL OK` and `git status --short` shows only your three listed files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `V07: Render and pixelate every car`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
