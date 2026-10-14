[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS02 SimUtil and SimData helpers for the sim ports

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS02
Needs (already merged into `dev`): GDF01, GDF02, GDF03, GDF05, GDF06, GDF07, GDF08, GDS01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two helper classes every sim port uses: `SimUtil` (JS-compatible rounding and number-to-text) and `SimData`, the ONE place that turns the Data autoload (JSON exported from src/data/*.js) into the lookups and the rng-driven name builders the JS data modules contain (modelOf, jobTypeOf, fillText, faultsOfSeverity, TIER_MULT, ADVERT_BY_ID, customerName, ownerName, headline pools).

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
- godot/autoload/data.gd (GDF03) and godot/data/*.json: the REAL accessor names and JSON shapes of the exported data; SimData adapts to them and is the only sim file that calls `Data`
- src/data/cars.js, jobtypes.js, faults.js, adverts.js, names.js, owners.js, headlines.js (exports and helper functions)

## Files you may change (and nothing else)
- `tools/godot/golden_simdata.mjs`
- `godot/tests/golden/simdata.json`
- `godot/sim/simutil.gd`
- `godot/sim/simdata.gd`
- `godot/tests/test_sim_simdata.gd`

## Steps
1. `tools/godot/golden_simdata.mjs`: imports from src/data/*.js (cars, jobtypes, faults, adverts, names, owners, headlines) and src/core/rng.js is not needed; use `bare(seed)` from golden_sim.mjs for rng states. Cases: (1) `pureCase('counts', 'data counts', [], { cars: CARS.length, job_types: JOB_TYPES.length, faults: FAULTS.length, adverts: ADVERTS.length, first: FIRST.length, last: LAST.length, prefix: PREFIX.length, owners: OWNERS.length, generic: GENERIC.length, carworld: CARWORLD.length, reactive_keys: Object.keys(REACTIVE).sort() })` (expected 31, 16, 24, 7, 40, 40, 8, 24, 80, 60 and the 9 situations broke, rich, breakdown, bigwin, viral, fullgarage, emptygarage, monthend, auctionday); (2) `pureCase('model_of', id, [id], modelOf(id))` for ids t1_allergy, t2_serious, t3_porshe; (3) `pureCase('job_type_of', id, [id], jobTypeOf(id))` for wedding and chef; (4) `pureCase('advert_by_id', id, [id], ADVERT_BY_ID[id])` for paper and tv; (5) `pureCase('faults_of_severity', sev, [sev], faultsOfSeverity(sev).map(f => f.id))` for minor, medium, major; (6) `pureCase('tier_mult', 'tier ' + t, [t], TIER_MULT[t])` for t = 1, 2, 3; (7) `pureCase('fill_text', name, [template, vars], fillText(template, vars))` for: ['{customer} drives {car}.', {customer: 'Nigel', car: 'Austen Allergy'}], ['{customer} and {customer} again', {customer: 'A'}], ['{car} only', {customer: 'B'}] (placeholder stays), ['no tokens here', {}], ['{customer}{car}', {customer: '{car}', car: 'X'}] (single pass: result '{car}X'); (8) `stateCase('customer_name_seq', 'seed 5 twelve names', {rng: 5}, [12], (s, n) => { const out = []; for (let i = 0; i < n; i++) out.push(customerName(s)); return out; })` and the same for seed 77 with 30 names; (9) `stateCase('owner_name_seq', 'seed 9 eight owners', {rng: 9}, [8], ...)` likewise with ownerName. Run `sh tools/godot/golden_run.sh simdata`.
2. Create `godot/sim/simutil.gd`: `class_name SimUtil`, `extends RefCounted`, all functions `static`. Functions: `jround(x: float) -> int` = `int(floor(x + 0.5))` (JS Math.round: halves go up, so 2.5 -> 3 and -2.5 -> -2); `num_str(x: float) -> String`: if x is integral return `str(int(x))`, else `String.num(x)` (so 4 -> "4", 4.0 -> "4", 2.5 -> "2.5", -3 -> "-3").
3. Create `godot/sim/simdata.gd`: `class_name SimData`, `extends RefCounted`, all functions `static`. Every function returns the data from `Data` UNCHANGED (no copies) except where noted. Build lookup indexes lazily in `static var` Dictionaries on first use (e.g. `static var _model_idx: Dictionary = {}`; `static func _ensure() -> void` fills them when empty). Functions: `cars() -> Array` (31 models in file order tier 1, 2, 3); `model_of(id: String) -> Dictionary` (unknown id: push_error, return {}); `job_types() -> Array`; `job_type_of(id: String) -> Dictionary`; `fill_text(template: String, vars: Dictionary) -> String`: ONE left-to-right pass over the template: at index i, if the text from i starts with `{customer}` and vars has a non-null "customer", append that value and skip 10 characters; else if it starts with `{car}` and vars has a non-null "car", append it and skip 5; else append the single character and skip 1 (a substituted value is never re-scanned; a placeholder without a value stays as written); `faults() -> Array` (24, file order); `faults_of_severity(sev: String) -> Array` (those with that severity, file order); `tier_mult(tier: Variant) -> float` = match int(tier): 1 -> 1.0, 2 -> 1.8, 3 -> 3.5 (never use a float as a Dictionary key); `adverts() -> Array`; `advert_by_id(id: String) -> Dictionary` (unknown: {} silently); `first_names() -> Array`, `last_names() -> Array`, `prefixes() -> Array`, `owners() -> Array` (strings); `customer_name(state: Dictionary) -> String`: `var r := CoreRng.rand(state)`; r < 0.60 -> pick(first) + " " + pick(last); r < 0.85 -> pick(prefix) + " " + pick(last); else "The " + pick(last) + " Family" (draw order exactly as written, first pick before last pick); `owner_name(state) -> String` = CoreRng.pick(state, owners()); `headline_generic() -> Array` (80), `headline_carworld() -> Array` (60), `headline_reactive() -> Dictionary` (situation -> Array of 5 strings). If the Data JSON lacks a piece (e.g. TIER_MULT) hard-code it here with the values above.
4. Create `godot/tests/test_sim_simdata.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `simdata`) and exactly these test methods:
```
func test_counts() -> void:
	var cs := _cases("counts")
	ok(cs.size() >= 1, "counts: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var rk: Array = SimData.headline_reactive().keys()
		rk.sort()
		var cd := {"cars": SimData.cars().size(), "job_types": SimData.job_types().size(), "faults": SimData.faults().size(), "adverts": SimData.adverts().size(), "first": SimData.first_names().size(), "last": SimData.last_names().size(), "prefix": SimData.prefixes().size(), "owners": SimData.owners().size(), "generic": SimData.headline_generic().size(), "carworld": SimData.headline_carworld().size(), "reactive_keys": rk}
		_check(c, cd)

func test_model_of() -> void:
	var cs := _cases("model_of")
	ok(cs.size() >= 3, "model_of: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.model_of(a[0]))

func test_job_type_of() -> void:
	var cs := _cases("job_type_of")
	ok(cs.size() >= 2, "job_type_of: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.job_type_of(a[0]))

func test_advert_by_id() -> void:
	var cs := _cases("advert_by_id")
	ok(cs.size() >= 2, "advert_by_id: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.advert_by_id(a[0]))

func test_faults_of_severity() -> void:
	var cs := _cases("faults_of_severity")
	ok(cs.size() >= 3, "faults_of_severity: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var ids: Array = []
		for f in SimData.faults_of_severity(a[0]):
			ids.append(f["id"])
		_check(c, ids)

func test_tier_mult() -> void:
	var cs := _cases("tier_mult")
	ok(cs.size() >= 3, "tier_mult: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.tier_mult(a[0]))
		_check(c, SimData.tier_mult(float(a[0])))

func test_fill_text() -> void:
	var cs := _cases("fill_text")
	ok(cs.size() >= 5, "fill_text: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.fill_text(a[0], a[1]))

func test_customer_name_seq() -> void:
	var cs := _cases("customer_name_seq")
	ok(cs.size() >= 2, "customer_name_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		for i in range(int(a[0])):
			out.append(SimData.customer_name(st))
		_check(c, out, st)

func test_owner_name_seq() -> void:
	var cs := _cases("owner_name_seq")
	ok(cs.size() >= 1, "owner_name_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		for i in range(int(a[0])):
			out.append(SimData.owner_name(st))
		_check(c, out, st)
```
Also add `test_simutil` (no golden): jround(2.5) == 3, jround(-2.5) == -2, jround(0.49) == 0, jround(1234.5) == 1235, jround(7.0) == 7 and typeof(jround(7.0)) == TYPE_INT; num_str(4) == "4", num_str(4.0) == "4", num_str(2.5) == "2.5", num_str(0.1) == "0.1", num_str(-3) == "-3"; and `test_fill_text_unknown_var`: fill_text("{car} {customer}", {"car": "X"}) == "X {customer}".

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh simdata` prints a last line starting `GOLDEN simdata OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/simdata.json'))['cases']))"` prints a number >= 22.
- `sh tools/godot/gtest.sh test_sim_simdata` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS02: SimUtil and SimData helpers for the sim ports`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
