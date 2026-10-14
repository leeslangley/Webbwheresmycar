[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA07 Showroom turntable scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA07
Needs (already merged into `dev`): GDA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`showroom.tscn`: the stage the SHOP channel shows a car on: purple back wall, tiled floor, spotlight cone and light pool, the car on a slow turntable, and a faint mirrored reflection on the floor. Colours come from src/art/showroom.js (read it in the dev worktree).

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/art/showroom.js (drawShowroom: wall #3B3470, seams #2F2A5C, dado #6C5EB5, floor #4A4180, spotlight cone and pool) and src/art/carfx.js (drawReflection: 0.16 alpha, 40 percent of car height)
- godot/art/carview.gd (GDA03: set_car, set_paint, set_wear, turntable, get_texture, ground_y_px)
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `godot/art/showroom.gd`
- `godot/art/showroom.tscn`
- `godot/tests/test_showroom.gd`

## Steps
1. `godot/art/showroom.tscn`: root `Control` named `Showroom` with `custom_minimum_size = Vector2(596, 420)`, `layout_mode = 3`, `anchors_preset = 0`, `script = ExtResource("1")` (res://art/showroom.gd). `showroom.gd`: `class_name Showroom`, `extends Control`, consts `W := 596`, `H := 420`, `FLOOR_Y := 300`.
2. `build()` (idempotent; `_ready()` calls it; sets `size = Vector2(W, H)`) creates children in this order (names exact): `Wall` ColorRect (0,0,W,FLOOR_Y, `3B3470`); `Seams` - one ColorRect (2 px wide, FLOOR_Y high, `2F2A5C`) for every x = 64, 128, ... < W, children of a Control named `Seams`; `Dado` ColorRect (0, FLOOR_Y - 28, W, 4, `6C5EB5`); `Floor` ColorRect (0, FLOOR_Y, W, H - FLOOR_Y, `4A4180`); `Cone` Polygon2D (polygon (298, 0), (298 + 178, FLOOR_Y + 30), (298 - 178, FLOOR_Y + 30); color `Color(1.0, 0.9, 0.6, 0.10)`; material `CanvasItemMaterial` with `blend_mode = CanvasItemMaterial.BLEND_MODE_ADD`); `Pool` Polygon2D (a 32 point ellipse centre (298, FLOOR_Y + 60) radii (170, 18), `Color(1.0, 0.9, 0.6, 0.18)`, ADD material); `ReflectClip` Control (`clip_contents = true`) containing `Reflect` TextureRect (`texture = View.get_texture()`, `flip_v = true`, `modulate = Color(1, 1, 1, 0.16)`, `stretch_mode = TextureRect.STRETCH_SCALE`, `mouse_filter` ignore, `texture_filter` NEAREST); then `View` (instance of res://art/carview.tscn, so create it BEFORE ReflectClip in code but `move_child` it above `Pool`: final child order is Wall, Seams, Dado, Floor, Cone, Pool, View, ReflectClip). `View`: position (0, 40), size (W, 300), `set_view("three_quarter")`, `turntable(true)`, `mouse_filter` ignore. Call `_place_reflection()` at the end.
3. `_place_reflection()`: `g := View.position.y + View.ground_y_px()` (ground row in Showroom coordinates); `Reflect.size = View.size`; mirroring about the row g: `Reflect.position.y = (2.0 * g - (View.position.y + View.size.y)) - ReflectClip.position.y` with `ReflectClip.position = Vector2(0, g)`, `ReflectClip.size = Vector2(W, 60)` (so only the first 60 px under the ground line show; `Reflect.position.x = View.position.x`).
4. Public API: `set_car(id: String) -> bool` (forwards to View, then `_place_reflection()`), `set_paint(c: Color)`, `set_wear(w: float)`, `spin(on: bool)` (`View.turntable(on)`), `spot_on(on: bool)` (`Cone.visible = on`, `Pool.visible = on`), `get_view() -> CarView`.
5. `godot/tests/test_showroom.gd`: instantiate `res://art/showroom.tscn`, `build()`; child names in order are `Wall, Seams, Dado, Floor, Cone, Pool, View, ReflectClip`; `Seams` has 8 children (x = 64 .. 512 step 64); `Cone.material` is a CanvasItemMaterial with ADD blend; `set_car("t1_chimp")` is true and `get_view().car_id` is `t1_chimp`; `spin(false)` makes `get_view().is_processing()` false and `spin(true)` true; `spot_on(false)` hides Cone and Pool, `spot_on(true)` shows them; `Reflect.flip_v` is true and its `texture` is the object `get_view().get_texture()`; `set_paint(Color("3b4a2f"))` leaves the car set; `View.view` is `three_quarter`. Free the node.
6. Screenshot step: run `sh tools/godot/gshot.sh art/showroom.tscn /tmp/gda07.png 30`. The output must contain NO line with `ERROR` (shader compile errors appear there). Then open the PNG with the Read tool and DESCRIBE what you see in your final reply (what is drawn, the main colours, anything cut off, black or missing). If it looks wrong, fix it. Expected: purple wall with panel seams and a lighter rail, two-tone floor, a soft light cone from the top centre ending in a bright pool on the floor, the orange car at three-quarter view (the screenshot is 1280x720 so the 596x420 stage sits in the top-left corner), a faint upside-down copy of the car under it.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_showroom` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh art/showroom.tscn /tmp/gda07.png 30` prints `wrote /tmp/gda07.png` with no `ERROR` line; you viewed it and described it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No channel code (the SHOP channel is a GDU card). No new shaders.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA07: Showroom turntable scene`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
