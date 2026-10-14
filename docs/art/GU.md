# GU: UI kit, type, HUD, transitions and juice (review and plan, 14 Oct 2026)

Cards: `tools/cards/GU.py` (GU01..GU25). Look we echo: `docs/art/RSAMH_STYLE.md`. Brief: Lee, 14 Oct 2026.

## What I looked at
All scene screenshots, rendered from `_dev` with my own copy of `preview/shot.html` (stubs `app.hasSave`, catches draw errors): title, office, tvshop, garage (empty stable), adverts, news (mid-spin), ledger, auction, endgame, settings, bookings. Code: `src/ui/kit_draw.js`, `theme.js`, `kit_hits.js`, `scenes.js`, `canvas.js`, `art/hud.js`, `art/speech.js`, all `ui/scenes/*`, the tests that pin them.

## What is wrong (honest)
1. **Flat.** `panel` is a cream rounded rectangle with a 4px border; `button` is one flat fill with a pale strip; `bar` is two rectangles. No grain, wood, paper or enamel, no pressed state, no hover. Looks like a 2012 canvas demo, not 2026 indie.
2. **Text collides.** TV shop: the salesman's quip is painted across the car roof; `CONDITION 3.3/10` runs into its own bar and is cut. Auction: lot name and estimate sit on top of the car; the `<` `>` glyphs overlap the PREV, NEXT and BACK captions; the stat labels (CONDITION) are clipped by the REVEAL buttons. Adverts: `RISK 30%` is cut by the next row. Office: Dave's third line leaves its bubble. Endgame: confetti squares cover the headline.
3. **Text is too small for an iPhone held landscape.** The 1280x720 canvas is scaled to about 0.55 there. We use Press Start 2P at 10 to 14px (HUD plate codes 10, HUD labels 12, FOR SALE tags 12, advert PAYS/RISK about 12) and VT323 at 16 to 20px: that is 5 to 8 CSS px. Floors set in `tokens.js`: Press Start 2P >= 16 logical (9 CSS px), VT323 >= 22 (12 CSS px).
4. **Nothing moves.** No transition (every screen change is a hard cut), taps give no feedback, bars and money jump, toasts pop, the CRT toggle in Settings does nothing (no overlay exists), only 5 of the scenes show any life.
5. **No icons anywhere**; HUD shows words (REP, BUZZ) instead of symbols.
6. **Not yet the RSAMH grammar.** Top HUD strip and full-screen menus; no speech banner, no permanent bottom strip, no pop-up menu with arrow cursor.
7. Tooling: `preview/shots.sh` gives black images for title, tvshop, garage, news, bookings, cars (title throws on `app.hasSave`; the rest need stubs). Planner: copy my stubs into `shot.html`. Also `boot.js` still registers only a placeholder title, the real scenes are not wired yet.

