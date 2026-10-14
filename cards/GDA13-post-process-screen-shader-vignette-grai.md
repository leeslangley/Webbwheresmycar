[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA13 Post-process screen shader (vignette, grain, glow)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA13
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A full-screen post-process layer: soft vignette, subtle film grain and a bloom-like glow on bright pixels, optional scanlines, as a `CanvasLayer` that can be switched on and off from the game settings (the `crt` setting of src/game.js DEFAULT_SETTINGS; Game keeps the settings Dictionary with keys `crt`, `sound`, `music`).

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/art/crt.js (scanline spacing 3 px, vignette corner 0.45) and roomfx_light.js (vignette, grain) for the look
- Godot 4 canvas_item shaders: `uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;`, `textureLod`, `SCREEN_UV`

## Files you may change (and nothing else)
- `godot/art/post.gdshader`
- `godot/art/post.gd`
- `godot/art/post.tscn`
- `godot/tests/test_post.gd`

## Steps
1. `godot/art/post.gdshader`: `shader_type canvas_item;` Uniforms: `uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap, repeat_disable;` `uniform float vignette : hint_range(0.0, 1.0) = 0.3;` `uniform float grain : hint_range(0.0, 0.2) = 0.04;` `uniform float glow : hint_range(0.0, 1.0) = 0.25;` `uniform float glow_threshold : hint_range(0.0, 0.95) = 0.7;` `uniform float scanlines : hint_range(0.0, 1.0) = 0.0;` `uniform float time_s = 0.0;`. `float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`. `fragment()`: `vec3 c = texture(screen_tex, SCREEN_UV).rgb;` glow: `vec3 b = (textureLod(screen_tex, SCREEN_UV, 2.0).rgb + textureLod(screen_tex, SCREEN_UV, 3.0).rgb) * 0.5; b = max(b - vec3(glow_threshold), vec3(0.0)) / (1.0 - glow_threshold); c += b * glow;` vignette: `vec2 q = (SCREEN_UV - 0.5) * vec2(1.7778, 1.0); c *= 1.0 - vignette * smoothstep(0.45, 1.0, length(q));` grain: `float n = hash21(floor(SCREEN_UV * vec2(640.0, 360.0)) + floor(time_s * 12.0) * 17.0); c += (n - 0.5) * grain;` scanlines: `c *= 1.0 - scanlines * 0.5 * (0.5 + 0.5 * sin(SCREEN_UV.y * 720.0 * 3.14159));` then `COLOR = vec4(clamp(c, 0.0, 1.0), 1.0);`.
2. `godot/art/post.tscn` exactly: `[gd_scene load_steps=4 format=3]`, `[ext_resource type="Script" path="res://art/post.gd" id="1"]`, `[ext_resource type="Shader" path="res://art/post.gdshader" id="2"]`, `[sub_resource type="ShaderMaterial" id="ShaderMaterial_1"]` with `shader = ExtResource("2")`, `[node name="Post" type="CanvasLayer"]` with `layer = 100` and `script = ExtResource("1")`, `[node name="Rect" type="ColorRect" parent="."]` with `material = SubResource("ShaderMaterial_1")`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `mouse_filter = 2`.
3. `godot/art/post.gd`: `class_name PostFx`, `extends CanvasLayer`. `var _t := 0.0`. `set_enabled(on: bool)`: `visible = on` and `set_process(on)`; `is_enabled() -> bool` = `visible`. `set_param(name: String, v: float) -> bool`: only for `vignette`, `grain`, `glow`, `glow_threshold`, `scanlines` (returns false for any other name); calls `$Rect.material.set_shader_parameter(name, v)`; `get_param(name: String) -> float`. `apply_settings(s: Dictionary)`: `set_enabled(bool(s.get("crt", false)))` and, when the key `scanlines` is a number, `set_param("scanlines", ...)`. `_process(delta)`: `_t += delta; $Rect.material.set_shader_parameter("time_s", _t)`. `_ready()`: `set_enabled(false)` (off until the settings say so).
4. `godot/tests/test_post.gd`: the shader file text contains `shader_type canvas_item;`, `hint_screen_texture`, `uniform float vignette`, `uniform float grain`, `uniform float glow`, `textureLod(`; instantiate `res://art/post.tscn` (no build needed); `layer` is 100; `Rect` is a ColorRect with `mouse_filter` 2 and a ShaderMaterial whose shader is not null; `set_param("grain", 0.1)` is true and `get_param("grain")` is 0.1; `set_param("nope", 1.0)` is false; `set_enabled(true)` makes `is_enabled()` true and `is_processing()` true; `apply_settings({"crt": false})` makes `is_enabled()` false; `apply_settings({"crt": true, "scanlines": 0.5})` makes it true and `get_param("scanlines")` 0.5; `apply_settings({})` makes it false. Free the node.
5. Screenshot check of the shader on a visible picture: `sh tools/godot/gshot.sh art/post.tscn /tmp/gda13.png 10` only shows an empty screen (the layer starts disabled), so just require that the command prints `wrote /tmp/gda13.png` and no `ERROR` line (that proves the shader compiles under real GL); view it and say it is a plain empty frame.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_post` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh art/post.tscn /tmp/gda13.png 10` prints `wrote /tmp/gda13.png` and no `ERROR` line.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Do not add the layer to the main scene (a GDR card does that). No CRT curvature (the TV screen has its own CRT shader in a GDU card).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA13: Post-process screen shader (vignette, grain, glow)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
