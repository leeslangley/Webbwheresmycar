# GE: environment art plan (offices, shops, garage, auction, title)  14 Oct 2026

Cards: tools/cards/GE.py (GE01 to GE24). Reference prototype that already runs: docs/art/ge_proto/ (Blender room kit, pixel stage, checker, 5 room scripts, sample_*_x2.png renders).
Merge docs/art/ before the GE cards start: the cards tell the Sparks to copy from ge_proto/.

## What I looked at, and what is wrong
Ran the scene screenshots (title, office, tvshop, garage, adverts, news, ledger, auction, bookings) and read the scene code.
- Everything except the car sprites is `fillRect` and gradient vector: flat rectangles, one flat colour per object, no light, no texture, no depth. The office is a purple wall, one brown desk rectangle, a grey cabinet, a wooden-stripe floor and a yellow glow blob. It reads as a 2012 Flash toy, not a 2026 indie game.
- Most management screens (TV shop, garage, ledger, bookings, adverts) are full-screen opaque UI panels on a flat colour. There is almost no environment at all: no room, no clutter, no comedy in the props.
- Tooling bug (not in the repo): `preview/shot.html` crashes for title, tvshop, garage, news, bookings (it lacks `app.hasSave`, `newGame`, `continueGame`) so shots.sh writes black PNGs for them. Fix: add `app.hasSave = () => true; app.newGame = app.continueGame = () => {};` before `app.go(id)`. The garage shot also shows an EMPTY garage because its buy hack silently fails.
- The art bible already chose Blender-to-pixel for cars; the rooms were never given the same treatment.

## Decision: Blender-rendered room plates, pixelated (not layered code sprites)
Proven by a prototype, not argued: docs/art/ge_proto/sample_office_x2.png. A Blender scene built from boxes, cylinders and procedural materials (about 330 lines of Python kit) renders in 3 s (Cycles CPU, 64 samples), then pixelbg.py (area-average 1280x720 to 640x360, 96-colour k-means palette, light ordered dither) gives a picture with baked soft shadows, ambient occlusion, a warm lamp pool against cold TV light, sun slats through venetian blinds on the floor, wallpaper and wood grain. A code-drawn canvas version cannot get soft global lighting without hundreds of hand-placed gradients, and the Sparks cannot see what they draw.
Why this pipeline suits text-only Sparks: every prop is a function with numeric rectangles in game screen pixels (`wbox` places a box so its FRONT FACE lands on a screen rect; verified to 1 px with `project()`), so cards can assert positions with numbers; materials and lights are numbers; `check_room.py` asserts size, colour count, transparent holes, brightness and warmth of regions. A human/Sonnet QA loop then looks at the PNG and sends fix notes (change a light energy, a hex colour).
Honest limits: Cycles renders differ slightly run to run (multithreaded denoise); we commit the PNGs and treat pixelbg as the deterministic step (tested bit for bit). Banding rings around lamps appear with k-means at low dither: fix with more colours (96) and dither 0.22, QA tunes.

## Target look
HD pixel art at 2 screen px per art pixel (plates 640x360 drawn x2 with smoothing off). 64 to 96 colours per plate. Warm key light (lamp, shade bulbs) against cold fill (window, TV, strip lights). Soft contact shadows, AO in corners, chrome and brass highlights, wood grain, wallpaper, bunting, clutter. Game-side on top: additive glow with deterministic flicker, window sky layer behind the plate (hour of day, drifting clouds), dust motes, steam, light shaft, vignette (0.25 to 0.35), grain (60 specks), glass glare and scanlines on telly and laptop. Parallax: the front layer (chairs) shifts up to 6 px against the pointer; sky clouds 4 px. Characters and cars stay separate sprites.
Pixel type stays Press Start 2P / VT323, drawn by the game (poster, ledger label and sign text are NOT baked in, so ASCII tests still see them).

