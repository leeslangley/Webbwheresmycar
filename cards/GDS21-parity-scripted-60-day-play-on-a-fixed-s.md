[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS21 Parity: scripted 60-day play on a fixed seed

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS21
Needs (already merged into `dev`): GDS20
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
End-to-end parity: a JS bot plays 60 turns on seed 11 through the dispatch table; the GDScript Game replays the exact same recorded actions and must produce the same cash, reputation, buzz and day series and the same final state. Also creates tools/godot/golden_bot.mjs, the bot that GDS22 ports.

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
- tests/playthrough.test.mjs (the original bot: functions bot and actOrWait; read all of it)
- tools/godot/golden_dispatch.mjs (GDS20)
- godot/autoload/game.gd (GDS20: Game.act)

## Files you may change (and nothing else)
- `tools/godot/golden_bot.mjs`
- `tools/godot/golden_playthrough.mjs`
- `godot/tests/golden/playthrough.json`
- `godot/tests/test_playthrough.gd`

## Steps
1. `tools/godot/golden_bot.mjs` exports `chooseAction(state)` -> [action, params] or null, using `dispatch`-style action names (GDS20) and the JS helpers isAuctionDay, modelOf, effD, effR, isAvailable. Priority rules (first match wins): 1 gameOver -> null. 2 isAuctionDay(state.day) -> ['attend_auction', {}]. 3 no cars: the sale listing with the lowest price that is <= cash (strictly lower price replaces the best) -> ['buy_car', {listingId}], none -> ['wait_day', {}]. 4 the first car with a fault and cash >= fault.cost -> ['fix_fault', {carId}]. 5 for each request in order that is not expired (expiresDay >= day): the FIRST car (in garage order) that isAvailable and has effD(model, car) >= minDesirability and effR >= minReliability and condition >= minCondition; among those requests the one with the highest fee (a strictly higher fee replaces) -> ['accept_job', {requestId, carId}]. 6 cash > 6000 and buzz < 20 -> ['advertise', {mediaId: 'magazine'}]. 7 the first car with condition < 4 while cash > 400 -> ['service_car', {carId, kind: 'full'}]. 8 -> ['wait_day', {}]. It also exports `runBot(state, maxCalls)`: loop up to maxCalls bot calls; each call: `a = chooseAction(state)`; null -> stop; `r = dispatch(state, a[0], a[1])`; record a step; if `r.ok` is false also run `dispatch(state, 'wait_day', {})` and record that as a second step (one bot call = one day); returns the array of recorded steps `{ action, params, result, day, cash, reputation, buzz, cars, gameOver }` (the same record shape as GDS20, taken after each dispatch).
2. `tools/godot/golden_playthrough.mjs`: `const s = fresh(11); const steps = runBot(s, 60);` emits one case `pureCase('playthrough', 'seed 11, 60 bot calls', [11], { steps: steps, final: s })`. The script THROWS unless steps contains at least 6 distinct action names. Run `sh tools/godot/golden_run.sh playthrough`.
3. `godot/tests/test_playthrough.gd` (`extends "res://tests/harness.gd"`): `test_replay_matches_js`: `var g = load("res://autoload/game.gd").new()`, `g.autosave = false`, `g.new_game(int(a[0]))` (a = the case args), then for every recorded step call `g.act(step["action"], step["params"])` and compare: the result Dictionary with step.result (GoldenUtil.diff, message names the step index and action), then day, cash, reputation, buzz, cars.size() and flags.gameOver with the step's recorded values; at the end `GoldenUtil.diff(g.state, final) == ""` (so rng, headlines, listings, lots, stats all agree). Free the instance. `test_series_summary`: separately assert from the golden data (not from Godot) that the recorded cash series has 60 or more entries and that the last step's day is greater than 40.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh playthrough` prints a last line starting `GOLDEN playthrough OK`.
- `python3 -c "import json;d=json.load(open('godot/tests/golden/playthrough.json'));print(len(d['cases'][0]['result']['steps']))"` prints a number >= 60.
- `sh tools/godot/gtest.sh test_playthrough` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files; if the replay finds a mismatch in a sim port, do NOT patch the port: finish with STATUS: BLOCKED naming the step, the action and the first diff text.
- No UI.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS21: Parity: scripted 60-day play on a fixed seed`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
