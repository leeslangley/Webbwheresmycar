[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA04 Car paint, chrome and glass shaders

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA04
Needs (already merged into `dev`): GDA05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Three spatial shaders for the Compatibility renderer that make the car models look modern: a clear-coat style car paint (fresnel flop, bright highlight, colour parameter), a chrome with a fake environment reflection from a gradient ramp, and dark glass with a crack. All three use the wear include from GDA05 and a `wear` parameter 0..3.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- godot/art/car_wear.gdshaderinc and godot/art/wear.gd (GDA05: functions wr_apply_paint, wr_apply_chrome, wr_apply_glass)
- tools/art/cbmat.py (`make_paint`: facing colour flop; `make_chrome`; `make_glass`) and tools/art/cbrig.py (`_SKY_STOPS`: the studio sky ramp the chrome should mirror)
- Godot 4 spatial shader built-ins: NORMAL, VIEW, ALBEDO, ROUGHNESS, METALLIC, SPECULAR, EMISSION, INV_VIEW_MATRIX, and the `light()` function (SPECULAR_LIGHT, LIGHT, LIGHT_COLOR, ATTENUATION). The Compatibility renderer has NO clearcoat, so the coat is faked.

## Files you may change (and nothing else)
- `godot/art/car_paint.gdshader`
- `godot/art/chrome.gdshader`
- `godot/art/glass.gdshader`
- `godot/art/previews/mat_preview.gd`
- `godot/art/previews/mat_preview.tscn`
- `godot/tests/test_car_shaders.gd`
- `godot/art/car_wear.gdshaderinc`

## Steps
1. `godot/art/car_paint.gdshader`: `shader_type spatial;` then `#include "res://art/car_wear.gdshaderinc"`. Uniforms (exact names): `uniform vec4 base_color : source_color = vec4(0.79, 0.44, 0.2, 1.0);` `uniform vec4 flop_color : source_color = vec4(0.88, 0.55, 0.3, 1.0);` `uniform float roughness_base : hint_range(0.0, 1.0) = 0.32;` `uniform float metallic_amount : hint_range(0.0, 1.0) = 0.0;` `uniform float coat : hint_range(0.0, 1.0) = 1.0;` `uniform float wear : hint_range(0.0, 3.0) = 0.0;` `uniform float ground_y = 0.0;` `uniform float body_height = 3.8;`. `varying vec3 v_obj;` set in `vertex()` to `VERTEX`. `fragment()`: `float ndv = clamp(dot(NORMAL, VIEW), 0.0, 1.0); float flop = pow(1.0 - ndv, 2.0); vec3 alb = mix(base_color.rgb, flop_color.rgb, flop); float r = roughness_base; float hf = clamp((v_obj.y - ground_y) / body_height, 0.0, 1.0); wr_apply_paint(alb, r, v_obj, hf, wear); ALBEDO = alb; ROUGHNESS = r; METALLIC = metallic_amount; SPECULAR = 0.6; float rim = pow(1.0 - ndv, 4.0); EMISSION = mix(base_color.rgb, vec3(1.0), 0.5) * rim * 0.25 * coat * (1.0 - clamp(wear / 3.0, 0.0, 1.0));` (the coat sheen fades as the car wears). `light()`: `vec3 h = normalize(VIEW + LIGHT); float s = pow(max(dot(NORMAL, h), 0.0), 96.0); float coat_k = coat * (1.0 - clamp(wear / 2.0, 0.0, 1.0)); SPECULAR_LIGHT += LIGHT_COLOR * ATTENUATION * s * 0.7 * coat_k;`.
2. `godot/art/chrome.gdshader`: `shader_type spatial;` + the include. Uniforms: `uniform sampler2D env_ramp : source_color, repeat_disable, filter_linear;` `uniform float tint_strength = 1.0;` `uniform float wear : hint_range(0.0, 3.0) = 0.0;`. `varying vec3 v_obj;` from `VERTEX`. `fragment()`: `vec3 r = reflect(-VIEW, NORMAL); vec3 rw = normalize((INV_VIEW_MATRIX * vec4(r, 0.0)).xyz); float v = clamp(rw.y * 0.5 + 0.5, 0.0, 1.0); vec3 env = texture(env_ramp, vec2(v, 0.5)).rgb; float sun = smoothstep(0.92, 0.98, dot(rw, normalize(vec3(0.4, 0.7, 0.5)))); env += vec3(sun * 0.9); vec3 alb = vec3(0.05); vec3 emit = env * tint_strength; wr_apply_chrome(alb, emit, v_obj, wear); ALBEDO = alb; EMISSION = emit; METALLIC = 0.0; ROUGHNESS = 0.35; SPECULAR = 0.5;`.
3. `godot/art/glass.gdshader`: `shader_type spatial;` + the include. Uniforms: `uniform vec4 glass_color : source_color = vec4(0.106, 0.157, 0.188, 1.0);` `uniform float wear : hint_range(0.0, 3.0) = 0.0;`. `varying vec3 v_obj;` `fragment()`: `vec3 alb = glass_color.rgb; wr_apply_glass(alb, v_obj, wear); ALBEDO = alb; ROUGHNESS = 0.05; METALLIC = 0.0; SPECULAR = 0.9; float ndv = clamp(dot(NORMAL, VIEW), 0.0, 1.0); EMISSION = vec3(0.35, 0.45, 0.55) * pow(1.0 - ndv, 3.0) * 0.4;` (opaque on purpose: the old sprite glass was opaque too).
4. `godot/art/previews/mat_preview.gd` (`extends Node3D`; `build()` is idempotent and `_ready()` calls it) and `godot/art/previews/mat_preview.tscn` (root `Node3D` named `MatPreview` with that script). `build()` creates: a `WorldEnvironment` (Environment: `background_mode = Environment.BG_COLOR`, `background_color = Color("2b2550")`, `ambient_light_source = Environment.AMBIENT_SOURCE_COLOR`, `ambient_light_color = Color("6e6a8c")`, `ambient_light_energy = 0.9`); a `DirectionalLight3D` with `rotation_degrees = Vector3(-45, -35, 0)`; an orthographic `Camera3D` (`size = 8.0`, near 0.05, far 100, `transform = Transform3D(Basis(), Vector3(0, 2.4, 12)).looking_at(Vector3(0, 2.4, 0), Vector3.UP)`); and three rows of four spheres (`SphereMesh`, radius 0.8, height 1.6, one `MeshInstance3D` each) at x = -4.5, -1.5, 1.5, 4.5 and sphere-centre y = 0.8 (row 1), 2.4 (row 2), 4.0 (row 3), with `wear` = 0.0, 1.0, 2.0, 3.0 left to right. Row 1: ShaderMaterial of car_paint.gdshader with `base_color` `Color("c96f32")`, `flop_color` `Color("e08c4c")`, `body_height` 1.6 and `ground_y` -0.8 (a sphere mesh is centred on its own origin, so object-space y runs -0.8 to +0.8; with `body_height` 1.6 the height fraction runs 0 to 1 over the sphere; use the same two values for the paint spheres only). Row 2: ShaderMaterial of chrome.gdshader whose `env_ramp` is a `GradientTexture1D` (width 64) of a Gradient with exactly these 5 points (offset, colour): (0.0, 2a2432), (0.45, 2a2432), (0.5, e9dcc4), (0.6, b4c8e6), (1.0, 2b4a86). Row 3: ShaderMaterial of glass.gdshader. The `wear` parameter is set on all twelve.
5. `godot/tests/test_car_shaders.gd`: for each of the three .gdshader files: `load()` returns a `Shader` that is not null; the file text (FileAccess) contains `shader_type spatial;`, `#include "res://art/car_wear.gdshaderinc"` and `uniform float wear`; car_paint also contains `uniform vec4 base_color : source_color`, `void light()` and `uniform float ground_y`; chrome contains `uniform sampler2D env_ramp`. A `ShaderMaterial` with car_paint: `set_shader_parameter("wear", 2.0)` then `get_shader_parameter("wear")` is 2.0. `MatPreview` smoke: instantiate `res://art/previews/mat_preview.tscn`, call `build()`, count MeshInstance3D children recursively: 12, and the `Camera3D` projection is `Camera3D.PROJECTION_ORTHOGONAL`; free it.
6. Expected picture (3 rows x 4 spheres: orange paint with a bright highlight and a lighter edge, getting dirtier, rustier and duller left to right; chrome spheres reflecting a dark floor and a bright horizon and blue sky, pitted on the right; dark glass spheres, a pale crack line on the last one). Screenshot step: run `sh tools/godot/gshot.sh art/previews/mat_preview.tscn /tmp/gda04.png 30`. The output must contain NO line with `ERROR` (shader compile errors appear there). Then open the PNG with the Read tool and DESCRIBE what you see in your final reply (what is drawn, the main colours, anything cut off, black or missing). If it looks wrong, fix it. If a shader fails to compile fix it (you may edit the include `godot/art/car_wear.gdshaderinc` only to fix a compile error and must keep every name and constant that test_wear checks).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_shaders` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh test_wear` still ends with `GDTEST OK`.
- `sh tools/godot/gshot.sh art/previews/mat_preview.tscn /tmp/gda04.png 30` prints `wrote /tmp/gda04.png` and no `ERROR` line; you viewed the PNG.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No CarView, no car models (GDA03). No material factory (GDA18).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA04: Car paint, chrome and glass shaders`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
