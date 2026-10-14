[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU01 UI: UiTheme, theme.tres and bundled pixel fonts

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU01
Needs (already merged into `dev`): GDF01, GDF13
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The shared look: the two pixel fonts imported into the project, `UiTheme` (font roles, drawing helpers all widgets use) and `godot/ui/theme.tres` for stock Controls. Colours are NOT redefined: `UiTheme.color()` just asks `UiTokens` (GDF13).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/tokens.gd (GDF13: `UiTokens.col(key)`, `FLOOR`, `COLOR`, `PALETTE`)
- src/ui/theme.js (font sizes) and src/ui/kit_draw.js `panel` (the boxed look: 4 px ink border, drop shadow)

## Files you may change (and nothing else)
- `godot/ui/fonts/PressStart2P-Regular.ttf`
- `godot/ui/fonts/VT323-Regular.ttf`
- `godot/ui/fonts/OFL-PressStart2P.txt`
- `godot/ui/fonts/OFL-VT323.txt`
- `godot/ui/ui_theme.gd`
- `godot/ui/theme.tres`
- `godot/tests/test_ui_theme.gd`

## Steps
1. Copy the fonts: `mkdir -p godot/ui/fonts && cp assets/fonts/PressStart2P-Regular.ttf assets/fonts/VT323-Regular.ttf assets/fonts/OFL-PressStart2P.txt assets/fonts/OFL-VT323.txt godot/ui/fonts/`.
2. `godot/ui/ui_theme.gd`: `class_name UiTheme`, `extends RefCounted`, all static and typed. `const TOUCH := 64` (smallest touch target in stage px) and `const GRID := 4`. `const FONT_TITLE_PATH := "res://ui/fonts/PressStart2P-Regular.ttf"`, `const FONT_BODY_PATH := "res://ui/fonts/VT323-Regular.ttf"`. `const ROLES: Dictionary = {"number": ["title", 48], "h1": ["title", 32], "h2": ["title", 24], "h3": ["title", 16], "button": ["title", 16], "hero": ["body", 40], "body": ["body", 28], "caption": ["body", 24]}` (role -> [font kind, px]).
3. Fonts: `static var _fonts: Dictionary = {}`. `static func _load(path: String) -> Font`: return the cached one, else `var f := load(path) as FontFile`; if it is not null set `f.antialiasing = TextServer.FONT_ANTIALIASING_NONE`, `f.hinting = TextServer.HINTING_NONE`, `f.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED` (crisp pixel look); cache and return (a missing file gives `ThemeDB.fallback_font`). `static func title_font() -> Font` and `static func body_font() -> Font` call `_load` with the two paths. `static func font_for(role: String) -> Font`: `title_font()` when the role's kind is "title" else `body_font()`; an unknown role uses "body". `static func size_for(role: String) -> int` returns the px (unknown role: 28). `static func color(key: String) -> Color` returns `UiTokens.col(key)`.
4. Drawing helpers (call them only from inside a `_draw()`): `static func draw_box(item: CanvasItem, rect: Rect2, fill: Color, border: Color = Color(0.0784, 0.0627, 0.1647, 1.0), bw: int = 4, shadow: bool = true) -> void`: when `shadow`, `item.draw_rect(Rect2(rect.position + Vector2(4, 4), rect.size), Color(0, 0, 0, 0.35))`; then `item.draw_rect(rect, border)` filled; then `item.draw_rect(rect.grow(-bw), fill)` filled (so the border is `bw` px thick INSIDE the rect). `static func draw_text(item: CanvasItem, text: String, pos: Vector2, role: String, col: Color, width: float = -1.0, align: int = HORIZONTAL_ALIGNMENT_LEFT) -> void`: `pos` is the TOP-LEFT of the line; `var f := font_for(role); var s := size_for(role); item.draw_string(f, pos + Vector2(0, f.get_ascent(s)), text, align, width, s, col)`. `static func draw_bar(item: CanvasItem, rect: Rect2, ratio: float, fill: Color, back: Color = Color(0.0784, 0.0627, 0.1647, 1.0)) -> void`: draw `rect` filled with `back`, then a filled rect of `fill` at `rect.position + Vector2(2, 2)` with size `Vector2(bar_fill_width(rect, ratio), rect.size.y - 4)`. `static func bar_fill_width(rect: Rect2, ratio: float) -> float`: `(rect.size.x - 4.0) * clampf(ratio, 0.0, 1.0)`.
5. `godot/ui/theme.tres`: a hand-written text resource `[gd_resource type="Theme" load_steps=7 format=3]`. `[ext_resource type="FontFile" path="res://ui/fonts/VT323-Regular.ttf" id="1"]` and the same for `PressStart2P-Regular.ttf` with id="2". Sub-resources of type StyleBoxFlat: id "1" (normal: bg_color = Color(1, 0.968, 0.863, 1), border_width_left/top/right/bottom = 4, border_color = Color(0.0784, 0.0627, 0.1647, 1), content_margin_left/right = 12, content_margin_top/bottom = 8), id "2" (hover: same but bg_color = Color(1, 0.824, 0.478, 1)), id "3" (pressed: same but bg_color = Color(0.851, 0.796, 0.627, 1)), id "4" (disabled: same but bg_color = Color(0.584, 0.584, 0.584, 1)), id "5" (panel: same as normal). Then `[resource]` with `default_font = ExtResource("1")`, `default_font_size = 28`, `Button/fonts/font = ExtResource("2")`, `Button/font_sizes/font_size = 16`, `Button/colors/font_color = Color(0.0784, 0.0627, 0.1647, 1)`, `Button/styles/normal = SubResource("1")`, `Button/styles/hover = SubResource("2")`, `Button/styles/pressed = SubResource("3")`, `Button/styles/disabled = SubResource("4")`, `Label/colors/font_color = Color(0.0784, 0.0627, 0.1647, 1)`, `PanelContainer/styles/panel = SubResource("5")`.
6. `godot/tests/test_ui_theme.gd`: `test_colors` (`UiTheme.color("ink") == UiTokens.col("ink")`; `UiTheme.color("gold") == Color("#E8B923")`; an unknown key returns `Color.MAGENTA`); `test_roles` (`size_for("h1") == 32`, `size_for("number") == 48`, `size_for("body") == 28`, `size_for("caption") == 24`, unknown role 28; loop over `UiTheme.ROLES`: kind "title" roles have px >= `UiTokens.FLOOR.title`, kind "body" roles have px >= `UiTokens.FLOOR.body`); `test_fonts` (`font_for("h1") != null`, `title_font() != body_font()`, `font_for("zzz") == body_font()`, and `title_font().antialiasing == TextServer.FONT_ANTIALIASING_NONE` when it is a FontFile); `test_bar_fill_width` (`bar_fill_width(Rect2(0, 0, 104, 10), 0.5)` near 50.0; ratio 2.0 gives 100.0; ratio -1.0 gives 0.0); `test_touch` (`UiTheme.TOUCH == 64`); `test_theme_resource` (`var t := load("res://ui/theme.tres") as Theme`; not null; `t.default_font != null`; `t.default_font_size == 28`; `t.get_stylebox("normal", "Button") != null`).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_theme` last line is `GDTEST OK` (the run also imports the fonts on CASE).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- godot/ui/tokens.gd (GDF13), project.godot (do not set a project-wide theme here).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU01: UI: UiTheme, theme.tres and bundled pixel fonts`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
