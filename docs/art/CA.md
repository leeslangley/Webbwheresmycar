# CA: car shape and classic-detail fidelity (graphics review, 14 Oct 2026)

Cards: `tools/cards/CA.py` (CA01-CA35). Scope: the Blender pipeline (`tools/art/blender_car2.py`, V01-V07 plus these).

## What I looked at
I rendered all seven existing dossiers (t1_allergy, chimp, maurice, volksbeagle, trumpet, cooker, robbin) with the current V01 builder, and viewed t1_chimp and t1_trumpet plus the old `roadster_px_x4.png` preview. Honest verdict: **none of them is recognisable as a car, let alone as a specific classic.** Each render is a flat extruded side silhouette with bevelled edges: no windows, no wheels, no lamps, no grille, no bumper. The Chimp is a brown slab with a cabin-shaped lump; the Trumpet is a pink wedge. The dossier research (dimensions, profiles, feature lists) is good; the builder throws almost all of it away.

## What is wrong, specifically
1. **Slab body.** `extrude_polygon` gives vertical flat flanks. Real classics are all about curved wings, crowned bonnet and roof, tumblehome, sill roll-off. V02 only scales the ends; it will still be a slab.
2. **Glass is invisible by design.** V03 puts the greenhouse prism (86% width) inside a solid body that already contains the cabin, so it is hidden. The dossier convention is also inconsistent: for 6 cars `side_profile` includes the roof (max y = height), for the open Spitfire it stops at the belt (24.5 vs 30.5).
3. **No arches.** Wheels (V04) will be glued to the flank of a slab; real cars have the wheel tucked in a cut arch with a dark well.
4. **The dossier's feature text is free text.** Grille, lamps, bumpers, strips, handles, badges, fins, exhausts, shut lines live in prose a script cannot read. V05 reads only `headlamps` and invents tail lamps and plates. So the marque-defining detail (a Mini's hinges and white roof, an MGB's slatted grille and wire wheels, a Beetle's standing lamps) can never appear.
5. No two-tone, no soft top, no cockpit, no wing mirrors, no fins, no overriders. Lighting (V06) helps the paint but cannot fix missing geometry.

## Target look
Glossy toy-like classics in HD pixel art (320 px hero sprite, 2 px near-black `#0b0816` outline, 24-28 colour palette with hue-shifted ramps), warm key light upper-left-front `#fff0d8`, cool rim `#a8c4ff` from behind-right, purple-blue shadow `#2a2150`, chrome showing white/sky-blue/purple reflections, windows dark glossy teal `#1c2a34`, white-wall and wire-wheel highlights. Faces first: the front three-quarter view, so lamps (eyes), grille (mouth), bumper (jaw) read at once.

## RSAMH echo (new direction from Lee, see RSAMH_STYLE.md)
The cars are the band: big caricature faces on the telly, garage and HUD portrait.
- **Hero view = front three-quarter** (CA21 `front34`, 35 degrees), not a pure side view, so every car has a face. Pure front view gives the **96x96 HUD face portrait** (CA24).
- **Caricature factors** in the details file (`caricature`: eyes, mouth, wheels, bumper 0.8-1.4, default fill 1.15 / 1.1 / 1.05 / 1.1) enlarge lamps, grille, wheels, bumpers a little, exactly like the exaggerated features of the 1988 faces; accuracy stays because only size changes, never shape or position.
- **RSAMH finish** (CA23): saturation punch 1.25, shadow-side checkerboard dither, selective inner contour line, 2 px black outer outline, k-means to 28 colours: reads as a comic sprite at portrait size, but is still lit and glossy underneath.
- Scene dressing (dither, posters, HUD) belongs to the colleagues' cards; I only deliver `<id>.png` and `<id>_face.png` plus manifest keys (`face`, `fw`, `fh`) for them.

