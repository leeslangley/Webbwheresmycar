[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR10 Loading scene: segment bar, road and car marker

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR10
Needs (already merged into `dev`): GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The loading screen (port of src/ui/scenes/loading.js): night sky, title text, a 20-segment progress bar, a road with a scrolling dashed centre line and a small car that drives along it as the progress marker, a REVVING UP... status line. It requests the resources in `preload_paths` with threaded loading, never blocks for more than 8 seconds, shows for at least 0.6 s once ready, and leaves at once when there is nothing to load. Emits `finished` exactly once.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/loading.js (the whole file: constants, leave rule)

## Files you may change (and nothing else)
- `godot/scenes/loading.tscn`
- `godot/scenes/loading.gd`
- `godot/tests/test_loading_scene.gd`

## Steps
1. `godot/scenes/loading.gd`: `class_name LoadingRoom`, `extends RoomBase`. `signal finished`. Constants `SEG_COUNT := 20`, `SEG_W := 28.0`, `SEG_GAP := 4.0`, `SEG_Y := 486.0`, `ROAD := Rect2(340, 520, 600, 28)`, `MIN_SHOW := 0.6`, `MAX_SHOW := 8.0`, `DASH_SPEED := 90.0`. Members `var preload_paths: PackedStringArray = []`, `var progress_fn: Callable = Callable()` (tests inject `{"done": int, "total": int, "ready": bool}`), `var elapsed := 0.0`, `var went := false`. `loading.tscn` = one `Control` named `Loading` with the script (write by hand).
2. `_ready()`: `build_layers()`; `strip_color = Color("14102A")`. BACKGROUND placeholder: `Sky` `Polygon2D` rectangle (0,0)-(1280,720) with `vertex_colors` ink `#14102A` at the top two corners and blue `#352879` at the bottom two. UI: `Title` label (centred, width 1280, y 220, title 40, cream, text `WEBB, WHERE'S MY CAR?`), `Sub` (y 290, body 26, `#959595`, text `A WEBB'S WHEELS PRODUCTION`), `Status` (y 590, body 28, cream, centred), 20 boxes `Seg0`..`Seg19` of 28x16 at `x = (1280 - (20 * 28 + 19 * 4)) / 2 + i * 32` (= 322 + i * 32), y 486, colour dark `Color("14102A").lightened(0.2)`; a `Control` `RoadClip` (position = ROAD.position, size = ROAD.size, `clip_contents = true`) containing a box `Road` (0,0,600,28 `#444444`) and 16 dashes `Dash0`..`Dash15` (24x4 `#B8C76F`, local y 12); a `Node2D` `Car` (Props placeholder) with `Body` box Rect2(-30, -20, 60, 24) `#C8102E` and two wheel circles (radius 7 at (-15, 6) and (15, 6)).
3. `func begin()`: `for p in preload_paths: ResourceLoader.load_threaded_request(p)`; `_ready` calls it. `func progress() -> Dictionary`: `progress_fn.call()` if valid, else count `ResourceLoader.load_threaded_get_status(p)` results that are not `THREAD_LOAD_IN_PROGRESS` as done: `{"done": d, "total": n, "ready": d == n}`. `func tick(delta: float) -> void` (`_process` calls it): `elapsed += delta`; `p = progress()`; `frac = 1.0 if p.ready else (clampf(float(p.done) / p.total, 0.0, 1.0) if p.total > 0 else 0.0)`; segments `lit = floori(frac * 20.0)`: `Seg i` colour `Color("3FAE49")` for `i < lit`, else the dark colour; `Car.position = Vector2(ROAD.position.x + frac * ROAD.size.x, 508.0)`; dash `k` local x = `k * 40.0 - fposmod(elapsed * DASH_SPEED, 40.0)`; `Status.text` = "STILL REVVING - GOING ANYWAY" when `elapsed >= MAX_SHOW and not p.ready`, else "REVVING UP" + "." repeated `int(floor(elapsed * 3.0)) % 4` times. Leave rule: `leave = p.total == 0 or (p.ready and elapsed >= MIN_SHOW) or elapsed >= MAX_SHOW`; if `leave and not went`: `went = true; finished.emit()`.
4. `godot/tests/test_loading_scene.gd`: instantiate with `preload_paths` empty, add to the tree; `tick(0.0)` emits `finished` once and a second `tick(0.1)` does not emit again. With `progress_fn = func(): return {"done": 5, "total": 20, "ready": false}` (set BEFORE adding to the tree, `went` false): `tick(0.1)` -> `Seg0..Seg4` colour `Color("3FAE49")`, `Seg5` not, `Car.position.x == 340 + 0.25 * 600` (490), `Status.text == "REVVING UP"`, no `finished`; `tick(0.3)` (elapsed 0.4) -> `Status.text == "REVVING UP."`; set `progress_fn` to ready true (done 20, total 20) and `tick(0.1)` (elapsed 0.5): still no `finished` (below MIN_SHOW), then `tick(0.2)` -> `finished` fired; all 20 segments green and `Car.position.x == 940`. Timeout: a never-ready `progress_fn` and `tick(8.0)` -> `finished` fired and `Status.text == "STILL REVVING - GOING ANYWAY"`. Dashes: after `tick(0.0)` (elapsed 0) `Dash0.position.x == 0`; in a fresh instance after `tick(0.5)` (`fposmod(45.0, 40.0) == 5`) `Dash0.position.x == -5` and `Dash1.position.x == 35` (use a never-ready `progress_fn` so the scene does not matter). Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_loading_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/loading.tscn /tmp/gdr10_loading.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Which resources get preloaded (the Flow passes none for now).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR10: Loading scene: segment bar, road and car marker`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
