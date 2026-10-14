# CB: car materials, lighting, rendering and the pixel stage (review of 14 Oct 2026)

Cards: `tools/cards/CB.py` (CB01-CB24). Scratch experiments behind every number: Cycles renders of t1_chimp with a test rig, then a numpy prototype of the pixel stage, looked at as sprites at x2 and x3.

## What I looked at, and what is wrong (honest)
1. `assets/art/preview/roadster_*.png`: the old preview is a flat salmon slab; the sprite is mushy and has a solid black bar for a shadow.
2. Fresh render of `docs/cars/t1_chimp.json` with V01 `blender_car2.py` (orange #C96F32): it comes out BEIGE (AgX tone-map plus sRGB hex fed in as linear), matt, with a purple fog. Colour fidelity is the first casualty. V06 fixes the conversion but not the look.
3. Shadow: the catcher's soft shadow is thresholded to opaque black, so every sprite carries a hard black blob.
4. Environment: a flat purple world, so chrome and glass reflect nothing. Chrome looks like grey plastic.
5. **The body is a solid slab**: wheels sink into it (no arches) and the greenhouse glass is buried INSIDE it, so the glass and half the tyre never show. No material can look good until this is cut (card CB07; drop it if the shape reviewer already has it). Also: subdivision on boolean results makes long paint streaks, so use bevel only.
6. `pixelate.py` uses free k-means: colours drift per car, highlights merge with paint, the shadow eats palette slots.

## Decisions (tested, numbers in the cards)
- **Paint colour is authored, not rendered.** The render supplies only the shading; every paint pixel is snapped to a 7-step ramp generated from the car's exact hex (step 4 == the dossier colour, shadows tinted toward violet `#2a1a5c`, highlights toward cream `#fff2cc`). Result: period colours are always exact, every car shares the same cool-shadow / warm-light grammar, 80s saturated flat colour like RSAMH. A hand-measured Cycles render lost 20 percent saturation (0.59 vs 0.75) to the clearcoat reflecting a white sky, hence this.
- **Per-material ramps from a material-mask render** (flat emission colours, nearest-class majority vote per pixel): paint 7, chrome 6 (fixed, top step pure white, no dither), glass 4, tyre 3, whitewall 3, lamp 2, trim 2, tail lamp 2, outline 1. A normal car is 26-30 colours, a hard cap of 32 (two-tone adds a second paint ramp, wear adds at most 6).
- **Dither**: 4x4 ordered Bayer on paint (0.5 of a band) and a light touch on glass/tyre (0.3 x 0.08). 1.0 looked like noise, 0 looked like plastic bands; 0.5 reads as the 1989 shading and costs no palette.
- **Outlines**: 1 px silhouette `#120a1e` (one colour for every car), inner lines only on the paint/glass/tyre side of a class border, NEVER over chrome, lamps or tail lamps (highlights stay crisp). At x2 that is a 2 px canvas line: heavy, like RSAMH.
- **Studio rig** (all in CB02/CB03): gradient sky (dark floor, warm horizon band #e9dcc4, blue zenith) at strength 0.22 plus six rectangular area lights: 9x1.6 m overhead strip (the long highlight on the shoulder), warm key 4.5x3 front-left-high, cool rim behind-right, low fill, two tall white strips for chrome. View transform Standard, exposure -0.2. Probe: a chrome ball must have upper half >= 2x lower half (measured 3.5), 15 percent pixels > 0.9, 40 percent < 0.1.
- **Glass is opaque dark** (`#1b2830`, coat 1.0) with the sky reflected: crisp 4-step glass with one bright streak, no unmodelled interior to show.
- **Metallic flake**: skipped, it vanishes at 240 px. Instead `finish: metallic` adds 0.25 metallic and a facing colour flop.
- **Camera**: fixed-scale orthographic, 56 sprite px per metre (so a 3.5 m car is smaller than a 5.5 m car and cars sit together believably), rendered at 4x (1600x800). Three views per car: **q** = front three-quarter (yaw 25, pitch 10; sells grille, lamps, volume: the hero), **s** = pure side (best profile, driving and garage), **front** = head-on crop (the car as a character FACE for the HUD portrait, see RSAMH below). Yaw 38 foreshortens the length too much; pure side alone looks like a toy.
- **Sizes**: hero 400x200 canvas (Imp about 200 px wide, limo about 300) drawn at x2 on the 1280x720 canvas; mini 26 px/m (Imp about 93 px) for lists and HUD; face 34 px/m (about 105 px square) for the HUD portrait. 96 px wide hero lost the whitewalls, 128 was soft, 192-240 was the sweet spot, 320 at x2 filled the screen.
- **Shadow** is a separate sprite: sun-lit shadow-only render (sun 18 degree soft, nearly overhead), quantised to alpha levels 0/40/90/150 in `#120a1e`, same size and offset as the car sprite. The game draws it under the car on any floor.
- **Lamps**: pixel stage lists lamp and tail-lamp centroids/radii in the manifest so the game adds additive glow (bloom) at night.
- **Condition 0-10 to 4 baked states** (0 mint, 1 good, 2 tired, 3 wreck), made at the pixel stage, seeded by car id so a car always rots the same way: paint fades toward chalk `#b8aa96` (0/12/30/50 percent), dirt creeps up from the sill (0/10/24/40 percent of height), rust blobs (0/0/5/14, 3 colours), dents (ramp shifts, no new colours), chrome pitting (0/0/8/18 percent), a cracked windscreen in state 3. Game maps condition 8-10 to 0, 5-7 to 1, 3-4 to 2, 0-2 to 3. Mini and hero get all four, side gets 0 and 3.
- **Determinism**: Cycles with fixed seed is NOT byte-identical between runs (checked: differences of 1/255 on 0.0001 percent of pixels). The pixel stage is exactly deterministic given a raw PNG; the committed sprites are the source of truth; `render_all` caches raw renders by md5 of dossier + tool files.
- **Speed** (18-core Mac): about 5 s for a 1600x800 colour pass at 48 samples, 1 s mask, 3 s shadow: roughly 30 s per car for three views, 15 minutes for 31 cars; pixel stage a few seconds per car.

## RSAMH echo (Lee, 14 Oct, see docs/art/RSAMH_STYLE.md)
- Thick dark outlines, ordered dither in big gradients, saturated period paint from a hand-authored ramp (not whatever the renderer felt like): the 1989 grammar at today's richness (clearcoat streak, chrome horizon, soft shadow).
- The cars are the "band": the HUD portrait cluster shows the selected car as a FACE (head-on view, lamps as eyes, grille as mouth), 105 px square, dark outline, same ramp rules: card CB16 profile `face`. The three-quarter hero sits on the telly, the side view in the garage.
- Fixed-tableau friendliness: constant px/m and a recorded ground anchor (`ax`,`ay`) mean any scene can plant a car on its floor line with no per-car fiddling.
- Not done here (belongs to scene cards): HUD portrait frame, bloom, parallax, grain.

## Order of work
1. Start now (no dependencies beyond V01/A04): CB01, CB02, CB11. Then CB03, CB04, CB05, CB06, CB12, CB13, CB14, CB17, CB18, CB19 in parallel (pure functions + Blender tests).
2. After V02-V06 merge: CB07, CB08 (body cuts, whitewalls, two-tone), CB09, CB10 (studio rig and mask/shadow outputs).
3. CB15, CB16, CB20 (pixelate2: ramps, scale, crop, anchor, wear, shadow, lamps), CB21 (all variants per car), CB22 (render_all + manifest v2 + cache), CB23 (checker), CB24 (contact sheet for the visual QA loop).
Visual QA after CB22: run `sh tools/art/render_all.sh t1_chimp`, then the contact sheet, then LOOK at it. Expect two or three rounds of number tweaks (ramp multipliers, light watts) from that.

## Decisions for Lee / the planner
1. Whitewalls need a dossier field `wheels[i].whitewall` (optional bool). Which classics had them? The dossier cards do not say; default is none.
2. `finish: metallic` and two-tone (`roof.colour_split` plus a 2nd `typical_paint`) are read from the dossiers; check the 31 dossiers set them for the right cars.
3. The pixel size: x2 on a 1280x720 canvas (hero about 400 logical px wide for an Imp) is my recommendation. Lee may prefer chunkier (x3 of a 133 px sprite: cheaper, more 1989). It is one number (PROFILES ppm) in CB16.
4. If the shape reviewer's cards cut arches/windows, delete CB07 and keep the rest.
5. Condition thresholds (0-2 / 3-4 / 5-7 / 8-10) are a game-design call; the pixel stage only supplies four looks.
