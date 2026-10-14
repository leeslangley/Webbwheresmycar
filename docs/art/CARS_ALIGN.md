# CARS_ALIGN: one car-art pipeline (CA + CB + CC), 14 Oct 2026
Integration of the three reviewers' card sets. Where a card or a plan (CA.md, CB.md, CC.md) disagrees with this file, THIS FILE WINS.
Pipeline: dossier + details -> CA parts in Blender -> CB studio render (ONE run per car: views, class mask, shadow) -> CB pixel stage -> assets/art/cars + manifest v2 -> CC game.
LEE DECIDED (14 Oct 2026): the DEFAULT/HERO view of every classic car is the SIDE view `s`, not the front three-quarter `q`.

## Decisions (one owner, one interface)
- Geometry (loft body, arches, windows, wheels incl. whitewall, lamps, bumpers, grilles, trim, two-tone, details schema, per-car modules): CA. Materials, light rig, camera, mask, shadow, pixel stage, sprites, render_all, manifest, checker, contact sheet: CB. In-game JavaScript: CC.
- Materials: `cbmat.make_all` (CB01) is the only material set; CA's `parts/_mats.py` wraps it. Every material name is a key of `cbmat.MASK_CLASS` (9 classes: paint paint2 chrome glass tyre wall lamp trim tail; seats, dash, vinyl and fabric all count as trim, yellow plates as wall).
- Views (CB04), every car is rendered in all of them in ONE Blender run: `s` side (nose right, pitch 6) = THE DEFAULT/HERO picture: title drive-by, TV shop, garage, auction and bookings stages, office telly, lists (sprite key `<id>`); `front` head-on = the car FACE, used by the HUD portrait slot (key `<id>_f`); `q` front three-quarter (yaw 25, pitch 10) = an extra, not the default anywhere (key `<id>_q`); `r` rear three-quarter = QA only (build/art/qa). Contact sheets show `s` first. The mini sprite `<id>_m` is the side view at mini density.
- Density, fixed for every car: Blender ortho 192 px/m (48 x 4 supersample), canvas 1600x800, ground origin at canvas (800,680). Sprite px per metre: hero (s, q) 48, mini (m) 24, face (f) 40. Heroes are drawn x2.
- Paint: rendered ONCE in the dossier `typical_paint[0]`. Paint pixels are exactly the 7 steps of a ramp made from that hex (formula CB11 = JS `paintRamp` CC04, literal rows in both tests). The game repaints by looking up the new ramp with the game mask (CC04): exact, any colour, no luminance guessing. Second colour (two-tone) = details `paint.colour2`, class paint2, fixed per car. Finish metallic = details `paint.finish`.
- Wear: at RUN TIME. `wearState(cond)`: >=8 -> 0, >=5 -> 1, >=2.5 -> 2, else 3. Paint fade = ramp of `fadeHex(hex, state)` (CC04), dirt/rust/dents/pitting/cracked screen = CC21 (CB's numbers). No baked wear sprites (CB18-CB20 wear dropped).
- Shadow: baked car-shaped shadow sprite (s, q) is drawn first; CC06 ellipse is only the fallback. Lamp centroids go in the manifest for a later night-glow card.
- Dropped overlaps: CB07/CB08 (CA05, CA06, CA07, CA17 own arches, windows, whitewalls, two-tone), CA21-CA24 (CB owns views, finish, sprites, contact sheet), CC19/CC20 (CB05/CB17/CB20 make the masks, CB22 is the one render_all). File names changed to avoid card GC19: `carmanifest.py`, `carsheet.py`.
- Because the side view is the default, the flank decides recognisability: CA04-CA08 (body, arches, windows, wheels) and CA13-CA14 (strips, shut lines, handles, mirrors) come first in QA; front and rear parts (CA09-CA12, CA15) still matter for the face portrait and the `q` extra.

## Fit number: one change fixes the TV shop (hero density 48)
The TV shop slot is `LAYOUT.stage.w - 24` = 572 px (stage 596, CC14), and the sprite is drawn x2. Side-view width = length x ppm + 2 px outline (the baked shadow can add a few px).
- At the old 52 px/m: limo 5.7 m = 298 px = 596 px at x2: no margin, over the slot, and wider still with the shadow. The `q` view is wider than `s` (length x cos 25 + width x sin 25), about 310 px.
- At 48 px/m: limo 5.7 m = 276 px = 552 at x2 (inside 572); a 5.4 m car = 261 px = 522; Imp 3.56 m = 173 px; micro 3.05 m = 148 px. Only the extra `q` of a 5.7 m limo (about 288 px = 576) can exceed the slot, and nothing shows `q` by default.
- So the single number is `ppm_hero = 48` (CB04 `PX_PER_M` 192, CB16 PROFILES, CC07 `PX_PER_M_L`). A per-car fit scale in `drawModelCar` is NOT used: non-integer scales break the crisp whole-device-pixel scaling of CC01. The slot-fit rule of CC07 still falls back to the mini sprite for an exotic over-wide car, and `carmanifest.py` prints `WARN too wide for the TV shop stage` when `2 * w > 572` (CB22).
- Side effect: the office telly slot (CC12, 262 px at p = 1) fits cars up to about 5.4 m; a 5.7 m limo on the telly uses the mini sprite.

## Files in assets/art/cars/ (PNG RGBA 8-bit, hard alpha, drawn with smoothing off)
`<id>.png` (s hero = default) `<id>_q.png` (q extra) `<id>_m.png` (mini, s view) `<id>_f.png` (face); masks `<id>_mask.png`, `<id>_q_mask.png`, `<id>_m_mask.png`, `<id>_f_mask.png`; shadows `<id>_sh.png`, `<id>_q_sh.png` (same size and anchor as their sprite; rgb #120a1e, alpha only 0/40/90/150). `<id>.meta.json` is build input, not loaded. Silhouette outline is #120a1e, 1 px. 26-30 colours per hero sprite (limit 32).
## Game mask (RGBA, size of its sprite)
Pixel (0,0,0,0) unless it is paint, chrome or glass: then alpha 255, R = class (1 paint, 2 paint2, 3 chrome, 4 glass), G = ramp step 0..6 (R 1 or 2 only, else 0), B 0. Outline, tyre, wall, lamp, trim and tail pixels are unmasked. A pixel with R 1 equals `paintRamp(paint)[G]`.
## Manifest v2: `assets/art/cars/manifest.json` (keys sorted, 1-space indent, trailing newline)
`_meta` (the loader skips keys starting `_`): {version: int 2, ppm_hero: int 48, ppm_mini: int 24, ppm_face: int 40, supersample: int 4, outline: "#120a1e"}.
One entry per sprite, key = file stem: `<id>` (side, default), `<id>_q`, `<id>_m`, `<id>_f`. Entry (all keys always present):
- car: string car id; view: "s"|"q"|"m"|"f" (`<id>` has view "s"; "m" is the side view at mini density); file: string PNG name; w, h: int, sprite size in px
- ax, ay: int, sprite px from the top-left of the PNG to the car's ground centre (draw at x - ax*p, y - ay*p; p = px size on screen)
- ppm: int sprite px per metre (48, 24 or 40); len_mm: int dossier `dims_mm.length`; colors: int distinct opaque rgb
- paint: lowercase "#rrggbb" the ramp was made from; paint2: "#rrggbb" or null; paints: [string] dossier `typical_paint`, lowercase; finish: "solid"|"metallic"
- mask: string game-mask PNG name; shadow: string PNG name or null (null for m and f)
- lamps: [{x: float, y: float, r: float, kind: "head"|"tail"}] in sprite px (s and q only, else [])
Old S01 keys `file`, `w`, `h` keep working. Width check: `carmanifest.py` prints `WIDEST <id> <w>` (default side sprites only) and WARNs when 2*w > 572 (TV shop slot).

DROPPED: CA21, CA22, CA23, CA24, CB07, CB08, CB18, CB19, CC19, CC20
NEW: CC21 (runtime wear). Changed in substance: CA01-03, CA05-06, CA17-18, CA31, CA35 (and the shared per-car rules of CA25-34); CB01, CB04-05, CB09-17, CB20-22, CB24; CC02, CC04-07, CC11-12, CC17-18. All other CB and CC cards only got the new PLAN pointer.
Changed again for hero = side (14 Oct): CA25-CA35 (side-first note), CB04 (192 px/m, `s` first), CB16 (48 px/m, sizes), CB21 and CB22 (keys `<id>` = s, `<id>_q`), CB24 (`s` default), CC02 (keys), CC07 (default view `s`, 48), CC08 (wording), CC11 and CC13 (face / side wording), CC14 (limo fit test), CC17, CC18 (no explicit view).
Planner: re-run newcard.py for every CA, CB and CC id, and delete the stale cards/ files and index.json entries of the dropped ids.

## Lee must decide
1. DECIDED 14 Oct 2026: side view `s` is the default everywhere (shops, garage, auction, bookings, telly, drive-by); `front` is the HUD face; `q` stays as an extra render and costs only render time and about 3 extra PNGs per car.
2. Density 48/24/40 at x2 replaces the Art Bible's "320 px wide, x3" (hero 48 instead of the first 52 so the side view of a 5.7 m limo fits the TV shop slot: see the fit number above). Imp 173 px (346 at x2), limo 276 px (552).
3. Wear thresholds (8 / 5 / 2.5) and runtime weathering instead of baked wear. About 10 PNGs per car, ~18 MB decoded for 31 cars.
4. Accepted losses: seats and dash render as dark trim, yellow plates as cream, one second paint colour per car, caricature factors (CA, +5-15% lamps, grille, bumpers, wheels). With the side view as default the "face" now lives only in the HUD portrait slot, so the caricature factors for lamps and grille show less in the main pictures.
