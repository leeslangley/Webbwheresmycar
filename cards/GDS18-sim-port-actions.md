[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS18 Sim port: actions

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS18
Needs (already merged into `dev`): GDS12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/actions.js (buy_car, rent_car, return_rental, sell_to_dealer, buy_slot, wait_day) to `SimActions`.

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
- src/sim/actions.js (read fully) and tests/actions.test.mjs
- godot/sim/advance.gd, carstats.gd, simdata.gd

## Files you may change (and nothing else)
- `tools/godot/golden_actions.mjs`
- `godot/tests/golden/actions.json`
- `godot/sim/actions.gd`
- `godot/tests/test_sim_actions.gd`

## Steps
1. `tools/godot/golden_actions.mjs`: imports the six actions. Helpers: `sale(s)` / `rent(s)` = first listing of that mode in s.shop.listings; `base(seed)` = fresh(seed). Cases (`stateCase(fn, name, st, args, call)`; listing/car ids are read from the JS state when the case is built): buy_car: seeds 1..3 buying sale(s) (success); buying the rent listing (refusal 'No such car for sale on the telly'); unknown id 'L99'; no free slot (garageSlots 3 with three cars added); cash 100; rent_car: seeds 1..3 renting rent(s); renting a sale listing (refusal); no free slot; cash 50; return_rental: a rented car with condition 6 and rentedAtCondition 8 on a t1_robbin (damage fee 2 x 2% x basePrice); the same with condition 8 (no damage, fee 0); condition 9 (condition above start: still fee 0); an owned car (refusal 'That car is not one of your rentals'); cash 0 with damage (refusal 'Cannot afford the damage fee'); unknown car; sell_to_dealer: an owned t2_serious cond 6 (success); a rented car (refusal 'You do not own that car'); a consigned car (st.auction.consigned = [{carId: id, reserve: 100}]; refusal 'Withdraw it from the auction first'); unknown car; buy_slot: garageSlots 3 cash 20000 (success); garageSlots 8 (refusal 'Garage is full-size already'); cash 2999 (refusal 'Not enough money'); wait_day: seeds 1..3. Each success also checks the new car's full object in the `after` state. Run `sh tools/godot/golden_run.sh actions`.
2. Create `godot/sim/actions.gd`: `class_name SimActions`, `extends RefCounted`, all functions `static`. Constants `SLOT_COST := 3000`, `MAX_SLOTS := 8`, `DEALER_CUT := 0.6`. Private helpers `_find_listing`, `_find_car`, `_remove_listing`, `_remove_car` (by id, as in the JS), `_slot_and_cash_refusal(state, cost) -> String` ("No free garage slot" when cars.size() >= garageSlots, then "Not enough money" when cash < cost, else ""), `_succeed(state, msg) -> Dictionary` (pending.append(msg); SimAdvance.advance_day(state); return {ok true, msg}). `buy_car(state, listing_id)`: listing missing or mode != "sale" -> {ok false, msg "No such car for sale on the telly"}; refusal text from the helper; success: car = {id "c" + str(nextId) (nextId += 1), modelId, owned true, owner null, rentMonthly 0, paid listing.price, condition listing.condition, fault null, lastServiceDay state.day, jobsDone 0, boughtDay state.day, impoundedUntil 0, rentedAtCondition null}; cars.append; cash -= price; remove listing; stats.carsBought += 1; _succeed("Bought the " + model.name + " for " + CoreFormat.money(price)). `rent_car(state, listing_id)`: mode != "rent" -> "No such car for rent on the telly"; same refusals; car with owned false, owner listing.owner, rentMonthly listing.price, paid 0, rentedAtCondition listing.condition (rest as above); cash -= price; remove listing; _succeed("Rented the " + model.name + " from " + listing.owner). `return_rental(state, car_id)`: car missing or car.owned != false -> "That car is not one of your rentals"; `damage = maxf(0.0, car.rentedAtCondition - car.condition)`; `fee = SimUtil.jround(damage * 0.02 * model.basePrice)`; cash < fee -> "Cannot afford the damage fee"; cash -= fee; remove car; _succeed("Returned the " + model.name + " to " + car.owner + ". Damage fee: " + money(fee) + "."). `sell_to_dealer(state, car_id)`: car missing or owned != true -> "You do not own that car"; carId in state.auction.consigned -> "Withdraw it from the auction first"; `price = int(CoreRng.round_to(SimCarStats.market_value(state, model, car) * DEALER_CUT, 10))`; remove car; cash += price; stats.carsSold += 1; _succeed("Sold the " + model.name + " to the dealer for " + money(price) + "."). `buy_slot(state)`: garageSlots >= MAX_SLOTS -> "Garage is full-size already"; cash < SLOT_COST -> "Not enough money"; cash -= 3000; garageSlots += 1; _succeed("Bought another garage slot for " + money(SLOT_COST) + "."). `wait_day(state)` = _succeed(state, "You put the kettle on. Nothing happens. Lovely."). All refusals are {ok false, msg} and change nothing.
3. Create `godot/tests/test_sim_actions.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `actions`) and exactly these test methods:
```
func test_buy_car() -> void:
	var cs := _cases("buy_car")
	ok(cs.size() >= 7, "buy_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.buy_car(st, a[0]), st)

func test_rent_car() -> void:
	var cs := _cases("rent_car")
	ok(cs.size() >= 6, "rent_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.rent_car(st, a[0]), st)

func test_return_rental() -> void:
	var cs := _cases("return_rental")
	ok(cs.size() >= 6, "return_rental: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.return_rental(st, a[0]), st)

func test_sell_to_dealer() -> void:
	var cs := _cases("sell_to_dealer")
	ok(cs.size() >= 4, "sell_to_dealer: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.sell_to_dealer(st, a[0]), st)

func test_buy_slot() -> void:
	var cs := _cases("buy_slot")
	ok(cs.size() >= 3, "buy_slot: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.buy_slot(st), st)

func test_wait_day() -> void:
	var cs := _cases("wait_day")
	ok(cs.size() >= 3, "wait_day: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.wait_day(st), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh actions` prints a last line starting `GOLDEN actions OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/actions.json'))['cases']))"` prints a number >= 29.
- `sh tools/godot/gtest.sh test_sim_actions` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS18: Sim port: actions`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
