[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA12 RoomPlate: layered room with lights and parallax

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA12
Needs (already merged into `dev`): GDA11, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`RoomPlate` (a Node2D) shows one room from the JSON of GDA11: an optional sky gradient behind the window, the room plate, the front layer that shifts a little against the pointer (parallax), and one `PointLight2D` per light with flicker; the window light is cold and the lamp light warm; `set_hour` changes the sky and the window light. Port of src/art/roomfx_light.js (`flicker`), roomfx_world.js (`skyColors`) and rooms.js (parallax).

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- tools/art/export_room_layers.py (GDA11: the JSON format and the LIGHTS table)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/art/roomfx_light.js (flicker formula) and src/art/roomfx_world.js (skyColors)
- godot/tests/harness.gd
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `godot/art/room_plate.gd`
- `godot/tests/test_room_plate.gd`

## Steps
1. `godot/art/room_plate.gd`: `class_name RoomPlate`, `extends Node2D`. Static funcs: `flicker(t: float, seed: float, depth: float) -> float` = `1.0 - depth * (0.5 + 0.5 * (0.6 * sin(t * 7.3 + seed) + 0.4 * sin(t * 17.9 + seed * 2.1)))`; `sky_colors(hour: int) -> Dictionary` with Color values `top` and `bottom`: hours 6 to 8 `#3b4a8a` / `#f2a65a`; 9 to 16 `#6fb4ee` / `#d8efff`; 17 to 19 `#4a3a7a` / `#f08a5d`; otherwise `#0b0d24` / `#1d2450`; `radial_texture() -> GradientTexture2D` (cached in a `static var`; `fill = GradientTexture2D.FILL_RADIAL`, `fill_from = Vector2(0.5, 0.5)`, `fill_to = Vector2(1.0, 0.5)`, 128x128, gradient white alpha 1.0 at offset 0.0 to white alpha 0.0 at offset 1.0).
2. `build_from(doc: Dictionary, loader: Callable) -> bool` (loader takes a file name String and returns a Texture2D): false when `doc` has no `layers`. Clears earlier children (free them) then creates in this order: if `doc.sky` is a Dictionary: `Sky` (Sprite2D, `centered = false`, `texture` = a `GradientTexture2D` 4x64 vertical gradient (fill linear, fill_from (0, 0), fill_to (0, 1)), `position` = rect x, y, `scale` = rect w / 4, rect h / 64; `light_mask = 2`); then one `Sprite2D` per layer named by `layer.name` (`centered = false`, `texture = loader.call(layer.file)`, `scale = Vector2(doc.scale, doc.scale)`, `texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST`, `light_mask = 2`) and remembers its parallax; then one `PointLight2D` per light named by `light.id` (`texture = radial_texture()`, `texture_scale = 2.0 * radius / 128.0`, `color`, `energy`, `position = Vector2(pos)`, `range_item_cull_mask = 2`, `blend_mode = Light2D.BLEND_MODE_ADD`, `shadow_enabled = false`), remembering base energy, `flicker` depth and `seed`. Stores `room_id`. Calls `set_hour(12)` and `set_look(Vector2.ZERO)`. Returns true.
3. `load_room(id: String) -> bool`: reads `res://art/rooms/<id>.json` (FileAccess + JSON; false when missing) and calls `build_from(doc, func(f): return load("res://art/rooms/" + f) as Texture2D)`. `set_look(v: Vector2)`: clamp each component to -1..1; each layer sprite gets `position = Vector2(-v.x * px, -v.y * py).round()` where `[px, py]` is its parallax (the `mid` layer has [0, 0] so it never moves). `layer_node(name: String) -> Sprite2D`, `light_node(id: String) -> PointLight2D`, `sky_node() -> Sprite2D` (null if none).
4. `set_hour(h: int)`: if a Sky exists set its gradient to `sky_colors(h)` (top, bottom). Window light (the light whose `kind` is `window`): day (9 to 16) colour `#b4c8e6`, energy = base; dusk (6 to 8 and 17 to 19) colour `#f2a65a`, energy = base * 0.8; night colour `#9db4ff`, energy = base * 0.35, where `base` is always the energy from the doc (never the previous hour's value; flicker multiplies the value set here). Lamp-kind lights (`lamp`, `sconce`, `spot`, `strip`) are never recoloured, so they stay warm (or strip white). `_process(delta)`: `_t += delta`; for each light with `flicker > 0` set `energy = base * flicker(_t, seed, depth)`.
5. `godot/tests/test_room_plate.gd`: `flicker(0.0, 1.3, 0.12)` near 0.895710 (eps 1e-5); `flicker(1.0, 1.3, 0.12)` near 0.890087 (eps 1e-5); for t in 0..20 step 0.1 the value for depth 0.12 stays within [0.88, 1.0]; `sky_colors(12).top` is `Color("6fb4ee")`, `sky_colors(7).bottom` is `Color("f2a65a")`, `sky_colors(18).top` is `Color("4a3a7a")`, `sky_colors(2).top` is `Color("0b0d24")`. A fake doc (office-like: scale 2, size [640, 360], sky rect [30, 150, 160, 170], layers `mid` parallax [0, 0] and `front` parallax [6, 3], lights lamp (#ffab55, energy 0.45, radius 170, flicker 0.12, seed 1.3), window (#b4c8e6, energy 0.35, radius 200, flicker 0.0), tv (#78b4ff, 0.30, 230, 0.25, 4.1)) with a loader returning a 4x4 ImageTexture: `build_from` true; children names in order are `Sky, mid, front, lamp, window, tv`; `layer_node("mid").scale` is (2, 2); `set_look(Vector2(1, -1))` puts `front` at `Vector2(-6, 3)` and `mid` at zero; `set_look(Vector2(9, 0))` clamps to -6 in x; `lamp.color.r > lamp.color.b` (warm) and (hour 12) `window.color.b > window.color.r` (cold); `set_hour(23)`: window energy near 0.35 * 0.35 and colour `#9db4ff`; `set_hour(7)`: window colour `#f2a65a`; `_process(0.5)` then the lamp energy equals `0.45 * flicker(0.5, 1.3, 0.12)` (eps 1e-6) while the window energy is unchanged; the Sky texture gradient's first colour for hour 12 is `Color("6fb4ee")`; `build_from({}, loader)` is false. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_room_plate` last line is `GDTEST OK`.
- No screenshot in this card (no preview scene yet; room scenes come with the GDR cards).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No room scenes (office.tscn etc. belong to the GDR cards). No CanvasModulate or global lighting changes.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA12: RoomPlate: layered room with lights and parallax`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