## RSAMH echo (Lee's direction, 14 Oct)
Fixed zones at 1280x720: **banner 0..120**, **tableau 120..590 (470 tall)**, **HUD strip 590..720 (130)** (`ZONES` in `tokens.js`).
- Banner (GU08): rounded peach-to-tan gradient (#F6CFA0 to #D9A66F), 2x2 ordered dither on the lower half, 5px ink outline, a tail to the speaker, ALL-CAPS Press Start 2P 16px, typewriter reveal, 3 lines per page. Carries Dave's chatter, headlines, the day-change ceremony.
- HUD strip (GU09, GU10, GU11): left: four gold plate discs (grey until won) over the green CASH bar; centre: selected-car portrait slot (navy enamel); torn-off calendar sheet (MON 01 JAN, big day number, tear-off animation); right: white chart panel (REP, BUZZ, year bars with icons).
- Pop-up menu (GU12): small paper box, caps list, bobbing pixel arrow cursor, keyboard and tap hits.
- Modern richness stays: textured panels, bevels, animated bars and counters, transitions, particles.

## Target look: palette, type, grid, motion
Palette (all in `COLOR`): ink #14102A, night #1B1735, paper #FFF7DC, paper shade #D9CBA0, wood #6B4423 (light #8C5E34, dark #3F2814, grain #4E3119), brass #C9A24A (light #F2D98A, dark #8A6B1F), enamel red #B3282D / green #1E5A3C / navy #1C2E5A, banner #F6CFA0 to #D9A66F, cash green #3FAE49, gold #E8B923, warn #F2A93B, phosphor #7CFF8A. C64 PALETTE stays for scenes.
Light: key top-left. Every panel has a 2px white 35% top-left highlight and 2px black 22% bottom-right shade, hard 4px drop shadow (black 35%), no blurs on UI.
Type: Press Start 2P for headings, buttons, banner (logo 64, h1 32, h2 24, button and banner 16); VT323 for body (hero 40, body 28, caption 24, floor 22). Text over busy art gets a 2px ink outline (label `outline`). Never below the floors.
Grid: 4px base; steps 4, 8, 12, 16, 24, 32, 48. Panel edge 3px, corners stepped 3px (pixel look, no smooth radius), content inset edge+4.
Motion (ms): tap 90, press 80, toast 260 in / 2500 hold / 200 out, bars 450 (ghost trails 300 later), money count-up 700, page 320, slide 350, fade 250, iris 500, static wipe 400, calendar tear 700, shake 300, flash 180, day change 2400 (dim 300, tear 300-1000, money 700-1700, banner 1000-2400).
Icons (GU04): 12x12 and 16x16 text bitmaps, ink outline, 3-tone fills, drawn as merged fillRect runs. Particles (GU13): confetti, smoke, sparks, cash, rust. Juice (GU14): shake, flash, hit-stop. Transitions (GU15, GU16): fade, slide x4, iris, TV-static wipe, page-turn.

## Order of work
1. Start now, no dependencies: GU01 tokens. Then in parallel: GU02, GU03, GU04, GU05, GU07, GU13, GU14, GU15, GU17. (GU20, iPhone safe areas, was dropped on 14 Oct: WD03 replaces it, see WD.md.)
2. After those: GU06 (button), GU08 (banner), GU09, GU10, GU12, GU16, GU18.
3. GU11 (HUD strip), GU19 (day change), GU21 (kit_draw upgraded in place: every scene gets the new panels, buttons, bars at once; old tests stay green by design).
4. GU22, GU23 (app wiring; GU23 needs WD03 for the safe-area helpers), then GU24 (office in the RSAMH frame) and GU25 (TV shop fixes, the pattern for the rest).
Existing tests kept green: each card says which. GU21 keeps `kit_draw`; GU22/GU23 keep `scenes`; GU24 keeps `scene_office`, `office_art`, `hud`; GU25 keeps `scene_tvshop_*`; GU21 and GU22 wait for W45 and W47 (they edit those files). Only edited existing test: the one toast-position test in `tests/scenes.test.mjs` (GU23, settled time).

## Wave 2 (write after wave 1 merges, from fresh screenshots)
Per-scene adoption, each with the `auditCtx` zero-overlap and zero-below-floor test: auction (lot title vs car, arrows, stat labels), adverts (PAYS/RISK rows), garage, ledger, bookings, settings (icons on toggles), title (logo plate, wood buttons), endgame (confetti from particles, plate discs). Scenes become in-scene pop-ups inside the 470px tableau; wire day change to the kettle (`dayEvents` to audio and particles), page-turn to the newspaper, static wipe to the TV, disaster shake to breakdowns, `app.safe` into every back button and the HUD. Needs the art team's 1280x470 tableaus: until then the office keeps its old 56..720 art and the banner/strip simply cover its edges.

## Decisions for Lee
1. **Reflow every menu into the 470px tableau** (RSAMH pop-ups) or keep a few full-screen? I recommend pop-ups; it is wave 2 and touches every scene.
2. **Phone shape.** On a 19.5:9 iPhone the 16:9 canvas leaves about 18% of the width black. DECIDED 14 Oct: the canvas gets wider (720 high, 1280 to 1568 wide, 1280x720 stage in the middle), see docs/art/WD.md; GU14, GU16, GU19 overdraw to cover the strips.
3. **Fonts.** Keep Press Start 2P + VT323 (both OFL, bundled, readable at the floors). Swapping to Silkscreen or Pixelify Sans needs a download the Sparks cannot do; not worth it now.
4. **Sound.** Hooks are named `hover tap click deny paper coins thud stamp`; there is no audio module or sound assets in `src` yet (`app.audio.play` is a stub). Needs its own cards.
5. CRT filter default stays off; GU17/GU23 make the existing toggle work.
