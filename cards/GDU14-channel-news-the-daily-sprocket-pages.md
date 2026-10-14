[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU14 Channel NEWS: The Daily Sprocket pages

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU14
Needs (already merged into `dev`): GDU12, GDU02, GDU31, GDF07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The NEWS channel (port of src/ui/scenes/news.js): the front page of The Daily Sprocket (masthead, dateline, headline, today's events), the month-end bills page when there is one, and a BACK ISSUES page listing recent headlines. OK / the NEXT button turn the page.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/ui/button.gd (GDU02: `UiButton`: `text`, `kind`, `enabled`, signals `activated` and `blocked`, `handle_event(ev)`, `activate()`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- Channel screens are 640x448 (the SubViewport inside the TV) and are shown at 600x420 on the glass (scale 0.9375), so every interactive control inside a channel is at least 72x72 channel px (72 * 0.9375 = 67.5 stage px, above the 64 px rule).
- src/ui/scenes/news.js (read it all: pages 1 and 2, MAX_EVENTS 6 there; this port shows 5 to fit the small screen, monthReport fields)
- godot/core/format.gd (GDF07: `CoreFormat.money`, `CoreFormat.date_text(day)`)

## Files you may change (and nothing else)
- `godot/tv/news_channel.gd`
- `godot/tv/news_channel.tscn`
- `godot/tests/shots/news_shot.tscn`
- `godot/tests/test_news_channel.gd`

## Steps
1. `godot/tv/news_channel.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tv/news_channel.gd" id="1"]`, blank line, `[node name="NewsChannel" type="Control"]`, then `script = ExtResource("1")`)
2. `godot/tv/news_channel.gd`: `class_name NewsChannel`, `extends ChannelBase`. `_init`: `super()`; `title = "NEWS"`. Vars `page: int = 0`. Static helpers (pure, they take the state): `static func page_kinds(st: Dictionary) -> Array[String]`: `["front", "month", "back"]` when `st.today.monthReport != null` else `["front", "back"]`. `static func front(st: Dictionary) -> Dictionary`: `{"dateline": "DAY %d  -  %s" % [day, CoreFormat.date_text(day)], "headline": UiText.wrap(str(st.today.headline).to_upper(), 36, 3), "events": Array}` where `day = int(st.day)` and `events` is the first 5 of `st.today.events`, each `UiText.ellipsize(str(e), 48)`, and a 6th entry `"...and more"` when there were more than 5. (Use `int(st.get("day", 1))`; the dateline uses `date_text` only when day is 1..365, else "YEAR END".) `static func month_lines(report: Dictionary) -> Array[String]`: `"Rent " + CoreFormat.money(report.rent)`, `"Running costs " + CoreFormat.money(report.running)`, `"Garage lease " + CoreFormat.money(report.lease)`, `"TOTAL " + CoreFormat.money(report.total)`, `"Cash now " + CoreFormat.money(report.cashAfter)`, followed by one `"Fault: " + f` (ellipsized to 40) per entry of `report.newFaults` (at most 4).
3. Navigation: `func kinds() -> Array[String]: return NewsChannel.page_kinds(state())`. `func kind() -> String: return kinds()[clampi(page, 0, kinds().size() - 1)]`. `func next_page() -> void: page = (page + 1) % kinds().size(); queue_redraw()`. `func on_ok() -> void: next_page()`. `func on_back() -> bool`: if `page > 0` { `page = 0`; `queue_redraw()`; return true }; return false. `func _on_enter() -> void: page = 0`. `func refresh() -> void`: `page = mini(page, kinds().size() - 1)`; `queue_redraw()` (a new day returns to the front page: when `int(state().day)` differs from `_last_day` set `page = 0` and update `_last_day`; `_on_enter` also sets `_last_day` to the current day). In `_ready()` create `NextBtn` (a `UiButton`, `text = "NEXT"`, `Vector2(552, 368)`, size `Vector2(80, 72)`) whose `activated` calls `next_page`.
4. `_paint()`: paper sheet `UiTheme.draw_box(self, Rect2(16, 48, 608, 310), UiTheme.color("paper"), UiTheme.color("ink"), 4, true)`. Masthead (all pages) "THE DAILY SPROCKET" centred at y 58 (role "h2", colour "ink", width 640). Page "front": a 3 px ink rule at y 94; dateline (role "caption", colour "darkgrey", centred) at y 100; headline lines at x 32, y 124 + k * 22 (role "h3", colour "ink"); a 2 px ink rule at y 192; "TODAY IN WEBB'S WHEELS:" (role "h3") at y 198; then the events one per line from y 220, pitch 20, each prefixed "* " (role "caption", colour "ink"; a line containing "GOLD NUMBER PLATE" is drawn in "gold"). Page "month": heading "MONTH END: " + `str(report.monthName).to_upper()` (role "h3") at y 100 then the `month_lines` at y 132 + k * 28 (role "caption"; lines starting with "Fault:" in colour "bad"). Page "back": heading "BACK ISSUES" at y 100 and the first 8 entries of `state().headlines`, each `UiText.ellipsize(h, 52)` at y 130 + k * 26 (role "caption", colour "ink"); nothing to show -> "No back issues yet.". At the bottom of the paper, right-aligned, a page marker `"%d/%d" % [page + 1, kinds().size()]` (role "caption", colour "midgrey") at y 330.
5. `godot/tests/shots/news_shot.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tests/shots/channel_shot.gd" id="1"]`, blank line, `[node name="Shot" type="Control"]`, then the lines `layout_mode = 3`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `script = ExtResource("1")`, `metadata/channel = "res://tv/news_channel.tscn"`)
6. `godot/tests/test_news_channel.gd`: pure helpers first (state from `TestFakeGame.sample_state()`): `test_page_kinds`: `page_kinds(st) == ["front", "back"]`; with `st.today.monthReport = {...}` it is `["front", "month", "back"]`. `test_front`: `front(st).dateline == "DAY 12  -  12 January"`; `front(st).headline == ["LOCAL VICAR BUYS ROUND OF TEA"]`; `front(st).events == ["Bought nothing. Lovely.", "Dave found a spanner."]`; with 8 events in `st.today.events` the events list has 6 entries and the last is `"...and more"`; a 100-character event is cut to 48 characters ending in "..."; `day = 400` gives a dateline ending in `YEAR END`. `test_month_lines`: report `{"monthName": "January", "rent": 240, "running": 300, "lease": 400, "total": 940, "cashAfter": 5000, "newFaults": ["Flat tyre"]}`: the lines equal `["Rent " + CoreFormat.money(240), "Running costs " + CoreFormat.money(300), "Garage lease " + CoreFormat.money(400), "TOTAL " + CoreFormat.money(940), "Cash now " + CoreFormat.money(5000), "Fault: Flat tyre"]`. Scene tests (instantiate `res://tv/news_channel.tscn`, add to the tree, `enter(g)`): `test_pages`: `kind() == "front"`; `on_ok()`: "back" (no month report) ; `on_ok()`: wraps to "front"; with a month report in `g.state.today.monthReport` and `g.changed.emit()`: the cycle is front, month, back, front; `on_back()` on page 1 returns true and resets `page` to 0; `on_back()` on page 0 returns false. `test_next_button`: tapping `NextBtn` (press+release inside via `handle_event`) advances the page; `NextBtn.size.y >= 72.0`. `test_new_day_resets_page`: go to page 1; set `g.state.day = 13` and emit `changed`: `page == 0`. Free nodes after each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_news_channel` last line is `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh tests/shots/news_shot.tscn /tmp/news.png 8`, then LOOK at /tmp/news.png with the Read tool and describe in your final reply what you see (is the text readable, does anything overlap or run off the 640x448 screen, are the buttons visible). Fix what is wrong.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU14: Channel NEWS: The Daily Sprocket pages`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
