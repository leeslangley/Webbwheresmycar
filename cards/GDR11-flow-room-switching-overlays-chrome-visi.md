[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR11 Flow: room switching, overlays, chrome visibility

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR11
Needs (already merged into `dev`): GDR21, GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The navigation half of the game flow controller `Flow` (script on main.tscn): `go(id, params, kind)` swaps the room inside `Stage/Room` (optionally through a Transitions node), `open_overlay` / `close_overlay` show the settings panel over a room, signals of the rooms are wired (request_scene, chatter, toast, closed, finished), and the HUD / banner are shown only in the office, garage and auction. Port of the scene-stack part of src/ui/scenes.js (push / pop / go) in a simpler shape: one current room plus at most one overlay.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes.js (push, pop, go, transitionFor)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/game.js (scene registration)
- godot/scenes/flow.gd and godot/scenes/main.tscn (GDR21: say, show_toast and the node paths)

## Files you may change (and nothing else)
- `godot/scenes/flow.gd`
- `godot/tests/fake_room.gd`
- `godot/tests/fake_room.tscn`
- `godot/tests/test_flow_nav.gd`

## Steps
1. Edit `godot/scenes/flow.gd` (keep GDR21's `say`, `show_toast`, `toast_count`). Add: `signal scene_changed(id: StringName)`; `const ROOM_PATHS := {&"loading": "res://scenes/loading.tscn", &"title": "res://scenes/title.tscn", &"office": "res://scenes/office.tscn", &"garage": "res://scenes/garage.tscn", &"auction": "res://scenes/auction.tscn", &"endgame": "res://scenes/endgame.tscn", &"settings": "res://scenes/settings.tscn"}`; `const CHROME_ROOMS := [&"office", &"garage", &"auction"]`; `var room_paths: Dictionary = ROOM_PATHS.duplicate()` (tests replace entries); `@export var auto_start := true`; `var current_id: StringName = &""`; `var current: Node = null`; `var overlay_id: StringName = &""`; `var overlay: Node = null`; `var transitions: Node = null`.
2. `static func transition_for(from_id: StringName, to_id: StringName) -> String`: "" when `from_id == &""` (first room, no transition); table `{"office>garage": "slide-left", "garage>office": "slide-right", "office>auction": "iris", "auction>office": "iris"}`; any other target `endgame` -> "pageturn"; everything else "fade". `_ready()`: if `ResourceLoader.exists("res://rooms/transitions.gd")` then `transitions = load("res://rooms/transitions.gd").new()`, `transitions.name = "Transitions"`, add it to `Fx` (it may not exist yet: that is fine); then `if auto_start: go(&"loading", {}, "")`.
3. `func go(id: StringName, params: Dictionary = {}, kind := "default") -> bool`: if `room_paths` has no `id`, or the file is missing (`ResourceLoader.exists` false), `push_error("Flow.go: unknown room " + String(id))` and return false. `close_overlay()` first. `var k := transition_for(current_id, id) if kind == "default" else kind`. `var swap := _install.bind(id, params)`; if `transitions != null and transitions.has_method("play")` call `transitions.play(k, swap, get_node("Stage/Room"))` else `swap.call()`. Return true. `func _install(id: StringName, params: Dictionary) -> void`: if `current != null`: call its `leave()` when it has one, `get_node("Stage/Room").remove_child(current)`, `current.queue_free()`. Instantiate `load(room_paths[id]) as PackedScene`, add to `Stage/Room`, `current = node`, `current_id = id`, `_wire(node, false)`, `node.enter(params)` when it has `enter`, set `Stage/Hud.visible` and `Stage/Banner.visible` to `CHROME_ROOMS.has(id)`, call `_after_install(node)` (an empty virtual `func _after_install(_node: Node) -> void: pass`, GDR15 fills it), emit `scene_changed(id)`.
4. Overlays: `func open_overlay(id: StringName, params: Dictionary = {}) -> bool`: false when unknown; `close_overlay()` first; instantiate into `Stage/Overlays`, `overlay`, `overlay_id`, `_wire(node, true)`, `enter(params)` if present. `func close_overlay()`: nothing when none; else `leave()` if present, remove from `Stage/Overlays`, `queue_free()`, `overlay = null`, `overlay_id = &""`. `func _wire(node: Node, is_overlay: bool)`: connect when the node has the signal: `request_scene` -> `_on_request_scene`; `chatter` -> `say`; `toast` -> `show_toast`; `closed` -> `close_overlay` (use a lambda `func(): close_overlay()`); `finished` -> `_on_loading_finished` (calls `go(&"title")`). `func _on_request_scene(scene_id: StringName, params: Dictionary)`: if `params.get("overlay", false)` -> `open_overlay(scene_id, params)` else `go(scene_id, params)`.
5. Test fixtures: `godot/tests/fake_room.gd`: `class_name FakeRoom`, `extends RoomBase`, signals `finished`, `closed`, `news_closed`; vars `entered_with: Dictionary = {}`, `left := false`, `news_calls := 0`; `func enter(p: Dictionary = {}) -> void: entered_with = p`; `func leave() -> void: left = true`; `func show_news() -> void: news_calls += 1`. `godot/tests/fake_room.tscn`: one `Control` named `FakeRoom` with that script (write by hand).
6. `godot/tests/test_flow_nav.gd`: instantiate `res://scenes/main.tscn`, set `main.auto_start = false`, `main.room_paths = {&"a": "res://tests/fake_room.tscn", &"b": ..., &"office": ..., &"settings": ...}` (all the same path), add to the tree. Static table: `Flow.transition_for(&"", &"title") == ""`, office>garage "slide-left", garage>office "slide-right", office>auction "iris", auction>office "iris", title>office "fade", anything>endgame "pageturn", `(&"garage", &"title")` "fade". Navigation: `go(&"a", {"x": 1})` returns true, `current_id == &"a"`, `Stage/Room` has 1 child, `current.entered_with == {"x": 1}`; keep `var first = main.current`; `go(&"b")` -> `first.left` true, `Stage/Room` still 1 child, `current_id == &"b"`; `go(&"nope")` returns false and leaves `current_id == &"b"`. Chrome: `go(&"office")` -> `Stage/Hud.visible` and `Stage/Banner.visible` true; `go(&"a")` -> both false. Wiring: `current.request_scene.emit(&"b", {})` -> `current_id == &"b"`; `current.chatter.emit("hi")` -> `Stage/Banner/Text` text "hi"; `current.toast.emit("T")` -> `toast_count() == 1`. Overlay: `current.request_scene.emit(&"settings", {"overlay": true})` -> `overlay_id == &"settings"`, `Stage/Overlays` has 1 child, the room is unchanged; `overlay.closed.emit()` -> overlay gone (0 children, `overlay_id == &""`). `go` while an overlay is open closes it. `scene_changed` fires with the id. Free the instance.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_flow_nav` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- New game, continue, save, game over, settings (GDR30, GDR31). Transitions (GDR13, GDR22, GDR23) and stage fitting (GDR15).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR11: Flow: room switching, overlays, chrome visibility`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
