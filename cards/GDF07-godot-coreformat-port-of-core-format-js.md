[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF07 Godot: CoreFormat (port of core/format.js)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF07
Needs (already merged into `dev`): GDF04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Exact port of `src/core/format.js`: money, one decimal, dates, stars, plurals. Source files stay ASCII: the pound sign is built with `char(163)`, the stars with `char(9733)` and `char(9734)`.

## Read first
- src/core/format.js (read it all)
- tests/format.test.mjs
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- godot/tests/golden_util.gd (GDF04): `GoldenUtil.fixture(name) -> Variant` loads godot/tests/golden/<name>.json (whole JSON numbers come back as int, others float); `GoldenUtil.diff(a, b, eps = 1e-9) -> String` is "" when equal (numbers within eps) else a message naming the first difference; `GoldenUtil.same(a, b, eps = 1e-9) -> bool`
- Golden fixtures are made by the JS reference: `sh tools/godot/golden.sh <name>` (GDF04) runs `tools/godot/golden_<name>.mjs` under macOS `jsc -m` and writes `godot/tests/golden/<name>.json`. Run it yourself and commit both files; the JSON is never hand-edited

## Files you may change (and nothing else)
- `godot/core/format.gd`
- `tools/godot/golden_format.mjs`
- `godot/tests/golden/format.json`
- `godot/tests/test_format.gd`

## Steps
1. `godot/core/format.gd`: `class_name CoreFormat`, `extends RefCounted`, static, typed. `static func pound() -> String: return char(163)`. `static func _comma_group(digits: String) -> String`: insert a comma before every group of three digits counted from the right (`"1234567"` -> `"1,234,567"`, `"999"` unchanged).
2. `static func money(n: float) -> String`: `var rounded: int = int(floor(n + 0.5))` (JS `Math.round`: halves go UP, so 12.5 -> 13 and -12.5 -> -12); `sign = "-"` when `rounded < 0` else empty; return `sign + pound() + _comma_group(str(absi(rounded)))`. A value that rounds to 0 prints `"" + pound + "0"` (never a minus sign).
3. `static func one_dp(n: float) -> String`: `var s := "%.1f" % (n + 1e-9)`; if `s == "-0.0"` return `"0.0"`; return s.
4. `static func date_text(day: int) -> String`: `"24 February"` style (day number, a space, the month name; February has 28 days; do NOT depend on CoreClock: copy the two small arrays privately as `_MONTH_NAMES` and `_MONTH_LENGTHS`). Returns `""` for a day outside 1..365.
5. `static func stars(n: float) -> String`: `v = clampi(int(floor(n + 0.5)), 0, 10)`; return `char(9733)` repeated `v` times followed by `char(9734)` repeated `10 - v` times (use `.repeat()` on the one-character strings).
6. `static func plural(n: int, one: String, many: String) -> String`: `str(n) + " " + (one if n == 1 else many)`.
7. `tools/godot/golden_format.mjs`: emit `{ money: [[n, money(n)]...], oneDp: [[n, oneDp(n)]...], dateText: [dateText(d) for d 1..365], stars: [[n, stars(n)]...], plural: [[n, one, many, plural(n, one, many)]...] }` with these inputs. money: 1234, 0, 1234567, 12.6, -1234, -0.4, 999, 1000, 12.4, -12.6, 0.4, 1000000000, 0.5, -0.5, 12.5, -12.5, -0.6, 100, 99999.5, 1000000000000. oneDp: 2, 7.46, 0, 7.44, 10, -1.25, 0.05, 0.25, 2.675, -0.04, 99.95. stars: 0, 3.4, 3.5, 7, 10, 11, -2, 4.5. plural: [1,'car','cars'], [0,'car','cars'], [2,'day','days'], [-1,'bill','bills'], [101,'win','wins'].
8. `godot/tests/test_format.gd`: `test_money` (each pair), `test_one_dp`, `test_date_text` (all 365; also `date_text(0)` and `(366)` are `""`), `test_stars` (each pair; also check `stars(3).length() == 10`), `test_plural`, `test_ascii_source`: read `res://core/format.gd` with `FileAccess.get_file_as_string` and check no character has code > 127 (loop over `get_string_from_utf8`/`to_utf8_buffer()` bytes: no byte >= 128), `test_pound_is_one_char`: `CoreFormat.pound().length() == 1` and `unicode_at(0) == 163`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden.sh format` prints `wrote godot/tests/golden/format.json`.
- `grep -nP '[^\x00-\x7F]' godot/core/format.gd` prints nothing.
- `sh tools/godot/gtest.sh test_format | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Fonts (whether the pixel font has the star glyphs is a UI card's problem).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF07: Godot: CoreFormat (port of core/format.js)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
