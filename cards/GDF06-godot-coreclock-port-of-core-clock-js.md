[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF06 Godot: CoreClock (port of core/clock.js)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF06
Needs (already merged into `dev`): GDF04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Exact port of `src/core/clock.js`, the 365-day calendar.

## Read first
- src/core/clock.js (read it all)
- tests/clock.test.mjs
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- godot/tests/golden_util.gd (GDF04): `GoldenUtil.fixture(name) -> Variant` loads godot/tests/golden/<name>.json (whole JSON numbers come back as int, others float); `GoldenUtil.diff(a, b, eps = 1e-9) -> String` is "" when equal (numbers within eps) else a message naming the first difference; `GoldenUtil.same(a, b, eps = 1e-9) -> bool`
- Golden fixtures are made by the JS reference: `sh tools/godot/golden.sh <name>` (GDF04) runs `tools/godot/golden_<name>.mjs` under macOS `jsc -m` and writes `godot/tests/golden/<name>.json`. Run it yourself and commit both files; the JSON is never hand-edited

## Files you may change (and nothing else)
- `godot/core/clock.gd`
- `tools/godot/golden_clock.mjs`
- `godot/tests/golden/clock.json`
- `godot/tests/test_clock.gd`

## Steps
1. `godot/core/clock.gd`: `class_name CoreClock`, `extends RefCounted`, static, typed. Constants: `const MONTH_NAMES: Array[String] = ["January", ... "December"]` (12), `const MONTH_LENGTHS: Array[int] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]`, `const DAYS_IN_YEAR := 365`, `const AUCTION_DAY_OF_MONTH := 24`. A starts table `static func _month_start(m: int) -> int` (1-based day number of the 1st of month `m`: sum of the previous lengths plus 1).
2. Where the JS throws a RangeError the GDScript version returns a sentinel and never errors: `static func valid_day(day: Variant) -> bool` (int or float, whole, 1..365). `static func date_of(day) -> Dictionary` returns `{"month": m, "dayOfMonth": d, "monthName": name}` (keys exactly like the JS) or `{}` when the day is invalid. `static func day_of_year_start(month: int) -> int` (-1 when month is not 1..12). `static func is_month_start(day) -> bool` (false when invalid). `static func is_auction_day(day) -> bool` (false when invalid). `static func days_left_in_month(day) -> int` (`MONTH_LENGTHS[month - 1] - dayOfMonth`; -1 when invalid).
3. `tools/godot/golden_clock.mjs`: emit `{ dates: [[day, month, dayOfMonth, monthName] for day 1..365], monthStarts: [dayOfYearStart(m) for m 1..12], monthStartDays: [days 1..365 where isMonthStart], auctionDays: [days where isAuctionDay], daysLeft: [daysLeftInMonth(day) for day 1..365], constants: {names: MONTH_NAMES, lengths: MONTH_LENGTHS, year: DAYS_IN_YEAR, auction: AUCTION_DAY_OF_MONTH} }` (import everything from `../../src/core/clock.js`).
4. `godot/tests/test_clock.gd`: `test_dates_all_365` (every row of `dates` matches `date_of`), `test_month_starts`, `test_month_start_days`, `test_auction_days` (collect the days where `is_auction_day` is true and compare to `auctionDays`; 12 days), `test_days_left`, `test_constants` (names, lengths, year, auction vs the fixture; lengths sum to 365), `test_out_of_range` (`date_of(0)`, `date_of(366)`, `date_of(1.5)` are `{}`; `valid_day(365)` true; `day_of_year_start(0)` and `(13)` are -1; `is_month_start(0)` false; `days_left_in_month(400)` is -1).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden.sh clock` prints `wrote godot/tests/golden/clock.json`.
- `sh tools/godot/gtest.sh test_clock | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files (other cards own it).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF06: Godot: CoreClock (port of core/clock.js)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
