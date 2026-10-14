[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU08 UI: main.tscn Stage, layers, safe area

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU08
Needs (already merged into `dev`): GDU04, GDU06, GDU07, GDU30, GDU28, GDU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The root scene: a background layer that fills any window, a centred 1280x720 `Stage` holding everything interactive (SceneHost, HUD, banner, toasts, tooltip, fade layer), and safe-area maths for iPhone notches. GDF11's `run/main_scene` may point here later.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- docs/GODOT.md sections 'Engine and layout' and 'Layout zones'
- godot/ui/scene_host.gd, hud.gd, banner.gd, toast.gd, tooltip.gd (GDU30, GDU07, GDU06, GDU04)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)

## Files you may change (and nothing else)
- `godot/scenes/main.tscn`
- `godot/scenes/main.gd`
- `godot/tests/test_main.gd`

## Steps
1. `godot/scenes/main.tscn` (text scene): `[gd_scene load_steps=2 format=3]`, `[ext_resource type="Script" path="res://scenes/main.gd" id="1"]`, root `[node name="Main" type="Control"]` with `layout_mode = 3`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `script = ExtResource("1")`. Everything else is built in code by `main.gd`.
2. `godot/scenes/main.gd`: `class_name Main`, `extends Control`. Consts `STAGE := Vector2(1280, 720)`. Static maths: `static func stage_position(canvas: Vector2) -> Vector2`: `Vector2(floorf(maxf(0.0, canvas.x - 1280.0) / 2.0), floorf(maxf(0.0, canvas.y - 720.0) / 2.0))`. `static func safe_insets(screen: Vector2, safe: Rect2, canvas: Vector2) -> Dictionary`: `s = canvas.x / screen.x`; `{"left": safe.position.x * s, "top": safe.position.y * s, "right": (screen.x - safe.end.x) * s, "bottom": (screen.y - safe.end.y) * s}`. `static func stage_insets(ins: Dictionary, stage_pos: Vector2) -> Dictionary`: `{"left": maxf(0.0, ins.left - stage_pos.x), "right": maxf(0.0, ins.right - stage_pos.x), "top": maxf(0.0, ins.top - stage_pos.y), "bottom": maxf(0.0, ins.bottom - stage_pos.y)}` (how far the safe area cuts INTO the stage).
3. `func _ready() -> void`: build the tree (names exact): `Backdrop` ColorRect (full rect, colour `UiTheme.color("ink")`, mouse ignore); `Stage` Control (`size = STAGE`) with children, in this draw order: `Scenes` (SceneHost, full rect of the stage), `Hud` (UiHud, `position = Vector2(0, 590)`), `Banner` (UiBanner, `position = Vector2(24, 4)`), `Toasts` (UiToast, `size = STAGE`), `Tooltip` (UiTooltip), `Fade` (ColorRect, `size = STAGE`, colour `Color(0, 0, 0, 0)`, mouse ignore). Then `layout()`, connect `get_viewport().size_changed` to `layout`, and bind `/root/Game` when it exists: `var g := get_node_or_null("/root/Game"); if g != null and g.get("state") != null: bind_game(g)`. `func layout() -> void`: `var canvas := get_viewport_rect().size`; `$Stage.position = stage_position(canvas)`; compute `safe_insets(Vector2(DisplayServer.window_get_size()), Rect2(DisplayServer.get_display_safe_area()), canvas)` and store `stage_safe = stage_insets(..)` (a public Dictionary var, default all zeros; skip the safe-area call and keep zeros when the window size is zero). Use `get_node("Stage")` instead of `$` if you prefer.
4. API: `func bind_game(game: Object) -> void`: `game.toast_requested.connect(func(t: String): get_node("Stage/Toasts").show_text(t))`; `get_node("Stage/Hud").bind(game)`. `func show_hud(on: bool) -> void`: `Stage/Hud.visible = on`. `func say(text: String, tail_x: float = -1.0) -> void`: `Stage/Banner.say(text, tail_x)`. `func fade_to(alpha: float, duration: float = 0.25) -> Tween`: if `duration <= 0.0` set `Stage/Fade` `color.a = alpha` immediately and return `null`; else tween the property `color:a` to `alpha` over `duration` and return the Tween. `func scenes() -> SceneHost: return get_node("Stage/Scenes")`.
5. `godot/tests/test_main.gd`: `test_static_math`: `Main.stage_position(Vector2(1280, 720)) == Vector2.ZERO`; `Main.stage_position(Vector2(1600, 720)) == Vector2(160, 0)`; `Main.stage_position(Vector2(1281, 721)) == Vector2(0, 0)`; `safe_insets(Vector2(2400, 1080), Rect2(400, 0, 1600, 1080), Vector2(1600, 720))` has `left` near 266.667 (eps 0.01) and `right` near 266.667 and `top` 0.0; `stage_insets(that, Vector2(160, 0))` has `left` near 106.667 and `top` 0.0; with insets smaller than the strip (`safe_insets(Vector2(2400,1080), Rect2(100,0,2200,1080), Vector2(1600,720))` then `stage_insets(.., Vector2(160, 0))`) `left` is 0.0. `test_tree`: instantiate `load("res://scenes/main.tscn")`, add to `tree().root`; nodes exist via `get_node_or_null`: `Backdrop`, `Stage`, `Stage/Scenes`, `Stage/Hud`, `Stage/Banner`, `Stage/Toasts`, `Stage/Tooltip`, `Stage/Fade`; `Stage.size == Vector2(1280, 720)`; `Hud.position == Vector2(0, 590)`; `Banner.position == Vector2(24, 4)`; `scenes()` is a SceneHost; `show_hud(false)` hides the HUD, `show_hud(true)` shows it. `test_fade`: `fade_to(0.5, 0.0)`: `Stage/Fade.color.a` near 0.5. `test_bind_fake`: `var g := TestFakeGame.new()`; `m.bind_game(g)`; `g.toast_requested.emit("Hi")`: `Stage/Toasts.texts() == ["Hi"]`; the HUD shows the fake state's day (`Stage/Hud/Calendar.day == g.state.day`). `test_say`: `m.say("hello")`: `Stage/Banner.full_text == "HELLO"`. Free the instance at the end of each test and call `UiCashHistory.reset()` (the auto-bound Game autoload records into the history).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_main` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh scenes/main.tscn /tmp/main.png 8`, then LOOK at /tmp/main.png with the Read tool and describe it in your final reply (expected: a dark screen with the HUD strip along the bottom: four grey plate slots, CASH bar, calendar sheet, white SALES box, REP and BUZZ bars; the banner is empty; nothing overlaps or runs off the screen). Fix what is wrong.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU08: UI: main.tscn Stage, layers, safe area`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
