[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC19 Blender paint mask pass and pixelate mask output

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC19
Needs (already merged into `dev`): V06, A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Produce, next to every car sprite, a 1-bit MASK sprite: white opaque pixels where the sprite is body paint, transparent elsewhere (chrome, glass, tyres, lamps, outline). The game recolours only masked pixels (card CC04). Read first: blender_car2.py builds the car and names the paint material `paint` (a second paint colour material for a two-tone roof must be named `paint2`).

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- tools/art/blender_car2.py and tools/art/carlib.py (make_mat, render)
- tools/art/pixelate.py (downscale, add_outline, main)
- Blender 5.2 at /opt/homebrew/bin/blender; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>`; Blender's Python has bpy, numpy, NOT PIL; you cannot see images, use numbers

## Files you may change (and nothing else)
- `tools/art/blender_car2.py`
- `tools/art/pixelate.py`
- `tests/run_mask.sh`

## Steps
1. `blender_car2.py`: new flag `--mask` (bare flag, goes in the arg parser). When set, AFTER the car is built and BEFORE lights/camera: for every MESH object, take its first material slot name; build a new emission material (`use_nodes`, Emission node, strength 1.0, colour white `(1,1,1)` when the name starts with `paint`, otherwise black `(0,0,0)`) and assign it to all slots of that object; delete the shadow catcher and all lights; world colour black strength 0. Render with `scene.render.engine = 'CYCLES'`, `scene.cycles.samples = 4`, `scene.cycles.use_denoising = False`, `scene.view_settings.view_transform = 'Standard'`, `film_transparent = True`, same camera and resolution as the colour render (use the same `setup_camera` call). Print `RENDERED MASK <out>`. Without `--mask` behaviour is unchanged.
2. `pixelate.py`: new options `--mask-in <png>` and `--mask-out <png>` (both optional, both required together; add them to `opts` and the parser). After the sprite is quantised and BEFORE `add_outline` (use the same 1 px padding that add_outline applies so sizes match): load the mask render, run the SAME `downscale(mask, width, out_h)` call; paint coverage `c = mean(rgb over channels) * alpha`; the mask is `c >= 0.5 AND opaque (the sprite's alpha is 1)`. Pad it by 1 transparent pixel to the final sprite size (outline pixels are NOT paint). Save RGBA: white `(255,255,255,255)` where masked, `(0,0,0,0)` elsewhere; print `MASK OK out=<path> pixels=<n>`.
3. `tests/run_mask.sh` (sh, run it yourself): copy `tests/fixtures/dossier_ok.json` to `/tmp/cc19.json`; run blender_car2 normally to `/tmp/cc19_raw.png` and with `--mask` to `/tmp/cc19_mask.png` (both exit 0); run pixelate with `--in /tmp/cc19_raw.png --out /tmp/cc19_px.png --width 200 --colors 16 --mask-in /tmp/cc19_mask.png --mask-out /tmp/cc19_pm.png`; then a Blender python check (`--python-expr` with bpy.data.images.load and numpy) prints `MASKPX <masked> OPAQUE <opaque> SIZES <same|differ>`; require `0 < masked < opaque`, masked between 5% and 90% of opaque, both images the same size, and every mask alpha is 0 or 255. Print `MASK OK` when all hold, else exit 1. Scratch files stay in /tmp.

## Acceptance (all must pass; exact commands)
- `sh tests/run_mask.sh` prints `MASK OK`.
- `sh tests/run_blender_car2f.sh` still prints `BLENDER CAR2F OK` (no regression in blender_car2.py).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC19: Blender paint mask pass and pixelate mask output`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
