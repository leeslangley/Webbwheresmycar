[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA05 Wear: numbers (wear.gd) and shader include

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA05
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The weathering of a car as numbers (GDScript, testable) and as shader code (an include file the car shaders share). Port of the idea of src/art/sprite_wear.js: wear level 0 mint, 1 worn, 2 tatty, 3 wreck (a float 0..3 between the steps), layers dirt, rust, dents, pitting, glass crack, paint fade.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- src/art/sprite_wear.js and src/art/sprite_paint.js (read in the dev worktree /Users/leelangley/wt/webbwheresmycar/_dev: constants DIRT_AMOUNT, RUST_BLOBS, PIT_AMOUNT, FADE_LEVEL, FADE_TOWARD, wearState)
- godot/tests/harness.gd (GDF02: `ok`, `eq`, `near`)

## Files you may change (and nothing else)
- `godot/art/wear.gd`
- `godot/art/car_wear.gdshaderinc`
- `godot/tests/test_wear.gd`

## Steps
1. `godot/art/wear.gd`: `class_name Wear`, `extends RefCounted`. Constants (PackedFloat32Array, index = wear state 0..3): `DIRT := [0.0, 0.1, 0.24, 0.4]`, `RUST := [0.0, 0.0, 0.10, 0.28]`, `PIT := [0.0, 0.0, 0.08, 0.18]`, `FADE := [0.0, 0.12, 0.30, 0.50]`, `DENT := [0.0, 0.0, 0.0, 1.0]`, `CRACK := [0.0, 0.0, 0.0, 1.0]`; `FADE_TOWARD := Color("b8aa96")`.
2. Static funcs: `clamp_level(w: float) -> float` (clamp to 0.0..3.0; NaN gives 0.0); `lerp_table(t: PackedFloat32Array, level: float) -> float` (linear between the two neighbouring entries of the clamped level; level 3.0 gives t[3]); `at(level: float) -> Dictionary` with float keys `dirt`, `rust`, `pit`, `fade`, `dent`, `crack` from the tables; `faded(c: Color, level: float) -> Color` = `c.lerp(FADE_TOWARD, lerp_table(FADE, level))`; `state_from_condition(cond: float) -> int` (port of wearState: NaN -> 0, cond >= 8 -> 0, >= 5 -> 1, >= 2.5 -> 2, else 3).
3. `godot/art/car_wear.gdshaderinc` (plain shader code, no `shader_type` line; an include file for `#include "res://art/car_wear.gdshaderinc"`). Contents in this order: `const vec4 WR_DIRT = vec4(0.0, 0.1, 0.24, 0.4);` and the same for `WR_RUST` (0.0, 0.0, 0.10, 0.28), `WR_PIT` (0.0, 0.0, 0.08, 0.18), `WR_FADE` (0.0, 0.12, 0.30, 0.50); linear colour constants `const vec3 WR_FADE_TO = vec3(0.4793, 0.4020, 0.3050);` `WR_DIRT_A = vec3(0.1046, 0.0612, 0.0319)`, `WR_DIRT_B = vec3(0.0497, 0.0296, 0.0160)`, `WR_RUST_A = vec3(0.1070, 0.0232, 0.0060)`, `WR_RUST_B = vec3(0.3231, 0.0685, 0.0130)`, `WR_RUST_C = vec3(0.5841, 0.1946, 0.0319)`, `WR_PIT_C = vec3(0.1470, 0.1022, 0.0648)`, `WR_CRACK_C = vec3(0.5210, 0.7454, 0.8550)`.
4. Functions in the include file (all prefixed `wr_`): `float wr_tab(vec4 t, float w)` { w = clamp(w, 0.0, 3.0); int i = int(min(floor(w), 2.0)); return mix(t[i], t[i + 1], w - float(i)); }; `float wr_hash(vec3 p)` { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }; `float wr_noise(vec3 p)` = trilinear value noise: `vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);` then mix of the 8 `wr_hash(i + corner)` corners; `float wr_pit(vec3 p, float wear)` { return step(wr_hash(floor(p * 40.0)), wr_tab(WR_PIT, wear)); } (1.0 where chrome is pitted).
5. `void wr_apply_paint(inout vec3 albedo, inout float rough, vec3 p, float hf, float wear)`: `p` is the object-space position, `hf` the height fraction 0 (sill) .. 1 (roof). In this order: (1) fade: `albedo = mix(albedo, WR_FADE_TO, wr_tab(WR_FADE, wear));` (2) dirt: `float lim = wr_tab(WR_DIRT, wear); float dn = wr_noise(p * 6.0); float dirt = step(hf, lim + (dn - 0.5) * 0.1) * step(0.001, lim);` colour `mix(WR_DIRT_B, WR_DIRT_A, wr_noise(p * 11.0))`; `albedo = mix(albedo, dirtcol, dirt); rough = mix(rough, 0.95, dirt);` (3) rust on the lower body only: `float cover = wr_tab(WR_RUST, wear); float rn = wr_noise(p * 3.0 + 7.0); float rust = step(1.0 - cover, rn) * step(0.001, cover) * (1.0 - smoothstep(0.35, 0.55, hf));` colour `mix(mix(WR_RUST_A, WR_RUST_B, wr_noise(p * 9.0)), WR_RUST_C, step(0.8, wr_noise(p * 17.0)))`; mix into albedo by `rust`, rough to 0.9 by `rust`. (4) dents, only when `wear > 2.0` (strength `clamp(wear - 2.0, 0.0, 1.0)`): three centres in object space `vec3(1.0, 1.4, 1.6)`, `vec3(-2.2, 1.2, -1.7)`, `vec3(3.0, 1.5, 1.5)` (metres, car 10 m long); for each `float s = 1.0 - smoothstep(0.0, 0.4, distance(p, c));` and `albedo *= 1.0 + strength * s * clamp((p.y - c.y) / 0.4, -1.0, 1.0) * -0.35;` (top darker, bottom lighter).
6. `void wr_apply_chrome(inout vec3 albedo, inout vec3 emit, vec3 p, float wear)`: `float pit = wr_pit(p, wear); albedo = mix(albedo, WR_PIT_C, pit); emit *= 1.0 - pit;`. `void wr_apply_glass(inout vec3 albedo, vec3 p, float wear)`: only when `wear > 2.5`: a crack line `float d = abs(p.y - 2.6 - 0.5 * (p.x - 0.5)); float line = (1.0 - smoothstep(0.012, 0.03, d)) * step(abs(p.x - 0.5), 0.7) * clamp((wear - 2.5) * 2.0, 0.0, 1.0);` and `albedo = mix(albedo, WR_CRACK_C, line)`.
7. `godot/tests/test_wear.gd` (`extends "res://tests/harness.gd"`): `at(0.0)` has the six keys `dirt`, `rust`, `pit`, `fade`, `dent`, `crack` and all are 0.0; `at(3.0).dirt` is 0.4, `.rust` 0.28, `.pit` 0.18, `.fade` 0.5, `.dent` 1.0, `.crack` 1.0; `at(1.5).dirt` near 0.17 (eps 1e-6); `at(2.0).rust` near 0.10; `at(9.0)` equals `at(3.0)` and `at(-1.0)` equals `at(0.0)`; `clamp_level(NAN)` is 0.0; `state_from_condition` of 8.0 -> 0, 7.9 -> 1, 5.0 -> 1, 4.99 -> 2, 2.5 -> 2, 2.49 -> 3, NAN -> 0; `faded(Color8(201, 111, 50), 3.0)` near `Color8(192, 140, 100)` per channel (eps 1.5/255); `faded(c, 0.0) == c`. Then read `res://art/car_wear.gdshaderinc` with `FileAccess.get_file_as_string` and `ok(txt.contains(...))` for each of: `float wr_tab(`, `float wr_noise(`, `float wr_pit(`, `void wr_apply_paint(`, `void wr_apply_chrome(`, `void wr_apply_glass(`, `vec4(0.0, 0.1, 0.24, 0.4)`, `vec4(0.0, 0.0, 0.10, 0.28)`, and `ok(not txt.contains("shader_type"))`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_wear` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No scene, no material code (cards GDA04 and GDA18). The include is compiled and looked at in card GDA04; if GDA04 finds a compile error in it, GDA04 may fix the include.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA05: Wear: numbers (wear.gd) and shader include`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
