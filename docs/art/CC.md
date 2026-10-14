# CC: cars in the game (JavaScript canvas side). Plan and review, 14 Oct 2026

> **Alignment note (14 Oct 2026):** Parts of this plan are superseded by docs/art/CARS_ALIGN.md (the Sprite contract below is OUT OF DATE: views q/s/m/f, manifest v2, game mask, runtime ramp repaint, CB22 is render_all, CC19/CC20 dropped, CC21 added). Lee's 14 Oct decision: the DEFAULT/HERO view is the SIDE view (sprite key `<id>`, `drawModelCar` default view `s`), the three-quarter is the extra `<id>_q`, the HUD portrait uses the head-on `f` face, and hero density is 48 px/m (not 52) so a 5.7 m limo fits the TV shop slot.

Cards: tools/cards/cc.py (CC01-CC20). Focus: how the classic car art appears IN the game once Blender sprites exist, with the code-drawn cars as fallback until then.

## What I looked at
src/art/cardraw.js, sprites.js (S01), boot.js, canvas.js, paint.js, profiles.js; the scenes tvshop, garage, auction, bookings, title, office; tests/fakectx.js; cards V01-V07, S01, A04, I01; docs/ART_BIBLE.md, RSAMH_STYLE.md. Screenshots via preview/shots.sh: garage and auction render, `cars`, tvshop and title came out black (the shot page failed for them; read the code instead).

## What is wrong today (honest)
1. 13 generic flat vector shapes recoloured: every hatchback is the same hatchback. Nothing says "Hillman Imp" or "Rolls".
2. Five scenes each call `drawCar` directly with their own scale rules; the car is a sticker on a panel, not the star. TV shop: car floats on cream. Garage: empty cream box. Auction: the lot name, year and estimate are printed ON TOP of the car (seen in the screenshot). Bookings: 0.4x blob. Title: four red shapes.
3. No loading flow at all: boot draws at once. Sprites need an async load, a timeout and a loading screen, in the browser and in the WKWebView (`webb://` scheme).
4. No scene ever shows condition properly (a rust blotch below cond 4 only) and cars never show faults.
5. Sizes are inconsistent: V07 renders EVERY car 320 px wide, so a micro car and a limo would both fill the same width. The Art Bible says "x3 on desktop": 320x3 = 960 logical px, three quarters of the screen.
6. Palette mismatch: paint.js says t1_allergy is sage `#8E8455`, its dossier says mustard `#d9a520`; V07 bakes the dossier colour.

