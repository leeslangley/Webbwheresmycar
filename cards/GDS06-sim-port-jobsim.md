[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS06 Sim port: jobsim

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS06
Needs (already merged into `dev`): GDS02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/jobsim.js (daily customer booking requests: expire_requests, generate_requests) to `SimJobSim`.

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
- src/sim/jobsim.js (read fully) and tests/jobsim_requests.test.mjs
- godot/sim/simdata.gd (job_types, fill_text, customer_name)

## Files you may change (and nothing else)
- `tools/godot/golden_jobsim.mjs`
- `godot/tests/golden/jobsim.json`
- `godot/sim/jobsim.gd`
- `godot/tests/test_sim_jobsim.gd`

## Steps
1. `tools/godot/golden_jobsim.mjs`: imports expireRequests, generateRequests. Helper `req(id, exp)` = { id: id, jobTypeId: 'wedding', customer: 'Mrs Test', fee: 500, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: exp, blurb: 'x' }. Cases: (a) `stateCase('expire_requests', name, { day: 5, requests: [...] }, [], s => expireRequests(s))` for request lists [req('Q1',3), req('Q2',5), req('Q3',5), req('Q4',9)] (removes Q1 only), [] (nothing), and day 10 with the same list (removes all); (b) for seed 1..6 and (rep, buzz) in [[0,0],[40,0],[100,100]]: `stateCase('generate_requests', 's' + seed + ' rep' + rep + ' buzz' + buzz, <fresh(seed) with .reputation = rep, .buzz = buzz>, [], s => generateRequests(s))` (18 cases); (c) for seed 1..3: fresh(seed) with rep 100, buzz 100 and `requests` pre-filled with 5 copies req('Q1'..'Q5', 99): name 'cap 5'; and the same with 6 requests: name 'cap 6'. Run `sh tools/godot/golden_run.sh jobsim`.
2. Create `godot/sim/jobsim.gd`: `class_name SimJobSim`, `extends RefCounted`, all functions `static`. Constants `const MAX_REQUESTS := 6`, `const FEE_MULT := 1.4`, `const EASE_DESIRABILITY := 1`, `const EASE_RELIABILITY := 1`. Functions: `expire_requests(state) -> int`: keep (in order) requests with expiresDay >= state.day, return the number removed; assign the kept Array back with `state["requests"] = kept`. `generate_requests(state) -> int`: `expected = 0.20 + 0.006 * state.reputation + 0.015 * state.buzz`; `whole = floori(expected)`; `n = whole`; `if CoreRng.chance(state, expected - whole): n += 1` (this draw ALWAYS happens); `added = 0`; loop i < n: break when requests.size() >= MAX_REQUESTS; then, in THIS draw order: `job = CoreRng.pick(state, SimData.job_types())`; `customer = SimData.customer_name(state)`; `fee = SimUtil.jround((job.feeMin + CoreRng.rand(state) * (job.feeMax - job.feeMin)) * (0.85 + 0.30 * state.reputation / 100.0) * FEE_MULT)`; then the request: `id = "Q" + str(state.nextId)` and `nextId += 1` (before the next draw), jobTypeId = job.id, customer, fee, minDesirability = maxi/maxf(0, job.minD - EASE_DESIRABILITY), minReliability = max(0, job.minR - EASE_RELIABILITY), minCondition = job.minCond, expiresDay = state.day + CoreRng.rand_int(state, 4, 9), blurb = SimData.fill_text(CoreRng.pick(state, job.blurbs), {"customer": customer}) (the expiresDay draw comes BEFORE the blurb draw); append; added += 1. Return added. The key order inside the Dictionary does not matter, the draw order does.
3. Create `godot/tests/test_sim_jobsim.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `jobsim`) and exactly these test methods:
```
func test_expire_requests() -> void:
	var cs := _cases("expire_requests")
	ok(cs.size() >= 3, "expire_requests: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimJobSim.expire_requests(st), st)

func test_generate_requests() -> void:
	var cs := _cases("generate_requests")
	ok(cs.size() >= 24, "generate_requests: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimJobSim.generate_requests(st), st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh jobsim` prints a last line starting `GOLDEN jobsim OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/jobsim.json'))['cases']))"` prints a number >= 27.
- `sh tools/godot/gtest.sh test_sim_jobsim` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS06: Sim port: jobsim`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
