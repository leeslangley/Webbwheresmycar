[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA22 CarView: dark outline pass and finer pixels

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA22
Needs (already merged into `dev`): GDA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Cars look soft and blobby. Add a pixel-art style OUTLINE pass to CarView (a 1-pixel dark edge around the silhouette and a darker line where body meets glass/wheels) and render at a finer pixel size (shrink 2 instead of 3 for the side and three_quarter views) so cars look like crisp HD pixel art, in the spirit of Rock Star Ate My Hamster.

## Read first
- godot/art/carview.gd (VIEWS table with `shrink`, the SubViewportContainer 'Box' that scales the SubViewport texture with nearest filter)
- godot/tv/crt.gdshader (an example canvas_item shader in this project)

## Files you may change (and nothing else)
- `godot/art/car_outline.gdshader`
- `godot/art/carview.gd`
- `godot/tests/test_car_outline.gd`

## Steps
1. Create `godot/art/car_outline.gdshader` (shader_type canvas_item): sample the SubViewport texture, compute alpha edge by comparing the 4 neighbours (offset one texel = 1.0/vec2(textureSize(TEXTURE,0))); where the pixel is transparent but a neighbour is opaque output `outline_color` (uniform vec4 default (0.05,0.03,0.08,1.0)); where opaque keep the colour; also darken (mix 35% toward outline_color) opaque pixels whose neighbour luminance differs by more than 0.35. Uniforms `outline_color`, `edge_threshold` (default 0.35).
2. In godot/art/carview.gd: apply a ShaderMaterial using car_outline.gdshader to the SubViewportContainer 'Box' when the view is built (stretch must stay on; the container's own texture filter stays nearest). Expose `var outline := true` and `func set_outline(on: bool)` that sets/removes the material. Change VIEWS side and three_quarter `shrink` from 3 to 2 and keep `size` unchanged; front and mini unchanged.
3. godot/tests/test_car_outline.gd: assert the shader file loads and has uniforms outline_color and edge_threshold (use `Shader.get_shader_uniform_list()`), assert CarView built by hand (call build()) has the material on Box when outline is true and none after set_outline(false), assert VIEWS.side.shrink == 2 and VIEWS.front.shrink == 3.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_outline` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh test_carview` ends with `GDTEST OK` (update its VIEWS expectations ONLY if they hard-code shrink 3 for side/three_quarter: that edit to godot/tests/test_carview.gd is allowed).
- `sh tools/godot/gshot.sh art/previews/carview_demo.tscn /tmp/GDA22.png 40`; LOOK at it and describe honestly whether the car now has a crisp dark outline and finer pixels.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA22: CarView: dark outline pass and finer pixels`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
