[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF04 Godot: golden fixture helper

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF04
Needs (already merged into `dev`): GDF01, GDF02, GDF15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The pattern every port card follows to compare against the JS reference: a jsc script prints JSON, `golden.sh` stores it as a fixture, `GoldenUtil` compares in a Godot test. This card builds the pattern and one documented example.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules) section 'Determinism and parity'
- godot/core/json.gd (GDF15)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- tools/art/export_profiles.mjs (jsc -m script style)

## Files you may change (and nothing else)
- `tools/godot/golden_common.mjs`
- `tools/godot/golden.sh`
- `tools/godot/golden_example.mjs`
- `godot/tests/golden/example.json`
- `godot/tests/golden_util.gd`
- `godot/tests/test_golden_util.gd`

## Steps
1. `tools/godot/golden_common.mjs`: header comment explaining the pattern in 6 lines max. Exports `SEEDS = [0, 1, 42, 12345, 987654321, 4294967295]` and `emit(obj)` which calls `print(JSON.stringify(obj))` exactly once (a fixture is ONE line of JSON). No other exports.
2. `tools/godot/golden_example.mjs`: `import { emit } from './golden_common.mjs';` then `emit({ numbers: [1, 2.5, 0.1 + 0.2, -3], text: 'ok', nested: { list: [true, null, 'x'], empty: {} } });`.
3. `tools/godot/golden.sh <name>` (POSIX sh, `set -eu`, `cd` to the repo root from `$(dirname "$0")/../..`, usage line and exit 2 without an argument; `JSC` defaults to `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`): require `tools/godot/golden_<name>.mjs` to exist (else print `no golden_<name>.mjs` and exit 1); run `"$JSC" -m tools/godot/golden_<name>.mjs` into a `mktemp` file; pipe that file through `python3 -I -c 'import json,sys; print(json.dumps(json.loads(sys.stdin.buffer.read().decode("utf-8")), ensure_ascii=True, separators=(",", ":")))'` into `godot/tests/golden/<name>.json` (this validates the JSON and makes the fixture pure ASCII); print `wrote godot/tests/golden/<name>.json (<bytes> bytes)`. Exit non-zero if jsc or python fails (nothing half-written: write to a temp file, `mv` at the end).
4. `godot/tests/golden_util.gd`: `class_name GoldenUtil`, `extends RefCounted`, all static. `static func fixture(name: String) -> Variant`: `CoreJson.load_file("res://tests/golden/" + name + ".json")`. `static func diff(a: Variant, b: Variant, eps: float = 1e-9, path: String = "$") -> String`: returns "" when equal, else a one-line message starting with the path of the FIRST difference (e.g. `$.cars[3].tier: expected 2 got 3`). Rules: both int or float -> equal when both are int and `a == b`, otherwise when `absf(float(a) - float(b)) <= eps`; both Dictionary -> same set of keys compared as `str(key)` (report `missing key` / `extra key` with the key), then recurse in the key order of `a` using `path + "." + key`; both Array -> same size (report both sizes) then recurse with `path + "[i]"`; both String, both bool, both null -> `==`; any other pairing -> `type mismatch` message with both `typeof` numbers. `static func same(a: Variant, b: Variant, eps: float = 1e-9) -> bool: return diff(a, b, eps) == ""`.
5. `godot/tests/test_golden_util.gd`: `test_diff_rules` (equal ints; int 1 vs float 1.0 equal; 0.30000000000000004 vs 0.3 equal; 0.31 vs 0.3 differs; nested dict/array equal; missing key reported; array size mismatch reported; message for `{"a": [1, 2]}` vs `{"a": [1, 3]}` starts with `$.a[1]`; string vs int is a type mismatch; null equals null). `test_example_fixture`: `GoldenUtil.same(GoldenUtil.fixture("example"), {"numbers": [1, 2.5, 0.30000000000000004, -3], "text": "ok", "nested": {"list": [true, null, "x"], "empty": {}}})` is true.
6. Run `sh tools/godot/golden.sh example` and commit the produced `godot/tests/golden/example.json`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden.sh example` prints `wrote godot/tests/golden/example.json` and `cat godot/tests/golden/example.json` is one line starting `{"numbers":[1,2.5,`.
- `sh tools/godot/golden.sh nosuchname; echo exit=$?` prints `no golden_nosuchname.mjs` and `exit=1`.
- `sh tools/godot/gtest.sh test_golden_util | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files (other cards own it).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF04: Godot: golden fixture helper`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
