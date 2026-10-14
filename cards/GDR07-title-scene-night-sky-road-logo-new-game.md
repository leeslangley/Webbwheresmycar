[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR07 Title scene: night sky, road, logo, NEW GAME / CONTINUE / SETTINGS

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR07
Needs (already merged into `dev`): GDR19, GDR25, GDR12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The title screen (port of src/ui/scenes/title.js): night-sky gradient with 40 twinkling stars, a road with a scrolling centre line and a car driving across every 6 seconds (a new colour each time), the bobbing logo WEBB, / WHERE'S MY CAR? / A WEBB'S WHEELS PRODUCTION / Starring Mark Webb, and three buttons. Buttons only emit signals; the Flow decides what happens. No HUD or banner is shown on this screen (the Flow hides them).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/title.js (the whole file: LAYOUT, starAt, dash and car formulas, key handler)
- godot/rooms/save.gd (GDR12: Save.has_save)

## Files you may change (and nothing else)
- `godot/scenes/title.tscn`
- `godot/scenes/title.gd`
- `godot/tests/test_title_scene.gd`

## Steps
1. `godot/scenes/title.gd`: `class_name TitleRoom`, `extends RoomBase`. `signal new_game`, `signal continue_game`, `signal open_settings`. Constants `R_NEW := Rect2(480, 420, 320, 64)`, `R_CONTINUE := Rect2(480, 496, 320, 64)`, `R_SETTINGS := Rect2(480, 572, 320, 64)`, `CAR_COLORS := [Color("9A2A2A"), Color("1C2E5A"), Color("E8B923"), Color("588D43")]`. `var _t := 0.0`. `title.tscn` is one `Control` named `Title` with the script (write by hand).
2. `_ready()`: `build_layers()`; `strip_color = Color("14102A")`. BACKGROUND placeholder: `Sky` = `Polygon2D` with polygon the rectangle (0,0)-(1280,640) and `vertex_colors` `[Color("14102A"), Color("14102A"), Color("352879"), Color("352879")]`; `Road` box Rect2(0,640,1280,80) `#444444`. A `Node2D` named `Stars` (in the Background placeholder) with 40 boxes `Star0`..`Star39` of size 2x2 white at `Vector2((i * 137 + 53) % 1280, (i * 89 + 31) % 600)`. 14 dashes `Dash0`..`Dash13` (boxes 60x8, `#B8C76F`, y 676) in a `Node2D` `Dashes`. A `Node2D` `Car` (in the Props placeholder) with `Body` box Rect2(0,0,200,60) and two wheel `Polygon2D` circles (radius 16 at (45,60) and (155,60), colour black). UI labels (centred, width 1280, x 0): `LogoWebb` y 100, text `WEBB,`, title font 64, lamp `#FFD27A`; `LogoTitle` y 190, text `WHERE'S MY CAR?`, 48, cream `#F4E9C8`; `LogoSub` y 280, text `A WEBB'S WHEELS PRODUCTION`, 30, `#959595`; `LogoStar` y 320, text `Starring Mark Webb`, 28, `#B8C76F` (title font through `add_theme_font_override` for the first two, body font for the others). Buttons via `RoomButton.add_to`: `&"new_game"` R_NEW "NEW GAME" kind "primary"; `&"continue"` R_CONTINUE "CONTINUE"; `&"settings"` R_SETTINGS "SETTINGS". Then `refresh()` and `apply_time(0.0)`.
3. `func refresh()`: `hotspots[&"continue"].enabled = Save.has_save()` (and `set_dimmed(not that)`). `enter(_p)` calls `refresh()`. `_on_hotspot(id)`: new_game -> emit `new_game`; continue -> emit `continue_game`; settings -> emit `open_settings`. `handle_key(keycode) -> bool`: KEY_ENTER or KEY_N emits `new_game`; KEY_C emits `continue_game` only when `Save.has_save()`; KEY_S emits `open_settings`; return true when handled.
4. `func apply_time(t: float) -> void` (public and deterministic; `_process(delta)` does `_t += delta; apply_time(_t)`): star `i` alpha `0.5 + 0.5 * sin(t + i)` (`modulate.a`); dash `k` `position.x = fposmod(k * 100.0 - t * 120.0, 1400.0) - 60.0`; the car's `position = Vector2(-300.0 + (fmod(t, 6.0) / 6.0) * 1900.0, 596.0)` and its Body colour `CAR_COLORS[int(floor(t / 6.0)) % 4]`; the logo bob `b = sin(t * 1.5) * 4.0` moves each logo label to its base y plus `b`.
5. `godot/tests/test_title_scene.gd` (first `Save.path = "user://test_title_save.json"`, `Save.erase()`): instantiate, add to the tree. `Stars` has 40 children, `Star1.position == Vector2(190, 120)`, `Star39.position == Vector2(276, 502)`. Without a save, the continue hotspot `enabled == false`; after `Save.write(FakeGame.sample_state())` and `refresh()` it is true (erase the file at the end). Tapping new_game / settings emits `new_game` / `open_settings`; a tap on a disabled continue emits nothing, an enabled one emits `continue_game`. `apply_time(0.0)`: `Dash0.position.x == -60`, car x -300, `Car/Body.color == Color("9A2A2A")`; `apply_time(1.0)`: `Dash0.position.x == 1220`; `apply_time(3.0)`: car x 650; `apply_time(6.0)`: car x -300 and Body colour `Color("1C2E5A")`; `apply_time(PI / 3.0)` (so `t * 1.5 == PI / 2`): `LogoWebb.position.y` is its base y + 4 (near, eps 0.001). Keys: `handle_key(KEY_ENTER)` true + signal, `handle_key(KEY_Q)` false. All three buttons are >= 64 tall and do not intersect. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_title_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/title.tscn /tmp/gdr07_title.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it. Check: big logo centred, three buttons under it, stars above, road at the bottom.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Starting a game (Flow, GDR30). Real art (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR07: Title scene: night sky, road, logo, NEW GAME / CONTINUE / SETTINGS`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
