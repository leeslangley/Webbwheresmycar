[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU27 TV: static transition node

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU27
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`TvStatic`: the full-screen snow shown between channels. It plays for 0.4 s: intensity ramps up to a peak at the half-way point (signal `midpoint`, where the channel is swapped) and back down (signal `finished`). It blocks taps while playing.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- src/ui/transitions.js (the JS 'static' transition, 400 ms)

## Files you may change (and nothing else)
- `godot/tv/static.gdshader`
- `godot/tv/tv_static.gd`
- `godot/tests/test_tv_static.gd`

## Steps
1. `godot/tv/static.gdshader`: `shader_type canvas_item;` with `uniform float intensity : hint_range(0.0, 1.0) = 0.0;` and `fragment()`: `float n = fract(sin(dot(floor(UV * vec2(160.0, 112.0)) + vec2(floor(TIME * 30.0)), vec2(12.9898, 78.233))) * 43758.5453);` `float roll = smoothstep(0.0, 0.08, abs(fract(UV.y - TIME * 0.7) - 0.5) - 0.42);` `vec3 snow = vec3(n * 0.85 + 0.1);` `snow = mix(snow, vec3(0.0), roll * 0.5);` `COLOR = vec4(snow, intensity);` (the node fades in and out by `intensity`).
2. `godot/tv/tv_static.gd`: `class_name TvStatic`, `extends ColorRect`. Signals `midpoint` and `finished`. Vars `duration: float = 0.4`, `_elapsed: float = 0.0`, `_playing: bool = false`, `_mid_done: bool = false`. `_init`: `size = Vector2(640, 448)`, `color = Color.WHITE`, `visible = false`, `mouse_filter = MOUSE_FILTER_IGNORE`; in `_ready()` assign a `ShaderMaterial` with `load("res://tv/static.gdshader")` to `material`. `static func intensity_at(u: float) -> float: return clampf(1.0 - absf(2.0 * u - 1.0), 0.0, 1.0)` (triangle: 0 at the ends, 1 in the middle). `func play(d: float = 0.4) -> void`: `duration = d`, `_elapsed = 0.0`, `_playing = true`, `_mid_done = false`, `visible = true`, `mouse_filter = MOUSE_FILTER_STOP`, `_apply()`. `func is_playing() -> bool`. `func progress() -> float: return clampf(_elapsed / duration, 0.0, 1.0)`. `func _apply() -> void`: if `material is ShaderMaterial` set shader parameter `intensity` to `intensity_at(progress())`.
3. `func advance(dt: float) -> void`: if not playing return; `_elapsed += dt`; if not `_mid_done` and `_elapsed >= duration * 0.5`: `_mid_done = true`, `midpoint.emit()`; if `_elapsed >= duration`: `_playing = false`, `visible = false`, `mouse_filter = MOUSE_FILTER_IGNORE`, `finished.emit()`; else `_apply()`. `_process(dt)` calls `advance(dt)`.
4. `godot/tests/test_tv_static.gd`: `test_intensity`: `TvStatic.intensity_at(0.0)` near 0.0, `(0.25)` near 0.5, `(0.5)` near 1.0, `(0.75)` near 0.5, `(1.0)` near 0.0, `(2.0)` near 0.0. `test_play`: `var s := TvStatic.new()`, connect `midpoint` and `finished` to counters; `s.play(0.5)`: `is_playing()`, `visible`, `mouse_filter == Control.MOUSE_FILTER_STOP`; `advance(0.125)`: progress near 0.25, midpoint 0, finished 0; `advance(0.125)`: midpoint 1; `advance(0.25)`: finished 1, `is_playing()` false, `visible == false`, mouse filter back to IGNORE. `test_one_big_step`: `play(0.4)`, `advance(5.0)` fires midpoint once and finished once, in that order (record the order in an Array of strings: `["midpoint", "finished"]`). `test_idle`: `advance(1.0)` while not playing emits nothing. `test_shader`: `(load("res://tv/static.gdshader") as Shader).code.contains("uniform float intensity")`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_tv_static` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU27: TV: static transition node`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
