[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA06 CarPortrait: real implementation on CarView

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA06
Needs (already merged into `dev`): GDA03, GDU19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Card GDU19 made a placeholder `CarPortrait` (HUD selected-car slot, diary thumbnails) with the API `set_car(id, paint, wear)`. Replace the placeholder's drawing with a real `CarView` showing the car's front (HUD face) or mini view, behind the SAME public API.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- Find the placeholder: `grep -rl "class_name CarPortrait" godot/` (expected `godot/ui/car_portrait.gd`; if it lives elsewhere edit that file and say so) and read it fully: keep every public func, signal and var it has
- godot/art/carview.gd (GDA03 API: set_car, set_paint, set_wear, set_view, get_texture)
- docs/art/CARS_ALIGN.md: front = HUD face, mini = diary thumbnail
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `godot/ui/car_portrait.gd`
- `godot/tests/test_car_portrait_art.gd`

## Steps
1. Keep the class (`class_name CarPortrait`, same base class). Add `var view_name := "front"`, `var _cv: CarView`. `func set_car(id: String, paint, wear: float = 0.0) -> bool`: `paint` may be a Color or a String like `#c96f32` (`var c: Color = paint if paint is Color else Color(String(paint))`). Lazily create the child on first use (`_ensure_view()`: `_cv = preload("res://art/carview.tscn").instantiate() as CarView`, `_cv.name = "View"`, `add_child(_cv)`, `_cv.build()`, `_cv.set_view(view_name)`, anchors full rect, `mouse_filter = Control.MOUSE_FILTER_IGNORE`). Then `_cv.set_car(id)`, `_cv.set_paint(c)`, `_cv.set_wear(wear)`; return the result of `set_car`. When the id is unknown (false), hide `View` and fall back to what the placeholder drew for an empty slot.
2. Add `func set_portrait_view(v: String) -> bool` (forwards to `_cv.set_view(v)` and stores `view_name`; use `"mini"` for diary thumbnails) and `func get_view() -> CarView` (the child or null). Remove the placeholder's car-drawing code but keep its frame/background drawing if it had any. If the placeholder only drew a car, nothing else remains.
3. `godot/tests/test_car_portrait_art.gd`: `p = CarPortrait.new()` (or the placeholder's documented way to make one); `p.set_car("t1_chimp", Color("c96f32"), 2.0)` is true; `p.get_view()` is not null, its `car_id` is `t1_chimp`, `view` is `front`, `wear` is 2.0; passing the paint as the String `#3b4a2f` works (the paint materials' `base_color` equals `Color("3b4a2f")`); `p.set_car("nope", Color.WHITE, 0.0)` is false and `get_view().visible` is false; `p.set_portrait_view("mini")` is true and the CarView `view` is `mini`; `p.set_portrait_view("zzz")` is false. Free `p`. All GDU19 tests must still pass.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_portrait_art` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` (everything) still ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Do not change the portrait's public names or signals. No HUD layout changes.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA06: CarPortrait: real implementation on CarView`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
