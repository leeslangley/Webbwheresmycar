[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB22 render_all: studio pipeline, cache and manifest v2

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB22
Needs (already merged into `dev`): V07, CB21
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`sh tools/art/render_all.sh [car id]` renders every dossier with the studio rig (ONE Blender run per car, all views), pixelates all sprites, skips cars that have not changed, and writes manifest v2 exactly as docs/art/CARS_ALIGN.md says. It replaces V07's script and test (the old keys `file`, `w`, `h` stay, so card S01 keeps working). The file is NOT called build_manifest.py: card GC19 owns that name.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/render_all.sh and tests/run_render_all.sh (V07: keep their style and the optional first argument)
- tools/art/pixelate_all.py (CB21)
- docs/art/CARS_ALIGN.md (manifest v2: every key and type)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/render_all.sh`
- `tools/art/carmanifest.py`
- `tests/run_render_all.sh`

## Steps
1. Create `tools/art/carmanifest.py` (python3 standard library only) with two commands. `params <id>` prints three lines `color=#rrggbb`, `color2=#rrggbb` (empty when none), `finish=solid|metallic`: color = lowercase `typical_paint[0]` of `docs/cars/<id>.json`; color2 and finish come from `docs/cars/details/<id>.json` keys `paint.colour2` and `paint.finish` (empty / solid when file or key is missing). `build` reads every `assets/art/cars/*.meta.json` and writes `assets/art/cars/manifest.json` EXACTLY as CARS_ALIGN.md says (the `_meta` block, then one entry per sprite key `<id>`, `<id>_q`, `<id>_m`, `<id>_f`; `len_mm` and `paints` come from the dossier). Keys sorted, 1 space indent, trailing newline, byte-identical on a second run. Afterwards print `WIDEST <id> <w>` for the widest default (side, key `<id>`) sprite and `WARN too wide for the TV shop stage` (exit code unchanged) if `2 * w > 572` (the TV shop slot: stage 596 minus 24; a 5.7 m limo is about 276 px wide, so 552).
2. Rewrite the per-car body of `render_all.sh` (keep the optional first argument and the `OK <id>` / `FAIL <id>` lines): read the params with `carmanifest.py params`. Cache: `stamp` = md5 (`md5 -q`) of the concatenation (`cat`) of the dossier, the details file (if any) and every `tools/art/*.py`, `tools/art/parts/*.py` and `tools/art/cars/*.py`; if `build/art/raw/<id>.stamp` equals it and `assets/art/cars/<id>.meta.json` exists, print `CACHED <id>` and skip (env `FORCE=1` disables the cache). Otherwise ONE run `blender_car2.py --dossier docs/cars/<id>.json --rig studio --finish .. --color .. [--color2 ..] --samples 48 --views s,q,front --out build/art/raw/<id>_{v}.png --mask build/art/raw/<id>_{v}_mask.png --shadow-out build/art/raw/<id>_{v}_sh.png` (views `s,q,front,r` when env `REAR=1`), then `pixelate_all.py ... --qa-out build/art/qa`, then write the stamp and print `OK <id> <seconds>s`; on failure print `FAIL <id>` and continue; exit 1 if any failed. At the end run `python3 tools/art/carmanifest.py build`.
3. Rewrite `tests/run_render_all.sh` (V07's file, still printing `RENDER ALL OK`): copy `tests/fixtures/dossier_ok.json` to `docs/cars/dossier_ok.json`; run `FORCE=1 sh tools/art/render_all.sh dossier_ok` (requires `OK dossier_ok`) and again without FORCE (requires `CACHED dossier_ok`); require `manifest.json` to hold `_meta` and the keys `dossier_ok`, `dossier_ok_q`, `dossier_ok_m`, `dossier_ok_f`, each with the keys `car view file w h ax ay ppm len_mm paint paint2 paints finish mask shadow lamps colors`; `carmanifest.py build` twice gives the same md5; then `rm -f` everything it created (docs/cars/dossier_ok.json, assets/art/cars/dossier_ok*, the manifest if it did not exist before, build/art/raw/dossier_ok*, build/art/qa/dossier_ok*). `git status --short` must show only your three files.

## Acceptance (all must pass; exact commands)
- `sh tests/run_render_all.sh` prints `RENDER ALL OK` and `git status --short` lists only the three listed files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB22: render_all: studio pipeline, cache and manifest v2`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
