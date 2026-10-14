[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR19 RoomBase: layered room root with placeholder builders

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR19
Needs (already merged into `dev`): GDR18, GDR32
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The base class of every room scene. It builds the five art layers the GDA (art import) cards fill (`Background`, `Props`, `Characters`, `Lights`, `Front`), a `Ui` layer for panels and labels, and a `Hotspots` layer for tap rects, plus small static builders for flat-colour placeholder art.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/rooms/hotspot.gd (GDR18)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/art/rooms.js (how a room plate and its parallax front layer work)
- docs/art/RSAMH_STYLE.md (the look)

## Files you may change (and nothing else)
- `godot/rooms/room_base.gd`
- `godot/tests/test_room_base.gd`

## Steps
1. `godot/rooms/room_base.gd`: `class_name RoomBase`, `extends Control`. Constants: `STAGE_SIZE := Vector2(1280, 720)`; `LAYER_NAMES := ["Background", "Props", "Characters", "Lights", "Front"]`. Signals: `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text: String)`, `toast(text: String)`. Members: `var game = null` (untyped on purpose: the Game autoload or a FakeGame), `var hotspots: Dictionary = {}` (id -> RoomHotspot), `var strip_color := Color("14102A")` (colour of the extra-width strips, set by each room to its wall colour).
2. `func get_game()`: return `game` if not null, else `game = get_node_or_null("/root/Game")` and return it. Virtuals that do nothing here: `func enter(_params: Dictionary = {}) -> void`, `func leave() -> void`, `func _on_hotspot(_id: StringName) -> void`.
3. `func build_layers() -> void`: return at once if `has_node("Background")`. Otherwise: `size = STAGE_SIZE`, `custom_minimum_size = STAGE_SIZE`, `mouse_filter = Control.MOUSE_FILTER_IGNORE`, `texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST`. For each name in LAYER_NAMES add (in this order) a `Node2D` with that name that has two children: a `Sprite2D` named `Plate` (`centered = false`, no texture) and a `Node2D` named `Placeholder`. Then add a `Control` named `Ui` (`size = STAGE_SIZE`, mouse_filter IGNORE) and a `Control` named `Hotspots` (same). Final child order: Background, Props, Characters, Lights, Front, Ui, Hotspots.
4. `func layer(layer_name: String) -> Node2D` returns `get_node(layer_name)`. `func placeholder(layer_name: String) -> Node2D` returns `get_node(layer_name + "/Placeholder")`. `func ui() -> Control` returns `get_node("Ui")`. `func set_plate(layer_name: String, tex: Texture2D, pos := Vector2.ZERO) -> void`: sets the `Plate` sprite texture and position and sets `Placeholder.visible = (tex == null)` (this is how art cards replace the flat placeholders). `func add_hotspot(hs_id: StringName, rect: Rect2) -> RoomHotspot`: `RoomHotspot.make`, add to `Hotspots`, connect `tapped` to `_on_hotspot`, store in `hotspots[hs_id]`, return it.
5. Static builders (all child controls get `mouse_filter = Control.MOUSE_FILTER_IGNORE`): `static func add_box(parent: Node, node_name: String, rect: Rect2, color: Color, caption := "") -> ColorRect` (position/size from rect; when `caption != ""` add a child `Label` named `Caption` at (4, 2), font size 14, colour white if `color.get_luminance() < 0.5` else ink `Color("14102A")`). `static func add_panel(parent: Node, node_name: String, rect: Rect2, fill := Color("FFF7DC")) -> Panel` (a `Panel` with a `StyleBoxFlat` override named "panel": bg `fill`, border width 4 all sides, border colour ink, no corner radius). `static func add_label(parent: Node, node_name: String, text: String, pos: Vector2, font_px: int, color: Color, width := 0.0, center := false) -> Label` (font = `pixel_font("body")` through `add_theme_font_override("font", f)`, size via `add_theme_font_size_override("font_size", font_px)`, colour via `add_theme_color_override("font_color", color)`; when `width > 0` set `size = Vector2(width, font_px * 1.6)` and when `center` also `horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER`). `static func pixel_font(kind: String) -> Font`: path = `res://assets/fonts/PressStart2P-Regular.ttf` for "title" else `res://assets/fonts/VT323-Regular.ttf`; if `ResourceLoader.exists(path)` return `load(path) as Font`, otherwise `ThemeDB.fallback_font`.
6. `godot/tests/test_room_base.gd`: (1) `var r := RoomBase.new(); r.build_layers()`: children 0..6 are named Background, Props, Characters, Lights, Front, Ui, Hotspots in that order; each layer is a `Node2D` with children `Plate` (a `Sprite2D`, `centered == false`) and `Placeholder`; `r.size == Vector2(1280, 720)`; calling `build_layers()` again adds no children. (2) `set_plate("Props", tex)` with `ImageTexture.create_from_image(Image.create(4, 4, false, Image.FORMAT_RGBA8))` sets the texture and hides `Props/Placeholder`; `set_plate("Props", null)` shows it again. (3) `add_box(r.placeholder("Props"), "B", Rect2(10, 20, 30, 40), Color.BLACK, "HI")` returns a ColorRect with that position/size and a `Caption` Label child whose colour is white; with `Color.WHITE` the caption colour is `Color("14102A")`. (4) `add_hotspot(&"k", Rect2(0, 0, 10, 10))` is in `r.hotspots`, is a child of `Hotspots`, has size (64, 64); pressing/releasing it calls an overridden `_on_hotspot` (make a tiny subclass in the test with `extends RoomBase` via an inline script: `var s := GDScript.new(); s.source_code = "extends RoomBase\nvar got := []\nfunc _on_hotspot(i): got.append(i)\n"; s.reload()` then `s.new()`). (5) `add_panel` returns a Panel whose `get_theme_stylebox("panel")` is a StyleBoxFlat with `border_width_left == 4`. (6) `add_label(..., width=200.0, center=true)`: `size.x == 200`, `horizontal_alignment == HORIZONTAL_ALIGNMENT_CENTER`. (7) `RoomBase.pixel_font("title")` and `("body")` are not null. (8) `get_game()` returns `r.game` when set (set it to a `FakeGame.new()`, GDR32). Free every node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_room_base` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files. No room content, no parallax (GDR14), no scene files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR19: RoomBase: layered room root with placeholder builders`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
