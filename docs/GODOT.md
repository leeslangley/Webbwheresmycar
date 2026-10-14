# Godot rebuild: "Webb, where's my car?" (decision of Lee, 14 Oct 2026)

Lee: "use Godot anyway, we are WAAAAYYY off, also make the TV much bigger as it's the center of our game."
The HTML5/canvas build (src/, tests/*.mjs) stays in the repo as the REFERENCE: its sim code and data are the spec for the port, its tests give golden vectors. No new JS UI work. Blender art pipeline cards (CA, CB, CC art tools, GC, V) stay valid: they make the assets Godot imports.

## Engine and layout
- Godot 4.7.2 (installed: /opt/homebrew/bin/godot, export templates 4.7.2.stable present). GDScript, typed where cheap. Renderer: **Compatibility** (2D lights and shaders work, keeps a web export possible). Target: iPhone (landscape) first, Mac window second.
- Project folder `godot/` in the repo (`godot/project.godot`). Base size 1280x720, stretch mode `canvas_items`, aspect `expand`: tall phones show MORE picture left and right. Everything interactive lives in a centred 1280x720 `Stage` (a Control with its own anchors); wide extra strips only carry background art. Safe-area insets apply on iPhone.
- Pixel look: textures imported with `Nearest` filter, sprites at 2x (one art pixel = 2-3 screen px); body text in the bundled pixel fonts (assets/fonts/PressStart2P-Regular.ttf, VT323-Regular.ttf); a post-process `CanvasItem` shader layer for the CRT/vignette/grain.
- Player text is ASCII; the pound sign only via `Format.money()`; no real brands; no he/she/him/her for customers or named people. Mark Webb is a real friend: gentle, affectionate jokes only.

## The TV is the centre of the game
- The Webb TV (a big chunky 80s CRT on a wooden unit) is the middle of the office: about 760 px wide x 560 px tall of the 1280x720 stage (the screen glass about 600x420), centred, with Mark and Dave seen from behind in their chairs in front of it, lit by its glow. Desk and clutter around, not in front of it.
- The TV screen is a `SubViewport` (640x448) shown on the glass with a CRT shader (scanlines, curvature, bloom, static between channels). All day-to-day management happens as TV CHANNELS inside it: SHOP (cars for sale), NEWS, ADVERTS, LEDGER (money, sales chart), BOOKINGS (hire diary). The garage and the auction hall are separate rooms reached from the office (pop-up menu / door), but the TV remains the hub.
- A channel is a scene `res://tv/<name>_channel.tscn` with a script exposing `func enter(game)`, `func leave()`, and a signal `done`. The TV node owns channel switching, remote-control buttons (CH+, CH-, OK, BACK; large touch targets), and the static transition.
- Touch: every control is at least 64x64 px on the 1280x720 stage; tap = press-and-release inside the same control (tap rule: remember the pressed control on press, activate on release over it).

## Layout zones (from docs/art/RSAMH_STYLE.md, kept)
Top banner 0-120 (Dave's speech banner and headlines), tableau 120-590 (room, TV), bottom HUD 590-720 (4 Gold Number Plate slots, CASH bar, selected-car portrait, torn-off calendar day, small sales chart). The TV is allowed to overlap the banner zone a little.

## Code layout (all under `godot/`)
- `autoload/`: `game.gd` (Game singleton: state, actions, signals), `rng.gd`, `clock.gd`, `format.gd`, `save.gd`, `sfx.gd`.
- `sim/`: ports of src/sim/*.js (one .gd per JS file, same names, pure functions on a state Dictionary; no node access).
- `data/`: JSON exported from src/data/*.js by `tools/godot/export_data.mjs` (never hand-edited).
- `scenes/`: `main.tscn` (Stage, HUD, banner, transition layer), `office.tscn`, `garage.tscn`, `auction.tscn`, `title.tscn`, `endgame.tscn`, `settings.tscn`, `loading.tscn`.
- `tv/`: TV node + channels. `ui/`: theme, widgets (button, pop-up menu, toast, tooltip, counters). `art/`: imported sprites, spritesheets, room plates, car models.
- `tests/`: `test_*.gd`, run by `tools/godot/run_tests.sh` (= `godot --headless --path godot -s res://tests/runner.gd`), wired into `make gtest`. The root `make test` keeps running the JS tests until the JS build is retired.

## Determinism and parity
- `rng.gd` must reproduce src/core/rng.js exactly (same seeds, same sequences). Every sim port is tested against GOLDEN FIXTURES: `tools/godot/golden_*.mjs` run the JS reference under `jsc -m` and print JSON that is committed to `godot/tests/golden/*.json`; the .gd test loads the fixture and compares (integers equal, floats within 1e-9).
- Save format: Dictionary -> JSON string in `user://save.json` (version field).

## Art in Godot (what changes versus the canvas build)
- Cars are real 3D: the Blender builder (tools/art/blender_car2.py, driven by docs/cars/*.json dossiers and docs/cars/details/*.json) exports glTF (`tools/art/export_glb.py`); in Godot a `CarView` node renders the model in a `SubViewport` with an orthographic camera, low-res (pixel) render, one DirectionalLight + rim light, a clearcoat paint material whose colour is set at runtime from the paint ramp, wear/dirt/rust controlled by shader parameters (0..3), turntable and tilt in the showroom, side view in the garage, mini in the diary. This replaces sprite sheets for cars.
- Rooms: layered 2D plates (background, midground, props, front) rendered in Blender (tools/art/roomlib.py, pixelbg.py) imported as `Sprite2D` layers with parallax on pointer/tilt, `PointLight2D` lamps (warm lamp, cold window), `GPUParticles2D` steam/dust, flicker `AnimationPlayer`s.
- Characters (Mark, Dave, customers): Blender-rendered sprite frames (tools/art/charlib.py, poselib.py clips in docs/characters/*.json) imported as `SpriteFrames` on `AnimatedSprite2D`.
- Juice: `Tween` for screen shake/flash, `GPUParticles2D` for cash/confetti/smoke, CRT/grain shader, toasts and tooltips as pop-up `Control`s, all sound through `sfx.gd` (procedural beeps first, music later).

## Card rules for Godot cards
- Small, specific; one script or one scene per card; exact file list; acceptance commands exact. Tests: `godot --headless --path godot -s res://tests/runner.gd` prints `GDTEST OK` last on success (exit 0), `GDTEST FAIL` and exit 1 otherwise. Run one test: `godot --headless --path godot -s res://tests/runner.gd -- test_rng`.
- Scene (.tscn) cards also ship a headless smoke test that instantiates the scene, calls its public methods and checks node tree facts (no pixel checks) plus a screenshot script `tools/godot/shot.sh <scene> <out.png>` (runs Godot non-headless with a fixed frame count and saves the viewport) that the REVIEWER looks at.
- Workers cannot judge looks; a reviewer or the planner views the screenshot.