## The structured `details` schema (v2), CA01
One file per car: `docs/cars/details/<id>.json` (a subfolder so `docs/cars/*.json` globs in V07 and the checker still mean "dossiers"). Top level: `version`, `belt_y`, `window_frame`, `caricature`, `wheel` {style, hub, whitewall, trim_ring, hubcap_r, spokes}, `paint.zones` (roof, band, stripes, vinyl), `roof.variant` (hard, soft_up, soft_down, targa, open, vinyl), `windows` (side-view polygons), `pillars`, `cockpit`, and `parts`: a list of typed parts, each with `x` (-50 tail .. +50 nose), `y` (height), `lat` (sideways), `side` (both|near|far|centre), size fields, colour/material. 21 kinds: headlamp (round, square, oval, slanted, popup, quad), lamp (side, indicator, fog, driving, reverse, reflector), taillamp (round, rect, vertical, cat-eye, fin, wrap), grille (8 styles), bumper (blade, wrap, chunky, US, quarter; overriders, guards), plate, exhaust (round, oval, twin, quad, side pipe), strip, crease, shutline, handle, mirror, badge, wiper, aerial, fuelcap, fin, running_board, vent (louvre, gill, scoop, bulge), spare (boot, rear door, side well, bonnet), rack. The validator (`python3 tools/art/details.py f.json --dossier d.json --strict`) range-checks every number against the dossier, so the Sparks (blind) get numeric feedback, and `--doc` generates `docs/CAR_DETAILS_SPEC.md`.

## Architecture (why the cards will not collide)
`tools/art/parts/` is a plug-in package (CA03): each kind lives in its own file and registers itself, so up to five cards run at once without touching the same file. Stages run in order: body, arches, windows, wheels, paint, cockpit, roof, then parts, then a per-car module `tools/art/cars/<id>.py` (CA20) for truly unique features (Mini external hinges and driving lamps as the worked example; later: Robin fork wheel, Beetle front spare, DeLorean gullwings, Cobra roll bar). `surface.py` (CA02, pure python, no Blender) says where the body surface is, so a lamp or handle always sits ON the body.

## Order of work
1. Start immediately in parallel: CA01 (schema), CA02 (surface maths), CA23 (RSAMH finish; needs V07 only). The ten per-car fill cards CA25-CA34 need only CA01 plus their dossier card and can run any time after CA01 (they are data).
2. After V06: CA03 (framework), then CA04 body loft, then in parallel CA05 arches, CA06 windows, CA13 trim, CA14 fittings, CA16 features, CA17 paint; independent of the body: CA07 wheels, CA09/CA10 lamps, CA11 bumpers, CA12 grilles, CA15 plates and exhaust.
3. CA08 (wire/knock-off/alloy/spare) after CA07; CA18 cockpit after CA06, CA19 soft tops after CA18; CA20 per-car modules; CA21 views, CA22 contact sheet, CA24 sprite set (hero plus face) last.
4. Then the planner runs `sh tools/art/contact_sheet.sh /tmp/sheet.png t1_allergy t1_robbin ...`, LOOKS, and writes fix cards. CA35 is the template for the other 21 cars (t2_* and t3_*; copy per car, replace `{car}`, add its D11-D31 id to `needs`); cars with exotic features report `NEEDS A CAR MODULE: ...` for further CA20-style cards.
That is 24 build cards, 10 per-car cards and 1 template (35), over the 25 target because the per-car cards are mechanical and tiny.

## Risks and decisions for Lee
- **Boolean cuts** (arches, windows, cockpit) use Blender's EXACT solver, slower (render time per car maybe 1-2 minutes) and can fail on odd meshes; cards print `BOOL FAILED` and keep going, the planner will see it on the sheet.
- **Decision 1: hero view.** I recommend front three-quarter (nose toward the player, facing right-to-left as RSAMH characters face the viewer). Side view is safer for the garage drive-in animation; both can be rendered (the view flag exists). Lee to confirm.
- **Decision 2: caricature level.** Default +10-15% on lamps/grille/bumper. More comic means less "instantly the real car"; Lee's rule is accuracy, so I kept it mild.
- The Sparks cannot judge whether a car looks right; expect two or three visual-QA fix rounds per car family. The per-car cards are written from the dossiers; three (fjord, mgbee, alpaca) assume dossiers D08-D10 exist and say the dossier overrides my hints.
- Dossier accuracy limits fidelity: heights and profiles are "medium" confidence; a wrong belt line shows immediately. Verify the profile of two or three cars against photos.
