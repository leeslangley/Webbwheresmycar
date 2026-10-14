[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS09 Sim port: auction lots, reveals, consigning

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS09
Needs (already merged into `dev`): GDS03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First third of src/sim/auction.js in `SimAuction`: lot generation (prepare_auction), the safe player view (lot_view), paid stat reveals (reveal_stat), consign_car and unconsign. Bidding (GDS10) and attend_auction (GDS13) are added to the same file later.

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
- src/sim/auction.js lines 1-200 (header to unconsign; read the rest only to know what comes later) and tests/auction_lots.test.mjs
- godot/sim/carstats.gd (SimCarStats.market_value), godot/sim/simdata.gd

## Files you may change (and nothing else)
- `tools/godot/golden_auction_lots.mjs`
- `godot/tests/golden/auction_lots.json`
- `godot/sim/auction.gd`
- `godot/tests/test_sim_auction_lots.gd`

## Steps
1. `tools/godot/golden_auction_lots.mjs`: imports prepareAuction, lotView, revealStat, consignCar, unconsign. Cases: (a) for seed 1..6 with day in [1, 40, 200] (18 cases): `stateCase('prepare_auction', 's' + seed + ' day' + day, <fresh(seed) with .day = day>, [], s => prepareAuction(s))`; (b) lot_view on fresh(3): one case per lot (6) `stateCase('lot_view', 'lot ' + i, st, [st.auction.lots[i].lotId], (s, id) => lotView(s, id))`; one case where lots[0].revealed.desirability and .condition are true and revealCount 2 (name 'revealed two'); one with currentBid 800 and leader 'ai' (name 'bid placed'); one for unknown id 'A999' (result null); (c) reveal_stat on fresh(3) (each `stateCase('reveal_stat', name, st, [lotId, stat], (s, id, stat) => revealStat(s, id, stat))`): lots[0] 'desirability'; lots[0] 'condition'; 'bogus' stat; a stat already revealed (set lots[0].revealed.maintenance true); a lot with revealCount 2 asking 'reliability'; cash set to 100; unknown lot 'A999'; (d) consign_car (stateCase('consign_car', name, st, [carId, reserve], ...)) on fresh(3) with `addCar(st, 't2_serious', {condition: 6})` and a rented car `addCar(st, 't1_robbin', {owned: false, owner: 'Big Baz', rentMonthly: 200, rentedAtCondition: 5})`: day 10 owned car reserve 5000; reserve 0; reserve 12.5; reserve -5; reserve '800' (a string); the rented car; unknown car 'c99'; an already consigned car (pre-set `st.auction.consigned = [{carId: <id>, reserve: 100}]`); day 24 (auction day refusal); (e) unconsign: a consigned car (success) and a car that is not consigned. Run `sh tools/godot/golden_run.sh auction_lots`.
2. Create `godot/sim/auction.gd`: `class_name SimAuction`, `extends RefCounted`, all functions `static`. Add `const AUCTION_REVEAL_COST := 150` and `const STATS := ["desirability", "maintenance", "reliability", "condition"]`. Functions (leave room: GDS10 and GDS13 append more functions to this file): `_find_lot(state, lot_id) -> Variant` (Dictionary or null); `_find_car(state, car_id)` and `_remove_car(state, car_id) -> bool` (same as the JS helpers); `_make_lot(state, exclude_model_ids: Array) -> Dictionary`: draws in THIS order: `tier = int(CoreRng.weighted(state, [{"tier": 1, "w": 40}, {"tier": 2, "w": 40}, {"tier": 3, "w": 20}])["tier"])`; model = CoreRng.pick over the models of that tier not in exclude (file order); `condition = CoreRng.round_to(2.0 + 7.0 * CoreRng.rand(state), 0.1)`; `value = SimCarStats.market_value(state, model, {"condition": condition})`; three ceilings each `SimUtil.jround(value * (0.70 + 0.50 * CoreRng.rand(state)))`; append model id to exclude; return {lotId "A" + str(nextId) (then nextId += 1), modelId, condition, reserve = int(CoreRng.round_to(value * 0.7, 10)), revealCount 0, revealed {desirability false, maintenance false, reliability false, condition false}, currentBid 0, leader "house", ceilings}. `prepare_auction(state) -> void`: `state.auction.month = CoreClock.date_of(state.day).month`; lastResults = []; 6 lots via _make_lot sharing one exclude Array; `state.auction.lots = lots`. `lot_view(state, lot_id) -> Variant`: null for an unknown lot, else Dictionary with keys lotId, modelId, name, year, archetype (from the model), estLow = int(CoreRng.round_to(est * 0.65, 10)), estHigh = int(CoreRng.round_to(est * 1.35, 10)) where est = market_value(state, model, {"condition": 5.0}), revealed (copy of the 4 flags), values (only the revealed stats: desirability/maintenance/reliability from the MODEL, condition from the LOT), reserve, currentBid, leader, revealCount. `reveal_stat(state, lot_id, stat) -> Dictionary` with these refusals in this order (msg exact, all end with a full stop): no lot "No such lot."; stat not in STATS "That is not a stat you can reveal."; already revealed "Already revealed that one."; revealCount >= 2 "Max 2 reveals per lot."; cash < 150 "Not enough cash for a peek."; success: cash -= 150, flag true, revealCount += 1, {ok true, msg "Stat revealed."}. `consign_car(state, car_id, reserve: Variant) -> Dictionary`, refusals in order: CoreClock.is_auction_day(state.day) "Too late: it is auction day."; no car "No such car in the garage."; car.owned is not true "You cannot consign a car you only rent."; already in state.auction.consigned "That car is already consigned."; reserve invalid (not an int or float, or a float with a fraction, or < 0) "The reserve must be a whole amount of " + CoreFormat.money(0) + " or more."; success: append {carId, reserve (as int)} and return {ok true, msg "Consigned the " + model.name + " with a reserve of " + CoreFormat.money(reserve) + "."}. `unconsign(state, car_id) -> Dictionary`: remove the entry -> {ok true, msg "The car is out of the auction."}, else {ok false, msg "That car is not consigned."}.
3. Create `godot/tests/test_sim_auction_lots.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `auction_lots`) and exactly these test methods:
```
func test_prepare_auction() -> void:
	var cs := _cases("prepare_auction")
	ok(cs.size() >= 18, "prepare_auction: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimAuction.prepare_auction(st)
		_check(c, null, st)

func test_lot_view() -> void:
	var cs := _cases("lot_view")
	ok(cs.size() >= 9, "lot_view: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.lot_view(st, a[0]), st)

func test_reveal_stat() -> void:
	var cs := _cases("reveal_stat")
	ok(cs.size() >= 7, "reveal_stat: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.reveal_stat(st, a[0], a[1]), st)

func test_consign_car() -> void:
	var cs := _cases("consign_car")
	ok(cs.size() >= 9, "consign_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.consign_car(st, a[0], a[1]), st)

func test_unconsign() -> void:
	var cs := _cases("unconsign")
	ok(cs.size() >= 2, "unconsign: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.unconsign(st, a[0]), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh auction_lots` prints a last line starting `GOLDEN auction_lots OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/auction_lots.json'))['cases']))"` prints a number >= 45.
- `sh tools/godot/gtest.sh test_sim_auction_lots` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS09: Sim port: auction lots, reveals, consigning`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
