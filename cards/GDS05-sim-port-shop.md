[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS05 Sim port: shop

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS05
Needs (already merged into `dev`): GDS03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/shop.js (TV shop listings: make_listing, init_shop, should_refresh, refresh_shop) to `SimShop`.

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
- src/sim/shop.js (read fully) and tests/shop.test.mjs
- godot/sim/carstats.gd (SimCarStats.value_factor), godot/sim/simdata.gd (cars, owner_name)

## Files you may change (and nothing else)
- `tools/godot/golden_shop.mjs`
- `godot/tests/golden/shop.json`
- `godot/sim/shop.gd`
- `godot/tests/test_sim_shop.gd`

## Steps
1. `tools/godot/golden_shop.mjs`: imports shop.js. Cases: (a) for seed 1..8: `stateCase('make_listing', 'default s' + seed, fresh(seed), [{}], (s, o) => makeListing(s, o))`; (b) for seed 1..4 and each opts in [{mode:'sale', tier:1, maxPrice:14000, excludeModelIds:['t1_allergy','t1_robbin']}, {mode:'rent', tier:2}, {tier:3}, {mode:'sale', maxPrice:6000}]: the same stateCase with that opts (16 cases); (c) seeds 1..5: `stateCase('init_shop', name, <fresh(seed) with .day = 3>, [], s => initShop(s))`; (d) `pureCase('should_refresh', 'day ' + d, [d], shouldRefresh(d))` for d in [1, 2, 7, 8, 9, 15, 22, 29, 36, 365]; (e) seeds 1..6: `stateCase('refresh_shop', name, <fresh(seed) with .day = 8>, [], s => refreshShop(s))`; (f) `refresh_shop` on fresh(2) with day 8 and `shop.listings.length = 2` (case name 'short board'); (g) `refresh_shop` on fresh(3) with day 8 and `shop.listings = []` (name 'empty board'). Run `sh tools/godot/golden_run.sh shop`.
2. Create `godot/sim/shop.gd`: `class_name SimShop`, `extends RefCounted`, all functions `static`. Port the 10 BLURBS strings character for character (some contain double quotes: use single-quoted GDScript strings or escape them) as `const BLURBS := [...]`. Functions: `_tier_candidates(tier, exclude_model_ids: Array) -> Array` (models of that tier, file order, not excluded; compare `int(model["tier"]) == int(tier)`). `make_listing(state, opts: Dictionary = {}) -> Dictionary`: `mode = opts.get("mode")`; if it is null or "" draw `"sale" if CoreRng.chance(state, 0.6) else "rent"` (ONE draw, before the attempt loop, only when no mode was given); `exclude = opts.get("excludeModelIds", [])`; `max_price = opts.get("maxPrice")` (null when absent); loop attempt 0..19: `tier = opts.get("tier")`; if null/0 -> `int(CoreRng.weighted(state, [{"tier": 1, "w": 50}, {"tier": 2, "w": 35}, {"tier": 3, "w": 15}])["tier"])` (draw only when no tier was given); candidates empty -> continue; `model = CoreRng.pick(state, candidates)`; `top = 7.0 if tier == 3 else 8.0`; `condition = CoreRng.round_to(3.0 + CoreRng.rand(state) * (top - 3.0), 0.1)`; price: sale -> `SimUtil.jround(model.basePrice * SimCarStats.value_factor({"condition": condition}) * state.market.priceMult * (0.9 + 0.2 * CoreRng.rand(state)))`; rent -> `SimUtil.jround(model.baseRent * (0.9 + 0.2 * CoreRng.rand(state)))`; if max_price != null and price > max_price -> continue; then build the result in THIS order: listingId = "L" + str(state["nextId"]) and `state["nextId"] += 1`; modelId; mode; price; condition; owner = `SimData.owner_name(state)` for rent else null (draw happens here); blurb = `CoreRng.pick(state, BLURBS)` (draw after the owner). Keys: listingId, modelId, mode, price, condition, owner, blurb. After 20 failed attempts `push_error("makeListing: no car fits")` and return {}. `init_shop(state) -> void`: listings = []; exclude = []; 3x make_listing({mode sale, tier 1, maxPrice 14000, excludeModelIds exclude}); then 2x ({mode rent, tier: CoreRng.rand_int(state, 2, 3), excludeModelIds}) (the tier is drawn when building opts, BEFORE make_listing runs); then 3x ({excludeModelIds}); after each listing append its modelId to exclude and the listing to state.shop.listings; finally `state.shop.refreshedDay = state.day`. `should_refresh(day: int) -> bool` = day > 1 and day % 7 == 1. `refresh_shop(state) -> void`: `n = mini(CoreRng.rand_int(state, 1, 3), listings.size())` (the draw happens even for an empty board); n times `listings.remove_at(CoreRng.rand_int(state, 0, listings.size() - 1))`; exclude = modelIds of the remaining; n times make_listing({excludeModelIds}), append modelId to exclude and the listing to listings; `refreshedDay = state.day`.
3. Create `godot/tests/test_sim_shop.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `shop`) and exactly these test methods:
```
func test_make_listing() -> void:
	var cs := _cases("make_listing")
	ok(cs.size() >= 24, "make_listing: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimShop.make_listing(st, a[0]), st)

func test_init_shop() -> void:
	var cs := _cases("init_shop")
	ok(cs.size() >= 5, "init_shop: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimShop.init_shop(st)
		_check(c, null, st)

func test_should_refresh() -> void:
	var cs := _cases("should_refresh")
	ok(cs.size() >= 10, "should_refresh: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimShop.should_refresh(a[0]))

func test_refresh_shop() -> void:
	var cs := _cases("refresh_shop")
	ok(cs.size() >= 8, "refresh_shop: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimShop.refresh_shop(st)
		_check(c, null, st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh shop` prints a last line starting `GOLDEN shop OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/shop.json'))['cases']))"` prints a number >= 47.
- `sh tools/godot/gtest.sh test_sim_shop` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS05: Sim port: shop`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
