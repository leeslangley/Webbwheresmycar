[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU10 TV: tv.tscn cabinet, glass and SubViewport

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU10
Needs (already merged into `dev`): GDU01, GDU09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The big Webb TV node, 760x560 px (the centre of the game): a chunky wooden-cabinet CRT drawn in code, a 600x420 glass showing a 640x448 SubViewport through the CRT shader, and exact mapping of touches on the glass into the screen. Remote buttons and channels come in GDU11 and GDU12.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/tv/crt.gdshader and crt_math.gd (GDU09)
- docs/GODOT.md section 'The TV is the centre of the game'

## Files you may change (and nothing else)
- `godot/tv/tv.tscn`
- `godot/tv/tv.gd`
- `godot/tests/test_tv.gd`

## Steps
1. `godot/tv/tv.tscn` (text scene): `[gd_scene load_steps=2 format=3]`, `[ext_resource type="Script" path="res://tv/tv.gd" id="1"]`, root `[node name="Tv" type="Control"]` with `script = ExtResource("1")`. Children are built in code.
2. `godot/tv/tv.gd`: `class_name Tv`, `extends Control`. Consts `SIZE := Vector2(760, 560)`, `GLASS := Rect2(60, 50, 600, 420)`, `SCREEN := Vector2(640, 448)`. Signal `closed` (used from GDU12). `_init`: `size = SIZE`, `custom_minimum_size = SIZE`, `mouse_filter = MOUSE_FILTER_PASS`. `_ready()` builds (names exact): `Viewport` (SubViewport: `size = Vector2i(640, 448)`, `render_target_update_mode = SubViewport.UPDATE_ALWAYS`, `transparent_bg = false`, `canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST`, `gui_disable_input = false`); inside it `Screen` (a Control, `size = Vector2(640, 448)`, this is where channels go) with a black `ColorRect` background child; and `Glass` (TextureRect child of the Tv: `position = GLASS.position`, `size = GLASS.size`, `texture = $Viewport.get_texture()`, `expand_mode = TextureRect.EXPAND_IGNORE_SIZE`, `stretch_mode = TextureRect.STRETCH_SCALE`, `mouse_filter = MOUSE_FILTER_STOP`, a `ShaderMaterial` with `crt.gdshader` stored in `var crt_material`). Connect `Glass.gui_input` to `_on_glass_input`.
3. API: `func host() -> Control: return get_node("Viewport/Screen")`. `var curvature: float = CrtMath.DEFAULT_CURVATURE`. `func glass_to_screen(p: Vector2) -> Vector2: return CrtMath.glass_to_source(p, GLASS.size, SCREEN, curvature)`. `func set_crt(on: bool) -> void`: `Glass.material = crt_material if on else null`; when on set shader parameter `curvature` to `curvature`; `func crt_on() -> bool`. `func convert_event(ev: InputEvent) -> InputEvent`: for `InputEventMouseButton` or `InputEventMouseMotion` return a duplicate whose `position` (and `global_position`) is `glass_to_screen(ev.position)`; any other event returns `null`. `func _on_glass_input(ev: InputEvent) -> void`: `var c := convert_event(ev)`; if not null `$Viewport.push_input(c, true)`.
4. `_draw()` (cabinet, local coordinates, in this order): (1) `UiTheme.draw_box(self, Rect2(0, 0, 760, 560), UiTheme.color("woodDark"), UiTheme.color("ink"), 4, false)`; (2) wood grain: for `y` from 12 to 548 step 16: `draw_rect(Rect2(8, y, 744, 2), UiTheme.color("woodDark").lightened(0.08))`; (3) bezel `UiTheme.draw_box(self, Rect2(36, 30, 688, 448), Color("#2A2530"), UiTheme.color("ink"), 4, false)`; (4) glass recess `draw_rect(Rect2(56, 46, 608, 428), Color.BLACK)`; (5) control plate `UiTheme.draw_box(self, Rect2(36, 478, 688, 74), UiTheme.color("woodLight"), UiTheme.color("ink"), 4, false)`; (6) two knobs: for `cx` in `[668.0, 700.0]`: `draw_circle(Vector2(cx, 516), 14.0, Color.BLACK)` and `draw_arc(Vector2(cx, 516), 14.0, 0.0, TAU, 24, UiTheme.color("lightgrey"), 2.0)`; (7) brand plate `UiTheme.draw_box(self, Rect2(52, 492, 80, 40), UiTheme.color("brass"), UiTheme.color("ink"), 4, false)` with "WEBB" (role "h3", colour "ink") at (60, 504). The cabinet is drawn UNDER the children (the glass is a child), which is the default.
5. `godot/tests/test_tv.gd`: `test_size_and_tree`: `var tv := (load("res://tv/tv.tscn") as PackedScene).instantiate()`; add to `tree().root`; `tv.size == Vector2(760, 560)`; `Tv.GLASS == Rect2(60, 50, 600, 420)`; nodes `Viewport`, `Viewport/Screen`, `Glass` exist; `(tv.get_node("Viewport") as SubViewport).size == Vector2i(640, 448)`; `tv.host().size == Vector2(640, 448)`; `(tv.get_node("Glass") as TextureRect).texture != null`; the glass aspect equals the screen aspect: `near(600.0 / 420.0, 640.0 / 448.0, 1e-9)`. `test_crt_toggle`: `tv.crt_on()` true after `_ready`; `set_crt(false)`: `Glass.material == null` and `crt_on()` false; `set_crt(true)`: the material is a ShaderMaterial. `test_mapping`: `tv.curvature = 0.0`: `glass_to_screen(Vector2(300, 210)) == Vector2(320, 224)`, `glass_to_screen(Vector2(600, 420)) == Vector2(640, 448)`; with the default curvature the centre maps to (320, 224) (near, eps 1e-3) and `glass_to_screen(Vector2(0, 210)).x < 0.0` (the warp pushes the edge outside). `test_convert_event`: with `curvature = 0.0` an `InputEventMouseButton` at (150, 105) converts to position (160, 112) and the original event is untouched (still (150, 105)); a `InputEventMouseMotion` converts too; an `InputEventKey` gives `null`. Free `tv` at the end of each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_tv` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh tv/tv.tscn /tmp/tv.png 10`, then LOOK at /tmp/tv.png with the Read tool and describe it (expected, in the top-left of the window because the node is not centred yet: a brown wooden CRT cabinet with a dark bezel, a black glass area with rounded CRT corner darkening, a lighter control plate along the bottom with two round knobs on the right and a brass WEBB plate on the left).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Remote buttons (GDU11), channels and static node wiring (GDU12).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU10: TV: tv.tscn cabinet, glass and SubViewport`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
