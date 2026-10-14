[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS12 Sim port: advance (the day clock)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS12
Needs (already merged into `dev`): GDS05, GDS06, GDS07, GDS08, GDS11
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/advance.js (advance_day: decay, buzz fade, calendar, month-end, phone, shop refresh, plates, situations, headline, end check; and start_of_day_flags) to `SimAdvance`. This is the heart of the sim: every action ends with it.

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
- src/sim/advance.js (read fully) and tests/advance.test.mjs
- godot/sim/month.gd, jobsim.gd, shop.gd, endgame.gd, news.gd, carstats.gd (GDS03-GDS11)

## Files you may change (and nothing else)
- `tools/godot/golden_advance.mjs`
- `godot/tests/golden/advance.json`
- `godot/sim/advance.gd`
- `godot/tests/test_sim_advance.gd`

## Steps
1. `tools/godot/golden_advance.mjs`: imports advanceDay, startOfDayFlags. `stateCase('advance_day', name, st, [], s => advanceDay(s))` on these states (name them S1..S19 plus a short description): S1-S8: fresh(1)..fresh(8) unchanged (day 1 -> 2); S9: fresh(2) with day 31 and cars `addCar(s,'t1_allergy',{condition:6})`, `addCar(s,'t3_porshe',{condition:8})`, `addCar(s,'t1_robbin',{owned:false, owner:'Big Baz', rentMonthly:260, rentedAtCondition:5, condition:4})` (month end on Feb 1); S10: fresh(3) day 23 (auction day tomorrow); S11: fresh(4) day 364; S12: fresh(5) day 365 (year over: no bills, no phone); S13: fresh(6) with flags.gameOver = true (nothing changes); S14: fresh(7) with reputation 85 (a plate is won); S15: fresh(8) with cash 500 (broke); S16: fresh(9) with cash 60000 (rich); S17: fresh(10) with three cars added (garageSlots 3: full garage), pending ['A note'] and sit ['bigwin']; S18: fresh(11) with day 7 and two requests {id:'Q81', expiresDay:5, ...} and {id:'Q82', expiresDay:20, ...} (any other fields as in a normal request: jobTypeId 'wedding', customer 'Mrs Test', fee 500, minDesirability 1, minReliability 1, minCondition 1, blurb 'x') (shop refresh on day 8, expiry); S19: fresh(12) with day 31, cash -3000 (bankrupt at month end). Then `stateCase('advance_seq', 'sixty days seed 2', S, [60], (s, n) => { const out = []; for (let i = 0; i < n; i++) { advanceDay(s); out.push([s.day, s.cash, s.reputation, s.buzz, s.today.headline, s.today.events.length, s.requests.length]); } return out; })` where S = fresh(2) with two cars added (a t1_allergy cond 6 and a t2_serious cond 7). Then `stateCase('start_of_day_flags', 'day ' + d, { day: d }, [], s => startOfDayFlags(s))` for d in [1, 10, 24, 365]. Run `sh tools/godot/golden_run.sh advance`.
2. Create `godot/sim/advance.gd`: `class_name SimAdvance`, `extends RefCounted`, all functions `static`. `advance_day(state) -> void`, steps in this order (follow the JS comments (1)-(13)): if flags.gameOver: return. (1) every car: `SimCarStats.change_condition(car, -SimCarStats.idle_decay(SimData.model_of(car.modelId)))`. (2) `state.buzz = maxf(0.0, CoreRng.round_to(state.buzz * 0.9, 0.1))`. (3) day += 1. (4) `events = state.pending.duplicate()`, `sit = state.sit.duplicate()`, then `state.pending = []`, `state.sit = []`, `month_report = null`. (5) if state.day > CoreClock.DAYS_IN_YEAR: `state.today = {day, headline "", events, monthReport null}`; SimEndGame.check_end(state); return. (6) if CoreClock.is_month_start(state.day): month_report = SimMonth.month_end(state); events.append("Month end: bills of " + CoreFormat.money(month_report.total)); each newFaults string appended; sit.append("monthend"). (7) SimJobSim.expire_requests(state); if SimJobSim.generate_requests(state) > 0: events.append("The phone rings: new booking request(s)!"). (8) if SimShop.should_refresh(state.day): SimShop.refresh_shop(state); events.append("New cars on the TV!"). (9) for key in SimEndGame.evaluate_plates(state): events.append("GOLD NUMBER PLATE won: " + SimEndGame.plate_info()[key].name + "!"). (10) sit: cash < 1000 "broke"; cash > 50000 "rich"; cars.size() >= garageSlots "fullgarage"; cars.size() == 0 "emptygarage"; CoreClock.is_auction_day(day) "auctionday" (appended in this order). (11) `ctx = {"cash": state.cash}`; if cars is not empty: `ctx["car"] = SimData.model_of(CoreRng.pick(state, state.cars).modelId).name` (a draw); if requests is not empty: `ctx["customer"] = CoreRng.pick(state, state.requests).customer` (a draw, after the car draw); `headline = SimNews.choose_headline(state, sit, ctx)`. (12) `state.today = {day, headline, events, monthReport: month_report}`. (13) SimEndGame.check_end(state). `start_of_day_flags(state) -> Dictionary` = {isAuctionDay: CoreClock.is_auction_day(day), isMonthStart: CoreClock.is_month_start(day), daysLeftInYear: CoreClock.DAYS_IN_YEAR - day}.
3. Create `godot/tests/test_sim_advance.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `advance`) and exactly these test methods:
```
func test_advance_day() -> void:
	var cs := _cases("advance_day")
	ok(cs.size() >= 19, "advance_day: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimAdvance.advance_day(st)
		_check(c, null, st)

func test_advance_seq() -> void:
	var cs := _cases("advance_seq")
	ok(cs.size() >= 1, "advance_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		for i in range(int(a[0])):
			SimAdvance.advance_day(st)
			out.append([st["day"], st["cash"], st["reputation"], st["buzz"], st["today"]["headline"], st["today"]["events"].size(), st["requests"].size()])
		_check(c, out, st)

func test_start_of_day_flags() -> void:
	var cs := _cases("start_of_day_flags")
	ok(cs.size() >= 4, "start_of_day_flags: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAdvance.start_of_day_flags(st), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh advance` prints a last line starting `GOLDEN advance OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/advance.json'))['cases']))"` prints a number >= 24.
- `sh tools/godot/gtest.sh test_sim_advance` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS12: Sim port: advance (the day clock)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
