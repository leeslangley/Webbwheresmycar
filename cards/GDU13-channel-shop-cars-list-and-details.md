[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU13 Channel SHOP: cars list and details

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU13
Needs (already merged into `dev`): GDU12, GDU18, GDU19, GDU02, GDU31, GDF03, GDF07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The SHOP channel (port of src/ui/scenes/tvshop.js, display half): the week's telly listings in a scrolling list on the left, the selected car with portrait, quip and STYLE / UPKEEP / GRIT / CONDITION bars on the right. Buying comes in GDU23.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/ui/list.gd (GDU18: `UiList`)
- godot/ui/car_portrait.gd (GDU19)
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- src/ui/scenes/tvshop.js (read it all: row layout, detail panel, stat bars)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- Channel screens are 640x448 (the SubViewport inside the TV) and are shown at 600x420 on the glass (scale 0.9375), so every interactive control inside a channel is at least 72x72 channel px (72 * 0.9375 = 67.5 stage px, above the 64 px rule).

## Files you may change (and nothing else)
- `godot/tv/shop_channel.gd`
- `godot/tv/shop_channel.tscn`
- `godot/tests/shots/shop_shot.tscn`
- `godot/tests/test_shop_channel.gd`

## Steps
1. `godot/tv/shop_channel.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tv/shop_channel.gd" id="1"]`, blank line, `[node name="ShopChannel" type="Control"]`, then `script = ExtResource("1")`)
2. `godot/tv/shop_channel.gd`: `class_name ShopChannel`, `extends ChannelBase`. `_init`: `super()`; `title = "SHOP"`. Layout consts (channel px): `LIST := Rect2(8, 48, 300, 320)`, `DETAIL := Rect2(316, 48, 316, 320)`. `_ready()` creates `List` (a `UiList`, position/size from `LIST`, `row_h = 72`, `row_painter = _paint_row`) and `Portrait` (a `CarPortrait` at `DETAIL.position`, `size = Vector2(316, 150)`); `List.row_tapped.connect(_on_row)`; `func _on_row(i: int) -> void: _show_selected()`. `func listings() -> Array: return state().get("shop", {}).get("listings", [])`. `func selected_listing() -> Dictionary`: `listings()[List.selected]` when `List.selected` is a valid index, else `{}`. `func refresh() -> void`: `List.set_count(listings().size())`; if `List.selected < 0 and listings().size() > 0` then `List.select(0)`; `_show_selected()`; `queue_redraw()`.
3. `static func wear_for(condition: float) -> int: return CarPortrait.wear_for(condition)`. `func _show_selected() -> void`: `var l := selected_listing()`; `Portrait.clear()` when empty, else `Portrait.set_car(l.modelId, ChannelBase.paint_of(l.modelId), wear_for(float(l.condition)))`; `queue_redraw()`. Row painter `func _paint_row(list: Control, i: int, r: Rect2, sel: bool) -> void` (draws on `list`): `var l: Dictionary = listings()[i]`; `var m := ChannelBase.model_of(l.modelId)`; box `UiTheme.draw_box(list, r.grow(-2), UiTheme.color("paper"), UiTheme.color("ink"), 4, false)`; line 1 name `UiText.ellipsize(m.get("name", l.modelId), 20)` (role "caption", colour "ink") at `r.position + Vector2(14, 8)`; line 2 at `r.position + Vector2(14, 42)`: the tag `"FOR SALE"` / `"TO RENT"` (role "h3", colour "good" for sale, "warn" for rent); price right-aligned at the row's right edge minus 14: `CoreFormat.money(l.price)` plus `"/mo"` for rent (role "caption", colour "ink"; `draw_text(list, text, pos, role, col, width, HORIZONTAL_ALIGNMENT_RIGHT)` with `pos.x = r.position.x` and `width = r.size.x - 14`); when `sel` a 4 px "lamp" outline just inside the row and an `">"` (role "h3") at `r.position + Vector2(2, 24)`.
4. `_paint()` (detail side, in channel coordinates): `var l := selected_listing()`. Empty list: `UiTheme.draw_text(self, "Nothing on the telly.", Vector2(8, 200), "body", cream, 624, CENTER)` and a second line "Try again next week." at y 232. Otherwise: `var m := ChannelBase.model_of(l.modelId)`; name `UiText.ellipsize(str(m.get("name", "")).to_upper(), 19)` at `(DETAIL.x, 204)` role "h3" colour "phosphor"; then up to 3 lines at x = DETAIL.x, y = 226, 250, 274 (pitch 24, role "caption", colour "white"): `UiText.wrap("%d. %s" % [m.year, m.quip], 29, 2)` and, for a rent listing, `"Owner: " + l.owner` ellipsized to 29 as the next line. Stat rows at y = 304 + k*16... use pitch 16: STYLE `m.desirability` colour "good", UPKEEP `m.maintenance` "warn", GRIT `m.reliability` "cyan", CONDITION `l.condition` "cyan"; each row: label (role "caption", colour "cream") at `(DETAIL.x, y - 4)`, a bar `UiTheme.draw_bar(self, Rect2(DETAIL.x + 120, y, 190, 12), value / 10.0, col)`; rows at y = 298, 316, 334, 352 (CONDITION's label text is `"COND " + CoreFormat.one_dp(l.condition)`).
5. `godot/tests/shots/shop_shot.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tests/shots/channel_shot.gd" id="1"]`, blank line, `[node name="Shot" type="Control"]`, then the lines `layout_mode = 3`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `script = ExtResource("1")`, `metadata/channel = "res://tv/shop_channel.tscn"`)
6. `godot/tests/test_shop_channel.gd`: load `res://tv/shop_channel.tscn`, instantiate `c`, add to `tree().root`, `var g := TestFakeGame.new()`, `c.enter(g)`. `test_enter`: `c.get_node("List").count == 3`; `get_node("List").selected == 0`; `get_node("Portrait").get_car_id() == "t1_chimp"`; `selected_listing().listingId == "L1"`; `c.title == "SHOP"`. `test_select`: `get_node("List").select(1, true)`: `selected_listing().listingId == "L2"` and the portrait id is "t1_maurice" and wear is `ShopChannel.wear_for(5.5)` (= 1). `test_empty`: set `g.state.shop.listings = []` then `g.changed.emit()`: list count 0, `selected_listing() == {}`, portrait id "". `test_changed_refreshes`: change `g.state.shop.listings` to just L3 and emit `changed`: list count 1, selected clamps to 0, portrait "t1_cooker". `test_row_painter`: `c.get_node("List").row_painter.is_valid()`. `test_leave`: `c.leave()` disconnects (no error when `g.changed.emit()` follows). Free `c` at the end of each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_shop_channel` last line is `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh tests/shots/shop_shot.tscn /tmp/shop.png 8`, then LOOK at /tmp/shop.png with the Read tool and describe in your final reply what you see (is the text readable, does anything overlap or run off the 640x448 screen, are the buttons visible). Fix what is wrong.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- BUY / RENT buttons (GDU23).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU13: Channel SHOP: cars list and details`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
