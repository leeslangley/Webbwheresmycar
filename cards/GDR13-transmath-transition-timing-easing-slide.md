[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR13 TransMath: transition timing, easing, slides, iris, static

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR13
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
All the numbers of the screen transitions as pure static functions, ported from src/ui/transitions.js and transitions2.js (fade, four slides, iris, TV-static wipe, page turn), so the Transitions node (GDR22, GDR23) and the shader only apply them. Constants follow the JS MOTION table.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/transitions.js
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/transitions2.js
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/tokens.js (MOTION and EASE: inOutQuad, outCubic)

## Files you may change (and nothing else)
- `godot/rooms/trans_math.gd`
- `godot/tests/test_trans_math.gd`

## Steps
1. `godot/rooms/trans_math.gd`: `class_name TransMath`, `extends RefCounted`, all `static`. `const KINDS := ["fade", "slide-left", "slide-right", "slide-up", "slide-down", "iris", "static", "pageturn"]`; `const DURATION_MS := {"fade": 250, "slide-left": 350, "slide-right": 350, "slide-up": 350, "slide-down": 350, "iris": 500, "static": 400, "pageturn": 320}`; `const STATIC_COLORS := [Color("101010"), Color("505050"), Color("A0A0A0"), Color("F0F0F0")]`; `const STATIC_CELL := 32`. `is_kind(kind: String) -> bool`; `duration_ms(kind: String) -> int` (-1 for an unknown kind); `progress(start_ms: int, dur_ms: int, now_ms: int) -> float` = `clampf(float(now_ms - start_ms) / float(dur_ms), 0.0, 1.0)`; `is_done(start_ms, dur_ms, now_ms) -> bool` = `now_ms >= start_ms + dur_ms`.
2. Easing: `ease_in_out_quad(u)` = `2u^2` for `u < 0.5` else `1 - pow(-2u + 2, 2) / 2`; `ease_out_cubic(u)` = `1 - pow(1 - u, 3)` (both clamp `u` to 0..1 first). `fade_alpha(u)` = `ease_in_out_quad(u)` (the incoming screen's opacity). `slide_offsets(kind: String, e: float, size: Vector2) -> Array` returns `[old_offset, new_offset]` (two Vector2): slide-left `[(-e*w, 0), ((1-e)*w, 0)]`; slide-right `[(e*w, 0), (-(1-e)*w, 0)]`; slide-up `[(0, -e*h), (0, (1-e)*h)]`; slide-down `[(0, e*h), (0, -(1-e)*h)]`; `[]` for other kinds. (The caller passes `e = ease_out_cubic(u)`.)
3. `iris(u: float, size: Vector2) -> Dictionary` with `R = size.length() / 2.0`: for `u < 0.5` `{"radius": R * (1.0 - 2.0 * u), "showing": "from"}` else `{"radius": R * (2.0 * u - 1.0), "showing": "to"}`. `static_coverage(u: float) -> float` = `1.0 - absf(2.0 * u - 1.0)`. `static_cells(cols: int, rows: int, coverage: float, frame: int) -> Array` (of `Vector3i(i, j, level)`): for each `j` in `0..rows-1`, `i` in `0..cols-1` (row by row): `h = (((i + 1) * 73856093) & 0xFFFFFFFF) ^ (((j + 1) * 19349663) & 0xFFFFFFFF) ^ (((frame + 1) * 83492791) & 0xFFFFFFFF)`; keep the cell when `float(h % 1000) / 1000.0 < coverage`; `level = (h >> 10) % 4`. (This reproduces JavaScript's `Math.imul(...) ^ ... >>> 0`.) Page turn: `page_scale(u)` = `1.0 - ease_in_out_quad(u)` (horizontal scale of the old page), `page_edge_x(u, width)` = `page_scale(u) * width`, `page_shadow_alpha(u)` = `0.3 * (1.0 - u)`.
4. `godot/tests/test_trans_math.gd`: `is_kind("iris")` true, `is_kind("wipe")` false; `duration_ms`: fade 250, slide-up 350, iris 500, static 400, pageturn 320, "nope" -1; `progress(100, 250, 225) == 0.5` (near), `progress(100, 250, 50) == 0.0`, `progress(100, 250, 999) == 1.0`; `is_done(100, 250, 349)` false and `is_done(100, 250, 350)` true. `ease_in_out_quad`: 0 -> 0, 0.25 -> 0.125, 0.5 -> 0.5, 0.75 -> 0.875, 1 -> 1; `ease_out_cubic`: 0 -> 0, 0.5 -> 0.875, 1 -> 1. `slide_offsets("slide-left", 0.5, Vector2(1280, 720))` == `[Vector2(-640, 0), Vector2(640, 0)]`; slide-right `[(640, 0), (-640, 0)]`; slide-up with e 0.25: `[(0, -180), (0, 540)]`; slide-down with e 0.25: `[(0, 180), (0, -540)]`; `slide_offsets("fade", 0.5, ...)` is empty. `iris(0.0, Vector2(1280, 720))` radius `734.3023900274328` showing "from" (eps 1e-6); `iris(0.25, ...)` radius half of that, "from"; `iris(0.5, ...)` radius 0; `iris(0.75, ...)` radius half, "to"; `iris(1.0, ...)` full, "to". `static_coverage`: 0 -> 0, 0.25 -> 0.5, 0.5 -> 1, 1 -> 0. `static_cells(4, 3, 0.0, 0)` is empty; `static_cells(4, 3, 1.0, 0)` has 12 cells and begins `Vector3i(0, 0, 2), Vector3i(1, 0, 1), Vector3i(2, 0, 0), Vector3i(3, 0, 3)`; `static_cells(4, 3, 0.5, 0) == [Vector3i(0,0,2), Vector3i(1,0,1), Vector3i(2,0,0), Vector3i(2,1,0), Vector3i(1,2,1), Vector3i(2,2,0), Vector3i(3,2,3)]`; `static_cells(40, 23, 0.5, 3).size() == 450`; the same call twice gives equal results. `page_scale(0) == 1`, `page_scale(0.5) == 0.5`, `page_scale(1) == 0`; `page_edge_x(0.5, 1280) == 640`; `page_shadow_alpha(0) == 0.3`, `(0.5) == 0.15`, `(1) == 0`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_trans_math` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files. No nodes, no shaders.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR13: TransMath: transition timing, easing, slides, iris, static`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
