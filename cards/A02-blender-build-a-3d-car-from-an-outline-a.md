[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash A02 Blender: build a 3D car from an outline and render it

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: A02
Needs (already merged into `dev`): A01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First Blender script. It reads `tools/art/profiles.json`, builds a 3D toy-style car for one archetype by extruding the side outline, adds wheels, glass and bumpers, lights it and renders a transparent-background PNG from the side. This is the foundation of the new art; the planner will look at the picture and send exact refinement notes.

## Read first
- docs/ART_BIBLE.md
- docs/ART_SPEC.md (what the outline numbers mean: car units, x from -50 tail to +50 nose, y up from the ground, car faces right)
- tools/art/profiles.json
- Blender 5.2 is installed at `/opt/homebrew/bin/blender`. Run scripts headless like this: `/opt/homebrew/bin/blender --background --python tools/art/<script>.py -- <args>` (everything after the lone `--` goes to your script; read it with `sys.argv[sys.argv.index('--') + 1:]`). Blender's built-in Python has `bpy`, `bmesh`, `mathutils` and `numpy` but NOT PIL. You cannot see images: judge by numbers (file exists, PNG size, pixel counts via `bpy.data.images` and numpy) and let the planner inspect the pictures.

## Files you may change (and nothing else)
- `tools/art/blender_car.py`
- `assets/art/preview/roadster_flat.png`

## Steps
1. Create `tools/art/blender_car.py`. Arguments after `--`: `--archetype <name>` (default roadster), `--color <#rrggbb>` (default `#b02a2a`), `--out <png path>`, `--w <int>` (default 1024), `--h <int>` (default 512). Start by clearing the default scene (`bpy.ops.wm.read_factory_settings(use_empty=True)`).
2. Units: 1 car unit = 0.1 Blender metre. The car faces +X; Blender Z is UP (so car-profile y becomes Blender Z); the car's width runs along Blender Y. Car width (Y extent) = 0.40 * (lengthPx/100*10/... simplify: width = 36 car units for every archetype except trike 30.
3. Body: for each part of kind `body`: make a mesh from its polygon `pts` (x -> X, y -> Z, Y=0) with `bmesh` (`bm.verts.new`, `bm.faces.new`), extrude it along Y by the car width (centred on Y=0) with `bmesh.ops.extrude_face_region` then translate, then add a Bevel modifier (width 0.9 units, segments 3) and a Subdivision Surface modifier (level 1, render level 2), shade smooth. `glass` parts: same extrusion but with width 32 (a bit narrower than the body), a light blue glass material. `dark` parts: width 30, near-black. `chrome` parts: width 36, metal. `line` parts: ignore.
4. Wheels: for each wheel `{x, r, dim}` create TWO tyres (left and right side, at Y = +/-(width/2 - 3)): a cylinder with its axis along Y, radius `r` units, depth 7 units, centre at X = x, Z = r; black rubber; plus a rim (smaller cylinder, radius 0.62 r, depth 7.4, light chrome) and a hub. Bumpers: two small chrome boxes at the nose and tail (x = +/-50, z 6 to 10, width 36). Headlights: a pale yellow emissive sphere (radius `head.r`) at (head.x, +/-11, head.y) on each side; tail lights: red boxes at (tail.x, +/-11, tail.y).
5. Materials with `bpy.data.materials` + Principled BSDF: paint = the `--color` with Metallic 0.0, Roughness 0.25, Coat (clearcoat) weight 1.0, Coat roughness 0.05; chrome = Metallic 1.0, Roughness 0.08; glass = base colour `#9fc5d6`, Roughness 0.05, Alpha 0.45 (blend mode HASHED/BLEND; if transmission is easier use transmission 0.9, IOR 1.45); tyre = `#101014` roughness 0.9; ground is NOT rendered but a transparent shadow-catcher plane under the car is allowed (see lighting).
6. Lighting and camera: three lights: a warm key AREA light (colour `#fff0d8`, energy 3000 W-ish, size 6 m) at the upper left front, a cool rim AREA light (`#a8c4ff`, energy 1200) behind and above, and a fill (energy 300) from the right. World background colour dark purple `#2a2150` strength 0.6 (it lights the reflections) but film transparent. Camera: ORTHOGRAPHIC, `ortho_scale` = 11, located at X=0, Y=-20, Z=2.2 looking at (0, 0, 2.2) with a slight downward pitch of 6 degrees, so the car is seen from its right-hand side facing RIGHT of the image. Make sure the car is centred and fully inside the frame with a margin; adjust the camera Z or ortho_scale from the car's bounding box (length 100 units = 10 m).
7. Render settings: engine `CYCLES` on CPU (`scene.cycles.device = 'CPU'`), 64 samples, denoising ON, `scene.render.film_transparent = True`, resolution `--w` x `--h`, 100%, PNG RGBA 8-bit, `scene.render.filepath = args.out`, `bpy.ops.render.render(write_still=True)`. Print one line `RENDERED <out>` at the end. Also add a ground shadow catcher: a plane at Z=0 with `is_shadow_catcher = True` so the car casts a soft shadow onto transparency.
8. Run it once for the roadster and commit the output to `assets/art/preview/roadster_flat.png` (create the folder): `/opt/homebrew/bin/blender --background --python tools/art/blender_car.py -- --archetype roadster --color '#b02a2a' --out assets/art/preview/roadster_flat.png`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python tools/art/blender_car.py -- --archetype roadster --color '#b02a2a' --out assets/art/preview/roadster_flat.png` exits 0 and prints a line starting `RENDERED`.
- `file assets/art/preview/roadster_flat.png` prints `PNG image data, 1024 x 512, 8-bit/color RGBA`.
- `ls -l assets/art/preview/roadster_flat.png` shows a size over 20000 bytes.
- Run the script a second time for `--archetype saloon --color '#2a5a9a' --out /tmp/saloon_test.png` and for `--archetype trike`: both exit 0 and create PNG files (these two are checks only, do not commit them).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No pixelation, palette or outline work yet (cards A03 and A04). No game code changes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `A02: Blender: build a 3D car from an outline and render it`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
