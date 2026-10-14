[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDS07 Sim port: news

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDS07
Needs (already merged into `dev`): GDS02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Port src/sim/news.js (the Daily Sprocket headline chooser) to `SimNews`.

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
- src/sim/news.js (read fully) and tests/news.test.mjs
- godot/sim/simdata.gd (headline_generic, headline_carworld, headline_reactive)

## Files you may change (and nothing else)
- `tools/godot/golden_news.mjs`
- `godot/tests/golden/news.json`
- `godot/sim/news.gd`
- `godot/tests/test_sim_news.gd`

## Steps
1. `tools/godot/golden_news.mjs`: imports chooseHeadline and GENERIC. States are minimal: `{ rng: seed, headlines: [] }`. Cases: (a) seeds 1..10 with situations [] and ctx {}: `stateCase('choose_headline', ..., st, [[], {}], (s, sits, ctx) => chooseHeadline(s, sits, ctx))`; (b) seeds 1..6 for each of these (situations, ctx) pairs: (['broke'], {cash: 420}), (['monthend','rich'], {cash: 75000, car: 'Austen Allergy'}), (['bigwin','viral'], {customer: 'Brian Prong'}), (['nonsense'], {}), (['breakdown'], {car: '', customer: '', cash: 'lots'}) (empty and non-money values fall back to the defaults) = 30 cases; (c) pre-filled history: seeds 1..5 with `headlines` = GENERIC.slice(0, 29) (29 entries) and situations [], plus the same with `headlines` = GENERIC.slice(0, 30) (30 entries, the new one pushes the oldest out so length stays 30): names 'history 29 s' and 'history 30 s'; (d) a sequence: `stateCase('choose_headline_seq', 'forty calls seed 3', { rng: 3, headlines: [] }, [40], (s, n) => { const out = []; const SITS = [[], ['broke'], ['rich', 'monthend'], ['viral', 'bigwin', 'zzz']]; for (let i = 0; i < n; i++) out.push(chooseHeadline(s, SITS[i % 4], i % 2 === 0 ? { cash: 1000 * i } : { cash: 1000 * i, car: 'Fjord Capri', customer: 'Kevin Pumphrey' })); return out; })`. Run `sh tools/godot/golden_run.sh news`.
2. Create `godot/sim/news.gd`: `class_name SimNews`, `extends RefCounted`, all functions `static`. Constants `MAX_HEADLINES := 30`, `POOL_RETRY := 10`. Functions: `_fill(text, ctx) -> String`: `text.replace("{car}", car).replace("{customer}", customer).replace("{cash}", cash)` in that order, where car = ctx["car"] if it is a non-empty String else "a mystery car"; customer likewise with "a mystery customer"; cash = CoreFormat.money(ctx["cash"]) if ctx["cash"] is an int or float, else "some money". `_seen_recently(state, text) -> bool`: true when text equals one of the first min(20, headlines.size()) entries. `choose_headline(state, situations: Array = [], ctx: Dictionary = {}) -> String`: if state["headlines"] is not an Array set it to []; `text = null`; `known` = the situations (in order) that are keys of SimData.headline_reactive(); `if known.size() > 0 and CoreRng.chance(state, 0.6)`: (the chance is drawn ONLY when known is non-empty) `sit = CoreRng.pick(state, known)`; `text = CoreRng.pick(state, SimData.headline_reactive()[sit])`. If text is still null: for attempt in range(POOL_RETRY): `story = CoreRng.weighted(state, [{"w": 55, "pool": SimData.headline_generic()}, {"w": 45, "pool": SimData.headline_carworld()}])`; `text = CoreRng.pick(state, story["pool"])`; break if not _seen_recently(state, text). Then `text = _fill(text, ctx)`; `state["headlines"].insert(0, text)`; if size > MAX_HEADLINES then `resize(MAX_HEADLINES)`; return text.
3. Create `godot/tests/test_sim_news.gd` (`extends "res://tests/harness.gd"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `news`) and exactly these test methods:
```
func test_choose_headline() -> void:
	var cs := _cases("choose_headline")
	ok(cs.size() >= 50, "choose_headline: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimNews.choose_headline(st, a[0], a[1]), st)

func test_choose_headline_seq() -> void:
	var cs := _cases("choose_headline_seq")
	ok(cs.size() >= 1, "choose_headline_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		var sits := [[], ["broke"], ["rich", "monthend"], ["viral", "bigwin", "zzz"]]
		for i in range(int(a[0])):
			var ctx := {"cash": 1000 * i}
			if i % 2 == 1:
				ctx["car"] = "Fjord Capri"
				ctx["customer"] = "Kevin Pumphrey"
			out.append(SimNews.choose_headline(st, sits[i % 4], ctx))
		_check(c, out, st)
```

## Acceptance (all must pass; exact commands)
- `sh tools/godot/golden_run.sh news` prints a last line starting `GOLDEN news OK`.
- `python3 -c "import json;print(len(json.load(open('godot/tests/golden/news.json'))['cases']))"` prints a number >= 51.
- `sh tools/godot/gtest.sh test_sim_news` prints a last line `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.
- No scenes, no UI, no autoload edits.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDS07: Sim port: news`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
