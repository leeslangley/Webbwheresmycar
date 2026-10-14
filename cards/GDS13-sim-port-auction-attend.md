[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS13 Sim port: auction attend

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS13
Needs (already merged into `dev`): GDS10, GDS12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Last third of src/sim/auction.js: attend_auction (auction-day settlement: consigned cars under the hammer, then the lots the player leads) appended to `SimAuction`.

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
- src/sim/auction.js lines 290-339 (attendAuction) and tests/auction_bids.test.mjs (attend cases)
- godot/sim/auction.gd (GDS09/GDS10) and godot/sim/advance.gd (GDS12)

## Files you may change (and nothing else)
- `tools/godot/golden_auction_attend.mjs`
- `godot/tests/golden/auction_attend.json`
- `godot/sim/auction.gd`
- `godot/tests/test_sim_auction_attend.gd`

## Steps
1. `tools/godot/golden_auction_attend.mjs`: imports attendAuction. Helper `day24(seed)` = fresh(seed) with .day = 24 and .cash = 50000. Every case is `stateCase('attend_auction', name, st, [], s => attendAuction(s))`: A1: day24(1) nothing consigned, nobody leads (msg 'The gavel fell on nothing at all.'); A2-A5: day24(s) for s in 2..5 with `const car = addCar(st, 't2_serious', {condition: 6})` and `st.auction.consigned = [{carId: car.id, reserve: 100}]` (sold, different rng draws); A6: day24(2) with the same car and reserve 900000 (fails the reserve); A7: a consigned entry whose car does not exist (carId 'c99'); A8: day24(3) with lots[0].leader = 'player', lots[0].currentBid = 1500 (won; one slot free since there are no cars); A9: the same but cash 1000 (could not pay: reputation -2); A10: the same but garageSlots 1 with one car added (garage full); A11: two consigned cars (t1_allergy cond 7 reserve 100, t3_porshe cond 9 reserve 100) plus lots[1] and lots[2] led by the player with currentBid 2000 and 2500 and garageSlots 5; A12: day 10 (refusal: only on day 24); A13: day24(4) with st.auction.attendedDay = 24 (refusal: already been); A14: a sale that sets a new stats.bestAuctionSale (consign a t3_aston cond 10 with reserve 100 and stats.bestAuctionSale 5). The script THROWS unless at least one case sold a car (results contain 'Sold the') and at least one contains 'could not pay'. Run `sh tools/godot/golden_run.sh auction_attend`.
2. Append to `godot/sim/auction.gd` (keep everything earlier): `attend_auction(state) -> Dictionary`. Refusals: not CoreClock.is_auction_day -> {ok false, msg "The auction is only on day 24 of the month."}; `state.auction.get("attendedDay") == state.day` -> {ok false, msg "You have already been to this auction."}. `results = []`. (1) `consigned = state.auction.consigned.duplicate()`; for each entry: remove it from state.auction.consigned (find by carId); `car = _find_car(...)`; if null continue (NO rng draw); `model = SimData.model_of(car.modelId)`; `price = SimUtil.jround(SimCarStats.market_value(state, model, car) * (0.85 + 0.40 * CoreRng.rand(state)))`; if price >= entry.reserve: `fee = SimUtil.jround(price * 0.08)`; cash += price - fee; _remove_car; stats.carsSold += 1; stats.bestAuctionSale = maxi(stats.bestAuctionSale, price); results.append("Sold the " + model.name + " for " + CoreFormat.money(price) + " (fee " + CoreFormat.money(fee) + ")"); else results.append("The " + model.name + " failed to meet its reserve"). (2) for each lot in state.auction.lots (in order) whose leader == "player": model; if cash >= lot.currentBid and cars.size() < garageSlots: cash -= currentBid; push a new car {id "c" + str(nextId) (nextId += 1), modelId, owned true, owner null, rentMonthly 0, paid lot.currentBid, condition lot.condition, fault null, lastServiceDay state.day, jobsDone 0, boughtDay state.day, impoundedUntil 0, rentedAtCondition null}; stats.carsBought += 1; results.append("You won the " + model.name + " for " + CoreFormat.money(lot.currentBid) + "."); else reputation = maxi(0, reputation - 2) and results.append("You could not pay for the " + model.name + "."). (3) `state.auction.lots = []`; `state.auction.lastResults = results`; every result appended to state.pending; `state.auction.attendedDay = state.day`; `msg = " ".join(results) if results.size() > 0 else "The gavel fell on nothing at all."`; SimAdvance.advance_day(state); return {ok true, msg, results}.
3. Create `godot/tests/test_sim_auction_attend.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `auction_attend`) and exactly these test methods:
```
func test_attend_auction() -> void:
	var cs := _cases("attend_auction")
	ok(cs.size() >= 14, "attend_auction: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.attend_auction(st), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh auction_attend` prints a last line starting `GOLDEN auction_attend OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/auction_attend.json'))['cases']))"` prints a number >= 14.
- `sh tools/godot/gtest.sh test_sim_auction_attend` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS13: Sim port: auction attend`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
