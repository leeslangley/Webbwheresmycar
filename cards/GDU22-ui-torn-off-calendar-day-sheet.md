[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU22 UI: torn-off calendar day sheet

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU22
Needs (already merged into `dev`): GDU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiCalendarSheet`: the torn-off wall-calendar sheet of the bottom HUD (weekday + month on a red band, big day-of-month number, tiny DAY n line). When the day changes the old sheet is torn off and flutters away (0.35 s).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- src/art/calendar.js (day 1 of the year is a MONDAY: weekday of day d is (d - 1) % 7; 365-day year, no leap years)
- src/core/clock.js (MONTH_LENGTHS)

## Files you may change (and nothing else)
- `godot/ui/calendar_sheet.gd`
- `godot/tests/test_ui_calendar.gd`

## Steps
1. `godot/ui/calendar_sheet.gd`: `class_name UiCalendarSheet`, `extends Control`. Consts `MONTH_LENGTHS: Array[int] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]`, `MONTHS: Array[String] = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]`, `WEEKDAYS: Array[String] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]`, `TEAR := 0.35`. `static func date_parts(day: int) -> Dictionary`: clamp `day` to 1..365; walk the months to find `month` (1..12) and `dom` (day of month); `weekday = (day - 1) % 7` (0 = MON). Return `{"month": m, "dom": d, "weekday": w}`.
2. Vars `day: int = 1`, `_prev_day: int = 0`, `_tear: float = 1.0` (1 = finished). `_init`: `size = Vector2(130, 114)`, `mouse_filter = MOUSE_FILTER_IGNORE`. `func set_day(d: int, animate: bool = true) -> void`: clamp to 1..365; if `d == day` do nothing; `_prev_day = day`; `day = d`; `_tear = 0.0 if animate else 1.0`; `queue_redraw()`. `func advance(dt: float) -> void`: if `_tear < 1.0`: `_tear = minf(1.0, _tear + dt / TEAR)`; `queue_redraw()`. `_process(dt)` calls `advance(dt)`. `func tear_progress() -> float: return _tear`. `func label_for(d: int) -> String`: `"%s %s" % [WEEKDAYS[p.weekday], MONTHS[p.month - 1]]`, e.g. "MON JAN". `func number_for(d: int) -> String`: `str(p.dom)`.
3. `_draw()`: first the sheet underneath for the current `day` at offset (0, 0) via a private `_sheet(offset: Vector2, d: int, alpha: float)`; then, while `_tear < 1.0`, the previous sheet via `_sheet(Vector2(70.0 * _tear, 50.0 * _tear), _prev_day, 1.0 - _tear)`. `_sheet`: paper box `UiTheme.draw_box(self, Rect2(offset, Vector2(130, 114)), paper (alpha applied), ink, 4, false)`; a jagged torn top edge: for k in 0..12 a 4 px ink triangle-ish step `draw_rect(Rect2(offset.x + k * 10.0, offset.y + (k % 2) * 4.0, 10.0, 4.0), ink)`; a red band `Rect2(offset + Vector2(4, 12), Vector2(122, 28))` in "enamelRed" with `label_for(d)` centred (role "h3", colour "white"); the big day number centred below with role "number" (48 px) colour "ink" at `offset + Vector2(0, 48)`, width 130; and `"DAY %d" % d` at the bottom with role "caption" colour "midgrey" centred at `offset + Vector2(0, 92)`.
4. `godot/tests/test_ui_calendar.gd`: `test_date_parts`: `date_parts(1) == {"month": 1, "dom": 1, "weekday": 0}`; `date_parts(31)` is month 1, dom 31, weekday 2; `date_parts(32)` is month 2, dom 1, weekday 3; `date_parts(59)` is month 2 dom 28; `date_parts(60)` is month 3, dom 1, weekday 3; `date_parts(365)` is month 12, dom 31, weekday 0; `date_parts(0)` equals `date_parts(1)`; `date_parts(400)` equals `date_parts(365)`. `test_labels`: `label_for(1) == "MON JAN"`, `label_for(32) == "THU FEB"`, `number_for(60) == "1"`, `number_for(365) == "31"`. `test_tear`: a new sheet `s`; `s.set_day(2, false)`: `day == 2`, `tear_progress() == 1.0`; `s.set_day(3, true)`: progress 0.0; `advance(0.175)` -> near 0.5; `advance(1.0)` -> 1.0; `set_day(3)` again (same day) does not restart the tear. `test_clamp`: `set_day(999, false)` gives `day == 365`; `set_day(-4, false)` gives 1.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_calendar` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU22: UI: torn-off calendar day sheet`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
