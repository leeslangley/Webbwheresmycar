[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR20 RoomMenu: pop-up menu with arrow cursor

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR20
Needs (already merged into `dev`): GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The Rock Star Ate My Hamster style pop-up menu: a small paper box with a vertical list of captions and a bobbing arrow cursor, every row at least 64 px tall (touch), plus keyboard Up/Down/Enter. Used by the office (GARAGE, AUCTION, NEXT DAY, SETTINGS).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- docs/art/RSAMH_STYLE.md section 'The grammar' point 4 (in-scene pop-up menu with an arrow cursor)
- godot/rooms/hotspot.gd (GDR18) and godot/rooms/room_base.gd (GDR19)

## Files you may change (and nothing else)
- `godot/rooms/room_menu.gd`
- `godot/tests/test_room_menu.gd`

## Steps
1. `godot/rooms/room_menu.gd`: `class_name RoomMenu`, `extends Control`. `signal chosen(item_id: StringName)`. Constants `ITEM_H := 64`, `ITEM_GAP := 8`, `PAD := 8`. Members `var items: Array = []` (each `{"id": StringName, "label": String, "enabled": bool}`), `var cursor := 0`.
2. `func setup(new_items: Array, width := 200.0) -> void`: free old children, `items` = a copy where `id` is converted with `StringName(...)` and a missing `enabled` becomes true, `cursor = 0`, `size = Vector2(width, PAD * 2 + n * ITEM_H + (n - 1) * ITEM_GAP)` (n = number of items), `mouse_filter = Control.MOUSE_FILTER_IGNORE`. For each item add a `RoomHotspot` child via `RoomHotspot.make(id, item_rect(id))` named exactly `"Item_" + id`; connect its `tapped` to `_on_item_tapped` (sets `cursor` to that index and emits `chosen(id)`). Disabled items get `hs.enabled = false`.
3. `func item_rect(item_id: StringName) -> Rect2` (local coordinates): `Rect2(PAD, PAD + i * (ITEM_H + ITEM_GAP), size.x - 2 * PAD, ITEM_H)` for the item's index `i`. `func set_item_enabled(item_id: StringName, on: bool)` and `func set_item_label(item_id: StringName, text: String)` update `items` and the hotspot and call `queue_redraw()`. `func move_cursor(delta: int) -> void`: move to the next ENABLED item in that direction, wrapping round (no change when no item is enabled). `func activate_cursor() -> void`: emit `chosen` for `items[cursor]` when it is enabled. `func handle_key(keycode: int) -> bool`: KEY_UP -> `move_cursor(-1)`, KEY_DOWN -> `move_cursor(1)`, KEY_ENTER or KEY_KP_ENTER -> `activate_cursor()`; return true when handled. `func _unhandled_key_input(event: InputEvent) -> void`: if `visible` and the event is a pressed `InputEventKey` and `handle_key(event.keycode)` then `get_viewport().set_input_as_handled()`.
4. Drawing (`func _draw()`, and `func _process(_d): queue_redraw()` so the cursor bobs): box = whole rect filled `Color("FFF7DC")` with a 4 px ink border `Color("14102A")`. For each item: if its hotspot `pressed`, fill the row rect `Color("FFD27A")`; the caption is drawn with `RoomBase.pixel_font("title")` at 16 px, x = PAD + 34, baseline y = row.y + 40, colour ink (or `Color("959595")` when disabled). The cursor is an ink triangle `draw_colored_polygon(PackedVector2Array([Vector2(a, y), Vector2(a, y + 24), Vector2(a + 18, y + 12)]), ink)` at row `cursor`, with `a = PAD + 8 + 3.0 * sin(Time.get_ticks_msec() / 150.0)` and `y = row.y + 20`.
5. `godot/tests/test_room_menu.gd`: build `m := RoomMenu.new()` and `m.setup([{"id": "garage", "label": "GARAGE"}, {"id": "auction", "label": "AUCTION"}, {"id": "next_day", "label": "NEXT DAY"}, {"id": "settings", "label": "SETTINGS"}])`. Check: `m.size == Vector2(200, 296)`; `item_rect(&"auction") == Rect2(8, 80, 184, 64)`; children are named `Item_garage` ... `Item_settings`; tapping (`hs.press()` then `hs.release(true)` on `Item_next_day`) emits `chosen` with `&"next_day"` and sets `cursor == 2`; `set_item_enabled(&"auction", false)` makes `Item_auction.enabled` false and tapping it emits nothing; `move_cursor(1)` from 0 goes to 2 (skips the disabled one) and `move_cursor(-1)` goes back to 0, `move_cursor(-1)` again wraps to 3; `handle_key(KEY_ENTER)` at cursor 3 emits `settings`; `handle_key(KEY_A)` returns false; `set_item_label(&"garage", "CAR PARK")` changes `items[0].label`. Free every node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_room_menu` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR20: RoomMenu: pop-up menu with arrow cursor`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
