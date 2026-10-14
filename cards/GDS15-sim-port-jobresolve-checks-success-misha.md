[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS15 Sim port: jobresolve (checks, success, mishap, breakdown)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS15
Needs (already merged into `dev`): GDS04, GDS12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/jobresolve.js accept_job: the refusals, the fault roll, the outcome roll and the success, mishap and breakdown branches. The disaster branch is a stub here and is finished by GDS16; the golden file covers ALL outcomes and this card's test skips the disaster ones.

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
- src/sim/jobresolve.js (read fully) and tests/jobresolve.test.mjs, tests/jobs_a.test.mjs
- godot/sim/faultsim.gd, advance.gd, carstats.gd, simdata.gd

## Files you may change (and nothing else)
- `tools/godot/golden_jobresolve.mjs`
- `godot/tests/golden/jobresolve.json`
- `godot/sim/jobresolve.gd`
- `godot/tests/test_sim_jobresolve.gd`

## Steps
1. `tools/godot/golden_jobresolve.mjs`: imports acceptJob, jobresolve helpers are private. Base state `base`: `const b = fresh(4); addCar(b, 't2_serious', {condition: 8.5}); b.requests = [{ id: 'Q900', jobTypeId: 'wedding', customer: 'Mrs Test', fee: 1200, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: b.day + 5, blurb: '' }];` (car id c<n> = b.cars[0].id). Define classify = (w, r) => { if (!r.ok) return null; const o = r.outcome; const car = w.cars[0]; if (o.type === 'success') return car.fault ? 'success_fault' : 'success'; if (o.type === 'mishap') return car.fault ? 'mishap_fault' : 'mishap'; if (o.type === 'breakdown') return 'breakdown'; return o.paid < 0 ? 'disaster_comp' : (car.impoundedUntil > 0 ? 'disaster_impound' : 'disaster_truck'); }. `const found = sweepSeeds(base, 1, 30000, (w) => acceptJob(w, 'Q900', base.cars[0].id), classify, 2);` The script THROWS unless found has all 8 kinds success, success_fault, mishap, mishap_fault, breakdown, disaster_truck, disaster_comp, disaster_impound. Cases (fn 'accept_job', args [requestId, carId]): for every kind and each of its (up to 2) seeds one case `stateCase('accept_job', kind + ' seed ' + seed, <base clone with .rng = seed>, ['Q900', carId], (s, r, c) => acceptJob(s, r, c))`; plus 'bigwin' = the first 'success' seed with the request fee changed to 2400; plus 'low fee' = the first success seed with fee 1999 (no bigwin); plus these refusals (rng 1 each): unknown request 'Q1'; unknown car 'c99'; expired (request.expiresDay = b.day - 1); car with fault {faultId:'puncture', label:'Puncture', cost:90} (not fit to go out); car impoundedUntil = b.day + 2; minDesirability 99; minReliability 99; minCondition 9.5 (car cond 8.5). Run `sh tools/godot/golden_run.sh jobresolve`.
2. Create `godot/sim/jobresolve.gd`: `class_name SimJobResolve`, `extends RefCounted`, all functions `static`. Constants `DISASTER_P := 0.007`, `MISHAP_P := 0.057`. Private helpers `_find_request`, `_find_car`, `_remove_request` (by id), `_bump_reputation(state, delta)` (reputation = CoreRng.clamp(reputation + delta, 0, 100)). `accept_job(state, request_id, car_id) -> Dictionary`: refusals IN THIS ORDER, each {ok false, msg}: no request "No such booking"; no car "No such car in the garage"; req.expiresDay < state.day "That booking has expired"; not SimCarStats.is_available "That car is not fit to go out"; model, car_d = eff_d, car_r = eff_r: car_d < req.minDesirability "The " + model.name + " is not desirable enough for this booking (needs " + SimUtil.num_str(req.minDesirability) + ")."; car_r < req.minReliability "The " + model.name + " is not reliable enough for this booking (needs " + num_str(req.minReliability) + ")."; car.condition < req.minCondition "The " + model.name + " is in too poor condition for this booking (needs " + num_str(req.minCondition) + ").". Then (draw order is the test): `job = SimData.job_type_of(req.jobTypeId)`; `fault = SimFaultSim.roll_fault(state, model, car, 1.0)`; `roll = CoreRng.rand(state)`; type = "disaster" if roll < DISASTER_P, "mishap" if roll < MISHAP_P, else "success"; if fault != null and fault.severity == "major": type = "breakdown"; `wear = CoreRng.round_to(job.wearMin + CoreRng.rand(state) * (job.wearMax - job.wearMin), 0.1)` (drawn for EVERY type); `paid = 0`; `fault_label = fault.label if fault != null else null`; `text = ""`. success: paid = fee; cash += fee; _bump_reputation(+3 if car_d >= req.minDesirability + 2 else +2); change_condition(car, -wear); car.jobsDone += 1; stats.jobsDone += 1; text = SimData.fill_text(CoreRng.pick(state, job.success), {customer, car: model.name}); if fault is minor or medium: apply_fault(car, fault) and text += " (Then the " + fault.label + " started.)". mishap: paid = SimUtil.jround(fee * 0.6); cash += paid; rep -1; change_condition(car, -wear * 2); jobsDone += 1; stats.jobsDone += 1; text = fill_text(pick(job.mishap), ...); if fault minor/medium: apply_fault (no text added). breakdown: paid = jround(fee * 0.25); cash += paid; rep -4; apply_fault(car, fault); stats.jobsFailed += 1; stats.faults += 1; state.sit.append("breakdown"); text = model.name + " broke down: " + fault.label + ". " + customer + " is not impressed." (NO pick draw). disaster: `var d := _apply_disaster(state, req, car, model, job, fee, wear)`; paid = d.paid; fault_label = d.faultLabel; text = d.text. `static func _apply_disaster(state, req, car, model, job, fee, wear) -> Dictionary` is a STUB in this card: body `push_error("disaster branch not ported yet (card GDS16)")` then `return {"paid": 0, "faultLabel": null, "text": ""}`. After the branches: if type is success or mishap and fee >= 2000: state.sit.append("bigwin"); `_remove_request(state, request_id)`; state.pending.append(text); SimAdvance.advance_day(state); return {ok true, msg text, outcome {type, paid, wear, faultLabel}}.
3. Create `godot/tests/test_sim_jobresolve.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `jobresolve`) and exactly these test methods:
```
func test_accept_job() -> void:
	var cs := _cases("accept_job")
	ok(cs.size() >= 25, "accept_job: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var skip: bool = c["result"].has("outcome") and c["result"]["outcome"]["type"] == "disaster"
		if skip:
			continue
		_check(c, SimJobResolve.accept_job(st, a[0], a[1]), st)
```
Also add `test_golden_has_all_kinds`: loop the cases of accept_job and assert that the outcome types success, mishap, breakdown and disaster all occur at least once in the golden file, and that a case named 'bigwin' exists (so the fixture is not hollow).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh jobresolve` prints a last line starting `GOLDEN jobresolve OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/jobresolve.json'))['cases']))"` prints a number >= 26.
- `sh tools/godot/gtest.sh test_sim_jobresolve` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS15: Sim port: jobresolve (checks, success, mishap, breakdown)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
