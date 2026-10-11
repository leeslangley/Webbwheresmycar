# Art Bible: Webb, where's my car?  (revised 11 Oct 2026)

Decision (Lee, 11 Oct 2026): the code-drawn flat vector art is NOT acceptable. Target is a 2026 indie look: **modern HD pixel art, rendered from Blender**.

## Look
- Pixel art you can see (chunky pixels, limited palette, 1px selective outlines), but lit like a modern game: warm key light top-left, cool rim light, glossy paint highlights, chrome reflections, soft contact shadows, glowing TV and lamp.
- The C64 spirit: purple-blue palette base (see DESIGN.md section 3), chunky text, but at today's fidelity.
- Comedy proportions: big-headed caricatures (Mark with curly hair, round glasses, stubble), slightly toy-like cars.

## Pipeline (how the art is made)
1. Models are built by Blender Python scripts (`tools/art/*.py`), run headless: `blender --background --python tools/art/<script>.py -- <args>`. Blender 5.2 is at /opt/homebrew/bin/blender.
2. Car shapes come from the same outline data as the game (`tools/art/profiles.json`, exported from `src/art/profiles.js`), extruded to 3D, bevelled and smoothed, with real materials (glossy paint, chrome, glass, rubber).
3. Render at high resolution with transparent background (preview), then the PIXEL STAGE: render small (cars 320 to 480 px wide) with no anti-aliasing blur, then outline + quantise to a small palette (at most 32 colours per sprite) so it reads as hand-made pixel art.
4. The game draws the PNG sprites with `imageSmoothingEnabled = false` at whole-number scale (x3 on desktop, x2 or x3 on iPhone) and adds modern effects on top.
5. Every asset is rendered by a script, so every asset can be re-rendered when we change the look. Nothing is hand-edited.

## Asset list (first release)
- Cars: 13 body shapes x paint colour = 31 catalogue cars (one render per car, from its own paint colour), plus a damaged variant (rust/dirt) overlay set.
- Office: background room (layered: wall, floor, props, window, lamp glow), animated TV, phone, laptop, kettle steam.
- Characters: Mark Webb (idle loop, moods, 2 outfits), Dave (idle loop).
- UI: panel and button frames in the same pixel style.

## Rules
- All assets in `assets/art/` with names `cars/<carId>.png`, `office/<name>.png`, `characters/<name>_<frame>.png`.
- Output sizes and the palette are fixed per asset type (see the cards).
- No real brands; no real faces: Mark is a caricature.
