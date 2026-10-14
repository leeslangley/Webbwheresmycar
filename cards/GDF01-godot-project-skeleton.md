[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF01 Godot: project skeleton

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF01
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Create the empty Godot 4.7.2 project in `godot/`: 1280x720 base size, Compatibility renderer, three autoload stubs, the folder layout, and a placeholder test runner so `sh tools/godot/gtest.sh` already prints `GDTEST OK`.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules)
- tools/godot/gtest.sh and tools/godot/_common.sh (how the project is shipped to CASE and run; `project.godot` must exist in godot/)

## Files you may change (and nothing else)
- `godot/project.godot`
- `godot/.gitignore`
- `godot/autoload/game.gd`
- `godot/autoload/data.gd`
- `godot/autoload/sfx.gd`
- `godot/tests/runner.gd`
- `godot/core/.gitkeep`
- `godot/sim/.gitkeep`
- `godot/data/.gitkeep`
- `godot/scenes/.gitkeep`
- `godot/tv/.gitkeep`
- `godot/ui/.gitkeep`
- `godot/art/.gitkeep`
- `godot/tests/golden/.gitkeep`

## Steps
1. Write `godot/project.godot` as exactly these sections (Godot config format, one `key=value` per line, blank line between sections, first line `config_version=5`): `[application]` with `config/name="Webb, where's my car?"` and `config/features=PackedStringArray("4.7", "GL Compatibility")`; `[autoload]` with `Game="*res://autoload/game.gd"`, `Data="*res://autoload/data.gd"`, `Sfx="*res://autoload/sfx.gd"`; `[display]` with `window/size/viewport_width=1280`, `window/size/viewport_height=720`, `window/stretch/mode="canvas_items"`, `window/stretch/aspect="expand"`, `window/handheld/orientation=0` (0 = landscape); `[rendering]` with `renderer/rendering_method="gl_compatibility"`, `renderer/rendering_method.mobile="gl_compatibility"`, `textures/canvas_textures/default_texture_filter=0` (Nearest, for the pixel look). No `run/main_scene` yet (GDF11 adds it).
2. Write the three autoload stubs, each exactly two lines (use a TAB where indented): `godot/autoload/game.gd`: `extends Node` and `# Game singleton, filled in by GDF10.`; `godot/autoload/data.gd`: `extends Node` and `# Data singleton, filled in by GDF03.`; `godot/autoload/sfx.gd`: `extends Node` and `# Sfx singleton, filled in by GDF12.`
3. Write `godot/.gitignore` with these lines: `.godot/`, `*.tmp`, `/export/`. Create the empty placeholder files `.gitkeep` listed under files (empty files, NOT `.gdignore`, which would hide the folder from Godot).
4. Write the PLACEHOLDER `godot/tests/runner.gd` (GDF02 replaces it completely): `extends SceneTree`, then `func _initialize() -> void:` containing `print("GDTEST OK")` and `quit(0)`.
5. Run the acceptance commands below and paste their output.

## Acceptance (all must pass; exact commands)
- `grep -c -E '^(Game|Data|Sfx)="\*res://autoload/' godot/project.godot` prints `3`.
- `grep -E 'viewport_width=1280|viewport_height=720|stretch/mode="canvas_items"|stretch/aspect="expand"|gl_compatibility' godot/project.godot | wc -l` prints `6`.
- `test -f godot/autoload/game.gd && test -f godot/autoload/data.gd && test -f godot/autoload/sfx.gd && test -f godot/.gitignore && echo SKELETON OK` prints `SKELETON OK`.
- `sh tools/godot/gtest.sh | tail -1` prints `GDTEST OK` (the placeholder runner; the import step must not print parse errors for the autoload stubs).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Any scene, theme, font or art. Real autoload code (GDF03, GDF10, GDF12). The real runner (GDF02).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF01: Godot: project skeleton`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
