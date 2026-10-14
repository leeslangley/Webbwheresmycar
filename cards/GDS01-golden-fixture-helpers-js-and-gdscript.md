[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS01 Golden fixture helpers (JS and GDScript)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS01
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The shared machinery of every sim port card: a JS helper module that builds golden test cases from the JS reference, a shell script that turns a golden script into a committed JSON fixture, and a GDScript class `GoldenUtil` that loads fixtures and compares values (ints exact, floats within 1e-9, deep for arrays and dictionaries).

## Read first
- docs/GODOT.md section 'Determinism and parity'
- tests/harness.js and tests/playthrough.test.mjs (how JS tests import src/ and use print() under jsc)
- godot/tests/harness.gd and godot/tests/runner.gd (GDF02: how test files are discovered: methods starting `test_`)
- JSON detail: JS cannot tell 5 from 5.0, and Godot's JSON parser returns EVERY number as float, so GoldenUtil.load_golden converts integral floats back to int; this keeps str(), dictionary keys and `%d` working in the ports.

## Files you may change (and nothing else)
- `tools/godot/golden_sim.mjs`
- `tools/godot/golden_run.sh`
- `tools/godot/golden_selftest.mjs`
- `godot/tests/golden/selftest.json`
- `godot/tests/golden_util.gd`
- `godot/tests/test_golden_util.gd`

## Steps
1. `tools/godot/golden_sim.mjs` (ES module, run by `jsc -m`, imports `startGame` from '../../src/sim/newgame.js' and `newGameState` from '../../src/core/state.js'). Export exactly: `clone(x)` = JSON.parse(JSON.stringify(x)); `fresh(seed)` = startGame(seed); `bare(seed)` = newGameState(seed); `addCar(state, modelId, fields = {})`: builds `Object.assign({ id: 'c' + state.nextId++, modelId: modelId, owned: true, owner: null, rentMonthly: 0, paid: 0, condition: 5, fault: null, lastServiceDay: state.day, jobsDone: 0, boughtDay: state.day, impoundedUntil: 0, rentedAtCondition: null }, fields)`, pushes it onto state.cars and returns it; `pureCase(fn, name, args, result)` returns `{ fn: fn, name: name, args: clone(args), result: result === undefined ? null : clone(result) }`; `stateCase(fn, name, state, args, call)`: `const input = clone(state); const work = clone(state); const a = clone(args); const r = call(work, ...a);` returns `{ fn, name, state: input, args: clone(args), result: r === undefined ? null : clone(r), after: work }`; `sweepSeeds(base, lo, hi, run, classify, perKind = 2)`: for seed lo..hi: `const w = clone(base); w.rng = seed; const r = run(w); const k = classify(w, r);` skip when k === null, else push seed into `found[k]` while that list is shorter than perKind; returns `found` (a plain object kind -> array of seeds); `emitCases(name, cases)`: `print(JSON.stringify({ cases: cases }));`. A header comment explains each export in one line.
2. `tools/godot/golden_selftest.mjs` imports pureCase, stateCase, emitCases and builds 3 cases: `pureCase('add', 'two plus three', [2, 3], 5)`; `stateCase('bump', 'bump a state', { n: 1, list: [1, 2] }, [5], function (s, k) { s.n += k; s.list.push(k); return s.n; })` (result 6, after { n: 6, list: [1, 2, 5] }); `pureCase('float', 'floats and text', [0.1, 0.2], { sum: 0.1 + 0.2, text: 'Price \u00a3 5', flag: true, none: null })`. It ends with `emitCases('selftest', cases);`.
3. `tools/godot/golden_run.sh` (POSIX sh, usage `sh tools/godot/golden_run.sh <name>`): `cd` to the repo root (two levels above the script folder); fail with exit 2 and a usage line when no name is given or tools/godot/golden_<name>.mjs is missing; run `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/godot/golden_<name>.mjs > godot/tests/golden/<name>.json` (create the folder `godot/tests/golden` first; write to a temp file and move it only when jsc exited 0); then check the file is one valid JSON document with `python3 -c "import json,sys;json.load(open(sys.argv[1]))" <file>`; on success print `GOLDEN <name> OK <bytes> bytes` (bytes = `wc -c`) and exit 0, otherwise print `GOLDEN <name> FAIL` and exit 1. Run it for `selftest`.
4. `godot/tests/golden_util.gd`: `class_name GoldenUtil`, `extends RefCounted`, `const EPS := 1e-9`, static functions: `load_golden(name: String) -> Dictionary`: read `res://tests/golden/<name>.json` with FileAccess.get_file_as_string, JSON.parse_string, `intify` the result; on a missing file or parse error `push_error` and return an empty Dictionary. `intify(v: Variant) -> Variant`: recursively copy Arrays and Dictionaries; a float whose value is integral and below 1e15 in magnitude becomes int; everything else is kept. `copy(v: Variant) -> Variant`: `v.duplicate(true)` for Array and Dictionary, else v. `diff(got: Variant, want: Variant, path: String = "$") -> String`: returns "" when equal, else a text naming the FIRST difference found: numbers (int or float, either mix): when both are integral they must be exactly equal, else `absf(a - b) <= EPS`, message `<path>: <got> != <want>`; String, bool and null compare with `==` (a type mismatch, e.g. bool against number, is a difference); Arrays: sizes must match (message `<path>: array size <n> != <m>`), elements are compared in order with path `<path>[<i>]`; Dictionaries: every key of want must exist in got (message `<path>.<key>: missing`) and every key of got must exist in want (message `<path>.<key>: unexpected`), values compared with path `<path>.<key>`. `same(got, want) -> bool` = `diff(got, want) == ""`.
5. `godot/tests/test_golden_util.gd` (`extends "res://tests/harness.gd"`) with test methods: `test_intify` (intify({"a": 3.0, "b": [1.5, 2.0], "c": "x"}): typeof a == TYPE_INT, b[0] stays float 1.5, typeof b[1] == TYPE_INT, c == "x"); `test_same_numbers` (same(1, 1.0), same(0.1 + 0.2, 0.3), not same(1, 2), not same(1.5, 1.6), not same(true, 1)); `test_diff_paths` (diff({"a": [1, 2]}, {"a": [1, 3]}) begins with "$.a[1]"; diff({"a": 1}, {"a": 1, "b": 2}) contains "missing"; diff({"a": 1, "b": 2}, {"a": 1}) contains "unexpected"; diff([1], [1, 2]) contains "array size"; diff({}, {}) == ""); `test_copy_is_deep` (copy a nested Dictionary, change the copy, the original is unchanged); `test_selftest_fixture`: `var cs: Array = GoldenUtil.load_golden("selftest")["cases"]`; size == 3; cs[0]["result"] == 5 and typeof is TYPE_INT; cs[1]["after"] is {"n": 6, "list": [1, 2, 5]} by GoldenUtil.same; cs[1]["state"]["n"] == 1 (input kept); cs[2]["result"]["text"] == "Price " + char(163) + " 5" and cs[2]["result"]["sum"] near 0.3 within 1e-9.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh selftest` prints `GOLDEN selftest OK` and `godot/tests/golden/selftest.json` has 3 cases.
- `sh tools/godot/gtest.sh test_golden_util` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files; the sim ports; golden_common.mjs from GDF04 is NOT used by the GDS cards (do not edit it).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS01: Golden fixture helpers (JS and GDScript)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
