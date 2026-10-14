[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU06 UI: speech banner with typewriter reveal

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU06
Needs (already merged into `dev`): GDU01, GDU31, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiBanner`: Dave's big peach speech banner across the top (port of the idea of src/art/banner.js): four peach bands with dithered boundaries, ink outline cut at the corners, a tail pointing at the speaker, text typed out at 40 characters per second.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- src/art/banner.js (read it all: bands, dither rows, outline, tail geometry, typewriter, 4 px grid G)

## Files you may change (and nothing else)
- `godot/ui/banner.gd`
- `godot/tests/test_ui_banner.gd`

## Steps
1. `godot/ui/banner.gd`: `class_name UiBanner`, `extends Control`. Signals `char_revealed(count: int)` and `finished`. Consts `G := 4`, `CHAR_W := 12` (VT323 28 px is monospaced), `LINE_H := 30`, `MAX_LINES := 3`, `CPS := 40.0`, `PEACH := ["#F8DCB8", "#F2C9A0", "#E8B085", "#D99A6C"]` (Strings; use `Color(PEACH[i])`). Vars: `full_text: String`, `lines: Array[String]`, `tail_x: float = -1.0`, `_reveal: float`, `_done: bool = true`, `_t: float`. `_init`: `size = Vector2(1232, 112)`, `mouse_filter = MOUSE_FILTER_IGNORE`.
2. `func max_chars() -> int: return maxi(1, int(floor((size.x - 6.0 * G) / CHAR_W)))`. `func say(text: String, tail: float = -1.0) -> void`: `full_text = text.to_upper()`, `tail_x = tail`, `lines = UiText.wrap(full_text, max_chars(), MAX_LINES)`, `_reveal = 0.0`, `_done = (total_chars() == 0)`, `queue_redraw()`. `func total_chars() -> int`: sum of `lines[i].length()`. `func visible_chars() -> int: return mini(int(floor(_reveal)), total_chars())`. `func advance(dt: float) -> void`: `_t += dt`; if not done: `var before := visible_chars()`; `_reveal += CPS * dt`; if `visible_chars() != before` emit `char_revealed(visible_chars())`; if `visible_chars() >= total_chars()` set `_done = true` and emit `finished` (once). `queue_redraw()`. `_process(dt)` calls `advance(dt)`. `func skip() -> void`: if not done, `_reveal = float(total_chars())`, `_done = true`, emit `char_revealed(total_chars())` then `finished`; `queue_redraw()`. `func is_done() -> bool: return _done`. `func clear() -> void`: `full_text = ""; lines = []; _done = true`.
3. `static func tail_bx(tail: float, w: float) -> int`: `var bx := int(round(tail / G)) * G - 16`; clamp to `[4 * G, int(w) - 7 * G]` and return (the tail's left x). For `tail < 0` the caller passes `size.x / 2.0`. Examples: `tail_bx(100.0, 1232.0) == 84`, `tail_bx(-500.0, 1232.0) == 16`, `tail_bx(5000.0, 1232.0) == 1204`.
4. `_draw()` (all with `draw_rect`, port of banner.js in this order; bandH = `size.y / 4`): (1) shadow `Rect2(G, G, size.x, size.y)` colour black alpha 0.35; (2) four band rects, band i filled with `Color(PEACH[i])`; then for boundary i in 0..2 at `y = (i + 1) * bandH` a row of G x G squares at every `2 * G` step along x, colour `PEACH[i]` when `(j + i) % 2 == 0` else `PEACH[i + 1]` (j = square index); (3) ink outline (colour "ink"), G thick: top and bottom `Rect2(G, 0, size.x - 2G, G)` / `Rect2(G, size.y - G, size.x - 2G, G)`, left and right `Rect2(0, G, G, size.y - 2G)` / `Rect2(size.x - G, G, G, size.y - 2G)`, plus the four inner corner squares at `(G, G)`, `(size.x - 2G, G)`, `(G, size.y - 2G)`, `(size.x - 2G, size.y - 2G)`; (4) the tail: `bx = tail_bx(tail_x if tail_x >= 0.0 else size.x / 2.0, size.x)`, for i in 0..4: `y = size.y + i * G`; fill `Rect2(bx + i * G, y, (5 - i) * G, G)` with `PEACH[3]`, then ink squares at `(bx + i * G, y)` and `(bx + 4 * G, y)` (each G x G); (5) the text: for each line k draw `lines[k].substr(0, remaining)` with `UiTheme.draw_text(self, ..., Vector2(3 * G, 3 * G + k * LINE_H), "body", UiTheme.color("ink"))` where `remaining` starts at `visible_chars()` and drops by each line's length; (6) while not done and `int(_t * 4.0) % 2 == 0`: a `2G x 2G` ink square as a cursor at the end of the last drawn line (x = `3 * G + CHAR_W * shown_length`).
5. `godot/tests/test_ui_banner.gd`: `test_tail`: the three examples above. `test_say_reveal`: `var b := UiBanner.new()`; connect `finished` and `char_revealed` into counters; `b.say("hello world")`; `b.full_text == "HELLO WORLD"`, `b.lines == ["HELLO WORLD"]`, `total_chars() == 11`, `visible_chars() == 0`, `is_done()` false; `advance(0.125)` (= 5 characters) -> `visible_chars() == 5`, the FIRST `char_revealed` value recorded is 5; `advance(10.0)` -> `visible_chars() == 11`, `is_done()`, `finished` count exactly 1; another `advance(1.0)` leaves finished at 1. `test_skip`: `say("abc")`, `skip()` -> done, `visible_chars() == 3`, finished 1; `skip()` again leaves finished at 1. `test_wrap_three_lines`: `b.size = Vector2(200, 112)` (max_chars = floor((200 - 24) / 12) = 14); `say("one two three four five six seven eight nine ten")`: `lines == ["ONE TWO THREE", "FOUR FIVE SIX", "SEVEN EIGHT..."]` (the text is too long for 3 lines, so the last kept line gets the dots). `test_empty`: `say("")` is done immediately with `total_chars() == 0`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_banner` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU06: UI: speech banner with typewriter reveal`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
