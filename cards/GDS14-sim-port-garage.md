[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS14 Sim port: garage

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS14
Needs (already merged into `dev`): GDS12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/garage.js (service_car quick/full, fix_fault, restore_car) to `SimGarage`.

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
- src/sim/garage.js (read fully) and tests/garage.test.mjs
- godot/sim/advance.gd, carstats.gd (GDS03, GDS12)

## Files you may change (and nothing else)
- `tools/godot/golden_garage.mjs`
- `godot/tests/golden/garage.json`
- `godot/sim/garage.gd`
- `godot/tests/test_sim_garage.gd`

## Steps
1. `tools/godot/golden_garage.mjs`: imports serviceCar, fixFault, restoreCar. Helper `g(seed, condition, extra)` = fresh(seed) with one car `addCar(s, 't2_serious', Object.assign({condition: condition}, extra || {}))` and the car's id as args[0]. Cases (all `stateCase(fn, name, st, [carId, ...], call)`, fn names 'service_car', 'fix_fault', 'restore_car'): service_car: quick on cond 5; full on cond 5 (sets lastServiceDay); full on cond 9 (clamps to 10); quick on cond 10 ('Already perfect'); full with cash 20 (not enough); kind 'bogus'; unknown car 'c99'; quick on a t3_porshe cond 2; fix_fault: a car with fault {faultId:'puncture', label:'Puncture', cost:90} cash 5000 (success); the same with cash 50 (not enough); no fault ('Nothing to fix'); unknown car; a t3 car with fault cost 1400; restore_car: cond 3 with a fault (success; cost max(1200, round(basePrice*0.06))); a t3_porshe cond 4 (cost from basePrice); cond 10 with no fault ('Already perfect'); cond 10 WITH a fault (allowed); cash 100 (not enough); unknown car. Use seeds 1..4 spread over the cases. Run `sh tools/godot/golden_run.sh garage`.
2. Create `godot/sim/garage.gd`: `class_name SimGarage`, `extends RefCounted`, all functions `static`. Private helpers `_find_car(state, car_id)` (Dictionary or null) and `_finish(state, msg) -> Dictionary` (state.pending.append(msg); SimAdvance.advance_day(state); return {ok true, msg}). Refusals return {ok false, msg} and change nothing, no day passes. `service_car(state, car_id, kind) -> Dictionary`: refusal order: no car "No such car"; kind not "quick"/"full" "No such treatment"; cost = quick ? SimUtil.jround(40 + model.basePrice * 0.002) : SimUtil.jround(150 + model.basePrice * 0.008); condition >= 10 "Already perfect"; cash < cost "Not enough money". Success: cash -= cost; before = condition; after = SimCarStats.change_condition(car, 1.0 if quick else 2.5); quick msg = "Quick tinker on the " + model.name + ": condition " + CoreFormat.one_dp(before) + " -> " + CoreFormat.one_dp(after) + ". Cost " + CoreFormat.money(cost) + "."; full also sets car.lastServiceDay = state.day and msg = "Full service on the " + model.name + ": condition " + one_dp(before) + " -> " + one_dp(after) + ". Cost " + money(cost) + "."; return _finish. `fix_fault(state, car_id) -> Dictionary`: no car "No such car"; fault null "Nothing to fix"; cash < fault.cost "Not enough money"; success: cost = fault.cost; cash -= cost; label = fault.label; car.fault = null; after = change_condition(car, 0.5); msg = "Fixed the " + label + " on the " + model.name + " for " + money(cost) + ". Condition now " + one_dp(after) + ".". `restore_car(state, car_id) -> Dictionary`: no car "No such car"; cost = maxi(1200, SimUtil.jround(model.basePrice * 0.06)); condition >= 10 and fault == null "Already perfect"; cash < cost "Not enough money"; success: cash -= cost; fault = null; after = change_condition(car, 10 - car.condition); lastServiceDay = day; msg = "Full restoration of the " + model.name + ": good as new, " + one_dp(after) + " condition. Cost " + money(cost) + ".".
3. Create `godot/tests/test_sim_garage.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `garage`) and exactly these test methods:
```
func test_service_car() -> void:
	var cs := _cases("service_car")
	ok(cs.size() >= 8, "service_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimGarage.service_car(st, a[0], a[1]), st)

func test_fix_fault() -> void:
	var cs := _cases("fix_fault")
	ok(cs.size() >= 5, "fix_fault: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimGarage.fix_fault(st, a[0]), st)

func test_restore_car() -> void:
	var cs := _cases("restore_car")
	ok(cs.size() >= 6, "restore_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimGarage.restore_car(st, a[0]), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh garage` prints a last line starting `GOLDEN garage OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/garage.json'))['cases']))"` prints a number >= 19.
- `sh tools/godot/gtest.sh test_sim_garage` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS14: Sim port: garage`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
