[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR22 Transitions node: fade, slides, page turn

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR22
Needs (already merged into `dev`): GDR13, GDR21
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The `Transitions` node (full-screen Control in `Fx`): `play(kind, swap, shifter)` changes screens with a transition. It takes a snapshot of the outgoing screen, calls `swap` (which installs the new room), then animates snapshot and new room: fade (snapshot fades out), slide-left/right/up/down (snapshot slides away while the new room slides in by moving `shifter`, the Stage/Room control), page turn (snapshot squashes towards the left edge with a shadow and a light edge). Iris and static are a plain dip-to-black placeholder here (GDR23 replaces them with shaders). In headless mode, with effects off, with an unknown kind, or when already running, it just calls `swap` at once and emits `finished` (synchronously, no awaits) so tests and the CASE box work.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/transitions.js and src/ui/transitions2.js (draw order of each kind)
- godot/rooms/trans_math.gd (GDR13)
- godot/scenes/flow.gd (GDR11: how `play` is called)

## Files you may change (and nothing else)
- `godot/rooms/transitions.gd`
- `godot/tests/test_transitions.gd`

## Steps
1. `godot/rooms/transitions.gd`: `class_name Transitions`, `extends Control`. `signal finished(kind: String)`. Members `var running := false`, `var fx_enabled := true`, `var _from: TextureRect`, `var _edge: ColorRect`, `var _light: ColorRect`, `var _overlay: ColorRect`. `_ready()`: `set_anchors_preset(Control.PRESET_FULL_RECT)`, `mouse_filter = Control.MOUSE_FILTER_IGNORE`.
2. `func play(kind: String, swap: Callable, shifter: Control = null) -> void`: if `kind == "" or not TransMath.is_kind(kind) or not fx_enabled or running or DisplayServer.get_name() == "headless"`: `swap.call()`, `finished.emit(kind)`, return. Otherwise `_run(kind, swap, shifter)` (a coroutine; do NOT await it in `play`). `func _run(...)`: `running = true`; `mouse_filter = Control.MOUSE_FILTER_STOP` (swallows taps while it runs); `var size := get_viewport_rect().size`. For kinds fade, slide-*, pageturn: `await RenderingServer.frame_post_draw`, then `var img := get_viewport().get_texture().get_image()`, create `_from` = `TextureRect` with `ImageTexture.create_from_image(img)`, position (0,0), size = `size`, `expand_mode = TextureRect.EXPAND_IGNORE_SIZE`, `stretch_mode = TextureRect.STRETCH_SCALE`, `texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST`; add it as a child; call `swap.call()`. For pageturn also add `_edge` (ColorRect 24 wide, full height, black) and `_light` (3 wide, `Color(1.0, 0.969, 0.863, 0.8)`). Then `var tw := create_tween()`; `tw.tween_method(apply_progress.bind(kind, size, shifter), 0.0, 1.0, TransMath.duration_ms(kind) / 1000.0)`; `await tw.finished`; `_cleanup(shifter)`; `finished.emit(kind)`.
3. `func apply_progress(u: float, kind: String, size: Vector2, shifter: Control) -> void` (public so it can be tested): fade -> `_from.modulate.a = 1.0 - TransMath.fade_alpha(u)`. slide-* -> `var off := TransMath.slide_offsets(kind, TransMath.ease_out_cubic(u), size)`; `_from.position = off[0]`; `if shifter != null: shifter.position = off[1]`. pageturn -> `_from.pivot_offset = Vector2.ZERO`, `_from.scale = Vector2(TransMath.page_scale(u), 1.0)`, `_edge.position = Vector2(TransMath.page_edge_x(u, size.x), 0)`, `_edge.size = Vector2(24, size.y)`, `_edge.modulate.a = TransMath.page_shadow_alpha(u) / 0.3`, `_light.position = Vector2(TransMath.page_edge_x(u, size.x) - 3.0, 0)`, `_light.size = Vector2(3, size.y)`. iris / static (placeholder, replaced in GDR23) -> `_overlay` is a full-screen black ColorRect created on demand with `modulate.a = TransMath.static_coverage(u)`, and `swap` is called once when `u >= 0.5` (keep a `_swapped` flag; for these two kinds `_run` does not take a snapshot and does not call `swap` up front). `func _cleanup(shifter)`: free `_from`, `_edge`, `_light`, `_overlay` (when they exist), `if shifter != null: shifter.position = Vector2.ZERO`, `running = false`, `mouse_filter = IGNORE`, reset `_swapped`.
4. `godot/tests/test_transitions.gd`: add a `Transitions` node to the tree (headless run). `play("fade", swap)` with `swap` a lambda that increments a counter: the counter is 1 immediately, `finished` emitted once with "fade", `running` false. Same for an unknown kind "wipe" and for `kind == ""`. With `fx_enabled = false`, `play("slide-left", swap)` calls `swap` once. `apply_progress` maths (no rendering): set `t._from = TextureRect.new()` (add it as a child) and call `t.apply_progress(0.5, "fade", Vector2(1280, 720), null)` -> `_from.modulate.a` near 0.5; `apply_progress(0.5, "slide-left", Vector2(1280, 720), shifter)` with `shifter = Control.new()`: `_from.position.x` near `-0.875 * 1280` (-1120) and `shifter.position.x` near `0.125 * 1280` (160); `apply_progress(0.5, "pageturn", ...)` with `_edge` and `_light` created the same way: `_from.scale.x` near 0.5, `_edge.position.x` near 640, `_light.position.x` near 637. `_cleanup(shifter)` resets `shifter.position` to zero and `running` to false. Free everything.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_transitions` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Shaders for iris and static (GDR23). Anything outside the files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR22: Transitions node: fade, slides, page turn`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