## RSAMH echo (docs/art/RSAMH_STYLE.md): screen zones in px (src/art/stage.js, GE01)
- Banner (speech): x 0..1280, y 0..120. Dave's chatter and headlines. Inside it the bubble rect is {12,8,1256,104}.
- Tableau (the fixed stage set, head-on, wide and shallow): x 0..1280, y 120..590 (470 tall). Every plate puts its subject here.
- HUD strip: y 590..720 (130). Cash bar, 4 Gold Number Plates, selected-car portrait, torn-off calendar, chart. Owned by the UI agents; until it exists the old top HUD (56 px) still draws over the plate.
- Each plate is a full 640x360 image (1280x720): ceiling or sky above y 120, floor and foreground below y 590, so nothing breaks when a zone is covered or hidden.
- Camera: orthographic, tilted 16 degrees down; back wall at world y=0; 1 px = 0.01 m; wall height at screen y: (480 - y) / (100 cos16); floor line at screen y 480.
Office (the hub), screen px {x,y,w,h}: window 30,150,160,170 (opening is transparent: sky layer behind), auction poster 205,156,100,150, workshop board 320,170,110,130, Webb TV housing 450,170,350,262 on a cabinet with video recorder (tv hit 450,170,350,322), TV screen 482,196,286,210 (stays near black, live static drawn on it), calendar 836,168,88,112, kettle table 815..945 (kettle 830,318,110,92), filing cabinet (ledger) 960,250,100,235, garage roller door 1086,182,158,306 with a blank sign board above for the word GARAGE, desk 40,378,370,130 with phone 70,348,70,52, laptop 150,334,130,66, newspaper 310,372,70,28, a green banker's lamp at x 388 (bulb 388,328), rug and TWO swivel chairs seen from behind at x 555 and 715 (the second layer office_front.png, drawn OVER Mark and Dave who sit in them; their heads show above the chair backs at y 300 to 395). Until the characters agent delivers back-view sprites the old front-view Mark and Dave are drawn at those anchors (rects mark 495,300,120,190 and dave 667,310,96,180).

## Palettes (hex) and lighting per room
- Office: wall teal #3f6a75/#477883 stripes, oak #7a4828, cream #e3d9bd, honey floorboards #8c5a2b/#c08a4c, maroon rug #7a2232, olive cabinet #6f7d72, mustard hazard #e0b52a. Key: lamp #ffab55 (360), sun #ffe2b8 through blinds (2.6), TV #78b4ff (260), fill #ffe6c8. Warm pool left, cold pool centre.
- Garage / stable: breeze-block #6f7c76/#78857f, concrete #55575b/#6a6c70, pegboard #c9b48a, drums #2f5b9e, bay lines #e0b52a, tool handles #d9622b. Three cold strip lights #dff1ff (flicker in game), nothing warm except tool handles.
- Auction hall: panelled wall #3d2414/#4a2c1a, velvet #6a1f2b, brass #c9983c, floor #2b2230, chairs #3a2a55. One warm spot #ffe2a0 (3500) on the lot board, two small sconces; the rest stays dark.
- Title: sky transparent (game draws gradient #14102a to blue and stars), brick #6b3a30/#7a4438, windows #ffb050, lamp posts warm #ffb15c, wet road #23232e with window reflections, moon fill #9db4ff.
- Ledger desk: green leather #2b5a3c, red ledger #a02a35, brass lamp. Bookings desk: dark planks #4a2c18/#6b4528, cream telephone, yellow notepad. Both: warm lamp pool top left, calm elsewhere.
- TV shop and advertising laptop: no plate (the device already fills the screen); they get glass glare, scanlines, vignette, grain.

## Order of work
1. Immediately, in parallel: GE01 stage zones, GE02 roomlib, GE13 loader (after GE01), GE14 light effects, GE15 sky/dust/steam.
2. GE03 pixel stage + checker; GE04 shell, then GE05 furniture and GE06 props in parallel.
3. GE07 office plates, GE08 garage, GE09 auction, GE10 title, GE11 desks; GE12 build script and manifest.
4. GE16 office layout (moves hit rects, updates tests), then GE17 office scene; GE18 to GE23 the other scenes; GE24 boot wiring (needs W68d). Scene files are shared, so `needs` order them: GU24 then GE17 then GC26 then CC13 (office), GU25 then GE18 then CC14 (tv shop), GE19 then CC15, GE20 then CC17, GE21 then CC16 then WD13, GE23 then CC18; boot.js goes GE24, CC10, WD06, WD14. GE14's `vignette` now overdraws 144 px each side (wide screens, WD.md).
After GE07 the planner (or a Sonnet QA pass) should LOOK at the office plate and send fix notes before the other rooms are tuned.
Every scene keeps a fallback to its old vector background, so a missing PNG never breaks the game or any test.

## Decisions for Lee
1. Management screens (TV shop, garage, ledger, bookings, adverts) are still full-screen panels, so most of their plates is hidden. The RSAMH answer is in-scene pop-ups inside the 470 px tableau (a small boxed list beside the telly). That means relayout of each scene and its tests, and touch targets get smaller: on an iPhone in landscape 56 logical px is only about 30 points. Plates are already composed for it. Recommend Phase B after you have seen the office; do you want it?
2. Pixel density: environment is x2 (640x360). Cars were specced at 320 to 480 px wide drawn x3; a car at x3 beside a room at x2 will look wrong. Ask the car owners to keep sprites at x2 density.
3. Characters: Mark and Dave seen from behind in chairs need new back-view sprites (character owners). The office plate leaves the right room for them.
4. The wall calendar stays in the office (small) so its hit test still passes; the HUD agents may move the calendar to the HUD later.
