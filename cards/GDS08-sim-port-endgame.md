[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS08 Sim port: endgame

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS08
Needs (already merged into `dev`): GDS03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/endgame.js (net worth, the four Gold Number Plates, final score, ranks, end-of-game check) to `SimEndGame`.

## Read first
- PORT RULES (every GDS card). (a) The JS file is the spec: port every function line for line, SAME order of statements and of rng draws (the rng sequence is the parity test, the golden `after` state contains `rng`). (b) Each file `godot/sim/<jsname>.gd` starts with `class_name SimX` then `extends RefCounted`; all functions are `static func`, named like the JS exports in snake_case (private helpers get a leading underscore); typed signatures where cheap (`state: Dictionary`). Refer to other classes by their class_name ONLY, never `preload()`/`load()` them (the sim classes call each other in a cycle: advance -> month -> auction -> advance). (c) Core helpers: find the files with `grep -rl 'class_name CoreRng' godot/` (same for CoreClock, CoreFormat). Expected API: CoreRng.rand(state), rand_int(state, lo, hi) -> int, chance(state, p) -> bool, pick(state, arr), weighted(state, items), round_to(x, step), clamp(x, lo, hi), seed_rng(state, seed); CoreClock.date_of(day) -> Dictionary {month, dayOfMonth, monthName}, is_month_start(day), is_auction_day(day), DAYS_IN_YEAR; CoreFormat.money(n), CoreFormat.one_dp(n). Read those files; if a name differs, use the real name; never re-implement them. (d) State is a Dictionary with the JS key names (camelCase keys: state["garageSlots"], car["impoundedUntil"]); lists are Arrays of Dictionaries; JS null is GDScript null; a key that may be absent in JS (car.impoundedUntil, auction.attendedDay) is read with `.get(key)` and null treated as the JS default. (e) Numbers: keep integers (cash, counts, ids, prices) as int; every JS `Math.round(x)` becomes `SimUtil.jround(x)` (rounds .5 UP; GDScript round() does not) and `Math.floor` becomes `floori()`. NEVER write int / int (GDScript truncates): write `x / 2.0`. Keep the floating-point expression order exactly as in the JS (a * b * c is not a * (b * c)). Always write float literals as `0.5`, `10.0`. (f) Text: build every message from the same pieces as the JS; money only via CoreFormat.money(), one decimal via CoreFormat.one_dp(); a plain number inside a message uses SimUtil.num_str(x). Source files are ASCII only (a pound sign only ever comes out of CoreFormat.money). (g) Tabs, no `print` left in the files. A JS `throw` becomes `push_error(...)` plus returning an empty value; do not test those paths.
- tools/godot/golden_sim.mjs and tools/godot/golden_run.sh (GDS01): read the headers; godot/tests/golden_util.gd (GoldenUtil: load_golden(name), copy(v), diff(got, want) -> '' when equal) and godot/tests/harness.gd (GDF02: ok, eq, near)
- GOLDEN PATTERN. tools/godot/golden_sim.mjs (GDS01) exports: `clone(x)`, `fresh(seed)` (= startGame(seed): full new-game state), `bare(seed)` (= newGameState(seed): empty state), `addCar(state, modelId, fields = {})` (pushes a stable car with id 'c'+nextId++, owned true, condition 5, fault null, lastServiceDay = state.day, jobsDone 0, boughtDay = state.day, impoundedUntil 0, rentedAtCondition null, owner null, rentMonthly 0, paid 0; `fields` override; returns the car), `pureCase(fn, name, args, result)` -> {fn, name, args, result}, `stateCase(fn, name, state, args, call)` -> {fn, name, state: <input clone>, args, result, after: <state after>} (it clones the state, runs `call(work, ...args)` and records the return value, null when undefined), `sweepSeeds(base, lo, hi, run, classify, perKind)` -> {kind: [seeds]} (for seed in lo..hi: w = clone(base); w.rng = seed; r = run(w); k = classify(w, r); k === null is skipped; keeps the first perKind seeds per kind) and `emitCases(name, cases)` (prints one JSON line {"cases": [...]}). A golden script ends with `emitCases('<name>', cases);`. `sh tools/godot/golden_run.sh <name>` runs it under jsc and writes godot/tests/golden/<name>.json (commit the fixture). TEST PATTERN. The test godot/tests/test_sim_<name>.gd begins with `extends "res://tests/harness.gd"` and has exactly these two helpers (replace NAME):
```
func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("NAME")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out

func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])
```
plus one `func test_<fn>() -> void:` per golden function name, each of the form shown in the steps.
- src/sim/endgame.js (read fully) and tests/endgame.test.mjs
- godot/sim/carstats.gd (SimCarStats.market_value)

## Files you may change (and nothing else)
- `tools/godot/golden_endgame.mjs`
- `godot/tests/golden/endgame.json`
- `godot/sim/endgame.gd`
- `godot/tests/test_sim_endgame.gd`

## Steps
1. `tools/godot/golden_endgame.mjs`: imports endgame.js. Helper `base(over)` returns `Object.assign({ day: 100, cash: 0, reputation: 0, market: { priceMult: 1 }, cars: [], plates: { fatcat: false, stable: false, household: false, hammer: false }, stats: { bestAuctionSale: 0 }, flags: { gameOver: false, won: false, reason: '' } }, over)`; helper `oc(modelId, cond, owned)` = { modelId: modelId, condition: cond, owned: owned }. Cases: (a) `stateCase('net_worth', name, base(...), [], s => netWorth(s))`: { cash: 500 }; { cash: 1000, cars: [oc('t1_allergy', 10, true)] }; { cash: 2500, market: {priceMult: 1.2}, cars: [oc('t3_porshe', 5, true), oc('t2_serious', 8, false)] } (rental counts 0); { cash: -300, cars: [oc('t1_robbin', 3.5, true), oc('t1_allergy', 0, true)] }; (b) `stateCase('evaluate_plates', name, base(...), [], s => evaluatePlates(s))`: { cash: 100000 }; { cash: 99999 }; { cars: six x oc('t1_allergy', 0, true) } (6 owned); { cars: five owned + one rented }; { reputation: 85 }; { reputation: 84 }; { stats: { bestAuctionSale: 100000 } }; all four conditions at once; { cash: 0, plates: { fatcat: true, stable: false, household: false, hammer: false } } (a won plate is never taken away: result []); nothing true; (c) `stateCase('final_score', name, base(...), [], s => finalScore(s))`: { cash: 12345, reputation: 33 }; { cash: 50000, reputation: 99, plates: all four true }; { cash: -2000, plates: { fatcat: true, stable: false, household: true, hammer: false } }; { cash: 1000, reputation: 12, market: { priceMult: 0.85 }, cars: [oc('t3_aston', 6.5, true)] }; (d) `pureCase('rank_of', 'score ' + v, [v], rankOf(v))` for v in [-1, 0, 29999, 30000, 79999, 80000, 149999, 150000, 299999, 300000, 1000000]; (e) `stateCase('check_end', name, base(...), [], s => checkEnd(s))` for: { plates: all four true } (won); { day: 366 } (year-end); { day: 365 } (nothing); { day: 366, flags: { gameOver: true, won: false, reason: 'bankrupt' } } (unchanged); { day: 366, plates: all four true } (won wins); (f) `pureCase('plate_info', 'plate info', [], PLATE_INFO)`. Run `sh tools/godot/golden_run.sh endgame`.
2. Create `godot/sim/endgame.gd`: `class_name SimEndGame`, `extends RefCounted`, all functions `static`. `const PLATE_KEYS := ["fatcat", "stable", "household", "hammer"]`. Functions: `plate_info() -> Dictionary` (a function, because the texts need CoreFormat): fatcat {name "Fat Cat", text "Net worth " + CoreFormat.money(100000)}, stable {name "Stable Boy", text "Own 6 cars at once"}, household {name "Household Name", text "Reputation 85"}, hammer {name "Hammer Time", text "Sell a car at auction for " + CoreFormat.money(100000)}. `net_worth(state) -> int` = state.cash + SimCarStats.market_value(state, SimData.model_of(c.modelId), c) for every car with owned == true (rented cars add 0). `_plate_condition(state, key) -> bool`: fatcat net_worth >= 100000; stable: count of cars with owned == true >= 6; household reputation >= 85; hammer stats.bestAuctionSale >= 100000. `evaluate_plates(state) -> Array`: for key in PLATE_KEYS (in order): if not state.plates[key] and _plate_condition: set true and append key to the returned Array of newly won keys. `final_score(state) -> int` = SimUtil.jround(net_worth + 5000 * plates_won + 100 * reputation). `rank_of(score) -> String`: < 0 "Pavement Pete"; < 30000 "Learner Driver"; < 80000 "Weekend Mechanic"; < 150000 "Gearbox Guru"; < 300000 "Concours Champion"; else "Legend of the Lay-by". `check_end(state) -> void`: if flags.gameOver return; all four plates won -> gameOver true, won true, reason "won"; elif state.day > 365 -> gameOver true, won false, reason "year-end".
3. Create `godot/tests/test_sim_endgame.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `endgame`) and exactly these test methods:
```
func test_net_worth() -> void:
	var cs := _cases("net_worth")
	ok(cs.size() >= 4, "net_worth: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimEndGame.net_worth(st), st)

func test_evaluate_plates() -> void:
	var cs := _cases("evaluate_plates")
	ok(cs.size() >= 10, "evaluate_plates: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimEndGame.evaluate_plates(st), st)

func test_final_score() -> void:
	var cs := _cases("final_score")
	ok(cs.size() >= 4, "final_score: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimEndGame.final_score(st), st)

func test_rank_of() -> void:
	var cs := _cases("rank_of")
	ok(cs.size() >= 11, "rank_of: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimEndGame.rank_of(a[0]))

func test_check_end() -> void:
	var cs := _cases("check_end")
	ok(cs.size() >= 5, "check_end: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimEndGame.check_end(st)
		_check(c, null, st)

func test_plate_info() -> void:
	var cs := _cases("plate_info")
	ok(cs.size() >= 1, "plate_info: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimEndGame.plate_info())
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh endgame` prints a last line starting `GOLDEN endgame OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/endgame.json'))['cases']))"` prints a number >= 35.
- `sh tools/godot/gtest.sh test_sim_endgame` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS08: Sim port: endgame`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
