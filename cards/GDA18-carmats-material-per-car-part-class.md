[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA18 CarMats: material per car part class

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA18
Needs (already merged into `dev`): GDA04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`CarMats` makes the Godot material for each part class of a car model: the paint shader for paint and paint2, chrome and glass shaders, plain materials for lamp, tail, trim, tyre and wall. CarView (GDA03) uses it for every mesh surface.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- Car model contract (GDA01/GDA02): `res://art/cars/<id>.glb` has one MeshInstance3D node per part named `<class>_<NN>` (class is one of paint, paint2, chrome, glass, lamp, tail, trim, tyre, wall; NN two digits) and each mesh surface has a material whose `resource_name` is exactly the class. Axes in Godot: the car faces +X, up is +Y, the near (screen) side is +Z, the model is built 10.0 m long whatever the real car (1 car unit = 0.1 m); the real length is `len_mm` in `res://art/cars/manifest.json`, so the in-game scale of a car is `len_mm / 10000.0`.
- godot/art/car_paint.gdshader, chrome.gdshader, glass.gdshader (GDA04: exact uniform names)
- tools/art/cbmat.py (`make_lamp`, `make_tail`, `make_trim`, `make_tyre`, `make_whitewall` colours)

## Files you may change (and nothing else)
- `godot/art/car_mats.gd`
- `godot/tests/test_car_mats.gd`

## Steps
1. `godot/art/car_mats.gd`: `class_name CarMats`, `extends RefCounted`. `const CLASSES := PackedStringArray(["paint", "paint2", "chrome", "glass", "lamp", "tail", "trim", "tyre", "wall"])`. `static var _ramp: GradientTexture1D`.
2. `static func env_ramp() -> GradientTexture1D`: builds once and caches: a `Gradient` with `offsets = PackedFloat32Array([0.0, 0.45, 0.5, 0.6, 1.0])` and `colors = PackedColorArray([Color("2a2432"), Color("2a2432"), Color("e9dcc4"), Color("b4c8e6"), Color("2b4a86")])`, wrapped in a `GradientTexture1D` with `width = 64`.
3. `static func make(cls: String, paint: Color, wear: float, ground_y: float = 0.0, body_h: float = 3.8) -> Material`. `wear` is clamped with `Wear.clamp_level`. Cases: `paint` and `paint2`: a `ShaderMaterial` of `res://art/car_paint.gdshader` with parameters `base_color` = paint, `flop_color` = `paint.lightened(0.1)`, `wear`, `ground_y`, `body_height` = body_h; `chrome`: ShaderMaterial of chrome.gdshader with `env_ramp` = `env_ramp()`, `wear`; `glass`: ShaderMaterial of glass.gdshader with `wear`; `lamp`: `StandardMaterial3D` albedo `fff1c0`, emission_enabled true, emission `ffe9a8`, emission_energy_multiplier 2.0, roughness 0.1; `tail`: albedo `c01818`, emission `ff2010`, energy 1.0, roughness 0.2; `trim`: albedo `0e0e10`, roughness 0.55; `tyre`: albedo `16161a`, roughness 0.85; `wall`: albedo `e8e2d0`, roughness 0.7. Any other `cls` returns the `trim` material. Every returned material gets `resource_name = cls`.
4. `static func set_wear(m: Material, wear: float) -> void`: when `m` is a ShaderMaterial, `m.set_shader_parameter("wear", Wear.clamp_level(wear))`; otherwise nothing.
5. `godot/tests/test_car_mats.gd`: `make("paint", Color.RED, 2.0)` is a ShaderMaterial whose `base_color` parameter equals `Color.RED` and `wear` is 2.0, `shader.resource_path` ends with `car_paint.gdshader`; `make("paint2", ...)` same shader; `make("paint", Color.RED, 9.0)` has wear 3.0; `make("chrome", Color.WHITE, 0.0).get_shader_parameter("env_ramp")` is the object returned by `env_ramp()` (same instance on a second call); `make("glass", ...)` is a ShaderMaterial; each of lamp, tail, trim, tyre, wall is a `StandardMaterial3D` with `resource_name` equal to its class; lamp has `emission_enabled`; `make("zzz", Color.WHITE, 0.0)` is a StandardMaterial3D whose `albedo_color` equals the albedo of `make("trim", Color.WHITE, 0.0)`; for every name in `CLASSES` `make` returns non-null; `env_ramp().gradient.get_point_count()` is 5; `set_wear` on a paint material to 1.5 then `get_shader_parameter("wear")` is 1.5, and on a StandardMaterial3D does not raise.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_mats` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No scene nodes. No file under godot/art other than the two listed.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA18: CarMats: material per car part class`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
