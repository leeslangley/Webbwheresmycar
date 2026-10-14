[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU07 UI: bottom HUD strip (UiHud)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU07
Needs (already merged into `dev`): GDU05, GDU19, GDU21, GDU22, GDU29, GDF10, GDF03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiHud`: the permanent bottom strip (stage y 590-720, 1280x130): four Gold Number Plate slots, CASH bar, selected-car portrait, torn-off calendar day, small sales chart, REP and BUZZ bars. It only READS the game state.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/ui/plate_row.gd, cash_bar.gd, calendar_sheet.gd, sales_chart.gd, cash_history.gd, car_portrait.gd (GDU21, GDU22, GDU29, GDU19)
- docs/art/RSAMH_STYLE.md section 3 and src/art/hud.js (rep/buzz bars)
- godot/autoload/game.gd (GDF10: signals `changed`, `day_advanced`; `Game.state`)

## Files you may change (and nothing else)
- `godot/ui/hud.gd`
- `godot/tests/test_ui_hud.gd`

## Steps
1. `godot/ui/hud.gd`: `class_name UiHud`, `extends Control`. Signals `plate_tapped(key: String)`. `_init`: `size = Vector2(1280, 130)`, `mouse_filter = MOUSE_FILTER_PASS`. `func _ready() -> void: build()`. `func build() -> void` (idempotent: return at once when a child named "Plates" exists) creates children with these names and rects (local coordinates): `Plates` UiPlateRow at (24, 6) size (280, 64); `Cash` UiCashBar at (24, 78) size (280, 44); `Portrait` CarPortrait at (324, 8) size (300, 114); `Calendar` UiCalendarSheet at (640, 8) size (130, 114); `Chart` UiSalesChart at (786, 8) size (320, 114). Connect `Plates.plate_tapped` to re-emit `plate_tapped`.
2. State: `var _game: Object = null`, `var _rep: float`, `var _buzz: float`, `var _selected_id: String = ""`. `func bind(game: Object) -> void`: store it; `game.changed.connect(_on_changed)` (if not already connected); `refresh(game.state)`. `func _on_changed() -> void: refresh(_game.state)`. `func set_selected_car(car_id: String) -> void: _selected_id = car_id; if _game != null: refresh(_game.state)`. `func refresh(state: Dictionary) -> void`: `build()`; `Plates.set_plates(state.get("plates", {}))`; `var cash := float(state.get("cash", 0))`; `Cash.set_cash(cash)`; `var day := int(state.get("day", 1))`; `Calendar.set_day(day)`; `UiCashHistory.record(day, cash)`; `Chart.set_values(UiCashHistory.values(14))`; `_rep = float(state.get("reputation", 0))`; `_buzz = float(state.get("buzz", 0))`; the portrait car: pick the car in `state.get("cars", [])` whose `id == _selected_id`, else the first car with `owned == true`, else the first car, else none; `Portrait.set_car(car.modelId, Color(Data.paint_of(car.modelId)), CarPortrait.wear_for(float(car.condition)))` or `Portrait.clear()`. `queue_redraw()`.
3. `_draw()`: background `draw_rect(Rect2(Vector2.ZERO, size), UiTheme.color("hudBg"))`, a 4 px "hudEdge" line along the top. REP and BUZZ at x = 1122: `UiTheme.draw_text(self, "REP %d" % int(round(_rep)), Vector2(1122, 12), "h3", UiTheme.color("white"))` and a bar `UiTheme.draw_bar(self, Rect2(1122, 36, 134, 14), _rep / 100.0, UiTheme.color("good"))`; the same for "BUZZ %d" at y = 62 with the bar at y = 86 using colour "warn". Public helper `func portrait_car_id() -> String: return $Portrait.get_car_id()` (use `get_node("Portrait")`).
4. `godot/tests/test_ui_hud.gd` builds its own state inline (it does not use TestFakeGame): `{"day": 3, "cash": 5000, "reputation": 40, "buzz": 12, "plates": {"fatcat": true, "stable": false, "household": false, "hammer": false}, "cars": [{"id": "c1", "modelId": "t1_allergy", "owned": false, "condition": 5.0}, {"id": "c2", "modelId": "t1_robbin", "owned": true, "condition": 10.0}]}`. `test_layout`: `UiHud.new()` added to `tree().root`; `size == Vector2(1280, 130)`; children `Plates`, `Cash`, `Portrait`, `Calendar`, `Chart` exist (`get_node_or_null` not null) with positions (24, 6), (24, 78), (324, 8), (640, 8), (786, 8); free it. `test_refresh`: `UiCashHistory.reset()`; `h.refresh(state)`: `get_node("Plates").is_won("fatcat")` true; `get_node("Calendar").day == 3`; `get_node("Cash").cash == 5000.0`; the portrait shows the first OWNED car: `portrait_car_id() == "t1_robbin"`; `get_node("Portrait").get_wear() == 0`; `UiCashHistory.count() == 1`; `get_node("Chart").values == [5000.0]`. `test_selected_car`: `set_selected_car("c1")` then `refresh(state)`: `portrait_car_id() == "t1_allergy"` and wear 2 (condition 5.0). `test_no_cars`: a state with `"cars": []` gives `portrait_car_id() == ""`. `test_bind`: define in the test file a tiny inner helper class? Not needed: build a `Node` with a script from source: `var s := GDScript.new(); s.source_code = "extends Node\nsignal changed\nvar state := {}\n"; s.reload(); var g := Node.new(); g.set_script(s); g.state = state`; `h.bind(g)` refreshes immediately (`get_node("Calendar").day == 3`); change `g.state = {"day": 4, "cash": 1.0}` and `g.changed.emit()`: calendar day 4; free `g` and `h`. End each test with `UiCashHistory.reset()`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_hud` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU07: UI: bottom HUD strip (UiHud)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
