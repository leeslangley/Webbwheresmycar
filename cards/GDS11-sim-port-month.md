[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS11 Sim port: month

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS11
Needs (already merged into `dev`): GDS04, GDS09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/month.js (month-end bills, faults, market drift, next auction, bankruptcy) to `SimMonth`.

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
- src/sim/month.js (read fully) and tests/month.test.mjs
- godot/sim/faultsim.gd (GDS04), godot/sim/auction.gd (GDS09: prepare_auction), godot/sim/carstats.gd

## Files you may change (and nothing else)
- `tools/godot/golden_month.mjs`
- `godot/tests/golden/month.json`
- `godot/sim/month.gd`
- `godot/tests/test_sim_month.gd`

## Steps
1. `tools/godot/golden_month.mjs`: imports monthEnd. Helper `setup(seed, day)`: `const s = fresh(seed); s.day = day; addCar(s, 't1_allergy', {condition: 6}); addCar(s, 't2_serious', {condition: 3.5, fault: {faultId: 'puncture', label: 'Puncture', cost: 90}}); addCar(s, 't3_porshe', {condition: 8}); addCar(s, 't1_robbin', {owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 5, condition: 4}); return s;`. Cases `stateCase('month_end', name, st, [opts], (s, o) => monthEnd(s, o))` (the report is the result): seeds 1..6 with day 32 and opts {} ; seeds 1..3 with day 60 and {}; seeds 1..2 with day 335 and {}; seed 4 day 32 with opts { skipFaults: true }; seed 5 day 32 on fresh(5) with no cars added (name 'no cars'); bankruptcy: seed 6 day 32 with cash set to -1500 (bills push it below -2000: flags.gameOver true, reason 'bankrupt'); not bankrupt: seed 6 day 32 cash 100000. The script THROWS unless at least one report has a non-empty newFaults and at least one run ends with flags.reason 'bankrupt'. Run `sh tools/godot/golden_run.sh month`.
2. Create `godot/sim/month.gd`: `class_name SimMonth`, `extends RefCounted`, all functions `static`. `const GARAGE_LEASE := 400`, `const OVERDRAFT_LIMIT := -2000`. `month_end(state, opts: Dictionary = {}) -> Dictionary`: `ended = CoreClock.date_of(state.day - 1)`; report = {month: ended.month, monthName: ended.monthName, rent 0, running 0, lease GARAGE_LEASE, total 0, cashAfter 0, newFaults []}. Steps in this order: (1) for each car: if car.owned == false: rent += (car.rentMonthly or 0); elif car.owned == true: running += SimCarStats.running_cost(SimData.model_of(car.modelId), car); (2) total = rent + running + lease; state.cash -= total; (3) unless opts.get("skipFaults", false): for each car WITHOUT a fault (car.fault == null): model = model_of; `fault = SimFaultSim.roll_fault(state, model, car, 0.5)`; if not null: SimFaultSim.apply_fault(car, fault); state.stats.faults += 1; report.newFaults.append(model.name + ": " + fault.label); (4) `state.market.priceMult = CoreRng.clamp(CoreRng.round_to(state.market.priceMult + (CoreRng.rand(state) - 0.5) * 0.06, 0.001), 0.85, 1.25)` (ONE rand draw, after all fault rolls); (5) SimAuction.prepare_auction(state); (6) report.cashAfter = state.cash; state.lastMonthReport = report; (7) if state.cash < OVERDRAFT_LIMIT: flags.gameOver = true, won = false, reason = "bankrupt". Return report. (state.lastMonthReport and the returned report are equal Dictionaries.)
3. Create `godot/tests/test_sim_month.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `month`) and exactly these test methods:
```
func test_month_end() -> void:
	var cs := _cases("month_end")
	ok(cs.size() >= 15, "month_end: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimMonth.month_end(st, a[0]), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh month` prints a last line starting `GOLDEN month OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/month.json'))['cases']))"` prints a number >= 15.
- `sh tools/godot/gtest.sh test_sim_month` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS11: Sim port: month`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
