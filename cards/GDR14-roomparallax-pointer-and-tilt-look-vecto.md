[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR14 RoomParallax: pointer and tilt look vector for room layers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR14
Needs (already merged into `dev`): GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Depth for the rooms: a `RoomParallax` helper node that turns the pointer position (or the phone's tilt) into a look vector in -1..1 and shifts the room's art layers a few pixels against it, the front layer most, smoothly and in whole pixels (crisp pixel art). Port of the idea in src/art/rooms.js (PARALLAX front 6 x 3 px) and boot.js (look from pointer), extended to all five layers. The Hotspots and Ui layers never move.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/art/rooms.js (PARALLAX and drawFront)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/boot.js (how app.look is computed from the pointer)
- godot/rooms/room_base.gd (GDR19)

## Files you may change (and nothing else)
- `godot/rooms/room_parallax.gd`
- `godot/rooms/room_base.gd`
- `godot/tests/test_room_parallax.gd`

## Steps
1. `godot/rooms/room_parallax.gd`: `class_name RoomParallax`, `extends Node`. `const SHIFT_PX := {"Background": Vector2(2, 1), "Props": Vector2(3, 1.5), "Characters": Vector2(4, 2), "Lights": Vector2(3, 1.5), "Front": Vector2(6, 3)}`; `const RATE := 8.0`. Members `var room: Node2D`-like (type it as plain `Node`), `var look := Vector2.ZERO`, `var target := Vector2.ZERO`, `var enabled := true`, `var use_gravity := false`, `var _base: Dictionary = {}` (layer name -> its position when attached).
2. Statics: `look_from_pointer(p: Vector2, size: Vector2) -> Vector2` = `Vector2(clampf((p.x - size.x / 2.0) / (size.x / 2.0), -1.0, 1.0), clampf((p.y - size.y / 2.0) / (size.y / 2.0), -1.0, 1.0))`; `look_from_gravity(g: Vector3) -> Vector2` = `Vector2(clampf(g.x / 4.9, -1.0, 1.0), clampf(-g.y / 4.9, -1.0, 1.0))` (a tilt of about 30 degrees is full look; the sign convention is checked on a real iPhone later); `shift_for(layer_name: String, look: Vector2) -> Vector2` = `(-look * SHIFT_PX[layer_name]).round()` (zero for an unknown layer).
3. Methods: `attach(room_node: Node)`: remember `room`, store `_base[name] = layer.position` for each of `RoomBase.LAYER_NAMES` that exists as a child, `use_gravity = OS.has_feature("ios") or OS.has_feature("android")`. `set_pointer(local_pos: Vector2, size := Vector2(1280, 720))`: `target = look_from_pointer(local_pos, size)`. `step(delta: float)`: if not enabled return; if `use_gravity` set `target = look_from_gravity(Input.get_gravity())`; `look = look.lerp(target, 1.0 - exp(-RATE * delta))`; `apply()`. `apply()`: for every stored layer `layer.position = _base[name] + shift_for(name, look)`. `_process(delta)` calls `step(delta)`. `_input(event)`: for an `InputEventMouseMotion` and a Control `room`, `set_pointer(room.get_local_mouse_position())` (use `_input`, not `_unhandled_input`: buttons must not swallow the motion).
4. Edit `godot/rooms/room_base.gd`: add `var parallax: RoomParallax = null` and, as the LAST step of `build_layers()` (after Hotspots), `parallax = RoomParallax.new(); parallax.name = "Parallax"; add_child(parallax); parallax.attach(self)` (so the child order is Background, Props, Characters, Lights, Front, Ui, Hotspots, Parallax; GDR19's test only checks the first seven).
5. `godot/tests/test_room_parallax.gd`: statics: `look_from_pointer(Vector2(640, 360), Vector2(1280, 720)) == Vector2.ZERO`; `(1280, 720)` gives `(1, 1)`; `(0, 0)` gives `(-1, -1)`; `(-200, 360)` gives `(-1, 0)`; `(960, 360)` gives `(0.5, 0)`. `look_from_gravity(Vector3(0, 0, -9.8)) == Vector2.ZERO`, `Vector3(4.9, 0, 0)` gives `(1, 0)`, `Vector3(0, 2.45, 0)` gives `(0, -0.5)`. `shift_for("Front", Vector2(1, 1)) == Vector2(-6, -3)`; `("Front", Vector2(0.5, 0)) == Vector2(-3, 0)`; `("Background", Vector2(1, 0)) == Vector2(-2, 0)`; `("Props", Vector2(1, 0)) == Vector2(-3, 0)`; `("Lights", Vector2(-1, 0)) == Vector2(3, 0)`; `("Hotspots", Vector2(1, 1)) == Vector2.ZERO`. Node: `var r := RoomBase.new(); r.build_layers()`; `r.parallax` is a `RoomParallax` and the last child of `r`; `r.layer("Front").position = Vector2(5, 5)` BEFORE a second `r.parallax.attach(r)`; set `parallax.target = Vector2(1, 1)`, `step(10.0)`: `look` near `(1, 1)` (eps 0.001), `Front.position == Vector2(5, 5) + Vector2(-6, -3)`, `Background.position == Vector2(-2, -1)`, `Hotspots.position == Vector2.ZERO`, `Ui.position == Vector2.ZERO`; `target = Vector2.ZERO`, `step(10.0)` -> `Front.position == Vector2(5, 5)`; `enabled = false` then `target = (1,1)`, `step(10.0)` leaves positions unchanged. Free the nodes.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_room_parallax` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh test_room_base` ends with `GDTEST OK` (GDR19's test must stay green).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR14: RoomParallax: pointer and tilt look vector for room layers`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
