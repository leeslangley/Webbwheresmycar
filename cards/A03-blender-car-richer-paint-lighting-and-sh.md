[Project: Webbwheresmycar]
# Task: [GLM-SPARK] MiMo-v2.6-Flash A03 Blender car: richer paint, lighting and shape polish

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: A03
Needs (already merged into `dev`): A02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (MiMo-v2.6-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Refine the Blender car so it looks like a glossy, characterful toy classic instead of a pale slab. These are exact changes chosen after the planner looked at the first render (pale washed-out pink instead of red, a white-blob headlight, a grey wedge windscreen, a thick slab body). Build on the existing `tools/art/blender_car.py`; do not rewrite it.

## Read first
- docs/ART_BIBLE.md
- tools/art/blender_car.py (existing from A02)
- Blender 5.2 is installed at `/opt/homebrew/bin/blender`. Run scripts headless like this: `/opt/homebrew/bin/blender --background --python tools/art/<script>.py -- <args>` (everything after the lone `--` goes to your script; read it with `sys.argv[sys.argv.index('--') + 1:]`). Blender's built-in Python has `bpy`, `bmesh`, `mathutils` and `numpy` but NOT PIL. You cannot see images: judge by numbers (file exists, PNG size, pixel counts via `bpy.data.images` and numpy) and let the planner inspect the pictures.

## Files you may change (and nothing else)
- `tools/art/blender_car.py`
- `assets/art/preview/roadster_v2.png`

## Steps
1. Colour management and lighting (fixes the washed-out paint): set `scene.view_settings.view_transform = 'Standard'`, `scene.view_settings.look = 'None'`, `scene.view_settings.exposure = -0.4`. Reduce the key AREA light energy from its current value to about HALF of it and its size to 3.5 m (smaller light, smaller and crisper highlights); reduce the rim light energy to 60 percent of current; world strength 0.35 (the dark purple world was tinting the top of the car purple). Add a second, small cool-white 'sky strip' AREA light (size 8 m x 1.5 m, energy 400) directly above the car so the top surfaces get a soft highlight. The paint base colour must be the exact `--color` converted from sRGB hex to linear (`c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4`) so reds stay red; set Principled 'Specular IOR Level' 0.4, Coat Weight 1.0, Coat Roughness 0.03, Roughness 0.3.
2. Body shape (fixes the slab look): after building each `body` part (before the Bevel and Subdivision modifiers are applied) taper it: with `zmin`, `zmax` the vertical range of that part's vertices, scale the Y coordinate of every vertex with `z > zmin + 0.55*(zmax - zmin)` by 0.80 (narrower roof and shoulders), and of every vertex with `z < zmin + 0.15*(zmax - zmin)` by 0.94 (slightly narrower sills). Use `bmesh` vertex coordinates and `bm.verts.index_update()`. Increase the Bevel width to 1.4 units with 4 segments.
3. Windscreen and glass: glass material alpha 0.30 (blend mode `BLEND`, `show_transparent_back = False`), base colour `#a8d0e0`, roughness 0.03; add a thin dark frame to each glass part by creating a second copy of the glass mesh scaled 1.0 in Y and 1.05 in X and Z, material near-black `#15151a`, placed BEHIND the glass (offset 0.3 units toward the inside of the car in Y... simply use a solidify-free approach: a scaled copy with its faces flipped so only the rim shows is enough; if this is hard just add the frame as a Wireframe modifier (thickness 0.5) on the glass copy with the dark material).
4. Headlights and tail lights: replace the emissive sphere with a CHROME RING (a torus: major radius `head.r`, minor radius `0.22 * head.r`, axis along Y, material chrome) and a flattened glass lens inside it (sphere radius `0.85 * head.r`, scaled 0.45 along Y, base colour `#fff6c0`, Emission strength 1.2 only, never above 2); do this for both sides at Y = +/-(width/2 - 0.5). Tail lights: red boxes as before but with Emission strength 0.6.
5. Wheels: add a Bevel modifier (width 0.6, segments 3) to the tyres and rims, add a hub cap dome (a UV sphere of radius 0.22 r scaled 0.5 along Y) in chrome, and make the tyre sidewall slightly rounded with a Subdivision Surface level 1.
6. Add the optional flag `--no-shadow` (disables the shadow catcher plane) and `--view <side|threequarter>`: `side` is the existing camera; `threequarter` rotates the camera 28 degrees around the car's vertical axis (still orthographic, still framed from the car's bounding box). Default stays `side` with the shadow.
7. Render the roadster again to `assets/art/preview/roadster_v2.png` (1024x512, colour `#b02a2a`) and commit it. Also render (not committed) `--archetype saloon --color '#2a5a9a' --view threequarter --no-shadow --out /tmp/a03_saloon_3q.png` and confirm exit 0.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python tools/art/blender_car.py -- --archetype roadster --color '#b02a2a' --out assets/art/preview/roadster_v2.png` exits 0, prints `RENDERED`, and `file assets/art/preview/roadster_v2.png` says `PNG image data, 1024 x 512, 8-bit/color RGBA`.
- Run the script with `--archetype saloon --view threequarter --no-shadow --out /tmp/a03_saloon_3q.png` and `--archetype trike --out /tmp/a03_trike.png`: both exit 0 and create PNGs over 20000 bytes.
- With blender's python and numpy (write a 10-line check script under /tmp, not committed): in `assets/art/preview/roadster_v2.png` the median colour of the opaque pixels in the middle third of the car body (x 35 to 65 percent, y 45 to 65 percent of the image) has a red channel at least 1.8 times its green channel and 1.8 times its blue channel (the paint must read as red, not pink). Print the three channel medians in your summary.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No pixelation yet (A04). No game code. Do not change the file name or the CLI of the script beyond the two new flags.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `A03: Blender car: richer paint, lighting and shape polish`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
