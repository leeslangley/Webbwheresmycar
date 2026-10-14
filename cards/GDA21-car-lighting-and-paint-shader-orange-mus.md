[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA21 Car lighting and paint shader: orange must read orange

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA21
Needs (already merged into `dev`): GDA04, GDA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
In the car viewer the default orange paint (#c96f32) renders as a dark muddy brown with wedge-shaped dark bands. Retune the key light, rim light, ambient and the paint shader so a paint colour reads as itself: bright, saturated, with a soft highlight. Pixel look (1/3 size render, nearest scale) stays.

## Read first
- godot/art/car_paint.gdshader and godot/art/carview.gd (light energies, environment/ambient, shader params)
- godot/art/car_mats.gd (how the paint material is built)
- godot/tests/shots/tv_shot.gd (how a shot scene is built under gshot.sh: scene loaded on the first frame, autoloads exist)

## Files you may change (and nothing else)
- `godot/art/car_paint.gdshader`
- `godot/art/carview.gd`
- `godot/tests/test_car_colour.gd`
- `godot/tests/shots/car_colour_shot.gd`
- `godot/tests/shots/car_colour_shot.tscn`

## Steps
1. Create `godot/tests/shots/car_colour_shot.tscn` (root Control with script `car_colour_shot.gd`, size 1280x720): a flat mid-grey ColorRect background and ONE CarView (t1_chimp, side view, wear 0, paint Color("c96f32")) centred at 640x360 sized 800x400. The script only sets that up in _ready.
2. Create `godot/tests/test_car_colour.gd`: a test `test_paint_reads_as_itself` that builds a CarView headless is NOT possible (dummy renderer), so instead assert on the material numbers: the paint ShaderMaterial created by CarMats for class 'paint' has shader param `paint` == Color("c96f32"), and CarView's DirectionalLight3D energy is >= 1.2 and the ambient/environment energy is >= 0.35 (read the real node names from carview.gd and adapt). These numeric floors are what you tune toward.
3. Tune godot/art/carview.gd lights/ambient and godot/art/car_paint.gdshader (reduce the dark fresnel/flop term, raise diffuse so the lit side is within 85-100% of the paint value, keep a small white highlight). Run `sh tools/godot/gshot.sh tests/shots/car_colour_shot.tscn /tmp/GDA21.png 40`, LOOK at the PNG, iterate until the car body's dominant colour is clearly orange. Then run the objective check: `python3 -c "import sys,struct,zlib"` is NOT available for PNG, so use this Blender one-liner to measure it: `/opt/homebrew/bin/blender --background --python-expr "import bpy,colorsys;im=bpy.data.images.load('/tmp/GDA21.png');px=list(im.pixels);n=len(px)//4;c=[(px[i*4],px[i*4+1],px[i*4+2]) for i in range(n)];o=[p for p in c if 0.05<colorsys.rgb_to_hsv(*p)[0]<0.12 and colorsys.rgb_to_hsv(*p)[1]>0.5 and colorsys.rgb_to_hsv(*p)[2]>0.5];print('ORANGE_PX',len(o))"` and require ORANGE_PX >= 15000 (the car body is roughly 800x300 px at 1/3 render scale).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_colour` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh test_carview` and `sh tools/godot/gtest.sh test_car_shaders` still end with `GDTEST OK`.
- The Blender measurement above prints `ORANGE_PX` >= 15000 for /tmp/GDA21.png (paste the number); LOOK at /tmp/GDA21.png and describe the car honestly.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA21: Car lighting and paint shader: orange must read orange`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
