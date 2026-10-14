[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS03 Sim port: carstats

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS03
Needs (already merged into `dev`): GDS02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/carstats.js (effective stats, values, running costs, condition changes) to `SimCarStats` and prove it against golden values from the JS.

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
- src/sim/carstats.js (read fully) and tests/carstats.test.mjs
- godot/sim/simutil.gd and godot/sim/simdata.gd (GDS02)

## Files you may change (and nothing else)
- `tools/godot/golden_carstats.mjs`
- `godot/tests/golden/carstats.json`
- `godot/sim/carstats.gd`
- `godot/tests/test_sim_carstats.gd`

## Steps
1. `tools/godot/golden_carstats.mjs`: imports carstats.js, modelOf and the golden_sim helpers. MODELS = ['t1_allergy', 't1_robbin', 't2_serious', 't3_porshe', 't3_aston'], CONDS = [0, 2.5, 5, 7.3, 10]. For every model m and cond c (25 pairs) add SIX pure cases `pureCase(fn, m + ' ' + c, [m, c], <value>)` with fn and value: 'eff_d' effD(modelOf(m), {condition: c}); 'eff_r' effR(...); 'maint_mult' maintMult({condition: c}); 'value_factor' valueFactor({condition: c}); 'running_cost' runningCost(modelOf(m), {condition: c}); 'idle_decay' idleDecay(modelOf(m)). Then for every (m, c) and priceMult p in [0.85, 1, 1.25] add `stateCase('market_value', m + ' ' + c + ' x' + p, { market: { priceMult: p } }, [m, c], (s, mm, cc) => marketValue(s, modelOf(mm), { condition: cc }))` (75 cases). Then `pureCase('change_condition', name, [start, delta], <new condition>)` where the value is computed with `const car = { condition: start }; changeCondition(car, delta)` for [start, delta] in [[5, 1.0], [9.5, 2.5], [0.3, -1], [5.55, 0.01], [7.3, -0.1], [7.3, -0.3], [0, 0], [10, -0.04], [3.333, 0.004], [6.66, 1.005]]. Then `stateCase('is_available', name, { day: 10 }, [car], (s, c) => isAvailable(s, c))` for cars: {fault: null, impoundedUntil: 0}, {fault: null} (key missing), {fault: null, impoundedUntil: 10}, {fault: null, impoundedUntil: 11}, {fault: {faultId: 'puncture', label: 'Puncture', cost: 90}, impoundedUntil: 0}. End with emitCases('carstats', cases); run `sh tools/godot/golden_run.sh carstats`.
2. Create `godot/sim/carstats.gd`: `class_name SimCarStats`, `extends RefCounted`, all functions `static`. Functions with their formulas (model/car are Dictionaries; use "desirability", "reliability", "maintenance", "basePrice", "condition" keys): `eff_d(model, car) -> float` = model.desirability * (0.40 + 0.06 * car.condition); `eff_r(model, car) -> float` = model.reliability * (0.30 + 0.07 * car.condition); `maint_mult(car) -> float` = 1 + (10 - car.condition) * 0.08; `value_factor(car) -> float` = 0.50 + 0.05 * car.condition; `market_value(state, model, car) -> int` = SimUtil.jround(model.basePrice * value_factor(car) * state.market.priceMult); `running_cost(model, car) -> int` = SimUtil.jround(model.maintenance * (60 + model.basePrice * 0.0025) * maint_mult(car)); `idle_decay(model) -> float` = 0.01 + (10 - model.reliability) * 0.002; `change_condition(car, delta) -> float`: car["condition"] = CoreRng.clamp(CoreRng.round_to(car["condition"] + delta, 0.01), 0.0, 10.0), return it; `is_available(state, car) -> bool` = car["fault"] == null and (car.get("impoundedUntil") if not null else 0) <= state["day"] (a missing or null impoundedUntil counts as 0). Write every expression in exactly this operand order.
3. Create `godot/tests/test_sim_carstats.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `carstats`) and exactly these test methods:
```
func test_eff_d() -> void:
	var cs := _cases("eff_d")
	ok(cs.size() >= 25, "eff_d: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.eff_d(SimData.model_of(a[0]), {"condition": a[1]}))

func test_eff_r() -> void:
	var cs := _cases("eff_r")
	ok(cs.size() >= 25, "eff_r: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.eff_r(SimData.model_of(a[0]), {"condition": a[1]}))

func test_maint_mult() -> void:
	var cs := _cases("maint_mult")
	ok(cs.size() >= 25, "maint_mult: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.maint_mult({"condition": a[1]}))

func test_value_factor() -> void:
	var cs := _cases("value_factor")
	ok(cs.size() >= 25, "value_factor: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.value_factor({"condition": a[1]}))

func test_running_cost() -> void:
	var cs := _cases("running_cost")
	ok(cs.size() >= 25, "running_cost: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.running_cost(SimData.model_of(a[0]), {"condition": a[1]}))

func test_idle_decay() -> void:
	var cs := _cases("idle_decay")
	ok(cs.size() >= 25, "idle_decay: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.idle_decay(SimData.model_of(a[0])))

func test_market_value() -> void:
	var cs := _cases("market_value")
	ok(cs.size() >= 75, "market_value: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimCarStats.market_value(st, SimData.model_of(a[0]), {"condition": a[1]}), st)

func test_change_condition() -> void:
	var cs := _cases("change_condition")
	ok(cs.size() >= 10, "change_condition: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var car := {"condition": a[0]}
		_check(c, SimCarStats.change_condition(car, a[1]))
		ok(is_equal_approx(car["condition"], c["result"]), c["name"] + " stored on the car")

func test_is_available() -> void:
	var cs := _cases("is_available")
	ok(cs.size() >= 5, "is_available: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimCarStats.is_available(st, a[0]), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh carstats` prints a last line starting `GOLDEN carstats OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/carstats.json'))['cases']))"` prints a number >= 240.
- `sh tools/godot/gtest.sh test_sim_carstats` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS03: Sim port: carstats`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