## Decisions (with numbers)
**Pixel density (change to V07, card CC20).** One density for all cars: hero sheet 48 sprite px per metre (side view), thumbnail sheet 24 px/m. Micro 3.05 m = 148 px, Imp 3.56 m = 173, Beetle 4.07 m = 197, limo 5.7 m = 276 (x2 = 552 logical px, fits the 572 px slot of the 596 px TV shop stage; at 52 px/m the limo would be exactly 596 and overflow). Drawn at 2x so pixels are chunky (the original's 640x360 feel on 1280x720); cars keep real relative size. Lee to confirm: this replaces "320 px wide, x3" in the Art Bible.
**Paint: runtime palette swap with a mask, NOT N variants.** Per car: hero png (about 66 KB decoded RGBA at 220x75 average) + hero mask + thumb (14 KB) + thumb mask = 4 files, 31 cars = 124 files, about 2.5 MB decoded, 5 MB resident with masks. N=4 paints x 4 wear states x 2 sheets would be 32 files per car = 992 files, 4x16x Blender time, about 40 MB, and still no arbitrary colour. A recolour pass is 220x75 = 16 k pixels, about 1 ms (5 ms on an iPhone), cached in a 24 entry LRU (about 1.6 MB). Algorithm in card CC04: masked pixel luminance below the base paint scales the new colour, above it blends to white; outline pixels beside paint take the dark tone.
**Wear: 4 states generated at runtime from condition** (mint >= 8, worn >= 5, tatty >= 2.5, wreck below): fade + darken the paint ramp, dirt on the lower 28% of the body, seeded rust blotches (6, then 14) on the lower body, a primer patch on a wreck, exhaust smoke on a wreck, steam on any car with a fault. Zero extra Blender renders, zero extra files. The auction keeps showing condition 6 (state `worn`) until the player pays to reveal it, so the picture never leaks the hidden number.
**Crisp integer scaling.** 1280x720 desktop: device scale 1, sprite pixel = 2 px. iPhone 15 Pro landscape: layout scale 0.546 x dpr 3 = 1.64 device px per logical px, so 2 logical px would be 3.27 device px (shimmering, uneven). `pixelscale.js` snaps to whole device pixels: k = round(2 x 1.64) = 3 device px per sprite pixel (the car is 8% smaller), sprite positions snapped to the device grid, `imageSmoothingEnabled = false`. On a Pro Max (scale 1.79) k = 4: 11% bigger, so the slot-fit rule tries k, k-1 (at least 0.75 k) on the hero sheet before dropping to the thumbnail sheet; a limo never overflows its stage.
**Colour authority.** The sprite's default colour is the dossier `typical_paint[0]` (stored in the manifest as `paint`); paint.js now only feeds the code-drawn fallback. Lee to confirm; alternative is a data card to sync paint.js from the dossiers (the 3 to 4 dossier colours could also give each car instance its own paint index later).

## Sprite contract (what the game loads; CC19 and CC20 make it)
Superseded by CARS_ALIGN.md. Manifest keys: `<id>` (SIDE view, the default hero, 48 px/m), `<id>_q` (three-quarter extra), `<id>_m` (mini, side view, 24 px/m), `<id>_f` (face, 40 px/m). Entry fields, game masks and shadows: see CARS_ALIGN.md. Side view faces right, ground contact on the bottom row.

## API (names the cards share)
`pixelscale.js`: setDeviceScale, pixelK, pixelSize, snapPx, driveIn, driveOut, idleBob, makeTracker. `sprites.js` v2: load({onProgress, timeoutMs}), progress, meta, image, maskImage, keys. `assetenv.js`: makeAssetEnv(win, doc). `sprite_paint.js`: recolourPixels, wearState, wearPixels. `carvariants.js`: createVariants(env, sprites, max) -> get/light/stats. `carfx.js`: drawContactShadow, drawReflection, drawShine, drawSteam, drawExhaust. `modelcar.js`: configureCarArt, drawModelCar(ctx, modelId, x, y, scale, opts) (default view `s`; `q` and `f` by `opts.view`), measureModelCar. `stage.js`: drawStage(ctx, r, 'showroom'|'garage'|'auction', t). `carportrait.js`: drawCarPortrait, hudCarOf, drawHudCar. `tvcar.js`: drawTvCar. Tests share `tests/fakecarart.js` (fake sprites that make real `drawImage` calls under fakectx). Every card works with the code-drawn fallback when sprites are missing.

## RSAMH echo (new direction from Lee, see RSAMH_STYLE.md)
The original's band of faces becomes our cars: big characterful portraits, shown three ways.
1. **HUD portrait slot** (CC11, CC13): the selected car (the garage publishes `app.selectedCarId`; otherwise the owned cars rotate every 6 s) as a framed portrait with tier-coloured backdrop, name strip and 5 condition pips, the other owned cars peeking out behind it like the overlapping faces of the band; a `NO CAR` dashed slot when empty. Today it is placed at `OFFICE.hudCar` (floor, below the desk) because the HUD is still a top strip: when the planner moves the HUD to the bottom beside the calendar, change only that one rect.
2. **The car on the Webb TV** (CC12, CC13): the middle-of-the-room telly shows the owned cars (side view) as channels: scanlines, WEBB TV bug, name caption, static burst between cars; "Tap me to shop!" static when you own nothing.
3. **Fixed stage** (CC08 in `src/art/showroom.js`, renamed 14 Oct because GE01 owns `src/art/stage.js`; CC14-CC16): showroom, garage and auction are fixed tableaux: back wall, floor band, spotlight, the car (side view, nose to the right) standing in the middle with its shadow and reflection, driving in from the side when the selection changes. The text sits beside or under the stage, never on the car.
The title drive-by (CC18) is six real classics. Pop-up in-scene menus and the speech banner belong to other reviewers.

## Order of work
Start now (no sprites needed): CC01, CC04, CC06, CC08, CC09. Then CC02, CC03, CC05, CC07, CC10 (boot flow), CC11, CC12. Then scene cards CC13-CC18 (each one scene; once CC07 and CC08 merge they run after the GE/GU card on the same scene file, set by `needs`: GE19 then CC15, GE20 then CC17, GE18 then CC14, GE21 then CC16, GE23 then CC18, GC26 then CC13). Blender side: CC19 then CC20, after V06 and V07; overnight run of render_all gives the 31 sprites. Visual QA after CC14, CC15, CC16 with real sprites: check shine sweep speed, wear states, slot fit of the longest car.
Risks: CC19 and CC20 edit files the V cards also touch (blender_car2.py, render_all.sh): queue them after V07 merges. Other reviewers will relayout tvshop, garage, auction and the HUD: my scene cards only move the text that overlapped the car and add `LAYOUT.stage`; rebase conflicts will be small. W68d (createGame in boot.js) must merge before CC10.

## Decisions Lee must make
1. 48 px/m drawn at 2x (chunky, 148-276 px sprites) versus the Art Bible's 320 px wide: yes or no.
2. Sprite colour = dossier colour (recommended) versus keeping paint.js.
3. Runtime wear states (recommended) versus Blender damage renders.
