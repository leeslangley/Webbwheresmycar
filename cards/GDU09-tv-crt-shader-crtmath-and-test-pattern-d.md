[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU09 TV: CRT shader, CrtMath and test pattern demo

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU09
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The CRT look: one canvas_item shader (barrel curvature, scanlines, bloom, vignette, noise, flicker, static) plus `CrtMath`, a GDScript twin of the curvature function so touch positions can be mapped through the glass exactly. A demo scene shows the shader on a test pattern.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- docs/GODOT.md section 'The TV is the centre of the game'
- src/art/crt.js (what the JS CRT overlay did)

## Files you may change (and nothing else)
- `godot/tv/crt.gdshader`
- `godot/tv/crt_math.gd`
- `godot/tv/crt_demo.tscn`
- `godot/tv/crt_demo.gd`
- `godot/tests/test_crt.gd`

## Steps
1. `godot/tv/crt.gdshader` - write EXACTLY this source (Compatibility-renderer safe):
```
shader_type canvas_item;
uniform float curvature : hint_range(0.0, 0.5) = 0.12;
uniform float scanline_strength : hint_range(0.0, 1.0) = 0.25;
uniform float scanline_count = 224.0;
uniform float bloom : hint_range(0.0, 1.0) = 0.35;
uniform float vignette : hint_range(0.0, 1.0) = 0.35;
uniform float noise_amount : hint_range(0.0, 0.2) = 0.04;
uniform float flicker : hint_range(0.0, 0.1) = 0.02;
uniform float static_amount : hint_range(0.0, 1.0) = 0.0;

vec2 warp(vec2 uv) {
	vec2 cc = uv - vec2(0.5);
	float dist = dot(cc, cc) * curvature;
	return uv + cc * (1.0 + dist) * dist;
}

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	vec2 uv = warp(UV);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		COLOR = vec4(0.0, 0.0, 0.0, 1.0);
	} else {
		vec3 col = texture(TEXTURE, uv).rgb;
		vec2 px = TEXTURE_PIXEL_SIZE * 1.5;
		vec3 glow = texture(TEXTURE, uv + vec2(px.x, 0.0)).rgb + texture(TEXTURE, uv - vec2(px.x, 0.0)).rgb + texture(TEXTURE, uv + vec2(0.0, px.y)).rgb + texture(TEXTURE, uv - vec2(0.0, px.y)).rgb;
		col += glow * 0.25 * bloom;
		float s = 0.5 + 0.5 * sin(uv.y * scanline_count * 6.28318);
		col *= 1.0 - scanline_strength * (1.0 - s);
		float n = hash(uv * 640.0 + vec2(floor(TIME * 24.0)));
		col += (n - 0.5) * noise_amount;
		col = mix(col, vec3(n), static_amount);
		float v = length((UV - 0.5) * vec2(1.0, 1.1));
		col *= 1.0 - vignette * smoothstep(0.35, 0.8, v);
		col *= 1.0 + flicker * sin(TIME * 60.0);
		COLOR = vec4(col, 1.0);
	}
}
```
2. `godot/tv/crt_math.gd`: `class_name CrtMath`, `extends RefCounted`, static. `const DEFAULT_CURVATURE := 0.12`. `static func warp(uv: Vector2, curvature: float = DEFAULT_CURVATURE) -> Vector2`: `var cc := uv - Vector2(0.5, 0.5)`; `var dist := cc.dot(cc) * curvature`; `return uv + cc * (1.0 + dist) * dist` (the SAME formula as `warp` in the shader). `static func inside(uv: Vector2) -> bool: return uv.x >= 0.0 and uv.x <= 1.0 and uv.y >= 0.0 and uv.y <= 1.0`. `static func glass_to_source(p: Vector2, glass: Vector2, source: Vector2, curvature: float = DEFAULT_CURVATURE) -> Vector2`: `var w := warp(Vector2(p.x / glass.x, p.y / glass.y), curvature)`; `return Vector2(w.x * source.x, w.y * source.y)` (where on the 640x448 screen a touch at glass position `p` lands).
3. `godot/tv/crt_demo.gd`: `extends Control`. `_ready()`: `size = Vector2(1280, 720)`; build a `SubViewport` (child, `size = Vector2i(640, 448)`, `render_target_update_mode = SubViewport.UPDATE_ALWAYS`) containing a test pattern made of nodes: a full-size `ColorRect` in `UiTheme.color("blue")`; 8 vertical colour-bar `ColorRect`s of width 80 and height 200 at y = 40 (white, yellow, cyan, green, purple `#6F3D86`, red `#D9483B`, blue `#352879`, black); a 1-px-pitch grid is NOT needed; a `Label` "WEBB TV TEST CARD" at (120, 300) with the project font (use `UiTheme.title_font()` via `add_theme_font_override("font", ...)` and `add_theme_font_size_override("font_size", 24)`), colour white; a `Label` "CH 1" at (20, 8). Then a `TextureRect` named "Glass" at `Vector2(340, 150)` of `size = Vector2(600, 420)`, `texture = viewport.get_texture()`, `stretch_mode = TextureRect.STRETCH_SCALE`, `expand_mode = TextureRect.EXPAND_IGNORE_SIZE`, with a `ShaderMaterial` using `load("res://tv/crt.gdshader")`. A black `ColorRect` backdrop first. `godot/tv/crt_demo.tscn`: text scene with root `[node name="CrtDemo" type="Control"]` and `script = ExtResource("1")` (the script above).
4. `godot/tests/test_crt.gd`: `test_warp_values`: `CrtMath.warp(Vector2(0.5, 0.5), 0.12) == Vector2(0.5, 0.5)`; `CrtMath.warp(Vector2(1.0, 0.5), 0.12).x` near 1.01545 (eps 1e-6) and `.y` near 0.5; `CrtMath.warp(Vector2(0.3, 0.8), 0.0) == Vector2(0.3, 0.8)` (curvature 0 is the identity); symmetry: `warp(Vector2(0.0, 0.5), 0.12).x` near `-0.01545` (eps 1e-6). `test_inside`: `inside(Vector2(0.5, 0.5))` true, `inside(Vector2(1.01545, 0.5))` false, `inside(Vector2(0, 0))` true. `test_glass_to_source`: `glass_to_source(Vector2(300, 210), Vector2(600, 420), Vector2(640, 448), 0.0) == Vector2(320, 224)`; with the default curvature the centre point still maps to (320, 224) (use `near` on x and y, eps 1e-4); `glass_to_source(Vector2(0, 0), Vector2(600, 420), Vector2(640, 448), 0.0) == Vector2(0, 0)`. `test_shader_loads`: `var sh := load("res://tv/crt.gdshader") as Shader`; not null; `sh.code.contains("uniform float curvature")`, `contains("scanline_strength")`, `contains("static_amount")`, `contains("vec2 warp(vec2 uv)")`. `test_demo_instantiates`: `var d := (load("res://tv/crt_demo.tscn") as PackedScene).instantiate()`; add to `tree().root`; `d.get_node_or_null("Glass") != null`; `(d.get_node("Glass") as TextureRect).material is ShaderMaterial`; free it.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_crt` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh tv/crt_demo.tscn /tmp/crt.png 12`, then LOOK at /tmp/crt.png with the Read tool and describe it (expected: a black screen with a rounded-corner TV picture in the middle showing 8 colour bars, the text WEBB TV TEST CARD, faint horizontal scanlines, darker corners). Say honestly if the picture is all black, all white or has no scanlines, and fix the shader if so.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- godot/tv/tv.gd and tv.tscn (GDU10).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU09: TV: CRT shader, CrtMath and test pattern demo`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
