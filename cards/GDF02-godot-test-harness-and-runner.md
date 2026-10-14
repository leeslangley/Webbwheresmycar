[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF02 Godot: test harness and runner

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF02
Needs (already merged into `dev`): GDF01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The Godot test framework every later card uses: `harness.gd` (base class with assertions), `runner.gd` (finds and runs test files, prints failures, last line `GDTEST OK` or `GDTEST FAIL`, exit code 0 or 1) and a tiny passing `test_harness.gd`. Also make `gtest.sh` fail when Godot reports script errors.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules) section 'Card rules for Godot cards'
- tools/godot/gtest.sh and tools/godot/_common.sh
- tests/harness.js (the JS harness this mirrors: ok, eq, near, done)

## Files you may change (and nothing else)
- `godot/tests/harness.gd`
- `godot/tests/runner.gd`
- `godot/tests/test_harness.gd`
- `tools/godot/gtest.sh`

## Steps
1. `godot/tests/harness.gd`: `extends RefCounted`, no `class_name`. Public vars: `var failures: Array[String] = []`, `var checks: int = 0`, `var current_test: String = ""`. Methods (all typed): `func before_each() -> void: pass` (tests may override); `func ok(cond: bool, msg: String = "") -> void` (checks += 1; when false append `current_test + ": " + msg` to failures); `func eq(a: Variant, b: Variant, msg: String = "") -> void` (checks += 1; two Arrays or Dictionaries are equal when `JSON.stringify(a, "", true) == JSON.stringify(b, "", true)`; everything else uses `a == b`; on mismatch append `current_test: msg: expected <b> got <a>` using `str()` of both); `func near(a: float, b: float, eps: float = 1e-9, msg: String = "") -> void` (fail when `absf(a - b) > eps`, message includes both numbers); `func fail(msg: String) -> void` (always a failure); `func autoload(autoload_name: String) -> Node`: return `Engine.get_main_loop().root.get_node_or_null(autoload_name)` if it is not null, otherwise `load("res://autoload/" + autoload_name.to_lower() + ".gd").new()` (a fresh instance not added to the tree); `func tree() -> SceneTree: return Engine.get_main_loop() as SceneTree`.
2. `godot/tests/runner.gd`: `extends SceneTree`; all work happens in `func _initialize() -> void`. (1) `var args := OS.get_cmdline_user_args()` (the words after `--`). (2) Stems: if args is empty, list `res://tests` with `DirAccess.get_files_at("res://tests")` and keep names that start with `test_` and end with `.gd`, sorted; otherwise each arg is a stem, with `test_` prepended when it does not already start with `test_` and `.gd` appended. (3) For every file: `var sc = load("res://tests/" + file)`; if it is null or `sc.can_instantiate()` is false print `FAIL <file>: could not load or parse` and count a failure. Else `var t = sc.new()`, collect the methods with `t.get_method_list()` whose `name` begins with `test_`, sort by name, and for each: `t.current_test = name; t.before_each(); t.call(name)`; a test that ran but made no new checks (`t.checks` unchanged) is a failure `<name>: made no checks`. (4) After a file print `PASS <file> (<n> checks)` or `FAIL <file>` followed by one line per failure indented two spaces. (5) At the end print `GDTEST OK` and `quit(0)` when there were no failures and at least one test ran, otherwise print `GDTEST FAIL` and `quit(1)` (zero tests run is a failure). `GDTEST OK` / `GDTEST FAIL` must be the LAST printed line.
3. `godot/tests/test_harness.gd`: `extends "res://tests/harness.gd"`. `test_ok_and_eq`: ok(true), eq(1, 1), eq([1, 2], [1, 2]), eq({"a": 1}, {"a": 1}), eq("x", "x"). `test_near`: near(0.1 + 0.2, 0.3, 1e-9). `test_failure_is_recorded`: `var before := failures.size()`, call `ok(false, "x")`, then `var grew: bool = failures.size() == before + 1`, `failures.pop_back()`, `checks` stays, then `ok(grew, "a failing ok() adds one failure")`; do the same for `eq(1, 2, "y")` and `near(1.0, 2.0, 1e-9, "z")`. `test_autoload_helper`: `ok(autoload("Game") != null, "Game stub reachable")`, `ok(tree() != null, "tree")`.
4. Edit `tools/godot/gtest.sh` so script errors cannot slip through (Godot keeps running after a runtime error inside a test): capture the ssh output in a variable (`OUT=$(ssh ... 2>&1); RC=$?`, keep the existing ssh command and the `grep -v` filter on the printed text), print it, then `if printf '%s\n' "$OUT" | grep -q -E 'SCRIPT ERROR|Parse Error'; then echo 'GDTEST FAIL (script errors above)'; exit 1; fi; exit $RC`. `gshot.sh` is not touched.
5. Make the negative check yourself (it is in the acceptance list) and delete the temporary failing test file afterwards.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_harness | tail -3` shows a `PASS test_harness.gd` line and ends with `GDTEST OK`.
- `printf 'extends "res://tests/harness.gd"\nfunc test_bad():\n\tok(false, "boom")\n' > godot/tests/test_zz_fail.gd; sh tools/godot/gtest.sh zz_fail > /tmp/gdf02.txt; echo "exit=$?"; tail -1 /tmp/gdf02.txt; rm godot/tests/test_zz_fail.gd` prints `exit=1` and `GDTEST FAIL`.
- `printf 'extends "res://tests/harness.gd"\nfunc test_err():\n\tvar n = null\n\tn.foo()\n\tok(true, "after")\n' > godot/tests/test_zz_err.gd; sh tools/godot/gtest.sh zz_err > /tmp/gdf02.txt; echo "exit=$?"; tail -1 /tmp/gdf02.txt; rm godot/tests/test_zz_err.gd` prints `exit=1` and a last line starting `GDTEST FAIL`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Tests for game code. Scene tests (GDF11 shows how). gshot.sh.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF02: Godot: test harness and runner`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
