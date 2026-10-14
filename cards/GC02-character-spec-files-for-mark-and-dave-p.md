[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC02 Character spec files for Mark and Dave plus checker

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC02
Needs (already merged into `dev`): A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One JSON spec per character holds every number the Blender modules read (frames, palette, proportions), so a visual QA pass can change a colour or a size by editing one number and re-rendering. A checker keeps the files valid.

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- docs/ART_BIBLE.md (palette and pipeline)
- tools/check_dossier.py (the style of the car dossier checker: copy its exit codes and messages)

## Files you may change (and nothing else)
- `docs/characters/mark.json`
- `docs/characters/dave.json`
- `tools/check_charspec.py`

## Steps
1. Create `docs/characters/mark.json` (plain JSON, no comments) with exactly these top-level keys: `id` "mark"; `name` "Mark Webb"; `head_scale` 1.3; `frames` = {`world`: {`w`:144,`h`:144,`ortho`:2.25,`center`:[0.0,1.17]}, `head`: {`w`:80,`h`:80,`ortho`:1.25,`pivot_px`:[40,66]}, `bust`: {`w`:96,`h`:96,`ortho`:1.6,`center`:[0.0,1.40]}}; `render` = {`supersample`:4,`outline`:"#14102a",`outline_px`:1,`dither`:0.18,`colors`:32}; `palette` = {skin "#f1c9a5", skin_shade "#c7a083", ear "#e4b793", hair "#7a5430", hair_dark "#5a3b24", hair_light "#a07848", navy "#243a66", navy_dark "#1b2c50", shirt "#f4e9c8", tie "#7a1f2b", hood "#6a1f2b", hood_tee "#e8d44a", rim "#15151d", white "#ffffff", pupil "#14141c", lip "#b0524a", chair "#6a1f2b", chair_dark "#4a1420", phone "#2a2a32", mug "#e8e0cc", tea "#8a5a2a", spanner "#9aa0aa"}; `body` = {`torso_size`:[0.84,0.44,1.10],`torso_center`:[0,0,0.55],`neck_pivot`:[0,0,1.12],`shoulder_x`:0.45,`shoulder_z`:0.98,`upper_arm`:0.42,`forearm`:0.38,`hand`:0.12,`outfit`:"suit"}; `head` = {`radii`:[0.265,0.245,0.31],`center_offset`:0.31}; `hair` = {`seed`:7,`curls`:66,`radius`:[0.07,0.105]}; `glasses` = {`rim_radius`:0.088,`rim_thickness`:0.0125}; `face` = {`eye_x`:0.105,`eye_y`:-0.205,`eye_z`:0.035,`eye_radii`:[0.058,0.03,0.062],`brow_thick`:0.014,`brow_color`:"hair_dark",`mouth_z`:-0.165,`mouth_y`:-0.225}; `bust_faces` ["neutral","happy","grin","worried","panic","shock","smug","sad"].
2. Create `docs/characters/dave.json` the same way with these differences: `id` "dave", `name` "Dave Spanner Dobbs", `head_scale` 1.25; `frames.world.center` [0.0,0.95]; palette = {skin "#e8bf98", skin_shade "#d8a67e", ear "#d9a37c", nose "#d98a78", cap "#4a4a52", cap_dark "#33333a", hair_grey "#bdb6a8", moustache "#6b4a2e", overalls "#2f5d9e", overalls_dark "#223f70", bib "#3a6fb5", sleeve "#d9d2c0", boot "#222222", stain "#1d2b45", brass "#c9a227", mug "#e8e0cc", tea "#8a5a2a", spanner "#9aa0aa", white "#ffffff", pupil "#14141c", lip "#8a3b2b", stool "#6a4a2a", phone "#2a2a32"}; `body` = {`torso_size`:[0.92,0.52,0.95],`torso_center`:[0,0,1.05],`neck_pivot`:[0,0,1.58],`shoulder_x`:0.5,`shoulder_z`:1.45,`upper_arm`:0.40,`forearm`:0.36,`hand`:0.12,`hip_x`:0.2,`hip_z`:0.62,`thigh`:0.36,`shin`:0.36}; `head` = {`radii`:[0.28,0.26,0.30],`center_offset`:0.30}; `hair` = null; `glasses` = null; `face` = {`eye_x`:0.095,`eye_y`:-0.215,`eye_z`:0.03,`eye_radii`:[0.05,0.028,0.055],`brow_thick`:0.024,`brow_color`:"hair_grey",`mouth_z`:-0.17,`mouth_y`:-0.235}; `bust_faces` ["neutral","happy","grin","worried","panic","shock"]; keep the same `render`; add `moustache` = {`color`:"moustache",`span`:0.13}.
3. Create `tools/check_charspec.py` (python3 standard library only): `python3 tools/check_charspec.py <spec.json>...` checks every file: valid JSON object; required keys present (`id name head_scale frames render palette body head face bust_faces`; `hair`, `glasses` and `moustache` optional); `frames.world|head|bust` have integer `w`,`h` between 32 and 256 and a positive float `ortho`; `head_scale` between 1.0 and 1.6; every `palette` value matches `^#[0-9a-fA-F]{6}$` and the palette has at least 15 entries; every colour name used in `face.brow_color` and `moustache.color` exists in the palette; `render.colors` between 16 and 48. On success print one line per file `CHARSPEC OK <id> palette=<n>`; on failure print `CHARSPEC FAIL <file>: <reason>` and exit 2 after checking all files.
4. Run it on both files, then run it on a copy of mark.json with one palette value changed to `red` (in /tmp) and confirm exit 2 with the word FAIL.

## Acceptance (all must pass; exact commands)
- `python3 tools/check_charspec.py docs/characters/mark.json docs/characters/dave.json` prints two lines `CHARSPEC OK` and exits 0.
- `python3 -c "import json;d=json.load(open('docs/characters/mark.json'));print(d['frames']['world']['w'], len(d['palette']))"` prints `144 22`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC02: Character spec files for Mark and Dave plus checker`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
