[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA14 Particle effect scenes: steam, dust, cash, confetti, smoke

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA14
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A library of five `GPUParticles2D` scenes built from one table in `Fx`, plus `Fx.burst()` to fire a one-shot effect at a position. Numbers come from src/ui/particles.js KINDS and src/art/roomfx_world.js (steamPuffs, drawDust).

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- src/ui/particles.js in the dev worktree /Users/leelangley/wt/webbwheresmycar/_dev (KINDS: the colours and timings this card copies; everything you need is also written below)
- Godot 4 `GPUParticles2D` and `ParticleProcessMaterial` (direction, spread, initial_velocity_min/max, gravity, scale_min/max, color_ramp, color_initial_ramp, emission_shape, emission_box_extents)
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `godot/art/fx/fx.gd`
- `godot/art/fx/steam.tscn`
- `godot/art/fx/dust.tscn`
- `godot/art/fx/cash.tscn`
- `godot/art/fx/confetti.tscn`
- `godot/art/fx/smoke.tscn`
- `godot/tests/test_fx.gd`

## Steps
1. Each of the five scene files is exactly these five lines (example for steam): `[gd_scene load_steps=2 format=3]`, `[ext_resource type="Script" path="res://art/fx/fx.gd" id="1"]`, `[node name="Steam" type="GPUParticles2D"]`, `script = ExtResource("1")`, `metadata/kind = "steam"`. Kinds and node names: steam/Steam, dust/Dust, cash/Cash, confetti/Confetti, smoke/Smoke. `fx.gd` is both the script of these scenes (`extends GPUParticles2D`; `_ready()` calls `Fx.setup(self, str(get_meta("kind", "steam")))`) and the library: it declares `class_name Fx` and holds the static funcs.
2. `godot/art/fx/fx.gd`: `class_name Fx`, `extends GPUParticles2D`. `const KINDS := PackedStringArray(["steam", "dust", "cash", "confetti", "smoke"])`. `const TABLE := {...}` with these numbers (all keys: amount, lifetime, one_shot, explosiveness, dir (Vector2), spread (degrees), vmin, vmax, gravity (Vector2), smin, smax, color (Color), colors (Array of Color, may be empty), box (Vector2, zero = point emitter)): steam: amount 12, lifetime 1.4, one_shot false, explosiveness 0.0, dir (0, -1), spread 20, vmin 18, vmax 30, gravity (0, -8), smin 1.5, smax 3.0, color `Color(1, 1, 1, 0.45)`, box zero; dust: amount 20, lifetime 6.0, one_shot false, explosiveness 0.0, dir (0, -1), spread 180, vmin 2, vmax 6, gravity (0, 0), smin 0.5, smax 1.0, color `Color(1.0, 0.914, 0.753, 0.35)`, box (200, 120); cash: amount 24, lifetime 1.3, one_shot true, explosiveness 0.95, dir (0, -1), spread 50, vmin 220, vmax 380, gravity (0, 700), smin 2.0, smax 3.0, color `Color(0.91, 0.725, 0.137, 1.0)`, box zero; confetti: amount 60, lifetime 2.2, one_shot true, explosiveness 0.9, dir (0, -1), spread 80, vmin 250, vmax 450, gravity (0, 420), smin 1.5, smax 3.0, color white, colors [`e8b923`, `d9483b`, `3fae49`, `70a4b2`, `6f3d86`, `ffffff`], box zero; smoke: amount 16, lifetime 1.6, one_shot false, explosiveness 0.0, dir (0, -1), spread 25, vmin 20, vmax 40, gravity (0, -6), smin 2.0, smax 5.0, color `Color(0.784, 0.784, 0.824, 0.5)`, box zero.
3. `static func setup(p: GPUParticles2D, kind: String) -> bool`: false for an unknown kind. Otherwise fill the node from `TABLE[kind]`: `p.amount`, `p.lifetime`, `p.one_shot`, `p.explosiveness`, `p.emitting = not one_shot` (one-shot effects wait for `burst`), `p.texture = tex()` and `p.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST`, `p.process_material = ParticleProcessMaterial` with `direction = Vector3(dir.x, dir.y, 0)`, `spread`, `initial_velocity_min/max`, `gravity = Vector3(g.x, g.y, 0)`, `scale_min/max`, `color` (or for confetti `color_initial_ramp` = a `GradientTexture1D` whose Gradient has the 6 colours with offsets `i / 5.0`), `color_ramp` = a `GradientTexture1D` of a 2 colour Gradient (`Color(1, 1, 1, 1)` at 0.6 to `Color(1, 1, 1, 0)` at 1.0 for all kinds; smoke and steam: from `Color(1, 1, 1, 1)` at 0.0), and when `box != Vector2.ZERO`: `emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX`, `emission_box_extents = Vector3(box.x, box.y, 1)`. Set `p.set_meta("kind", kind)` and return true. `static func tex() -> Texture2D`: cached in a `static var`; a 4x4 white `Image` (FORMAT_RGBA8) as `ImageTexture`.
4. `static func burst(parent: Node, kind: String, pos: Vector2) -> GPUParticles2D`: loads `res://art/fx/<kind>.tscn` (null for an unknown kind), instantiates, `position = pos`, `parent.add_child(n)`; for one-shot kinds: `n.emitting = true`, `n.restart()` and `n.finished.connect(n.queue_free)`; returns the node. (`burst` needs a parent inside the tree, tests only check the failure case.)
5. `godot/tests/test_fx.gd`: for each kind: `load("res://art/fx/<kind>.tscn")` is a PackedScene; instantiate, call `Fx.setup(node, kind)` (the test calls it itself because `_ready` does not run out of tree): true; `amount` and `lifetime` equal the table; `one_shot` equals the table; `emitting` equals `not one_shot`; `process_material` is a ParticleProcessMaterial whose `initial_velocity_max` equals `vmax`; `texture_filter` is NEAREST. Specific: cash `amount` 24 and `explosiveness` 0.95; confetti `process_material.color_initial_ramp` is a GradientTexture1D whose gradient has 6 points; dust `emission_shape` is BOX with `emission_box_extents.x` 200; steam `process_material.gravity.y` is -8.0. `Fx.setup(n, "zzz")` is false; `Fx.burst(null, "zzz", Vector2.ZERO)` is null; `Fx.KINDS.size()` is 5; `Fx.tex().get_width()` is 4 and a second call returns the same object. Free all nodes.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_fx` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No sound. No placing of effects in rooms (GDR cards call Fx.burst).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA14: Particle effect scenes: steam, dust, cash, confetti, smoke`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
