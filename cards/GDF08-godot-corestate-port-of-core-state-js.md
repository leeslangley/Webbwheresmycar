[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF08 Godot: CoreState (port of core/state.js)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF08
Needs (already merged into `dev`): GDF04, GDF05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Exact port of `src/core/state.js`: `CoreState.new_game_state(seed)` returns a fresh Dictionary with EXACTLY the JS keys (camelCase key names are kept: `garageSlots`, `nextId`, `priceMult`, `refreshedDay`, `lastResults`, `jobsDone`, ... because saves, fixtures and sim ports all use them).

## Read first
- src/core/state.js (read it all)
- tests/state.test.mjs
- godot/core/rng.gd (GDF05)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- godot/tests/golden_util.gd (GDF04): `GoldenUtil.fixture(name) -> Variant` loads godot/tests/golden/<name>.json (whole JSON numbers come back as int, others float); `GoldenUtil.diff(a, b, eps = 1e-9) -> String` is "" when equal (numbers within eps) else a message naming the first difference; `GoldenUtil.same(a, b, eps = 1e-9) -> bool`
- Golden fixtures are made by the JS reference: `sh tools/godot/golden.sh <name>` (GDF04) runs `tools/godot/golden_<name>.mjs` under macOS `jsc -m` and writes `godot/tests/golden/<name>.json`. Run it yourself and commit both files; the JSON is never hand-edited

## Files you may change (and nothing else)
- `godot/core/state.gd`
- `tools/godot/golden_state.mjs`
- `godot/tests/golden/state.json`
- `godot/tests/test_state.gd`

## Steps
1. `godot/core/state.gd`: `class_name CoreState`, `extends RefCounted`. `const PLATE_KEYS: Array[String] = ["fatcat", "stable", "household", "hammer"]`. `static func new_game_state(seed_value: int = 1) -> Dictionary`: builds the Dictionary literal with the same keys, same order and same initial values as the JS (`v: 1, seed: seed, rng: 0, day: 1, cash: 20000, reputation: 40, buzz: 0, garageSlots: 3, nextId: 1, market: {priceMult: 1}, cars: [], shop: {listings: [], refreshedDay: 1}, requests: [], auction: {month: 1, lots: [], consigned: [], lastResults: []}, stats: {...7 keys...}, plates: {all four false}, headlines: [], pending: [], sit: [], today: {day: 1, headline: "", events: [], monthReport: null}, lastMonthReport: null, flags: {gameOver: false, won: false, reason: ""}, log: []`), then `CoreRng.seed_rng(state, seed_value)` and returns it. Every call builds NEW containers (never share a constant Dictionary or Array between calls). Whole numbers are GDScript ints (`priceMult: 1`).
2. `tools/godot/golden_state.mjs`: emit `{ plateKeys: PLATE_KEYS, states: [{seed: s, state: newGameState(s)} for s in [1, 0, 42, 4294967295]], defaultSeed: newGameState() }`.
3. `godot/tests/test_state.gd`: `test_matches_js` (for each fixture entry `GoldenUtil.diff(CoreState.new_game_state(seed), entry.state)` is ""; also `new_game_state()` vs `defaultSeed`), `test_plate_keys`, `test_fresh_containers` (mutating `cars` and `plates` of one state does not change the next state), `test_json_roundtrip` (`CoreJson.parse(CoreJson.stringify(state))` is `GoldenUtil.same` to the state), `test_rng_seeded` (state.rng for seed 42 equals 42; for seed 4294967295 equals 4294967295).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden.sh state` prints `wrote godot/tests/golden/state.json`.
- `sh tools/godot/gtest.sh test_state | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- `start_game` (src/sim/newgame.js: shop, auction, headline; that is a sim port).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF08: Godot: CoreState (port of core/state.js)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
