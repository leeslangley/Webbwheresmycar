[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR23 Transitions: iris and TV-static wipe shaders

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR23
Needs (already merged into `dev`): GDR22
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Replace the dip-to-black placeholder of iris and static in the Transitions node with real canvas_item shaders: the iris closes to a black dot (old screen visible through the hole), swaps at the midpoint and opens again; the static wipe shows 32 px cells of grey noise (the same hash as the JS) that peaks at the midpoint where the screen swaps. Plus a small dev scene that shows both effects frozen at a fixed progress for the screenshot.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/transitions.js (iris) and src/ui/transitions2.js (staticCells, drawStaticWipe)
- godot/rooms/trans_math.gd (GDR13) and godot/rooms/transitions.gd (GDR22)

## Files you may change (and nothing else)
- `godot/shaders/iris.gdshader`
- `godot/shaders/static_wipe.gdshader`
- `godot/rooms/transitions.gd`
- `godot/scenes/dev/trans_demo.tscn`
- `godot/scenes/dev/trans_demo.gd`
- `godot/tests/test_transitions_shaders.gd`

## Steps
1. `godot/shaders/iris.gdshader`: `shader_type canvas_item; uniform float radius = 100.0; uniform vec2 center = vec2(640.0, 360.0); uniform vec2 rect_size = vec2(1280.0, 720.0); void fragment() { vec2 p = UV * rect_size; COLOR = vec4(0.0, 0.0, 0.0, step(radius, distance(p, center))); }` (black outside the circle, transparent inside, hard pixel edge).
2. `godot/shaders/static_wipe.gdshader`: uniforms `float coverage : hint_range(0.0, 1.0) = 0.5; int frame = 0; vec2 rect_size = vec2(1280.0, 720.0); float cell = 32.0;`. `fragment()`: `vec2 p = UV * rect_size; uint i = uint(floor(p.x / cell)) + 1u; uint j = uint(floor(p.y / cell)) + 1u; uint h = (i * 73856093u) ^ (j * 19349663u) ^ (uint(frame + 1) * 83492791u); float r = float(h % 1000u) / 1000.0; int level = int((h >> 10u) % 4u);` colour = `vec3(16.0/255.0)` for level 0, `vec3(80.0/255.0)` for 1, `vec3(160.0/255.0)` for 2, `vec3(240.0/255.0)` for 3; `COLOR = vec4(col, r < coverage ? 1.0 : 0.0);` (identical to `TransMath.static_cells`, cell index + 1 as in the JS).
3. Edit `godot/rooms/transitions.gd`: `func make_overlay(kind: String, size: Vector2) -> ColorRect` builds a full-screen `ColorRect` (size = `size`, `color = Color.WHITE`, `mouse_filter` IGNORE) with a `ShaderMaterial` using `res://shaders/iris.gdshader` for "iris" or `res://shaders/static_wipe.gdshader` for "static" and sets `rect_size` to `size` (and `center` to `size / 2` for the iris). `func apply_overlay(ov: ColorRect, kind: String, u: float, size: Vector2) -> void`: iris -> `radius = TransMath.iris(u, size).radius`; static -> `coverage = TransMath.static_coverage(u)` and `frame = int(Time.get_ticks_msec() / 50)`, using `set_shader_parameter`. Make the iris / static branch of `apply_progress` call these (create `_overlay` through `make_overlay` on first use, add it as the LAST child so it is on top) and keep the midpoint swap logic.
4. `godot/scenes/dev/trans_demo.gd` + `.tscn` (one `Control` named `TransDemo`, 1280x720): in `_ready` add eight vertical colour stripes (ColorRects 160 px wide, any eight distinct colours) as a background; then two `Transitions`-made overlays side by side: the left half uses `Transitions.new().make_overlay("iris", Vector2(640, 720))` after `apply_overlay(ov, "iris", 0.25, Vector2(640, 720))` (hole radius a bit under 300), the right half (position x 640) a "static" overlay with `u = 0.25` (coverage 0.5) and the frame frozen by setting the parameter `frame` to 3 afterwards. Add two labels IRIS u=0.25 and STATIC u=0.25 on top.
5. `godot/tests/test_transitions_shaders.gd`: both shader files load as `Shader`; `var t := Transitions.new()`; `var ov := t.make_overlay("iris", Vector2(1280, 720))` has a `ShaderMaterial` whose shader path ends with `iris.gdshader` and `get_shader_parameter("rect_size") == Vector2(1280, 720)`; after `t.apply_overlay(ov, "iris", 0.25, Vector2(1280, 720))` the `radius` parameter is near `367.1511950137164` (eps 0.01), and at u 0.5 it is 0; a static overlay after `apply_overlay(..., "static", 0.25, ...)` has `coverage` near 0.5 and at u 0.5 near 1.0; `make_overlay("fade", ...)` returns null. Free everything.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_transitions_shaders` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/dev/trans_demo.tscn /tmp/gdr23_trans.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it. Check: left half shows the stripes with a black frame and a round hole in the middle; right half shows blocky grey static cells covering about half the area.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR23: Transitions: iris and TV-static wipe shaders`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
