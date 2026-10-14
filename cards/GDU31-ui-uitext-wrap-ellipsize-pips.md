[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU31 UI: UiText wrap, ellipsize, pips

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU31
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pure text helpers shared by banner, toasts and channels. Wrapping works on CHARACTER COUNTS (the game fonts are monospaced) so it is testable headless.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`

## Files you may change (and nothing else)
- `godot/ui/ui_text.gd`
- `godot/tests/test_ui_text.gd`

## Steps
1. `godot/ui/ui_text.gd`: `class_name UiText`, `extends RefCounted`, static, typed. `static func wrap(text: String, max_chars: int, max_lines: int = 0) -> Array[String]`: split `text` on single spaces (`text.split(" ", false)`; a `\n` inside the text is replaced by a space first). Greedy: `cur = ""`; for each word: if `cur == ""` then `cur = word` (a word longer than `max_chars` keeps its own line, never broken); elif `cur.length() + 1 + word.length() <= max_chars` then `cur += " " + word`; else push `cur` and `cur = word`. After the loop push `cur` if it is not empty. If `max_lines > 0` and there are more lines than `max_lines`: drop the extra lines and replace the last kept line `L` by `L.substr(0, max_chars - 3) + "..."` when `L.length() + 3 > max_chars`, else `L + "..."` (an overflow always ends with three dots, and the last line is never longer than `max_chars` unless it is a single long word).
2. `static func ellipsize(text: String, max_chars: int) -> String`: return `text` when `text.length() <= max_chars`; when `max_chars <= 3` return `text.substr(0, max_chars)`; else `text.substr(0, max_chars - 3) + "..."`. `static func pips(n: int, total: int = 10) -> String`: `n` clamped to 0..total; `"*".repeat(n) + "-".repeat(total - n)` (ASCII stand-in for stars). `static func upper(text: String) -> String`: `text.to_upper()`. `static func lines_height(count: int, pitch: int) -> int`: `count * pitch`.
3. `godot/tests/test_ui_text.gd`: `test_wrap_basic`: `UiText.wrap("ONE TWO THREE FOUR", 9, 3)` equals `["ONE TWO", "THREE", "FOUR"]`; `wrap("", 10, 3)` equals `[]`; `wrap("HELLO", 3, 3)` equals `["HELLO"]` (long word kept); `wrap("AAAA BBBB CCCC DDDD", 4, 3)` equals `["AAAA", "BBBB", "C..."]`; `wrap("AA BB CC", 5, 0)` equals `["AA BB", "CC"]`; `wrap("A B C D", 3, 2)` equals `["A B", "C D"]` (exactly two lines, no overflow, no dots). `test_ellipsize`: `ellipsize("HELLO WORLD", 8) == "HELLO..."`, `ellipsize("HELLO", 8) == "HELLO"`, `ellipsize("HELLO", 3) == "HEL"`, `ellipsize("HELLO", 5) == "HELLO"`. `test_pips`: `pips(3) == "***-------"`, `pips(0) == "----------"`, `pips(12) == "**********"`, `pips(-1) == "----------"`, `pips(2, 4) == "**--"`. `test_upper_height`: `upper("ab") == "AB"`, `lines_height(3, 30) == 90`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_text` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU31: UI: UiText wrap, ellipsize, pips`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
