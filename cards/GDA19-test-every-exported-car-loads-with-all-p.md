[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA19 Test: every exported car loads with all part classes

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA19
Needs (already merged into `dev`): GDA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A guard test over the whole car manifest: every car in `res://art/cars/manifest.json` has a glb that loads, instantiates and has the part classes Godot needs, and shows in a CarView.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- Car model contract (GDA01/GDA02): `res://art/cars/<id>.glb` has one MeshInstance3D node per part named `<class>_<NN>` (class is one of paint, paint2, chrome, glass, lamp, tail, trim, tyre, wall; NN two digits) and each mesh surface has a material whose `resource_name` is exactly the class. Axes in Godot: the car faces +X, up is +Y, the near (screen) side is +Z, the model is built 10.0 m long whatever the real car (1 car unit = 0.1 m); the real length is `len_mm` in `res://art/cars/manifest.json`, so the in-game scale of a car is `len_mm / 10000.0`.
- godot/art/carview.gd (GDA03 API: set_car, surface_classes, car_node)
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `godot/tests/test_art_cars.gd`

## Steps
1. `godot/tests/test_art_cars.gd` (`extends "res://tests/harness.gd"`) with one method `test_every_car()`: `cars = CarView.manifest().get("cars", {})`; `ok(cars.size() >= 8, "manifest has 8 cars")`. One shared `CarView` (instantiated from `res://art/carview.tscn`, `build()` called, freed at the end). For each id (sorted): `ps = load("res://art/cars/%s.glb" % id)` is a PackedScene; `cv.set_car(id)` is true; `classes = cv.surface_classes()`; `ok` that every key of `classes` is one of `CarMats.CLASSES`, `classes.get("paint", 0) >= 1`, `classes.get("tyre", 0) >= 3`; manifest facts: `len_mm` between 2500 and 7000, `bbox_max[0] - bbox_min[0]` between 9.5 and 10.6, `bbox_min[1]` between -0.05 and 1.0, `wheels >= 3`, `game_name` is a non-empty ASCII String (no character code above 126), `paints` has at least 1 entry and each starts with `#` and has 7 characters; after `cv.set_wear(3.0)` and `cv.set_paint(Color("3b4a2f"))` the `paint_materials()` array is not empty. Failure messages include the car id.
2. `test_names()`: the game names in the manifest are unique.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_art_cars` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Test only. If a car fails because of its model, report the id and the failing check in your final reply and finish with `STATUS: BLOCKED`.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA19: Test: every exported car loads with all part classes`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
