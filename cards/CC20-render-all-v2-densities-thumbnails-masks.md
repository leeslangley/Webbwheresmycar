[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC20 Render all v2: densities, thumbnails, masks, manifest

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC20
Needs (already merged into `dev`): V07, CC19, CC02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make render_all produce what the game loads: every car at ONE pixel density (so a micro car and a limo keep their real relative size), a hero sheet and a thumbnail sheet, a paint mask for each, and a manifest with the fields the loader reads. Numbers: hero sheet 52 sprite pixels per metre of car length, thumbnail sheet 24 per metre (a 5.7 m limo is 296 px wide at 52 and 137 px at 24; drawn at 2x it is 592 logical px, which fits the 596 px stage in the TV shop).

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- tools/art/render_all.sh, tests/run_render_all.sh (V07)
- tools/art/pixelate.py (--width, --colors, --mask-in, --mask-out from CC19)
- docs/cars/t1_chimp.json (dims_mm.length, typical_paint)

## Files you may change (and nothing else)
- `tools/art/render_all.sh`
- `tests/run_render_all.sh`

## Steps
1. In `render_all.sh` for each dossier: `len_mm` = `dims_mm.length` (python3 -c); `paints` = the `typical_paint` list; `paint` = its first entry; `wl = round(len_mm/1000*52)`, `ws = round(len_mm/1000*24)` (python3 -c; integers). Render ONCE at `--w 1536 --h 768` to `build/art/raw/<id>.png` and once with `--mask` to `build/art/raw/<id>_mask.png`. Pixelate twice from the same raws: hero `--width $wl --colors 24 --out assets/art/cars/<id>.png --mask-in ... --mask-out assets/art/cars/<id>_m.png`; thumbnail `--width $ws --colors 16 --out assets/art/cars/<id>_s.png ... --mask-out assets/art/cars/<id>_s_m.png`. Keep `OK <id>` / `FAIL <id>` output and the optional first argument.
2. Manifest (python3, same place as now): two entries per car: `<id>`: `{file:'<id>.png', w, h, len_mm, paint, paints, mask:'<id>_m.png'}` and `<id>_s`: `{file:'<id>_s.png', w, h, len_mm, paint, paints, mask:'<id>_s_m.png'}`; `w,h` read from the PNG with `file`. After the manifest print `WIDEST <id> <w>` for the widest hero sprite and print `WARN too wide for the TV shop stage` (exit code unchanged) if `2 * w > 596`.
3. `tests/run_render_all.sh`: extend it so, after running on `dossier_ok`, it requires the four PNGs `dossier_ok.png`, `dossier_ok_m.png`, `dossier_ok_s.png`, `dossier_ok_s_m.png` and both manifest keys with `mask` fields, that the hero width equals `round(len_mm/1000*52) + 2` (the +2 is the outline padding), then deletes ALL its test files (also the raw and mask renders in `build/art/raw`) and prints `RENDER ALL OK`.
4. Do not run it on the real cars: the planner does that overnight.

## Acceptance (all must pass; exact commands)
- `sh tests/run_render_all.sh` prints `RENDER ALL OK` and `git status --short` shows only the two listed files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC20: Render all v2: densities, thumbnails, masks, manifest`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
