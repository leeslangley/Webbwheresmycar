[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS10 Sim port: auction bidding

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS10
Needs (already merged into `dev`): GDS09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Second third of src/sim/auction.js: bid_step, min_bid and place_bid appended to `SimAuction`.

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
- src/sim/auction.js lines 200-290 (bidStep, minBid, placeBid) and tests/auction_bids.test.mjs
- godot/sim/auction.gd (GDS09: existing helpers _find_lot etc.)

## Files you may change (and nothing else)
- `tools/godot/golden_auction_bids.mjs`
- `godot/tests/golden/auction_bids.json`
- `godot/sim/auction.gd`
- `godot/tests/test_sim_auction_bids.gd`

## Steps
1. `tools/godot/golden_auction_bids.mjs`: imports bidStep, minBid, placeBid. Helper `day24(seed)` = fresh(seed) with .day = 24 (auction day) and .cash = 50000. Cases: (a) `pureCase('bid_step', 'reserve ' + r, [r], bidStep({ reserve: r }))` for r in [100, 700, 1234, 5000, 40000]; (b) `pureCase('min_bid', name, [lot], minBid(lot))` for lot { reserve: 700, currentBid: 0 } and { reserve: 700, currentBid: 800 } and { reserve: 5000, currentBid: 5250 }; (c) place_bid cases `stateCase('place_bid', name, st, [lotId, steps], (s, id, n) => placeBid(s, id, n))`, st = day24(3) with lots[0].ceilings and lots[0].reserve edited as noted: ceilings [10, 10, 10] steps 1 (player leads); same steps 3; ceilings [999999, 1, 1] steps 1 (outbid); ceilings [999999, 1, 1] steps 3; steps 2 (refusal); lot already led by the player (leader 'player'); cash 50 (not enough); not an auction day (day 10); unknown lot 'A999'; garage full (st.garageSlots = 3 and three cars added with addCar); a lot where currentBid is already 2000 and ceilings [2100, 1, 1] (edge: best >= bid + step), and one with ceilings [2099, 1, 1] on the same setup (player leads); (d) a second lot already led by the player, one slot free, bidding on lots[1] (counts the leading lots against free slots): set lots[0].leader = 'player', garageSlots 3 with 2 cars added, bid on lots[1]. Run `sh tools/godot/golden_run.sh auction_bids`.
2. Append to `godot/sim/auction.gd` (keep everything GDS09 wrote): `bid_step(lot) -> int` = int(maxf(50.0, CoreRng.round_to(lot["reserve"] * 0.05, 10))); `min_bid(lot) -> int` = lot["reserve"] if lot["currentBid"] == 0 else lot["currentBid"] + bid_step(lot); `place_bid(state, lot_id, steps) -> Dictionary`, refusals in THIS order with exact messages: not CoreClock.is_auction_day(state.day) "Bidding only happens on auction day."; steps is not 1 and not 3 "Bid one step or three steps."; no lot "No such lot."; lot.leader == "player" "You are already winning" (no full stop); `step = bid_step(lot)`; `bid = min_bid(lot) + (steps - 1) * step`; cash < bid "Not enough cash for that bid."; `leading` = number of lots in state.auction.lots whose leader is "player"; cars.size() + leading >= garageSlots "No free garage slot to win another car."; `best = lot["ceilings"].max()`; if best >= bid + step: currentBid = bid + step, leader "ai", return {ok true, msg "Outbid! The bid is now " + CoreFormat.money(lot.currentBid) + ".", outbid true}; else currentBid = bid, leader "player", return {ok true, msg "You lead at " + CoreFormat.money(bid) + ".", outbid false}. No day passes and no rng is drawn.
3. Create `godot/tests/test_sim_auction_bids.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `auction_bids`) and exactly these test methods:
```
func test_bid_step() -> void:
	var cs := _cases("bid_step")
	ok(cs.size() >= 5, "bid_step: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimAuction.bid_step({"reserve": a[0]}))

func test_min_bid() -> void:
	var cs := _cases("min_bid")
	ok(cs.size() >= 3, "min_bid: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimAuction.min_bid(a[0]))

func test_place_bid() -> void:
	var cs := _cases("place_bid")
	ok(cs.size() >= 12, "place_bid: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.place_bid(st, a[0], a[1]), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh auction_bids` prints a last line starting `GOLDEN auction_bids OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/auction_bids.json'))['cases']))"` prints a number >= 21.
- `sh tools/godot/gtest.sh test_sim_auction_bids` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS10: Sim port: auction bidding`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
