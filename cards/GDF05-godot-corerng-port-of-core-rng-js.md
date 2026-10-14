[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF05 Godot: CoreRng (port of core/rng.js)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF05
Needs (already merged into `dev`): GDF04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Exact port of `src/core/rng.js`: the same seeds give the same numbers as the JS build (bit for bit; floats equal).

## Read first
- src/core/rng.js (read it all)
- tests/rng.test.mjs (reference values)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- godot/tests/golden_util.gd (GDF04): `GoldenUtil.fixture(name) -> Variant` loads godot/tests/golden/<name>.json (whole JSON numbers come back as int, others float); `GoldenUtil.diff(a, b, eps = 1e-9) -> String` is "" when equal (numbers within eps) else a message naming the first difference; `GoldenUtil.same(a, b, eps = 1e-9) -> bool`
- Golden fixtures are made by the JS reference: `sh tools/godot/golden.sh <name>` (GDF04) runs `tools/godot/golden_<name>.mjs` under macOS `jsc -m` and writes `godot/tests/golden/<name>.json`. Run it yourself and commit both files; the JSON is never hand-edited
- GDScript's JSON parser returns EVERY number as float; `CoreJson` (GDF15) turns whole numbers back into int. GDScript `/` on two ints truncates: always convert with `float()` first when a JS division is meant

## Files you may change (and nothing else)
- `godot/core/rng.gd`
- `tools/godot/golden_rng.mjs`
- `godot/tests/golden/rng.json`
- `godot/tests/test_rng.gd`

## Steps
1. `godot/core/rng.gd`: `class_name CoreRng`, `extends RefCounted`, all functions `static`, typed. The random state is `state.rng` (an int holding a uint32) inside the state Dictionary. 64-bit GDScript ints make this easy; mask EVERY result with `& 0xFFFFFFFF`.
2. `static func _imul(a: int, b: int) -> int: return (a * b) & 0xFFFFFFFF`.
3. `static func _step(state: Dictionary) -> int` (indent the body with tabs): `state.rng = (int(state.rng) + 0x6D2B79F5) & 0xFFFFFFFF`; `var t: int = state.rng`; `t = _imul(t ^ (t >> 15), t | 1)`; `t = (t ^ ((t + _imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF`; `return (t ^ (t >> 14)) & 0xFFFFFFFF`. Do not 'simplify' it.
4. Public API (names are the JS names in snake_case): `seed_rng(state: Dictionary, seed_value: int) -> void` (`state.rng = seed_value & 0xFFFFFFFF`, so -1 becomes 4294967295); `rand(state) -> float` (`float(_step(state)) / 4294967296.0`); `rand_int(state, lo: int, hi: int) -> int` (`lo + int(floor(rand(state) * float(hi - lo + 1)))`); `chance(state, p: float) -> bool` (`rand(state) < p`); `pick(state, arr: Array) -> Variant` (`arr[rand_int(state, 0, arr.size() - 1)]`; an empty array returns null WITHOUT drawing); `weighted(state, items: Array) -> Variant`: items are Dictionaries with a numeric `w`; `total` as a FLOAT sum of `w`; if `total <= 0` return `{}` without drawing; draw ONE `r = rand(state)`; loop `r -= float(items[i].w) / total; if r < 0.0: return items[i]`; if the loop ends, return the last item whose `w > 0`; `round_to(x: float, step_size: float) -> float` (`snappedf(floor(x / step_size + 0.5) * step_size, 0.000001)`: JS `Math.round` rounds halves UP, so do not use `roundf`/`round`); `clamp_value(x: float, lo: float, hi: float) -> float` (`minf(hi, maxf(lo, x))`).
5. `tools/godot/golden_rng.mjs` (imports `emit, SEEDS` from `./golden_common.mjs` and the JS functions from `../../src/core/rng.js`): constants `POOL = ['a','b','c','d']`, `WEIGHTS = [{w:1,id:'x'},{w:3,id:'y'},{w:0,id:'z'},{w:6,id:'w'}]`. The op list `OPS` (in this order): `rand` x5, `randInt [1,6]` x5, `randInt [-3,3]` x5, `randInt [7,7]` x2, `chance [0.3]` x5, `pick` x5 (draws from POOL), `weighted` x8 (draws from WEIGHTS, the output is the picked `.id`), `roundTo [0.5]` x3, `roundTo [0.01]` x3 (each `roundTo` op draws one `rand` and rounds `rand * 100`). For every seed in SEEDS, create `{rng: 0}`, `seedRng(s, seed)`, run all ops in order, and record `out` (list of results). Also record `final: s.rng`. Emit `{ ops: OPS, cases: [{seed, out, final}, ...], statics: [...] }` where `statics` has entries `{fn, args, out}` for: `roundTo [1.2345, 0.01]`, `[2.5, 1]`, `[-2.5, 1]`, `[0.125, 0.25]`, `[7, 5]`; `clamp [5,0,3]`, `[-1,0,3]`, `[2,0,3]`; and `seedRng`-then-read cases `{fn:'seed', args:[-1], out: <state.rng after seedRng(s, -1)>}`, `[3.7]`, `[4294967296]`.
6. `godot/tests/test_rng.gd`: `test_golden_sequences`: load `GoldenUtil.fixture("rng")`; for each case seed a Dictionary `{"rng": 0}` with `CoreRng.seed_rng`, replay `ops` in the same order (match on op name; `pick` uses POOL, `weighted` uses WEIGHTS and takes `.id`, `roundTo` draws `rand` then `round_to(r * 100.0, step)`; ops with `args` pass them), compare every output with `GoldenUtil.diff` (eps 1e-12) and finally `state.rng == case.final`. `test_statics` replays `statics` (`seed` entries use `seed_rng(s, int(args[0]))` and read `s.rng`; note `3.7` becomes `int(3.7)` = 3 in GDScript and `>>> 0` of 3.7 is also 3). `test_known_values`: seed 12345 gives `rand` values near 0.9797282677609473, 0.3067522644996643, 0.484205421525985 (eps 1e-12); seed 1 first raw draw: `rand * 4294967296.0` rounds to 2693262067 and the second to 11749833. `test_edge_cases`: `pick` of `[]` is null and leaves `state.rng` unchanged; `weighted` of `[{"w": 0}]` is `{}`; `weighted` with only the last item weighted always returns it; same seed twice gives identical 20 numbers; different seeds differ; `rand` is always in [0, 1).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden.sh rng` prints `wrote godot/tests/golden/rng.json`.
- `sh tools/godot/gtest.sh test_rng | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- `weighted` for non-Dictionary items. Any use of GDScript randf/randi. Game code that calls the rng (sim cards).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF05: Godot: CoreRng (port of core/rng.js)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
