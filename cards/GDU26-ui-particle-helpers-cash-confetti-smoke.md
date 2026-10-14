[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU26 UI: particle helpers (cash, confetti, smoke)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU26
Needs (already merged into `dev`): GDU01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiParticles`: one-shot GPUParticles2D bursts built entirely in code (no texture files): falling cash, confetti and smoke puffs. Each burst frees itself when finished.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- src/ui/particles.js (what the JS bursts look like: counts, colours, gravity)

## Files you may change (and nothing else)
- `godot/ui/particles.gd`
- `godot/tests/test_ui_particles.gd`

## Steps
1. `godot/ui/particles.gd`: `class_name UiParticles`, `extends RefCounted`, static, typed. `static var _tex: ImageTexture`. `static func square_texture() -> ImageTexture`: build once: `var img := Image.create(4, 4, false, Image.FORMAT_RGBA8)`, `img.fill(Color.WHITE)`, `_tex = ImageTexture.create_from_image(img)`; return the cached one afterwards. `static func _base(parent: Node, pos: Vector2, amount: int, lifetime: float) -> GPUParticles2D`: `var p := GPUParticles2D.new()`, `p.position = pos`, `p.amount = amount`, `p.lifetime = lifetime`, `p.one_shot = true`, `p.explosiveness = 0.9`, `p.texture = square_texture()`, `p.emitting = true`, `p.finished.connect(p.queue_free)`, `parent.add_child(p)`, return `p`.
2. `static func cash(parent: Node, pos: Vector2) -> GPUParticles2D`: `_base(parent, pos, 24, 1.2)` with a `ParticleProcessMaterial` `m`: `m.direction = Vector3(0, -1, 0)`, `m.spread = 60.0`, `m.initial_velocity_min = 180.0`, `m.initial_velocity_max = 320.0`, `m.gravity = Vector3(0, 600, 0)`, `m.scale_min = 2.0`, `m.scale_max = 3.0`, `m.color = UiTheme.color("cashGreen")`; assign `p.process_material = m`. `static func confetti(parent: Node, pos: Vector2) -> GPUParticles2D`: `_base(parent, pos, 60, 1.8)`, material: direction (0, -1, 0), spread 80.0, velocity 200..420, gravity (0, 500, 0), scale 1.5..3.0, and a `color_ramp` `GradientTexture1D` whose `gradient` has 4 colours: `Color("#E8B923")`, `Color("#D9483B")`, `Color("#3FAE49")`, `Color("#70A4B2")` at offsets 0.0, 0.33, 0.66, 1.0 and `m.color_initial_ramp = ramp_texture` (random colour per particle). `static func smoke(parent: Node, pos: Vector2) -> GPUParticles2D`: `_base(parent, pos, 12, 1.6)`, explosiveness 0.2, material: direction (0, -1, 0), spread 20.0, velocity 20..50, gravity (0, -30, 0), scale 4.0..7.0, `m.color = Color(0.6, 0.6, 0.6, 0.5)`.
3. `godot/tests/test_ui_particles.gd` (every `near` uses eps 0.001): `test_texture`: `UiParticles.square_texture()` is not null, 4x4 (`get_width() == 4`), and the second call returns the same object. `test_cash`: a host `Node2D` in the tree; `var p := UiParticles.cash(host, Vector2(10, 20))`: `p.position == Vector2(10, 20)`, `p.amount == 24`, `p.one_shot`, `p.lifetime` near 1.2, `p.process_material is ParticleProcessMaterial`, `p.texture != null`, `p.get_parent() == host`. `test_confetti`: `amount == 60`, lifetime near 1.8, `(p.process_material as ParticleProcessMaterial).color_initial_ramp != null`. `test_smoke`: `amount == 12`, `explosiveness` near 0.2, the material's `gravity.y` near -30.0. Free `host` at the end of each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_particles` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU26: UI: particle helpers (cash, confetti, smoke)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
