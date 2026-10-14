MODE = "godot"
# GDS cards: GDScript ports of every file in src/sim/ plus the Game.act dispatch and the playthrough parity tests.
# Pattern for every port card: (1) a golden script tools/godot/golden_<name>.mjs runs the JS reference over fixed
# scenarios and prints JSON (fixture godot/tests/golden/<name>.json); (2) the GDScript port godot/sim/<name>.gd;
# (3) godot/tests/test_sim_<name>.gd replays each golden case (input state in, result + resulting state out).
# Golden case shape: {fn, name, state?, args, result, after?}; see GDS01 (tools/godot/golden_sim.mjs).
# Class names: SimCarStats SimFaultSim SimGarage SimShop SimJobSim SimJobResolve SimAdSim SimNews SimMonth SimAdvance
# SimAuction SimEndGame SimActions SimNewGame (files godot/sim/<jsname>.gd), plus SimUtil and SimData (GDS02).

JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"

PR = ("PORT RULES (every GDS card). (a) The JS file is the spec: port every function line for line, SAME order of statements and of rng draws "
      "(the rng sequence is the parity test, the golden `after` state contains `rng`). (b) Each file `godot/sim/<jsname>.gd` starts with `class_name SimX` then `extends RefCounted`; "
      "all functions are `static func`, named like the JS exports in snake_case (private helpers get a leading underscore); typed signatures where cheap (`state: Dictionary`). "
      "Refer to other classes by their class_name ONLY, never `preload()`/`load()` them (the sim classes call each other in a cycle: advance -> month -> auction -> advance). "
      "(c) Core helpers: find the files with `grep -rl 'class_name CoreRng' godot/` (same for CoreClock, CoreFormat). Expected API: CoreRng.rand(state), rand_int(state, lo, hi) -> int, chance(state, p) -> bool, pick(state, arr), weighted(state, items), round_to(x, step), clamp(x, lo, hi), seed_rng(state, seed); "
      "CoreClock.date_of(day) -> Dictionary {month, dayOfMonth, monthName}, is_month_start(day), is_auction_day(day), DAYS_IN_YEAR; CoreFormat.money(n), CoreFormat.one_dp(n). Read those files; if a name differs, use the real name; never re-implement them. "
      "(d) State is a Dictionary with the JS key names (camelCase keys: state[\"garageSlots\"], car[\"impoundedUntil\"]); lists are Arrays of Dictionaries; JS null is GDScript null; a key that may be absent in JS (car.impoundedUntil, auction.attendedDay) is read with `.get(key)` and null treated as the JS default. "
      "(e) Numbers: keep integers (cash, counts, ids, prices) as int; every JS `Math.round(x)` becomes `SimUtil.jround(x)` (rounds .5 UP; GDScript round() does not) and `Math.floor` becomes `floori()`. NEVER write int / int (GDScript truncates): write `x / 2.0`. "
      "Keep the floating-point expression order exactly as in the JS (a * b * c is not a * (b * c)). Always write float literals as `0.5`, `10.0`. "
      "(f) Text: build every message from the same pieces as the JS; money only via CoreFormat.money(), one decimal via CoreFormat.one_dp(); a plain number inside a message uses SimUtil.num_str(x). Source files are ASCII only (a pound sign only ever comes out of CoreFormat.money). "
      "(g) Tabs, no `print` left in the files. A JS `throw` becomes `push_error(...)` plus returning an empty value; do not test those paths.")

GR = ("GOLDEN PATTERN. tools/godot/golden_sim.mjs (GDS01) exports: `clone(x)`, `fresh(seed)` (= startGame(seed): full new-game state), `bare(seed)` (= newGameState(seed): empty state), "
      "`addCar(state, modelId, fields = {})` (pushes a stable car with id 'c'+nextId++, owned true, condition 5, fault null, lastServiceDay = state.day, jobsDone 0, boughtDay = state.day, impoundedUntil 0, rentedAtCondition null, owner null, rentMonthly 0, paid 0; `fields` override; returns the car), "
      "`pureCase(fn, name, args, result)` -> {fn, name, args, result}, `stateCase(fn, name, state, args, call)` -> {fn, name, state: <input clone>, args, result, after: <state after>} (it clones the state, runs `call(work, ...args)` and records the return value, null when undefined), "
      "`sweepSeeds(base, lo, hi, run, classify, perKind)` -> {kind: [seeds]} (for seed in lo..hi: w = clone(base); w.rng = seed; r = run(w); k = classify(w, r); k === null is skipped; keeps the first perKind seeds per kind) and `emitCases(name, cases)` (prints one JSON line {\"cases\": [...]}). "
      "A golden script ends with `emitCases('<name>', cases);`. `sh tools/godot/golden_run.sh <name>` runs it under jsc and writes godot/tests/golden/<name>.json (commit the fixture). "
      "TEST PATTERN. The test godot/tests/test_sim_<name>.gd begins with `extends \"res://tests/harness.gd\"` and has exactly these two helpers (replace NAME):\n"
      "```\nfunc _cases(fn_name: String) -> Array:\n\tvar out: Array = []\n\tfor c in GoldenUtil.load_golden(\"NAME\")[\"cases\"]:\n\t\tif c[\"fn\"] == fn_name:\n\t\t\tout.append(c)\n\treturn out\n\n"
      "func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:\n\tvar d := GoldenUtil.diff(res, c[\"result\"])\n\tok(d == \"\", \"%s result %s\" % [c[\"name\"], d])\n\tif c.has(\"after\"):\n\t\tvar d2 := GoldenUtil.diff(st, c[\"after\"])\n\t\tok(d2 == \"\", \"%s state %s\" % [c[\"name\"], d2])\n```\n"
      "plus one `func test_<fn>() -> void:` per golden function name, each of the form shown in the steps.")

R_GOLD = "tools/godot/golden_sim.mjs and tools/godot/golden_run.sh (GDS01): read the headers; " + "godot/tests/golden_util.gd (GoldenUtil: load_golden(name), copy(v), diff(got, want) -> '' when equal) and godot/tests/harness.gd (GDF02: ok, eq, near)"
R_PR = PR
R_GR = GR

OOS = ["Every file not listed under files: no edits to other sim ports, to src/ or to tests/*.mjs.", "No scenes, no UI, no autoload edits."]


def acc(name, minc):
    return [
        "`sh tools/godot/golden_run.sh %s` prints a last line starting `GOLDEN %s OK`." % (name, name),
        "`python3 -c \"import json;print(len(json.load(open('godot/tests/golden/%s.json'))['cases']))\"` prints a number >= %d." % (name, minc),
        "`sh tools/godot/gtest.sh test_sim_%s` prints a last line `GDTEST OK`." % name,
    ]


def tfun(fn, minc, has_state, body):
    """One test method in the standard form."""
    s = "func test_%s() -> void:\n\tvar cs := _cases(\"%s\")\n\tok(cs.size() >= %d, \"%s: enough golden cases\")\n\tfor c: Dictionary in cs:\n\t\tvar a: Array = c[\"args\"]\n" % (fn, fn, minc, fn)
    if has_state:
        s += "\t\tvar st: Dictionary = GoldenUtil.copy(c[\"state\"])\n"
    for line in body.split("\n"):
        s += "\t\t" + line + "\n"
    return s


def tstep(name, rows):
    """Step text: write the test file with these test methods."""
    out = ("Create `godot/tests/test_sim_%s.gd` (`extends \"res://tests/harness.gd\"`, the two helpers `_cases` and `_check` from the GOLDEN PATTERN with NAME = `%s`) and exactly these test methods:\n```\n" % (name, name))
    out += "\n".join(tfun(*r) for r in rows)
    out += "```"
    return out


SIM_HEAD = "Create `%s`: `class_name %s`, `extends RefCounted`, all functions `static`. "

CARDS = []

# ---------------------------------------------------------------------------------------------------------------- GDS01
CARDS.append(dict(id="GDS01", title="Golden fixture helpers (JS and GDScript)", needs=["GDF01", "GDF02"],
  files=["tools/godot/golden_sim.mjs", "tools/godot/golden_run.sh", "tools/godot/golden_selftest.mjs", "godot/tests/golden/selftest.json", "godot/tests/golden_util.gd", "godot/tests/test_golden_util.gd"],
  goal="The shared machinery of every sim port card: a JS helper module that builds golden test cases from the JS reference, a shell script that turns a golden script into a committed JSON fixture, and a GDScript class `GoldenUtil` that loads fixtures and compares values (ints exact, floats within 1e-9, deep for arrays and dictionaries).",
  read=["docs/GODOT.md section 'Determinism and parity'", "tests/harness.js and tests/playthrough.test.mjs (how JS tests import src/ and use print() under jsc)", "godot/tests/harness.gd and godot/tests/runner.gd (GDF02: how test files are discovered: methods starting `test_`)",
        "JSON detail: JS cannot tell 5 from 5.0, and Godot's JSON parser returns EVERY number as float, so GoldenUtil.load_golden converts integral floats back to int; this keeps str(), dictionary keys and `%d` working in the ports."],
  steps=[
   "`tools/godot/golden_sim.mjs` (ES module, run by `jsc -m`, imports `startGame` from '../../src/sim/newgame.js' and `newGameState` from '../../src/core/state.js'). Export exactly: `clone(x)` = JSON.parse(JSON.stringify(x)); `fresh(seed)` = startGame(seed); `bare(seed)` = newGameState(seed); "
   "`addCar(state, modelId, fields = {})`: builds `Object.assign({ id: 'c' + state.nextId++, modelId: modelId, owned: true, owner: null, rentMonthly: 0, paid: 0, condition: 5, fault: null, lastServiceDay: state.day, jobsDone: 0, boughtDay: state.day, impoundedUntil: 0, rentedAtCondition: null }, fields)`, pushes it onto state.cars and returns it; "
   "`pureCase(fn, name, args, result)` returns `{ fn: fn, name: name, args: clone(args), result: result === undefined ? null : clone(result) }`; "
   "`stateCase(fn, name, state, args, call)`: `const input = clone(state); const work = clone(state); const a = clone(args); const r = call(work, ...a);` returns `{ fn, name, state: input, args: clone(args), result: r === undefined ? null : clone(r), after: work }`; "
   "`sweepSeeds(base, lo, hi, run, classify, perKind = 2)`: for seed lo..hi: `const w = clone(base); w.rng = seed; const r = run(w); const k = classify(w, r);` skip when k === null, else push seed into `found[k]` while that list is shorter than perKind; returns `found` (a plain object kind -> array of seeds); "
   "`emitCases(name, cases)`: `print(JSON.stringify({ cases: cases }));`. A header comment explains each export in one line.",
   "`tools/godot/golden_selftest.mjs` imports pureCase, stateCase, emitCases and builds 3 cases: `pureCase('add', 'two plus three', [2, 3], 5)`; `stateCase('bump', 'bump a state', { n: 1, list: [1, 2] }, [5], function (s, k) { s.n += k; s.list.push(k); return s.n; })` (result 6, after { n: 6, list: [1, 2, 5] }); `pureCase('float', 'floats and text', [0.1, 0.2], { sum: 0.1 + 0.2, text: 'Price \\u00a3 5', flag: true, none: null })`. It ends with `emitCases('selftest', cases);`.",
   "`tools/godot/golden_run.sh` (POSIX sh, usage `sh tools/godot/golden_run.sh <name>`): `cd` to the repo root (two levels above the script folder); fail with exit 2 and a usage line when no name is given or tools/godot/golden_<name>.mjs is missing; run `" + JSC + " -m tools/godot/golden_<name>.mjs > godot/tests/golden/<name>.json` (create the folder `godot/tests/golden` first; write to a temp file and move it only when jsc exited 0); then check the file is one valid JSON document with `python3 -c \"import json,sys;json.load(open(sys.argv[1]))\" <file>`; on success print `GOLDEN <name> OK <bytes> bytes` (bytes = `wc -c`) and exit 0, otherwise print `GOLDEN <name> FAIL` and exit 1. Run it for `selftest`.",
   "`godot/tests/golden_util.gd`: `class_name GoldenUtil`, `extends RefCounted`, `const EPS := 1e-9`, static functions: "
   "`load_golden(name: String) -> Dictionary`: read `res://tests/golden/<name>.json` with FileAccess.get_file_as_string, JSON.parse_string, `intify` the result; on a missing file or parse error `push_error` and return an empty Dictionary. "
   "`intify(v: Variant) -> Variant`: recursively copy Arrays and Dictionaries; a float whose value is integral and below 1e15 in magnitude becomes int; everything else is kept. "
   "`copy(v: Variant) -> Variant`: `v.duplicate(true)` for Array and Dictionary, else v. "
   "`diff(got: Variant, want: Variant, path: String = \"$\") -> String`: returns \"\" when equal, else a text naming the FIRST difference found: numbers (int or float, either mix): when both are integral they must be exactly equal, else `absf(a - b) <= EPS`, message `<path>: <got> != <want>`; String, bool and null compare with `==` (a type mismatch, e.g. bool against number, is a difference); Arrays: sizes must match (message `<path>: array size <n> != <m>`), elements are compared in order with path `<path>[<i>]`; Dictionaries: every key of want must exist in got (message `<path>.<key>: missing`) and every key of got must exist in want (message `<path>.<key>: unexpected`), values compared with path `<path>.<key>`. "
   "`same(got, want) -> bool` = `diff(got, want) == \"\"`.",
   "`godot/tests/test_golden_util.gd` (`extends \"res://tests/harness.gd\"`) with test methods: `test_intify` (intify({\"a\": 3.0, \"b\": [1.5, 2.0], \"c\": \"x\"}): typeof a == TYPE_INT, b[0] stays float 1.5, typeof b[1] == TYPE_INT, c == \"x\"); `test_same_numbers` (same(1, 1.0), same(0.1 + 0.2, 0.3), not same(1, 2), not same(1.5, 1.6), not same(true, 1)); `test_diff_paths` (diff({\"a\": [1, 2]}, {\"a\": [1, 3]}) begins with \"$.a[1]\"; diff({\"a\": 1}, {\"a\": 1, \"b\": 2}) contains \"missing\"; diff({\"a\": 1, \"b\": 2}, {\"a\": 1}) contains \"unexpected\"; diff([1], [1, 2]) contains \"array size\"; diff({}, {}) == \"\"); `test_copy_is_deep` (copy a nested Dictionary, change the copy, the original is unchanged); "
   "`test_selftest_fixture`: `var cs: Array = GoldenUtil.load_golden(\"selftest\")[\"cases\"]`; size == 3; cs[0][\"result\"] == 5 and typeof is TYPE_INT; cs[1][\"after\"] is {\"n\": 6, \"list\": [1, 2, 5]} by GoldenUtil.same; cs[1][\"state\"][\"n\"] == 1 (input kept); cs[2][\"result\"][\"text\"] == \"Price \" + char(163) + \" 5\" and cs[2][\"result\"][\"sum\"] near 0.3 within 1e-9."],
  accept=["`sh tools/godot/golden_run.sh selftest` prints `GOLDEN selftest OK` and `godot/tests/golden/selftest.json` has 3 cases.", "`sh tools/godot/gtest.sh test_golden_util` prints a last line `GDTEST OK`."],
  oos=["Everything not listed under files; the sim ports; golden_common.mjs from GDF04 is NOT used by the GDS cards (do not edit it)."]))

# ---------------------------------------------------------------------------------------------------------------- GDS02
CARDS.append(dict(id="GDS02", title="SimUtil and SimData helpers for the sim ports", needs=["GDF01", "GDF02", "GDF03", "GDF05", "GDF06", "GDF07", "GDF08", "GDS01"],
  files=["tools/godot/golden_simdata.mjs", "godot/tests/golden/simdata.json", "godot/sim/simutil.gd", "godot/sim/simdata.gd", "godot/tests/test_sim_simdata.gd"],
  goal="Two helper classes every sim port uses: `SimUtil` (JS-compatible rounding and number-to-text) and `SimData`, the ONE place that turns the Data autoload (JSON exported from src/data/*.js) into the lookups and the rng-driven name builders the JS data modules contain (modelOf, jobTypeOf, fillText, faultsOfSeverity, TIER_MULT, ADVERT_BY_ID, customerName, ownerName, headline pools).",
  read=[R_PR, R_GOLD, R_GR, "godot/autoload/data.gd (GDF03) and godot/data/*.json: the REAL accessor names and JSON shapes of the exported data; SimData adapts to them and is the only sim file that calls `Data`",
        "src/data/cars.js, jobtypes.js, faults.js, adverts.js, names.js, owners.js, headlines.js (exports and helper functions)"],
  steps=[
   "`tools/godot/golden_simdata.mjs`: imports from src/data/*.js (cars, jobtypes, faults, adverts, names, owners, headlines) and src/core/rng.js is not needed; use `bare(seed)` from golden_sim.mjs for rng states. Cases: "
   "(1) `pureCase('counts', 'data counts', [], { cars: CARS.length, job_types: JOB_TYPES.length, faults: FAULTS.length, adverts: ADVERTS.length, first: FIRST.length, last: LAST.length, prefix: PREFIX.length, owners: OWNERS.length, generic: GENERIC.length, carworld: CARWORLD.length, reactive_keys: Object.keys(REACTIVE).sort() })` (expected 31, 16, 24, 7, 40, 40, 8, 24, 80, 60 and the 9 situations broke, rich, breakdown, bigwin, viral, fullgarage, emptygarage, monthend, auctionday); "
   "(2) `pureCase('model_of', id, [id], modelOf(id))` for ids t1_allergy, t2_serious, t3_porshe; (3) `pureCase('job_type_of', id, [id], jobTypeOf(id))` for wedding and chef; (4) `pureCase('advert_by_id', id, [id], ADVERT_BY_ID[id])` for paper and tv; "
   "(5) `pureCase('faults_of_severity', sev, [sev], faultsOfSeverity(sev).map(f => f.id))` for minor, medium, major; (6) `pureCase('tier_mult', 'tier ' + t, [t], TIER_MULT[t])` for t = 1, 2, 3; "
   "(7) `pureCase('fill_text', name, [template, vars], fillText(template, vars))` for: ['{customer} drives {car}.', {customer: 'Nigel', car: 'Austen Allergy'}], ['{customer} and {customer} again', {customer: 'A'}], ['{car} only', {customer: 'B'}] (placeholder stays), ['no tokens here', {}], ['{customer}{car}', {customer: '{car}', car: 'X'}] (single pass: result '{car}X'); "
   "(8) `stateCase('customer_name_seq', 'seed 5 twelve names', {rng: 5}, [12], (s, n) => { const out = []; for (let i = 0; i < n; i++) out.push(customerName(s)); return out; })` and the same for seed 77 with 30 names; "
   "(9) `stateCase('owner_name_seq', 'seed 9 eight owners', {rng: 9}, [8], ...)` likewise with ownerName. Run `sh tools/godot/golden_run.sh simdata`.",
   SIM_HEAD % ("godot/sim/simutil.gd", "SimUtil") + "Functions: `jround(x: float) -> int` = `int(floor(x + 0.5))` (JS Math.round: halves go up, so 2.5 -> 3 and -2.5 -> -2); `num_str(x: float) -> String`: if x is integral return `str(int(x))`, else `String.num(x)` (so 4 -> \"4\", 4.0 -> \"4\", 2.5 -> \"2.5\", -3 -> \"-3\").",
   SIM_HEAD % ("godot/sim/simdata.gd", "SimData") + "Every function returns the data from `Data` UNCHANGED (no copies) except where noted. Build lookup indexes lazily in `static var` Dictionaries on first use (e.g. `static var _model_idx: Dictionary = {}`; `static func _ensure() -> void` fills them when empty). Functions: "
   "`cars() -> Array` (31 models in file order tier 1, 2, 3); `model_of(id: String) -> Dictionary` (unknown id: push_error, return {}); `job_types() -> Array`; `job_type_of(id: String) -> Dictionary`; "
   "`fill_text(template: String, vars: Dictionary) -> String`: ONE left-to-right pass over the template: at index i, if the text from i starts with `{customer}` and vars has a non-null \"customer\", append that value and skip 10 characters; else if it starts with `{car}` and vars has a non-null \"car\", append it and skip 5; else append the single character and skip 1 (a substituted value is never re-scanned; a placeholder without a value stays as written); "
   "`faults() -> Array` (24, file order); `faults_of_severity(sev: String) -> Array` (those with that severity, file order); `tier_mult(tier: Variant) -> float` = match int(tier): 1 -> 1.0, 2 -> 1.8, 3 -> 3.5 (never use a float as a Dictionary key); "
   "`adverts() -> Array`; `advert_by_id(id: String) -> Dictionary` (unknown: {} silently); "
   "`first_names() -> Array`, `last_names() -> Array`, `prefixes() -> Array`, `owners() -> Array` (strings); "
   "`customer_name(state: Dictionary) -> String`: `var r := CoreRng.rand(state)`; r < 0.60 -> pick(first) + \" \" + pick(last); r < 0.85 -> pick(prefix) + \" \" + pick(last); else \"The \" + pick(last) + \" Family\" (draw order exactly as written, first pick before last pick); `owner_name(state) -> String` = CoreRng.pick(state, owners()); "
   "`headline_generic() -> Array` (80), `headline_carworld() -> Array` (60), `headline_reactive() -> Dictionary` (situation -> Array of 5 strings). If the Data JSON lacks a piece (e.g. TIER_MULT) hard-code it here with the values above.",
   tstep("simdata", [
     ("counts", 1, False, "var rk: Array = SimData.headline_reactive().keys()\nrk.sort()\nvar cd := {\"cars\": SimData.cars().size(), \"job_types\": SimData.job_types().size(), \"faults\": SimData.faults().size(), \"adverts\": SimData.adverts().size(), \"first\": SimData.first_names().size(), \"last\": SimData.last_names().size(), \"prefix\": SimData.prefixes().size(), \"owners\": SimData.owners().size(), \"generic\": SimData.headline_generic().size(), \"carworld\": SimData.headline_carworld().size(), \"reactive_keys\": rk}\n_check(c, cd)"),
     ("model_of", 3, False, "_check(c, SimData.model_of(a[0]))"),
     ("job_type_of", 2, False, "_check(c, SimData.job_type_of(a[0]))"),
     ("advert_by_id", 2, False, "_check(c, SimData.advert_by_id(a[0]))"),
     ("faults_of_severity", 3, False, "var ids: Array = []\nfor f in SimData.faults_of_severity(a[0]):\n\tids.append(f[\"id\"])\n_check(c, ids)"),
     ("tier_mult", 3, False, "_check(c, SimData.tier_mult(a[0]))\n_check(c, SimData.tier_mult(float(a[0])))"),
     ("fill_text", 5, False, "_check(c, SimData.fill_text(a[0], a[1]))"),
     ("customer_name_seq", 2, True, "var out: Array = []\nfor i in range(int(a[0])):\n\tout.append(SimData.customer_name(st))\n_check(c, out, st)"),
     ("owner_name_seq", 1, True, "var out: Array = []\nfor i in range(int(a[0])):\n\tout.append(SimData.owner_name(st))\n_check(c, out, st)"),
   ]) + "\nAlso add `test_simutil` (no golden): jround(2.5) == 3, jround(-2.5) == -2, jround(0.49) == 0, jround(1234.5) == 1235, jround(7.0) == 7 and typeof(jround(7.0)) == TYPE_INT; num_str(4) == \"4\", num_str(4.0) == \"4\", num_str(2.5) == \"2.5\", num_str(0.1) == \"0.1\", num_str(-3) == \"-3\"; and `test_fill_text_unknown_var`: fill_text(\"{car} {customer}\", {\"car\": \"X\"}) == \"X {customer}\"."],
  accept=acc("simdata", 22), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS03
MODELS5 = "['t1_allergy', 't1_robbin', 't2_serious', 't3_porshe', 't3_aston']"
CARDS.append(dict(id="GDS03", title="Sim port: carstats", needs=["GDS02"],
  files=["tools/godot/golden_carstats.mjs", "godot/tests/golden/carstats.json", "godot/sim/carstats.gd", "godot/tests/test_sim_carstats.gd"],
  goal="Port src/sim/carstats.js (effective stats, values, running costs, condition changes) to `SimCarStats` and prove it against golden values from the JS.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/carstats.js (read fully) and tests/carstats.test.mjs", "godot/sim/simutil.gd and godot/sim/simdata.gd (GDS02)"],
  steps=[
   "`tools/godot/golden_carstats.mjs`: imports carstats.js, modelOf and the golden_sim helpers. MODELS = " + MODELS5 + ", CONDS = [0, 2.5, 5, 7.3, 10]. For every model m and cond c (25 pairs) add SIX pure cases `pureCase(fn, m + ' ' + c, [m, c], <value>)` with fn and value: 'eff_d' effD(modelOf(m), {condition: c}); 'eff_r' effR(...); 'maint_mult' maintMult({condition: c}); 'value_factor' valueFactor({condition: c}); 'running_cost' runningCost(modelOf(m), {condition: c}); 'idle_decay' idleDecay(modelOf(m)). "
   "Then for every (m, c) and priceMult p in [0.85, 1, 1.25] add `stateCase('market_value', m + ' ' + c + ' x' + p, { market: { priceMult: p } }, [m, c], (s, mm, cc) => marketValue(s, modelOf(mm), { condition: cc }))` (75 cases). "
   "Then `pureCase('change_condition', name, [start, delta], <new condition>)` where the value is computed with `const car = { condition: start }; changeCondition(car, delta)` for [start, delta] in [[5, 1.0], [9.5, 2.5], [0.3, -1], [5.55, 0.01], [7.3, -0.1], [7.3, -0.3], [0, 0], [10, -0.04], [3.333, 0.004], [6.66, 1.005]]. "
   "Then `stateCase('is_available', name, { day: 10 }, [car], (s, c) => isAvailable(s, c))` for cars: {fault: null, impoundedUntil: 0}, {fault: null} (key missing), {fault: null, impoundedUntil: 10}, {fault: null, impoundedUntil: 11}, {fault: {faultId: 'puncture', label: 'Puncture', cost: 90}, impoundedUntil: 0}. End with emitCases('carstats', cases); run `sh tools/godot/golden_run.sh carstats`.",
   SIM_HEAD % ("godot/sim/carstats.gd", "SimCarStats") + "Functions with their formulas (model/car are Dictionaries; use \"desirability\", \"reliability\", \"maintenance\", \"basePrice\", \"condition\" keys): "
   "`eff_d(model, car) -> float` = model.desirability * (0.40 + 0.06 * car.condition); `eff_r(model, car) -> float` = model.reliability * (0.30 + 0.07 * car.condition); `maint_mult(car) -> float` = 1 + (10 - car.condition) * 0.08; `value_factor(car) -> float` = 0.50 + 0.05 * car.condition; "
   "`market_value(state, model, car) -> int` = SimUtil.jround(model.basePrice * value_factor(car) * state.market.priceMult); `running_cost(model, car) -> int` = SimUtil.jround(model.maintenance * (60 + model.basePrice * 0.0025) * maint_mult(car)); "
   "`idle_decay(model) -> float` = 0.01 + (10 - model.reliability) * 0.002; `change_condition(car, delta) -> float`: car[\"condition\"] = CoreRng.clamp(CoreRng.round_to(car[\"condition\"] + delta, 0.01), 0.0, 10.0), return it; "
   "`is_available(state, car) -> bool` = car[\"fault\"] == null and (car.get(\"impoundedUntil\") if not null else 0) <= state[\"day\"] (a missing or null impoundedUntil counts as 0). Write every expression in exactly this operand order.",
   tstep("carstats", [
     ("eff_d", 25, False, "_check(c, SimCarStats.eff_d(SimData.model_of(a[0]), {\"condition\": a[1]}))"),
     ("eff_r", 25, False, "_check(c, SimCarStats.eff_r(SimData.model_of(a[0]), {\"condition\": a[1]}))"),
     ("maint_mult", 25, False, "_check(c, SimCarStats.maint_mult({\"condition\": a[1]}))"),
     ("value_factor", 25, False, "_check(c, SimCarStats.value_factor({\"condition\": a[1]}))"),
     ("running_cost", 25, False, "_check(c, SimCarStats.running_cost(SimData.model_of(a[0]), {\"condition\": a[1]}))"),
     ("idle_decay", 25, False, "_check(c, SimCarStats.idle_decay(SimData.model_of(a[0])))"),
     ("market_value", 75, True, "_check(c, SimCarStats.market_value(st, SimData.model_of(a[0]), {\"condition\": a[1]}), st)"),
     ("change_condition", 10, False, "var car := {\"condition\": a[0]}\n_check(c, SimCarStats.change_condition(car, a[1]))\nok(is_equal_approx(car[\"condition\"], c[\"result\"]), c[\"name\"] + \" stored on the car\")"),
     ("is_available", 5, True, "_check(c, SimCarStats.is_available(st, a[0]), st)"),
   ])],
  accept=acc("carstats", 240), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS04
CARDS.append(dict(id="GDS04", title="Sim port: faultsim", needs=["GDS03"],
  files=["tools/godot/golden_faultsim.mjs", "godot/tests/golden/faultsim.json", "godot/sim/faultsim.gd", "godot/tests/test_sim_faultsim.gd"],
  goal="Port src/sim/faultsim.js (fault roll and apply) to `SimFaultSim` with identical rng draws.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/faultsim.js (read fully) and tests/faultsim.test.mjs", "godot/sim/carstats.gd (GDS03: SimCarStats.eff_r), godot/sim/simdata.gd (faults_of_severity, tier_mult)"],
  steps=[
   "`tools/godot/golden_faultsim.mjs`: imports rollFault, applyFault, modelOf. For model m in ['t1_allergy', 't2_serious', 't3_porshe'], condition c in [2, 6, 9.5]: (a) seeds 1..30 with mult 1: `stateCase('roll_fault', m + ' c' + c + ' seed' + s + ' x1', { rng: s }, [m, c, 1], (st, mm, cc, mult) => rollFault(st, modelOf(mm), { condition: cc }, mult))` (270 cases); (b) seeds 1..10 with mult 0.5 (90 cases). "
   "Then three apply_fault cases `pureCase('apply_fault', name, [car, fault], <car after>)` (compute with `const car2 = clone(car); applyFault(car2, fault)`): car { id: 'c1', condition: 5, fault: null } with fault { faultId: 'puncture', label: 'Puncture', cost: 90, severity: 'minor' }; a car that already has a fault replaced by { faultId: 'clutch', label: 'Slipping clutch', cost: 400, severity: 'medium' } (any ids are fine); the same car with a major fault. "
   "The script THROWS (so golden_run.sh fails) unless at least 40 roll results are non-null and each of minor, medium, major occurs at least once. Run `sh tools/godot/golden_run.sh faultsim`.",
   SIM_HEAD % ("godot/sim/faultsim.gd", "SimFaultSim") + "Functions: `roll_fault(state, model, car, mult: float = 1.0) -> Variant` (null or Dictionary {faultId, label, cost, severity}): "
   "`var p := CoreRng.clamp(0.02 + (1 - SimCarStats.eff_r(model, car) / 10.0) * 0.35, 0.02, 0.60) * mult`; `if not CoreRng.chance(state, p): return null`; `var c = car[\"condition\"]`; severity = `CoreRng.weighted(state, [{\"w\": maxf(20.0, 70.0 - (10.0 - c) * 5.0), \"s\": \"minor\"}, {\"w\": 25.0 + (10.0 - c) * 2.0, \"s\": \"medium\"}, {\"w\": 5.0 + (10.0 - c) * 3.0, \"s\": \"major\"}])[\"s\"]`; "
   "`var fault = CoreRng.pick(state, SimData.faults_of_severity(severity))`; `var cost := int(CoreRng.round_to(fault[\"baseCost\"] * SimData.tier_mult(model[\"tier\"]), 10))`; return {\"faultId\": fault[\"id\"], \"label\": fault[\"label\"], \"cost\": cost, \"severity\": severity}. "
   "`apply_fault(car, fault) -> Dictionary`: `car[\"fault\"] = {\"faultId\": fault[\"faultId\"], \"label\": fault[\"label\"], \"cost\": fault[\"cost\"]}` (a NEW dictionary, no severity key), return car. roll_fault does not touch the car.",
   tstep("faultsim", [
     ("roll_fault", 360, True, "_check(c, SimFaultSim.roll_fault(st, SimData.model_of(a[0]), {\"condition\": a[1]}, a[2]), st)"),
     ("apply_fault", 3, False, "var car: Dictionary = GoldenUtil.copy(a[0])\nvar fault: Dictionary = GoldenUtil.copy(a[1])\nSimFaultSim.apply_fault(car, fault)\n_check(c, car)\nfault[\"cost\"] = 1\nok(car[\"fault\"][\"cost\"] != 1, c[\"name\"] + \" car does not share the fault object\")"),
   ]) + "\nAlso add `test_roll_fault_leaves_car_alone`: car {\"condition\": 4.0, \"fault\": null}, state {\"rng\": 7}, call roll_fault, the car still equals its copy."],
  accept=acc("faultsim", 363), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS05
CARDS.append(dict(id="GDS05", title="Sim port: shop", needs=["GDS03"],
  files=["tools/godot/golden_shop.mjs", "godot/tests/golden/shop.json", "godot/sim/shop.gd", "godot/tests/test_sim_shop.gd"],
  goal="Port src/sim/shop.js (TV shop listings: make_listing, init_shop, should_refresh, refresh_shop) to `SimShop`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/shop.js (read fully) and tests/shop.test.mjs", "godot/sim/carstats.gd (SimCarStats.value_factor), godot/sim/simdata.gd (cars, owner_name)"],
  steps=[
   "`tools/godot/golden_shop.mjs`: imports shop.js. Cases: (a) for seed 1..8: `stateCase('make_listing', 'default s' + seed, fresh(seed), [{}], (s, o) => makeListing(s, o))`; (b) for seed 1..4 and each opts in [{mode:'sale', tier:1, maxPrice:14000, excludeModelIds:['t1_allergy','t1_robbin']}, {mode:'rent', tier:2}, {tier:3}, {mode:'sale', maxPrice:6000}]: the same stateCase with that opts (16 cases); "
   "(c) seeds 1..5: `stateCase('init_shop', name, <fresh(seed) with .day = 3>, [], s => initShop(s))`; (d) `pureCase('should_refresh', 'day ' + d, [d], shouldRefresh(d))` for d in [1, 2, 7, 8, 9, 15, 22, 29, 36, 365]; "
   "(e) seeds 1..6: `stateCase('refresh_shop', name, <fresh(seed) with .day = 8>, [], s => refreshShop(s))`; (f) `refresh_shop` on fresh(2) with day 8 and `shop.listings.length = 2` (case name 'short board'); (g) `refresh_shop` on fresh(3) with day 8 and `shop.listings = []` (name 'empty board'). Run `sh tools/godot/golden_run.sh shop`.",
   SIM_HEAD % ("godot/sim/shop.gd", "SimShop") + "Port the 10 BLURBS strings character for character (some contain double quotes: use single-quoted GDScript strings or escape them) as `const BLURBS := [...]`. Functions: "
   "`_tier_candidates(tier, exclude_model_ids: Array) -> Array` (models of that tier, file order, not excluded; compare `int(model[\"tier\"]) == int(tier)`). "
   "`make_listing(state, opts: Dictionary = {}) -> Dictionary`: `mode = opts.get(\"mode\")`; if it is null or \"\" draw `\"sale\" if CoreRng.chance(state, 0.6) else \"rent\"` (ONE draw, before the attempt loop, only when no mode was given); `exclude = opts.get(\"excludeModelIds\", [])`; `max_price = opts.get(\"maxPrice\")` (null when absent); "
   "loop attempt 0..19: `tier = opts.get(\"tier\")`; if null/0 -> `int(CoreRng.weighted(state, [{\"tier\": 1, \"w\": 50}, {\"tier\": 2, \"w\": 35}, {\"tier\": 3, \"w\": 15}])[\"tier\"])` (draw only when no tier was given); candidates empty -> continue; `model = CoreRng.pick(state, candidates)`; `top = 7.0 if tier == 3 else 8.0`; `condition = CoreRng.round_to(3.0 + CoreRng.rand(state) * (top - 3.0), 0.1)`; "
   "price: sale -> `SimUtil.jround(model.basePrice * SimCarStats.value_factor({\"condition\": condition}) * state.market.priceMult * (0.9 + 0.2 * CoreRng.rand(state)))`; rent -> `SimUtil.jround(model.baseRent * (0.9 + 0.2 * CoreRng.rand(state)))`; if max_price != null and price > max_price -> continue; "
   "then build the result in THIS order: listingId = \"L\" + str(state[\"nextId\"]) and `state[\"nextId\"] += 1`; modelId; mode; price; condition; owner = `SimData.owner_name(state)` for rent else null (draw happens here); blurb = `CoreRng.pick(state, BLURBS)` (draw after the owner). Keys: listingId, modelId, mode, price, condition, owner, blurb. After 20 failed attempts `push_error(\"makeListing: no car fits\")` and return {}. "
   "`init_shop(state) -> void`: listings = []; exclude = []; 3x make_listing({mode sale, tier 1, maxPrice 14000, excludeModelIds exclude}); then 2x ({mode rent, tier: CoreRng.rand_int(state, 2, 3), excludeModelIds}) (the tier is drawn when building opts, BEFORE make_listing runs); then 3x ({excludeModelIds}); after each listing append its modelId to exclude and the listing to state.shop.listings; finally `state.shop.refreshedDay = state.day`. "
   "`should_refresh(day: int) -> bool` = day > 1 and day % 7 == 1. "
   "`refresh_shop(state) -> void`: `n = mini(CoreRng.rand_int(state, 1, 3), listings.size())` (the draw happens even for an empty board); n times `listings.remove_at(CoreRng.rand_int(state, 0, listings.size() - 1))`; exclude = modelIds of the remaining; n times make_listing({excludeModelIds}), append modelId to exclude and the listing to listings; `refreshedDay = state.day`.",
   tstep("shop", [
     ("make_listing", 24, True, "_check(c, SimShop.make_listing(st, a[0]), st)"),
     ("init_shop", 5, True, "SimShop.init_shop(st)\n_check(c, null, st)"),
     ("should_refresh", 10, False, "_check(c, SimShop.should_refresh(a[0]))"),
     ("refresh_shop", 8, True, "SimShop.refresh_shop(st)\n_check(c, null, st)"),
   ])],
  accept=acc("shop", 47), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS06
CARDS.append(dict(id="GDS06", title="Sim port: jobsim", needs=["GDS02"],
  files=["tools/godot/golden_jobsim.mjs", "godot/tests/golden/jobsim.json", "godot/sim/jobsim.gd", "godot/tests/test_sim_jobsim.gd"],
  goal="Port src/sim/jobsim.js (daily customer booking requests: expire_requests, generate_requests) to `SimJobSim`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/jobsim.js (read fully) and tests/jobsim_requests.test.mjs", "godot/sim/simdata.gd (job_types, fill_text, customer_name)"],
  steps=[
   "`tools/godot/golden_jobsim.mjs`: imports expireRequests, generateRequests. Helper `req(id, exp)` = { id: id, jobTypeId: 'wedding', customer: 'Mrs Test', fee: 500, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: exp, blurb: 'x' }. Cases: "
   "(a) `stateCase('expire_requests', name, { day: 5, requests: [...] }, [], s => expireRequests(s))` for request lists [req('Q1',3), req('Q2',5), req('Q3',5), req('Q4',9)] (removes Q1 only), [] (nothing), and day 10 with the same list (removes all); "
   "(b) for seed 1..6 and (rep, buzz) in [[0,0],[40,0],[100,100]]: `stateCase('generate_requests', 's' + seed + ' rep' + rep + ' buzz' + buzz, <fresh(seed) with .reputation = rep, .buzz = buzz>, [], s => generateRequests(s))` (18 cases); "
   "(c) for seed 1..3: fresh(seed) with rep 100, buzz 100 and `requests` pre-filled with 5 copies req('Q1'..'Q5', 99): name 'cap 5'; and the same with 6 requests: name 'cap 6'. Run `sh tools/godot/golden_run.sh jobsim`.",
   SIM_HEAD % ("godot/sim/jobsim.gd", "SimJobSim") + "Constants `const MAX_REQUESTS := 6`, `const FEE_MULT := 1.4`, `const EASE_DESIRABILITY := 1`, `const EASE_RELIABILITY := 1`. Functions: "
   "`expire_requests(state) -> int`: keep (in order) requests with expiresDay >= state.day, return the number removed; assign the kept Array back with `state[\"requests\"] = kept`. "
   "`generate_requests(state) -> int`: `expected = 0.20 + 0.006 * state.reputation + 0.015 * state.buzz`; `whole = floori(expected)`; `n = whole`; `if CoreRng.chance(state, expected - whole): n += 1` (this draw ALWAYS happens); `added = 0`; loop i < n: break when requests.size() >= MAX_REQUESTS; then, in THIS draw order: `job = CoreRng.pick(state, SimData.job_types())`; `customer = SimData.customer_name(state)`; "
   "`fee = SimUtil.jround((job.feeMin + CoreRng.rand(state) * (job.feeMax - job.feeMin)) * (0.85 + 0.30 * state.reputation / 100.0) * FEE_MULT)`; then the request: `id = \"Q\" + str(state.nextId)` and `nextId += 1` (before the next draw), jobTypeId = job.id, customer, fee, minDesirability = maxi/maxf(0, job.minD - EASE_DESIRABILITY), minReliability = max(0, job.minR - EASE_RELIABILITY), minCondition = job.minCond, expiresDay = state.day + CoreRng.rand_int(state, 4, 9), blurb = SimData.fill_text(CoreRng.pick(state, job.blurbs), {\"customer\": customer}) (the expiresDay draw comes BEFORE the blurb draw); append; added += 1. Return added. The key order inside the Dictionary does not matter, the draw order does.",
   tstep("jobsim", [
     ("expire_requests", 3, True, "_check(c, SimJobSim.expire_requests(st), st)"),
     ("generate_requests", 24, True, "_check(c, SimJobSim.generate_requests(st), st)"),
   ])],
  accept=acc("jobsim", 27), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS07
CARDS.append(dict(id="GDS07", title="Sim port: news", needs=["GDS02"],
  files=["tools/godot/golden_news.mjs", "godot/tests/golden/news.json", "godot/sim/news.gd", "godot/tests/test_sim_news.gd"],
  goal="Port src/sim/news.js (the Daily Sprocket headline chooser) to `SimNews`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/news.js (read fully) and tests/news.test.mjs", "godot/sim/simdata.gd (headline_generic, headline_carworld, headline_reactive)"],
  steps=[
   "`tools/godot/golden_news.mjs`: imports chooseHeadline and GENERIC. States are minimal: `{ rng: seed, headlines: [] }`. Cases: "
   "(a) seeds 1..10 with situations [] and ctx {}: `stateCase('choose_headline', ..., st, [[], {}], (s, sits, ctx) => chooseHeadline(s, sits, ctx))`; "
   "(b) seeds 1..6 for each of these (situations, ctx) pairs: (['broke'], {cash: 420}), (['monthend','rich'], {cash: 75000, car: 'Austen Allergy'}), (['bigwin','viral'], {customer: 'Brian Prong'}), (['nonsense'], {}), (['breakdown'], {car: '', customer: '', cash: 'lots'}) (empty and non-money values fall back to the defaults) = 30 cases; "
   "(c) pre-filled history: seeds 1..5 with `headlines` = GENERIC.slice(0, 29) (29 entries) and situations [], plus the same with `headlines` = GENERIC.slice(0, 30) (30 entries, the new one pushes the oldest out so length stays 30): names 'history 29 s' and 'history 30 s'; "
   "(d) a sequence: `stateCase('choose_headline_seq', 'forty calls seed 3', { rng: 3, headlines: [] }, [40], (s, n) => { const out = []; const SITS = [[], ['broke'], ['rich', 'monthend'], ['viral', 'bigwin', 'zzz']]; for (let i = 0; i < n; i++) out.push(chooseHeadline(s, SITS[i % 4], i % 2 === 0 ? { cash: 1000 * i } : { cash: 1000 * i, car: 'Fjord Capri', customer: 'Kevin Pumphrey' })); return out; })`. Run `sh tools/godot/golden_run.sh news`.",
   SIM_HEAD % ("godot/sim/news.gd", "SimNews") + "Constants `MAX_HEADLINES := 30`, `POOL_RETRY := 10`. Functions: "
   "`_fill(text, ctx) -> String`: `text.replace(\"{car}\", car).replace(\"{customer}\", customer).replace(\"{cash}\", cash)` in that order, where car = ctx[\"car\"] if it is a non-empty String else \"a mystery car\"; customer likewise with \"a mystery customer\"; cash = CoreFormat.money(ctx[\"cash\"]) if ctx[\"cash\"] is an int or float, else \"some money\". "
   "`_seen_recently(state, text) -> bool`: true when text equals one of the first min(20, headlines.size()) entries. "
   "`choose_headline(state, situations: Array = [], ctx: Dictionary = {}) -> String`: if state[\"headlines\"] is not an Array set it to []; `text = null`; `known` = the situations (in order) that are keys of SimData.headline_reactive(); `if known.size() > 0 and CoreRng.chance(state, 0.6)`: (the chance is drawn ONLY when known is non-empty) `sit = CoreRng.pick(state, known)`; `text = CoreRng.pick(state, SimData.headline_reactive()[sit])`. "
   "If text is still null: for attempt in range(POOL_RETRY): `story = CoreRng.weighted(state, [{\"w\": 55, \"pool\": SimData.headline_generic()}, {\"w\": 45, \"pool\": SimData.headline_carworld()}])`; `text = CoreRng.pick(state, story[\"pool\"])`; break if not _seen_recently(state, text). "
   "Then `text = _fill(text, ctx)`; `state[\"headlines\"].insert(0, text)`; if size > MAX_HEADLINES then `resize(MAX_HEADLINES)`; return text.",
   tstep("news", [
     ("choose_headline", 50, True, "_check(c, SimNews.choose_headline(st, a[0], a[1]), st)"),
     ("choose_headline_seq", 1, True, "var out: Array = []\nvar sits := [[], [\"broke\"], [\"rich\", \"monthend\"], [\"viral\", \"bigwin\", \"zzz\"]]\nfor i in range(int(a[0])):\n\tvar ctx := {\"cash\": 1000 * i}\n\tif i % 2 == 1:\n\t\tctx[\"car\"] = \"Fjord Capri\"\n\t\tctx[\"customer\"] = \"Kevin Pumphrey\"\n\tout.append(SimNews.choose_headline(st, sits[i % 4], ctx))\n_check(c, out, st)"),
   ])],
  accept=acc("news", 51), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS08
CARDS.append(dict(id="GDS08", title="Sim port: endgame", needs=["GDS03"],
  files=["tools/godot/golden_endgame.mjs", "godot/tests/golden/endgame.json", "godot/sim/endgame.gd", "godot/tests/test_sim_endgame.gd"],
  goal="Port src/sim/endgame.js (net worth, the four Gold Number Plates, final score, ranks, end-of-game check) to `SimEndGame`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/endgame.js (read fully) and tests/endgame.test.mjs", "godot/sim/carstats.gd (SimCarStats.market_value)"],
  steps=[
   "`tools/godot/golden_endgame.mjs`: imports endgame.js. Helper `base(over)` returns `Object.assign({ day: 100, cash: 0, reputation: 0, market: { priceMult: 1 }, cars: [], plates: { fatcat: false, stable: false, household: false, hammer: false }, stats: { bestAuctionSale: 0 }, flags: { gameOver: false, won: false, reason: '' } }, over)`; helper `oc(modelId, cond, owned)` = { modelId: modelId, condition: cond, owned: owned }. Cases: "
   "(a) `stateCase('net_worth', name, base(...), [], s => netWorth(s))`: { cash: 500 }; { cash: 1000, cars: [oc('t1_allergy', 10, true)] }; { cash: 2500, market: {priceMult: 1.2}, cars: [oc('t3_porshe', 5, true), oc('t2_serious', 8, false)] } (rental counts 0); { cash: -300, cars: [oc('t1_robbin', 3.5, true), oc('t1_allergy', 0, true)] }; "
   "(b) `stateCase('evaluate_plates', name, base(...), [], s => evaluatePlates(s))`: { cash: 100000 }; { cash: 99999 }; { cars: six x oc('t1_allergy', 0, true) } (6 owned); { cars: five owned + one rented }; { reputation: 85 }; { reputation: 84 }; { stats: { bestAuctionSale: 100000 } }; all four conditions at once; { cash: 0, plates: { fatcat: true, stable: false, household: false, hammer: false } } (a won plate is never taken away: result []); nothing true; "
   "(c) `stateCase('final_score', name, base(...), [], s => finalScore(s))`: { cash: 12345, reputation: 33 }; { cash: 50000, reputation: 99, plates: all four true }; { cash: -2000, plates: { fatcat: true, stable: false, household: true, hammer: false } }; { cash: 1000, reputation: 12, market: { priceMult: 0.85 }, cars: [oc('t3_aston', 6.5, true)] }; "
   "(d) `pureCase('rank_of', 'score ' + v, [v], rankOf(v))` for v in [-1, 0, 29999, 30000, 79999, 80000, 149999, 150000, 299999, 300000, 1000000]; "
   "(e) `stateCase('check_end', name, base(...), [], s => checkEnd(s))` for: { plates: all four true } (won); { day: 366 } (year-end); { day: 365 } (nothing); { day: 366, flags: { gameOver: true, won: false, reason: 'bankrupt' } } (unchanged); { day: 366, plates: all four true } (won wins); "
   "(f) `pureCase('plate_info', 'plate info', [], PLATE_INFO)`. Run `sh tools/godot/golden_run.sh endgame`.",
   SIM_HEAD % ("godot/sim/endgame.gd", "SimEndGame") + "`const PLATE_KEYS := [\"fatcat\", \"stable\", \"household\", \"hammer\"]`. Functions: "
   "`plate_info() -> Dictionary` (a function, because the texts need CoreFormat): fatcat {name \"Fat Cat\", text \"Net worth \" + CoreFormat.money(100000)}, stable {name \"Stable Boy\", text \"Own 6 cars at once\"}, household {name \"Household Name\", text \"Reputation 85\"}, hammer {name \"Hammer Time\", text \"Sell a car at auction for \" + CoreFormat.money(100000)}. "
   "`net_worth(state) -> int` = state.cash + SimCarStats.market_value(state, SimData.model_of(c.modelId), c) for every car with owned == true (rented cars add 0). "
   "`_plate_condition(state, key) -> bool`: fatcat net_worth >= 100000; stable: count of cars with owned == true >= 6; household reputation >= 85; hammer stats.bestAuctionSale >= 100000. "
   "`evaluate_plates(state) -> Array`: for key in PLATE_KEYS (in order): if not state.plates[key] and _plate_condition: set true and append key to the returned Array of newly won keys. "
   "`final_score(state) -> int` = SimUtil.jround(net_worth + 5000 * plates_won + 100 * reputation). "
   "`rank_of(score) -> String`: < 0 \"Pavement Pete\"; < 30000 \"Learner Driver\"; < 80000 \"Weekend Mechanic\"; < 150000 \"Gearbox Guru\"; < 300000 \"Concours Champion\"; else \"Legend of the Lay-by\". "
   "`check_end(state) -> void`: if flags.gameOver return; all four plates won -> gameOver true, won true, reason \"won\"; elif state.day > 365 -> gameOver true, won false, reason \"year-end\".",
   tstep("endgame", [
     ("net_worth", 4, True, "_check(c, SimEndGame.net_worth(st), st)"),
     ("evaluate_plates", 10, True, "_check(c, SimEndGame.evaluate_plates(st), st)"),
     ("final_score", 4, True, "_check(c, SimEndGame.final_score(st), st)"),
     ("rank_of", 11, False, "_check(c, SimEndGame.rank_of(a[0]))"),
     ("check_end", 5, True, "SimEndGame.check_end(st)\n_check(c, null, st)"),
     ("plate_info", 1, False, "_check(c, SimEndGame.plate_info())"),
   ])],
  accept=acc("endgame", 35), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS09
CARDS.append(dict(id="GDS09", title="Sim port: auction lots, reveals, consigning", needs=["GDS03"],
  files=["tools/godot/golden_auction_lots.mjs", "godot/tests/golden/auction_lots.json", "godot/sim/auction.gd", "godot/tests/test_sim_auction_lots.gd"],
  goal="First third of src/sim/auction.js in `SimAuction`: lot generation (prepare_auction), the safe player view (lot_view), paid stat reveals (reveal_stat), consign_car and unconsign. Bidding (GDS10) and attend_auction (GDS13) are added to the same file later.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/auction.js lines 1-200 (header to unconsign; read the rest only to know what comes later) and tests/auction_lots.test.mjs", "godot/sim/carstats.gd (SimCarStats.market_value), godot/sim/simdata.gd"],
  steps=[
   "`tools/godot/golden_auction_lots.mjs`: imports prepareAuction, lotView, revealStat, consignCar, unconsign. Cases: "
   "(a) for seed 1..6 with day in [1, 40, 200] (18 cases): `stateCase('prepare_auction', 's' + seed + ' day' + day, <fresh(seed) with .day = day>, [], s => prepareAuction(s))`; "
   "(b) lot_view on fresh(3): one case per lot (6) `stateCase('lot_view', 'lot ' + i, st, [st.auction.lots[i].lotId], (s, id) => lotView(s, id))`; one case where lots[0].revealed.desirability and .condition are true and revealCount 2 (name 'revealed two'); one with currentBid 800 and leader 'ai' (name 'bid placed'); one for unknown id 'A999' (result null); "
   "(c) reveal_stat on fresh(3) (each `stateCase('reveal_stat', name, st, [lotId, stat], (s, id, stat) => revealStat(s, id, stat))`): lots[0] 'desirability'; lots[0] 'condition'; 'bogus' stat; a stat already revealed (set lots[0].revealed.maintenance true); a lot with revealCount 2 asking 'reliability'; cash set to 100; unknown lot 'A999'; "
   "(d) consign_car (stateCase('consign_car', name, st, [carId, reserve], ...)) on fresh(3) with `addCar(st, 't2_serious', {condition: 6})` and a rented car `addCar(st, 't1_robbin', {owned: false, owner: 'Big Baz', rentMonthly: 200, rentedAtCondition: 5})`: day 10 owned car reserve 5000; reserve 0; reserve 12.5; reserve -5; reserve '800' (a string); the rented car; unknown car 'c99'; an already consigned car (pre-set `st.auction.consigned = [{carId: <id>, reserve: 100}]`); day 24 (auction day refusal); "
   "(e) unconsign: a consigned car (success) and a car that is not consigned. Run `sh tools/godot/golden_run.sh auction_lots`.",
   SIM_HEAD % ("godot/sim/auction.gd", "SimAuction") + "Add `const AUCTION_REVEAL_COST := 150` and `const STATS := [\"desirability\", \"maintenance\", \"reliability\", \"condition\"]`. Functions (leave room: GDS10 and GDS13 append more functions to this file): "
   "`_find_lot(state, lot_id) -> Variant` (Dictionary or null); `_find_car(state, car_id)` and `_remove_car(state, car_id) -> bool` (same as the JS helpers); "
   "`_make_lot(state, exclude_model_ids: Array) -> Dictionary`: draws in THIS order: `tier = int(CoreRng.weighted(state, [{\"tier\": 1, \"w\": 40}, {\"tier\": 2, \"w\": 40}, {\"tier\": 3, \"w\": 20}])[\"tier\"])`; model = CoreRng.pick over the models of that tier not in exclude (file order); `condition = CoreRng.round_to(2.0 + 7.0 * CoreRng.rand(state), 0.1)`; `value = SimCarStats.market_value(state, model, {\"condition\": condition})`; three ceilings each `SimUtil.jround(value * (0.70 + 0.50 * CoreRng.rand(state)))`; append model id to exclude; return {lotId \"A\" + str(nextId) (then nextId += 1), modelId, condition, reserve = int(CoreRng.round_to(value * 0.7, 10)), revealCount 0, revealed {desirability false, maintenance false, reliability false, condition false}, currentBid 0, leader \"house\", ceilings}. "
   "`prepare_auction(state) -> void`: `state.auction.month = CoreClock.date_of(state.day).month`; lastResults = []; 6 lots via _make_lot sharing one exclude Array; `state.auction.lots = lots`. "
   "`lot_view(state, lot_id) -> Variant`: null for an unknown lot, else Dictionary with keys lotId, modelId, name, year, archetype (from the model), estLow = int(CoreRng.round_to(est * 0.65, 10)), estHigh = int(CoreRng.round_to(est * 1.35, 10)) where est = market_value(state, model, {\"condition\": 5.0}), revealed (copy of the 4 flags), values (only the revealed stats: desirability/maintenance/reliability from the MODEL, condition from the LOT), reserve, currentBid, leader, revealCount. "
   "`reveal_stat(state, lot_id, stat) -> Dictionary` with these refusals in this order (msg exact, all end with a full stop): no lot \"No such lot.\"; stat not in STATS \"That is not a stat you can reveal.\"; already revealed \"Already revealed that one.\"; revealCount >= 2 \"Max 2 reveals per lot.\"; cash < 150 \"Not enough cash for a peek.\"; success: cash -= 150, flag true, revealCount += 1, {ok true, msg \"Stat revealed.\"}. "
   "`consign_car(state, car_id, reserve: Variant) -> Dictionary`, refusals in order: CoreClock.is_auction_day(state.day) \"Too late: it is auction day.\"; no car \"No such car in the garage.\"; car.owned is not true \"You cannot consign a car you only rent.\"; already in state.auction.consigned \"That car is already consigned.\"; reserve invalid (not an int or float, or a float with a fraction, or < 0) \"The reserve must be a whole amount of \" + CoreFormat.money(0) + \" or more.\"; success: append {carId, reserve (as int)} and return {ok true, msg \"Consigned the \" + model.name + \" with a reserve of \" + CoreFormat.money(reserve) + \".\"}. "
   "`unconsign(state, car_id) -> Dictionary`: remove the entry -> {ok true, msg \"The car is out of the auction.\"}, else {ok false, msg \"That car is not consigned.\"}.",
   tstep("auction_lots", [
     ("prepare_auction", 18, True, "SimAuction.prepare_auction(st)\n_check(c, null, st)"),
     ("lot_view", 9, True, "_check(c, SimAuction.lot_view(st, a[0]), st)"),
     ("reveal_stat", 7, True, "_check(c, SimAuction.reveal_stat(st, a[0], a[1]), st)"),
     ("consign_car", 9, True, "_check(c, SimAuction.consign_car(st, a[0], a[1]), st)"),
     ("unconsign", 2, True, "_check(c, SimAuction.unconsign(st, a[0]), st)"),
   ])],
  accept=acc("auction_lots", 45), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS10
CARDS.append(dict(id="GDS10", title="Sim port: auction bidding", needs=["GDS09"],
  files=["tools/godot/golden_auction_bids.mjs", "godot/tests/golden/auction_bids.json", "godot/sim/auction.gd", "godot/tests/test_sim_auction_bids.gd"],
  goal="Second third of src/sim/auction.js: bid_step, min_bid and place_bid appended to `SimAuction`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/auction.js lines 200-290 (bidStep, minBid, placeBid) and tests/auction_bids.test.mjs", "godot/sim/auction.gd (GDS09: existing helpers _find_lot etc.)"],
  steps=[
   "`tools/godot/golden_auction_bids.mjs`: imports bidStep, minBid, placeBid. Helper `day24(seed)` = fresh(seed) with .day = 24 (auction day) and .cash = 50000. Cases: "
   "(a) `pureCase('bid_step', 'reserve ' + r, [r], bidStep({ reserve: r }))` for r in [100, 700, 1234, 5000, 40000]; "
   "(b) `pureCase('min_bid', name, [lot], minBid(lot))` for lot { reserve: 700, currentBid: 0 } and { reserve: 700, currentBid: 800 } and { reserve: 5000, currentBid: 5250 }; "
   "(c) place_bid cases `stateCase('place_bid', name, st, [lotId, steps], (s, id, n) => placeBid(s, id, n))`, st = day24(3) with lots[0].ceilings and lots[0].reserve edited as noted: ceilings [10, 10, 10] steps 1 (player leads); same steps 3; ceilings [999999, 1, 1] steps 1 (outbid); ceilings [999999, 1, 1] steps 3; steps 2 (refusal); lot already led by the player (leader 'player'); cash 50 (not enough); not an auction day (day 10); unknown lot 'A999'; garage full (st.garageSlots = 3 and three cars added with addCar); a lot where currentBid is already 2000 and ceilings [2100, 1, 1] (edge: best >= bid + step), and one with ceilings [2099, 1, 1] on the same setup (player leads); "
   "(d) a second lot already led by the player, one slot free, bidding on lots[1] (counts the leading lots against free slots): set lots[0].leader = 'player', garageSlots 3 with 2 cars added, bid on lots[1]. Run `sh tools/godot/golden_run.sh auction_bids`.",
   "Append to `godot/sim/auction.gd` (keep everything GDS09 wrote): "
   "`bid_step(lot) -> int` = int(maxf(50.0, CoreRng.round_to(lot[\"reserve\"] * 0.05, 10))); `min_bid(lot) -> int` = lot[\"reserve\"] if lot[\"currentBid\"] == 0 else lot[\"currentBid\"] + bid_step(lot); "
   "`place_bid(state, lot_id, steps) -> Dictionary`, refusals in THIS order with exact messages: not CoreClock.is_auction_day(state.day) \"Bidding only happens on auction day.\"; steps is not 1 and not 3 \"Bid one step or three steps.\"; no lot \"No such lot.\"; lot.leader == \"player\" \"You are already winning\" (no full stop); "
   "`step = bid_step(lot)`; `bid = min_bid(lot) + (steps - 1) * step`; cash < bid \"Not enough cash for that bid.\"; `leading` = number of lots in state.auction.lots whose leader is \"player\"; cars.size() + leading >= garageSlots \"No free garage slot to win another car.\"; "
   "`best = lot[\"ceilings\"].max()`; if best >= bid + step: currentBid = bid + step, leader \"ai\", return {ok true, msg \"Outbid! The bid is now \" + CoreFormat.money(lot.currentBid) + \".\", outbid true}; else currentBid = bid, leader \"player\", return {ok true, msg \"You lead at \" + CoreFormat.money(bid) + \".\", outbid false}. No day passes and no rng is drawn.",
   tstep("auction_bids", [
     ("bid_step", 5, False, "_check(c, SimAuction.bid_step({\"reserve\": a[0]}))"),
     ("min_bid", 3, False, "_check(c, SimAuction.min_bid(a[0]))"),
     ("place_bid", 12, True, "_check(c, SimAuction.place_bid(st, a[0], a[1]), st)"),
   ])],
  accept=acc("auction_bids", 21), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS11
CARDS.append(dict(id="GDS11", title="Sim port: month", needs=["GDS04", "GDS09"],
  files=["tools/godot/golden_month.mjs", "godot/tests/golden/month.json", "godot/sim/month.gd", "godot/tests/test_sim_month.gd"],
  goal="Port src/sim/month.js (month-end bills, faults, market drift, next auction, bankruptcy) to `SimMonth`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/month.js (read fully) and tests/month.test.mjs", "godot/sim/faultsim.gd (GDS04), godot/sim/auction.gd (GDS09: prepare_auction), godot/sim/carstats.gd"],
  steps=[
   "`tools/godot/golden_month.mjs`: imports monthEnd. Helper `setup(seed, day)`: `const s = fresh(seed); s.day = day; addCar(s, 't1_allergy', {condition: 6}); addCar(s, 't2_serious', {condition: 3.5, fault: {faultId: 'puncture', label: 'Puncture', cost: 90}}); addCar(s, 't3_porshe', {condition: 8}); addCar(s, 't1_robbin', {owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 5, condition: 4}); return s;`. Cases `stateCase('month_end', name, st, [opts], (s, o) => monthEnd(s, o))` (the report is the result): "
   "seeds 1..6 with day 32 and opts {} ; seeds 1..3 with day 60 and {}; seeds 1..2 with day 335 and {}; seed 4 day 32 with opts { skipFaults: true }; seed 5 day 32 on fresh(5) with no cars added (name 'no cars'); bankruptcy: seed 6 day 32 with cash set to -1500 (bills push it below -2000: flags.gameOver true, reason 'bankrupt'); not bankrupt: seed 6 day 32 cash 100000. "
   "The script THROWS unless at least one report has a non-empty newFaults and at least one run ends with flags.reason 'bankrupt'. Run `sh tools/godot/golden_run.sh month`.",
   SIM_HEAD % ("godot/sim/month.gd", "SimMonth") + "`const GARAGE_LEASE := 400`, `const OVERDRAFT_LIMIT := -2000`. `month_end(state, opts: Dictionary = {}) -> Dictionary`: `ended = CoreClock.date_of(state.day - 1)`; report = {month: ended.month, monthName: ended.monthName, rent 0, running 0, lease GARAGE_LEASE, total 0, cashAfter 0, newFaults []}. Steps in this order: "
   "(1) for each car: if car.owned == false: rent += (car.rentMonthly or 0); elif car.owned == true: running += SimCarStats.running_cost(SimData.model_of(car.modelId), car); "
   "(2) total = rent + running + lease; state.cash -= total; "
   "(3) unless opts.get(\"skipFaults\", false): for each car WITHOUT a fault (car.fault == null): model = model_of; `fault = SimFaultSim.roll_fault(state, model, car, 0.5)`; if not null: SimFaultSim.apply_fault(car, fault); state.stats.faults += 1; report.newFaults.append(model.name + \": \" + fault.label); "
   "(4) `state.market.priceMult = CoreRng.clamp(CoreRng.round_to(state.market.priceMult + (CoreRng.rand(state) - 0.5) * 0.06, 0.001), 0.85, 1.25)` (ONE rand draw, after all fault rolls); "
   "(5) SimAuction.prepare_auction(state); (6) report.cashAfter = state.cash; state.lastMonthReport = report; "
   "(7) if state.cash < OVERDRAFT_LIMIT: flags.gameOver = true, won = false, reason = \"bankrupt\". Return report. (state.lastMonthReport and the returned report are equal Dictionaries.)",
   tstep("month", [
     ("month_end", 15, True, "_check(c, SimMonth.month_end(st, a[0]), st)"),
   ])],
  accept=acc("month", 15), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS12
CARDS.append(dict(id="GDS12", title="Sim port: advance (the day clock)", needs=["GDS05", "GDS06", "GDS07", "GDS08", "GDS11"],
  files=["tools/godot/golden_advance.mjs", "godot/tests/golden/advance.json", "godot/sim/advance.gd", "godot/tests/test_sim_advance.gd"],
  goal="Port src/sim/advance.js (advance_day: decay, buzz fade, calendar, month-end, phone, shop refresh, plates, situations, headline, end check; and start_of_day_flags) to `SimAdvance`. This is the heart of the sim: every action ends with it.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/advance.js (read fully) and tests/advance.test.mjs", "godot/sim/month.gd, jobsim.gd, shop.gd, endgame.gd, news.gd, carstats.gd (GDS03-GDS11)"],
  steps=[
   "`tools/godot/golden_advance.mjs`: imports advanceDay, startOfDayFlags. `stateCase('advance_day', name, st, [], s => advanceDay(s))` on these states (name them S1..S19 plus a short description): "
   "S1-S8: fresh(1)..fresh(8) unchanged (day 1 -> 2); "
   "S9: fresh(2) with day 31 and cars `addCar(s,'t1_allergy',{condition:6})`, `addCar(s,'t3_porshe',{condition:8})`, `addCar(s,'t1_robbin',{owned:false, owner:'Big Baz', rentMonthly:260, rentedAtCondition:5, condition:4})` (month end on Feb 1); "
   "S10: fresh(3) day 23 (auction day tomorrow); S11: fresh(4) day 364; S12: fresh(5) day 365 (year over: no bills, no phone); S13: fresh(6) with flags.gameOver = true (nothing changes); "
   "S14: fresh(7) with reputation 85 (a plate is won); S15: fresh(8) with cash 500 (broke); S16: fresh(9) with cash 60000 (rich); "
   "S17: fresh(10) with three cars added (garageSlots 3: full garage), pending ['A note'] and sit ['bigwin']; S18: fresh(11) with day 7 and two requests {id:'Q81', expiresDay:5, ...} and {id:'Q82', expiresDay:20, ...} (any other fields as in a normal request: jobTypeId 'wedding', customer 'Mrs Test', fee 500, minDesirability 1, minReliability 1, minCondition 1, blurb 'x') (shop refresh on day 8, expiry); "
   "S19: fresh(12) with day 31, cash -3000 (bankrupt at month end). "
   "Then `stateCase('advance_seq', 'sixty days seed 2', S, [60], (s, n) => { const out = []; for (let i = 0; i < n; i++) { advanceDay(s); out.push([s.day, s.cash, s.reputation, s.buzz, s.today.headline, s.today.events.length, s.requests.length]); } return out; })` where S = fresh(2) with two cars added (a t1_allergy cond 6 and a t2_serious cond 7). "
   "Then `stateCase('start_of_day_flags', 'day ' + d, { day: d }, [], s => startOfDayFlags(s))` for d in [1, 10, 24, 365]. Run `sh tools/godot/golden_run.sh advance`.",
   SIM_HEAD % ("godot/sim/advance.gd", "SimAdvance") + "`advance_day(state) -> void`, steps in this order (follow the JS comments (1)-(13)): "
   "if flags.gameOver: return. (1) every car: `SimCarStats.change_condition(car, -SimCarStats.idle_decay(SimData.model_of(car.modelId)))`. (2) `state.buzz = maxf(0.0, CoreRng.round_to(state.buzz * 0.9, 0.1))`. (3) day += 1. "
   "(4) `events = state.pending.duplicate()`, `sit = state.sit.duplicate()`, then `state.pending = []`, `state.sit = []`, `month_report = null`. "
   "(5) if state.day > CoreClock.DAYS_IN_YEAR: `state.today = {day, headline \"\", events, monthReport null}`; SimEndGame.check_end(state); return. "
   "(6) if CoreClock.is_month_start(state.day): month_report = SimMonth.month_end(state); events.append(\"Month end: bills of \" + CoreFormat.money(month_report.total)); each newFaults string appended; sit.append(\"monthend\"). "
   "(7) SimJobSim.expire_requests(state); if SimJobSim.generate_requests(state) > 0: events.append(\"The phone rings: new booking request(s)!\"). "
   "(8) if SimShop.should_refresh(state.day): SimShop.refresh_shop(state); events.append(\"New cars on the TV!\"). "
   "(9) for key in SimEndGame.evaluate_plates(state): events.append(\"GOLD NUMBER PLATE won: \" + SimEndGame.plate_info()[key].name + \"!\"). "
   "(10) sit: cash < 1000 \"broke\"; cash > 50000 \"rich\"; cars.size() >= garageSlots \"fullgarage\"; cars.size() == 0 \"emptygarage\"; CoreClock.is_auction_day(day) \"auctionday\" (appended in this order). "
   "(11) `ctx = {\"cash\": state.cash}`; if cars is not empty: `ctx[\"car\"] = SimData.model_of(CoreRng.pick(state, state.cars).modelId).name` (a draw); if requests is not empty: `ctx[\"customer\"] = CoreRng.pick(state, state.requests).customer` (a draw, after the car draw); `headline = SimNews.choose_headline(state, sit, ctx)`. "
   "(12) `state.today = {day, headline, events, monthReport: month_report}`. (13) SimEndGame.check_end(state). "
   "`start_of_day_flags(state) -> Dictionary` = {isAuctionDay: CoreClock.is_auction_day(day), isMonthStart: CoreClock.is_month_start(day), daysLeftInYear: CoreClock.DAYS_IN_YEAR - day}.",
   tstep("advance", [
     ("advance_day", 19, True, "SimAdvance.advance_day(st)\n_check(c, null, st)"),
     ("advance_seq", 1, True, "var out: Array = []\nfor i in range(int(a[0])):\n\tSimAdvance.advance_day(st)\n\tout.append([st[\"day\"], st[\"cash\"], st[\"reputation\"], st[\"buzz\"], st[\"today\"][\"headline\"], st[\"today\"][\"events\"].size(), st[\"requests\"].size()])\n_check(c, out, st)"),
     ("start_of_day_flags", 4, True, "_check(c, SimAdvance.start_of_day_flags(st), st)"),
   ])],
  accept=acc("advance", 24), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS13
CARDS.append(dict(id="GDS13", title="Sim port: auction attend", needs=["GDS10", "GDS12"],
  files=["tools/godot/golden_auction_attend.mjs", "godot/tests/golden/auction_attend.json", "godot/sim/auction.gd", "godot/tests/test_sim_auction_attend.gd"],
  goal="Last third of src/sim/auction.js: attend_auction (auction-day settlement: consigned cars under the hammer, then the lots the player leads) appended to `SimAuction`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/auction.js lines 290-339 (attendAuction) and tests/auction_bids.test.mjs (attend cases)", "godot/sim/auction.gd (GDS09/GDS10) and godot/sim/advance.gd (GDS12)"],
  steps=[
   "`tools/godot/golden_auction_attend.mjs`: imports attendAuction. Helper `day24(seed)` = fresh(seed) with .day = 24 and .cash = 50000. Every case is `stateCase('attend_auction', name, st, [], s => attendAuction(s))`: "
   "A1: day24(1) nothing consigned, nobody leads (msg 'The gavel fell on nothing at all.'); "
   "A2-A5: day24(s) for s in 2..5 with `const car = addCar(st, 't2_serious', {condition: 6})` and `st.auction.consigned = [{carId: car.id, reserve: 100}]` (sold, different rng draws); "
   "A6: day24(2) with the same car and reserve 900000 (fails the reserve); A7: a consigned entry whose car does not exist (carId 'c99'); "
   "A8: day24(3) with lots[0].leader = 'player', lots[0].currentBid = 1500 (won; one slot free since there are no cars); A9: the same but cash 1000 (could not pay: reputation -2); A10: the same but garageSlots 1 with one car added (garage full); "
   "A11: two consigned cars (t1_allergy cond 7 reserve 100, t3_porshe cond 9 reserve 100) plus lots[1] and lots[2] led by the player with currentBid 2000 and 2500 and garageSlots 5; "
   "A12: day 10 (refusal: only on day 24); A13: day24(4) with st.auction.attendedDay = 24 (refusal: already been); A14: a sale that sets a new stats.bestAuctionSale (consign a t3_aston cond 10 with reserve 100 and stats.bestAuctionSale 5). "
   "The script THROWS unless at least one case sold a car (results contain 'Sold the') and at least one contains 'could not pay'. Run `sh tools/godot/golden_run.sh auction_attend`.",
   "Append to `godot/sim/auction.gd` (keep everything earlier): `attend_auction(state) -> Dictionary`. Refusals: not CoreClock.is_auction_day -> {ok false, msg \"The auction is only on day 24 of the month.\"}; `state.auction.get(\"attendedDay\") == state.day` -> {ok false, msg \"You have already been to this auction.\"}. "
   "`results = []`. (1) `consigned = state.auction.consigned.duplicate()`; for each entry: remove it from state.auction.consigned (find by carId); `car = _find_car(...)`; if null continue (NO rng draw); `model = SimData.model_of(car.modelId)`; `price = SimUtil.jround(SimCarStats.market_value(state, model, car) * (0.85 + 0.40 * CoreRng.rand(state)))`; if price >= entry.reserve: `fee = SimUtil.jround(price * 0.08)`; cash += price - fee; _remove_car; stats.carsSold += 1; stats.bestAuctionSale = maxi(stats.bestAuctionSale, price); results.append(\"Sold the \" + model.name + \" for \" + CoreFormat.money(price) + \" (fee \" + CoreFormat.money(fee) + \")\"); else results.append(\"The \" + model.name + \" failed to meet its reserve\"). "
   "(2) for each lot in state.auction.lots (in order) whose leader == \"player\": model; if cash >= lot.currentBid and cars.size() < garageSlots: cash -= currentBid; push a new car {id \"c\" + str(nextId) (nextId += 1), modelId, owned true, owner null, rentMonthly 0, paid lot.currentBid, condition lot.condition, fault null, lastServiceDay state.day, jobsDone 0, boughtDay state.day, impoundedUntil 0, rentedAtCondition null}; stats.carsBought += 1; results.append(\"You won the \" + model.name + \" for \" + CoreFormat.money(lot.currentBid) + \".\"); else reputation = maxi(0, reputation - 2) and results.append(\"You could not pay for the \" + model.name + \".\"). "
   "(3) `state.auction.lots = []`; `state.auction.lastResults = results`; every result appended to state.pending; `state.auction.attendedDay = state.day`; `msg = \" \".join(results) if results.size() > 0 else \"The gavel fell on nothing at all.\"`; SimAdvance.advance_day(state); return {ok true, msg, results}.",
   tstep("auction_attend", [
     ("attend_auction", 14, True, "_check(c, SimAuction.attend_auction(st), st)"),
   ])],
  accept=acc("auction_attend", 14), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS14
CARDS.append(dict(id="GDS14", title="Sim port: garage", needs=["GDS12"],
  files=["tools/godot/golden_garage.mjs", "godot/tests/golden/garage.json", "godot/sim/garage.gd", "godot/tests/test_sim_garage.gd"],
  goal="Port src/sim/garage.js (service_car quick/full, fix_fault, restore_car) to `SimGarage`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/garage.js (read fully) and tests/garage.test.mjs", "godot/sim/advance.gd, carstats.gd (GDS03, GDS12)"],
  steps=[
   "`tools/godot/golden_garage.mjs`: imports serviceCar, fixFault, restoreCar. Helper `g(seed, condition, extra)` = fresh(seed) with one car `addCar(s, 't2_serious', Object.assign({condition: condition}, extra || {}))` and the car's id as args[0]. Cases (all `stateCase(fn, name, st, [carId, ...], call)`, fn names 'service_car', 'fix_fault', 'restore_car'): "
   "service_car: quick on cond 5; full on cond 5 (sets lastServiceDay); full on cond 9 (clamps to 10); quick on cond 10 ('Already perfect'); full with cash 20 (not enough); kind 'bogus'; unknown car 'c99'; quick on a t3_porshe cond 2; "
   "fix_fault: a car with fault {faultId:'puncture', label:'Puncture', cost:90} cash 5000 (success); the same with cash 50 (not enough); no fault ('Nothing to fix'); unknown car; a t3 car with fault cost 1400; "
   "restore_car: cond 3 with a fault (success; cost max(1200, round(basePrice*0.06))); a t3_porshe cond 4 (cost from basePrice); cond 10 with no fault ('Already perfect'); cond 10 WITH a fault (allowed); cash 100 (not enough); unknown car. "
   "Use seeds 1..4 spread over the cases. Run `sh tools/godot/golden_run.sh garage`.",
   SIM_HEAD % ("godot/sim/garage.gd", "SimGarage") + "Private helpers `_find_car(state, car_id)` (Dictionary or null) and `_finish(state, msg) -> Dictionary` (state.pending.append(msg); SimAdvance.advance_day(state); return {ok true, msg}). Refusals return {ok false, msg} and change nothing, no day passes. "
   "`service_car(state, car_id, kind) -> Dictionary`: refusal order: no car \"No such car\"; kind not \"quick\"/\"full\" \"No such treatment\"; cost = quick ? SimUtil.jround(40 + model.basePrice * 0.002) : SimUtil.jround(150 + model.basePrice * 0.008); condition >= 10 \"Already perfect\"; cash < cost \"Not enough money\". Success: cash -= cost; before = condition; after = SimCarStats.change_condition(car, 1.0 if quick else 2.5); quick msg = \"Quick tinker on the \" + model.name + \": condition \" + CoreFormat.one_dp(before) + \" -> \" + CoreFormat.one_dp(after) + \". Cost \" + CoreFormat.money(cost) + \".\"; full also sets car.lastServiceDay = state.day and msg = \"Full service on the \" + model.name + \": condition \" + one_dp(before) + \" -> \" + one_dp(after) + \". Cost \" + money(cost) + \".\"; return _finish. "
   "`fix_fault(state, car_id) -> Dictionary`: no car \"No such car\"; fault null \"Nothing to fix\"; cash < fault.cost \"Not enough money\"; success: cost = fault.cost; cash -= cost; label = fault.label; car.fault = null; after = change_condition(car, 0.5); msg = \"Fixed the \" + label + \" on the \" + model.name + \" for \" + money(cost) + \". Condition now \" + one_dp(after) + \".\". "
   "`restore_car(state, car_id) -> Dictionary`: no car \"No such car\"; cost = maxi(1200, SimUtil.jround(model.basePrice * 0.06)); condition >= 10 and fault == null \"Already perfect\"; cash < cost \"Not enough money\"; success: cash -= cost; fault = null; after = change_condition(car, 10 - car.condition); lastServiceDay = day; msg = \"Full restoration of the \" + model.name + \": good as new, \" + one_dp(after) + \" condition. Cost \" + money(cost) + \".\".",
   tstep("garage", [
     ("service_car", 8, True, "_check(c, SimGarage.service_car(st, a[0], a[1]), st)"),
     ("fix_fault", 5, True, "_check(c, SimGarage.fix_fault(st, a[0]), st)"),
     ("restore_car", 6, True, "_check(c, SimGarage.restore_car(st, a[0]), st)"),
   ])],
  accept=acc("garage", 19), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS15
JR_CLASSIFY = ("classify = (w, r) => { if (!r.ok) return null; const o = r.outcome; const car = w.cars[0]; if (o.type === 'success') return car.fault ? 'success_fault' : 'success'; if (o.type === 'mishap') return car.fault ? 'mishap_fault' : 'mishap'; "
               "if (o.type === 'breakdown') return 'breakdown'; return o.paid < 0 ? 'disaster_comp' : (car.impoundedUntil > 0 ? 'disaster_impound' : 'disaster_truck'); }")
CARDS.append(dict(id="GDS15", title="Sim port: jobresolve (checks, success, mishap, breakdown)", needs=["GDS04", "GDS12"],
  files=["tools/godot/golden_jobresolve.mjs", "godot/tests/golden/jobresolve.json", "godot/sim/jobresolve.gd", "godot/tests/test_sim_jobresolve.gd"],
  goal="Port src/sim/jobresolve.js accept_job: the refusals, the fault roll, the outcome roll and the success, mishap and breakdown branches. The disaster branch is a stub here and is finished by GDS16; the golden file covers ALL outcomes and this card's test skips the disaster ones.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/jobresolve.js (read fully) and tests/jobresolve.test.mjs, tests/jobs_a.test.mjs", "godot/sim/faultsim.gd, advance.gd, carstats.gd, simdata.gd"],
  steps=[
   "`tools/godot/golden_jobresolve.mjs`: imports acceptJob, jobresolve helpers are private. Base state `base`: `const b = fresh(4); addCar(b, 't2_serious', {condition: 8.5}); b.requests = [{ id: 'Q900', jobTypeId: 'wedding', customer: 'Mrs Test', fee: 1200, minDesirability: 1, minReliability: 1, minCondition: 1, expiresDay: b.day + 5, blurb: '' }];` (car id c<n> = b.cars[0].id). "
   "Define " + JR_CLASSIFY + ". `const found = sweepSeeds(base, 1, 30000, (w) => acceptJob(w, 'Q900', base.cars[0].id), classify, 2);` The script THROWS unless found has all 8 kinds success, success_fault, mishap, mishap_fault, breakdown, disaster_truck, disaster_comp, disaster_impound. "
   "Cases (fn 'accept_job', args [requestId, carId]): for every kind and each of its (up to 2) seeds one case `stateCase('accept_job', kind + ' seed ' + seed, <base clone with .rng = seed>, ['Q900', carId], (s, r, c) => acceptJob(s, r, c))`; "
   "plus 'bigwin' = the first 'success' seed with the request fee changed to 2400; plus 'low fee' = the first success seed with fee 1999 (no bigwin); "
   "plus these refusals (rng 1 each): unknown request 'Q1'; unknown car 'c99'; expired (request.expiresDay = b.day - 1); car with fault {faultId:'puncture', label:'Puncture', cost:90} (not fit to go out); car impoundedUntil = b.day + 2; minDesirability 99; minReliability 99; minCondition 9.5 (car cond 8.5). "
   "Run `sh tools/godot/golden_run.sh jobresolve`.",
   SIM_HEAD % ("godot/sim/jobresolve.gd", "SimJobResolve") + "Constants `DISASTER_P := 0.007`, `MISHAP_P := 0.057`. Private helpers `_find_request`, `_find_car`, `_remove_request` (by id), `_bump_reputation(state, delta)` (reputation = CoreRng.clamp(reputation + delta, 0, 100)). "
   "`accept_job(state, request_id, car_id) -> Dictionary`: refusals IN THIS ORDER, each {ok false, msg}: no request \"No such booking\"; no car \"No such car in the garage\"; req.expiresDay < state.day \"That booking has expired\"; not SimCarStats.is_available \"That car is not fit to go out\"; "
   "model, car_d = eff_d, car_r = eff_r: car_d < req.minDesirability \"The \" + model.name + \" is not desirable enough for this booking (needs \" + SimUtil.num_str(req.minDesirability) + \").\"; car_r < req.minReliability \"The \" + model.name + \" is not reliable enough for this booking (needs \" + num_str(req.minReliability) + \").\"; car.condition < req.minCondition \"The \" + model.name + \" is in too poor condition for this booking (needs \" + num_str(req.minCondition) + \").\". "
   "Then (draw order is the test): `job = SimData.job_type_of(req.jobTypeId)`; `fault = SimFaultSim.roll_fault(state, model, car, 1.0)`; `roll = CoreRng.rand(state)`; type = \"disaster\" if roll < DISASTER_P, \"mishap\" if roll < MISHAP_P, else \"success\"; if fault != null and fault.severity == \"major\": type = \"breakdown\"; "
   "`wear = CoreRng.round_to(job.wearMin + CoreRng.rand(state) * (job.wearMax - job.wearMin), 0.1)` (drawn for EVERY type); `paid = 0`; `fault_label = fault.label if fault != null else null`; `text = \"\"`. "
   "success: paid = fee; cash += fee; _bump_reputation(+3 if car_d >= req.minDesirability + 2 else +2); change_condition(car, -wear); car.jobsDone += 1; stats.jobsDone += 1; text = SimData.fill_text(CoreRng.pick(state, job.success), {customer, car: model.name}); if fault is minor or medium: apply_fault(car, fault) and text += \" (Then the \" + fault.label + \" started.)\". "
   "mishap: paid = SimUtil.jround(fee * 0.6); cash += paid; rep -1; change_condition(car, -wear * 2); jobsDone += 1; stats.jobsDone += 1; text = fill_text(pick(job.mishap), ...); if fault minor/medium: apply_fault (no text added). "
   "breakdown: paid = jround(fee * 0.25); cash += paid; rep -4; apply_fault(car, fault); stats.jobsFailed += 1; stats.faults += 1; state.sit.append(\"breakdown\"); text = model.name + \" broke down: \" + fault.label + \". \" + customer + \" is not impressed.\" (NO pick draw). "
   "disaster: `var d := _apply_disaster(state, req, car, model, job, fee, wear)`; paid = d.paid; fault_label = d.faultLabel; text = d.text. "
   "`static func _apply_disaster(state, req, car, model, job, fee, wear) -> Dictionary` is a STUB in this card: body `push_error(\"disaster branch not ported yet (card GDS16)\")` then `return {\"paid\": 0, \"faultLabel\": null, \"text\": \"\"}`. "
   "After the branches: if type is success or mishap and fee >= 2000: state.sit.append(\"bigwin\"); `_remove_request(state, request_id)`; state.pending.append(text); SimAdvance.advance_day(state); return {ok true, msg text, outcome {type, paid, wear, faultLabel}}.",
   tstep("jobresolve", [
     ("accept_job", 25, True, "var skip: bool = c[\"result\"].has(\"outcome\") and c[\"result\"][\"outcome\"][\"type\"] == \"disaster\"\nif skip:\n\tcontinue\n_check(c, SimJobResolve.accept_job(st, a[0], a[1]), st)"),
   ]) + "\nAlso add `test_golden_has_all_kinds`: loop the cases of accept_job and assert that the outcome types success, mishap, breakdown and disaster all occur at least once in the golden file, and that a case named 'bigwin' exists (so the fixture is not hollow)."],
  accept=acc("jobresolve", 26), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS16
CARDS.append(dict(id="GDS16", title="Sim port: jobresolve disaster branch", needs=["GDS15"],
  files=["godot/sim/jobresolve.gd", "godot/tests/test_sim_jobresolve.gd"],
  goal="Finish `SimJobResolve`: replace the `_apply_disaster` stub (GDS15) with the real disaster branch and make the test cover the disaster cases too.",
  read=[R_PR, R_GR, "src/sim/jobresolve.js lines 150-192 (the disaster branch) and its place in acceptJob", "godot/sim/jobresolve.gd (GDS15) and godot/tests/golden/jobresolve.json (already committed: the cases whose result.outcome.type is 'disaster' have names 'disaster_truck seed N', 'disaster_comp seed N', 'disaster_impound seed N')"],
  steps=[
   "In `godot/sim/jobresolve.gd` rewrite `_apply_disaster(state, req, car, model, job, fee, wear) -> Dictionary` (no other function changes). Order of effects and draws: "
   "`SimCarStats.change_condition(car, -wear * 4)`; `_bump_reputation(state, -6)`; `state.stats.jobsFailed += 1`; `state.sit.append(\"breakdown\")`; `var flavour := CoreRng.rand_int(state, 1, 3)`; "
   "`customer = req.customer`; `paid = 0`; `fault_label = null`. "
   "flavour 1 (truck): `major = CoreRng.pick(state, SimData.faults_of_severity(\"major\"))`; `major_fault = {faultId: major.id, label: major.label, cost: int(CoreRng.round_to(major.baseCost * SimData.tier_mult(model.tier), 10)), severity: \"major\"}`; SimFaultSim.apply_fault(car, major_fault); fault_label = major_fault.label; "
   "text = SimData.fill_text(CoreRng.pick(state, job.disaster), {customer, car: model.name}) + \" The \" + model.name + \" went home on the back of a truck: \" + major_fault.label + \".\". "
   "flavour 2 (compensation): `compensation = SimUtil.jround(fee * 0.5)`; cash -= compensation; paid = -compensation; text = fill_text(pick(job.disaster), ...) + \" \" + customer + \" demanded \" + CoreFormat.money(compensation) + \" in compensation before the kettle boiled.\". "
   "flavour 3 (police): car.impoundedUntil = state.day + 3; text = fill_text(pick(job.disaster), ...) + \" The police impounded the \" + model.name + \" for three days.\". "
   "Note the `pick(job.disaster)` draw happens AFTER the flavour draw (and after the major-fault pick in flavour 1). Return {paid, faultLabel: fault_label, text}.",
   "In `godot/tests/test_sim_jobresolve.gd` delete the disaster skip (the `skip` lines) in `test_accept_job` so every golden case runs, and add `test_disaster_flavours`: collect the case names beginning with 'disaster_truck', 'disaster_comp', 'disaster_impound' and assert each prefix occurs at least once and that all of them pass (the loop in test_accept_job already checks them; this test only asserts the prefixes exist)."],
  accept=["`sh tools/godot/gtest.sh test_sim_jobresolve` prints a last line `GDTEST OK`.", "`grep -c 'not ported yet' godot/sim/jobresolve.gd` prints 0."],
  oos=["Every file not listed under files; do not regenerate the golden fixture.", "No scenes, no UI, no autoload edits."]))

# ---------------------------------------------------------------------------------------------------------------- GDS17
CARDS.append(dict(id="GDS17", title="Sim port: adsim", needs=["GDS12"],
  files=["tools/godot/golden_adsim.mjs", "godot/tests/golden/adsim.json", "godot/sim/adsim.gd", "godot/tests/test_sim_adsim.gd"],
  goal="Port src/sim/adsim.js (the advertising gamble) to `SimAdSim`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/adsim.js (read fully) and tests/adsim.test.mjs, tests/adverts.test.mjs", "godot/sim/advance.gd (GDS12), godot/sim/simdata.gd (advert_by_id)"],
  steps=[
   "`tools/godot/golden_adsim.mjs`: imports advertise. Cases `stateCase('advertise', name, st, [mediaId], (s, m) => advertise(s, m))`: "
   "(a) for each medium in ['paper','internet','magazine','youtube','radio','billboard','tv'] and seed 1..5, st = fresh(seed) with cash 100000 (35 cases); "
   "(b) refusals: unknown media 'nosuchad'; 'tv' with cash 100 (not enough money); "
   "(c) clamps: 'magazine' on fresh(2) with buzz 98 and reputation 99, cash 100000; "
   "(d) viral: for media in ['youtube','tv'], `sweepSeeds(base, 1, 5000, w => advertise(w, media), (w, r) => r.ok && r.outcome.buzz >= 80 ? 'viral' : null, 1)` on base = fresh(1) with cash 100000 and add the case for that seed (name 'viral youtube', 'viral tv'); the script THROWS if no seed is found. Run `sh tools/godot/golden_run.sh adsim`.",
   SIM_HEAD % ("godot/sim/adsim.gd", "SimAdSim") + "`advertise(state, media_id) -> Dictionary`: `medium = SimData.advert_by_id(media_id)`; empty -> {ok false, msg \"No such advert\"}; `state.cash < medium.cost` -> {ok false, msg \"Not enough money\"}. "
   "Then: cash -= cost; `outcome = CoreRng.weighted(state, medium[\"outcomes\"])` (items carry w, id, buzz, rep, texts); `state.buzz = CoreRng.clamp(state.buzz + outcome.buzz, 0, 100)`; `state.reputation = CoreRng.clamp(state.reputation + outcome.rep, 0, 100)`; stats.adsRun += 1; "
   "`text = CoreRng.pick(state, outcome.texts).replace(\"{medium}\", medium.name)`; state.pending.append(text); if outcome.buzz >= 80: state.sit.append(\"viral\"); SimAdvance.advance_day(state); "
   "return {ok true, msg text, outcome {id: outcome.id, buzz: outcome.buzz, rep: outcome.rep, mediaId: media_id}}.",
   tstep("adsim", [
     ("advertise", 39, True, "_check(c, SimAdSim.advertise(st, a[0]), st)"),
   ])],
  accept=acc("adsim", 40), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS18
CARDS.append(dict(id="GDS18", title="Sim port: actions", needs=["GDS12"],
  files=["tools/godot/golden_actions.mjs", "godot/tests/golden/actions.json", "godot/sim/actions.gd", "godot/tests/test_sim_actions.gd"],
  goal="Port src/sim/actions.js (buy_car, rent_car, return_rental, sell_to_dealer, buy_slot, wait_day) to `SimActions`.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/actions.js (read fully) and tests/actions.test.mjs", "godot/sim/advance.gd, carstats.gd, simdata.gd"],
  steps=[
   "`tools/godot/golden_actions.mjs`: imports the six actions. Helpers: `sale(s)` / `rent(s)` = first listing of that mode in s.shop.listings; `base(seed)` = fresh(seed). Cases (`stateCase(fn, name, st, args, call)`; listing/car ids are read from the JS state when the case is built): "
   "buy_car: seeds 1..3 buying sale(s) (success); buying the rent listing (refusal 'No such car for sale on the telly'); unknown id 'L99'; no free slot (garageSlots 3 with three cars added); cash 100; "
   "rent_car: seeds 1..3 renting rent(s); renting a sale listing (refusal); no free slot; cash 50; "
   "return_rental: a rented car with condition 6 and rentedAtCondition 8 on a t1_robbin (damage fee 2 x 2% x basePrice); the same with condition 8 (no damage, fee 0); condition 9 (condition above start: still fee 0); an owned car (refusal 'That car is not one of your rentals'); cash 0 with damage (refusal 'Cannot afford the damage fee'); unknown car; "
   "sell_to_dealer: an owned t2_serious cond 6 (success); a rented car (refusal 'You do not own that car'); a consigned car (st.auction.consigned = [{carId: id, reserve: 100}]; refusal 'Withdraw it from the auction first'); unknown car; "
   "buy_slot: garageSlots 3 cash 20000 (success); garageSlots 8 (refusal 'Garage is full-size already'); cash 2999 (refusal 'Not enough money'); "
   "wait_day: seeds 1..3. Each success also checks the new car's full object in the `after` state. Run `sh tools/godot/golden_run.sh actions`.",
   SIM_HEAD % ("godot/sim/actions.gd", "SimActions") + "Constants `SLOT_COST := 3000`, `MAX_SLOTS := 8`, `DEALER_CUT := 0.6`. Private helpers `_find_listing`, `_find_car`, `_remove_listing`, `_remove_car` (by id, as in the JS), `_slot_and_cash_refusal(state, cost) -> String` (\"No free garage slot\" when cars.size() >= garageSlots, then \"Not enough money\" when cash < cost, else \"\"), `_succeed(state, msg) -> Dictionary` (pending.append(msg); SimAdvance.advance_day(state); return {ok true, msg}). "
   "`buy_car(state, listing_id)`: listing missing or mode != \"sale\" -> {ok false, msg \"No such car for sale on the telly\"}; refusal text from the helper; success: car = {id \"c\" + str(nextId) (nextId += 1), modelId, owned true, owner null, rentMonthly 0, paid listing.price, condition listing.condition, fault null, lastServiceDay state.day, jobsDone 0, boughtDay state.day, impoundedUntil 0, rentedAtCondition null}; cars.append; cash -= price; remove listing; stats.carsBought += 1; _succeed(\"Bought the \" + model.name + \" for \" + CoreFormat.money(price)). "
   "`rent_car(state, listing_id)`: mode != \"rent\" -> \"No such car for rent on the telly\"; same refusals; car with owned false, owner listing.owner, rentMonthly listing.price, paid 0, rentedAtCondition listing.condition (rest as above); cash -= price; remove listing; _succeed(\"Rented the \" + model.name + \" from \" + listing.owner). "
   "`return_rental(state, car_id)`: car missing or car.owned != false -> \"That car is not one of your rentals\"; `damage = maxf(0.0, car.rentedAtCondition - car.condition)`; `fee = SimUtil.jround(damage * 0.02 * model.basePrice)`; cash < fee -> \"Cannot afford the damage fee\"; cash -= fee; remove car; _succeed(\"Returned the \" + model.name + \" to \" + car.owner + \". Damage fee: \" + money(fee) + \".\"). "
   "`sell_to_dealer(state, car_id)`: car missing or owned != true -> \"You do not own that car\"; carId in state.auction.consigned -> \"Withdraw it from the auction first\"; `price = int(CoreRng.round_to(SimCarStats.market_value(state, model, car) * DEALER_CUT, 10))`; remove car; cash += price; stats.carsSold += 1; _succeed(\"Sold the \" + model.name + \" to the dealer for \" + money(price) + \".\"). "
   "`buy_slot(state)`: garageSlots >= MAX_SLOTS -> \"Garage is full-size already\"; cash < SLOT_COST -> \"Not enough money\"; cash -= 3000; garageSlots += 1; _succeed(\"Bought another garage slot for \" + money(SLOT_COST) + \".\"). `wait_day(state)` = _succeed(state, \"You put the kettle on. Nothing happens. Lovely.\"). All refusals are {ok false, msg} and change nothing.",
   tstep("actions", [
     ("buy_car", 7, True, "_check(c, SimActions.buy_car(st, a[0]), st)"),
     ("rent_car", 6, True, "_check(c, SimActions.rent_car(st, a[0]), st)"),
     ("return_rental", 6, True, "_check(c, SimActions.return_rental(st, a[0]), st)"),
     ("sell_to_dealer", 4, True, "_check(c, SimActions.sell_to_dealer(st, a[0]), st)"),
     ("buy_slot", 3, True, "_check(c, SimActions.buy_slot(st), st)"),
     ("wait_day", 3, True, "_check(c, SimActions.wait_day(st), st)"),
   ])],
  accept=acc("actions", 29), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS19
CARDS.append(dict(id="GDS19", title="Sim port: newgame", needs=["GDS05", "GDS06", "GDS07", "GDS09"],
  files=["tools/godot/golden_newgame.mjs", "godot/tests/golden/newgame.json", "godot/sim/newgame.gd", "godot/tests/test_sim_newgame.gd"],
  goal="Port src/sim/newgame.js (start_game) to `SimNewGame`: a whole fresh year state for a seed, byte-for-byte equal to the JS.",
  read=[R_PR, R_GOLD, R_GR, "src/sim/newgame.js and src/core/state.js (newGameState: the CoreState port from GDF08 already has it; find it with `grep -rl 'class_name CoreState' godot/`)", "godot/sim/shop.gd, auction.gd, news.gd, jobsim.gd (GDS05-GDS09)"],
  steps=[
   "`tools/godot/golden_newgame.mjs`: imports startGame. Cases: `pureCase('start_game', 'seed ' + seed, [seed], startGame(seed))` for seed in [0, 1, 2, 3, 7, 42, 12345, 987654321, 4294967301, 1700000000001] (the last two exceed uint32: the rng wraps but state.seed keeps the raw value). Run `sh tools/godot/golden_run.sh newgame`.",
   SIM_HEAD % ("godot/sim/newgame.gd", "SimNewGame") + "One function: `start_game(seed_value: int = 1) -> Dictionary`: `state = CoreState.new_game_state(seed_value)` (use the real function name found in the CoreState file); `SimShop.init_shop(state)`; `SimAuction.prepare_auction(state)`; "
   "`state[\"today\"] = {\"day\": 1, \"headline\": SimNews.choose_headline(state, [], {}), \"events\": [\"Welcome to Webb's Wheels, Mark!\"], \"monthReport\": null}` (the headline is drawn FIRST, as an argument evaluated before the dictionary is stored); `SimJobSim.generate_requests(state)`; return state. The order of the five calls is the parity test.",
   tstep("newgame", [
     ("start_game", 10, False, "_check(c, SimNewGame.start_game(int(a[0])))"),
   ]) + "\nAlso add `test_start_game_basics`: start_game(5) has day 1, cash 20000, reputation 40, garageSlots 3, shop listings size 8, auction lots size 6, flags.gameOver false, and two calls with seed 5 give states that GoldenUtil.same() considers equal."],
  accept=acc("newgame", 10), oos=OOS))

# ---------------------------------------------------------------------------------------------------------------- GDS20
ACTION_TABLE = ("buy_car {listingId}; rent_car {listingId}; return_rental {carId}; sell_to_dealer {carId}; buy_slot {}; wait_day {}; service_car {carId, kind}; fix_fault {carId}; restore_car {carId}; "
                "accept_job {requestId, carId}; advertise {mediaId}; reveal_stat {lotId, stat}; consign_car {carId, reserve}; unconsign {carId}; place_bid {lotId, steps}; attend_auction {}")
CARDS.append(dict(id="GDS20", title="Game.act: dispatch every sim action", needs=["GDF10", "GDS13", "GDS14", "GDS16", "GDS17", "GDS18", "GDS19"],
  files=["tools/godot/golden_dispatch.mjs", "tools/godot/golden_game_act.mjs", "godot/tests/golden/game_act.json", "godot/autoload/game.gd", "godot/tests/test_game_act.gd"],
  goal="Wire the sim into the `Game` autoload (port of src/game.js createGame's action runner): `Game.new_game(seed)`, `Game.act(action, params)` dispatching all 16 sim actions by name, the signals, autosave on success, the game-over flag. Proved by a scripted JS session replayed step by step.",
  read=[R_PR, R_GOLD, R_GR, "src/game.js (the `app.act` runner: success saves, failure toasts), src/sim/actions.js, garage.js, jobresolve.js, adsim.js, auction.js (export signatures)", "godot/autoload/game.gd and the Save code from GDF09/GDF10 (`grep -rn 'user://save' godot/`): find the EXISTING signals (changed, toast_requested(text), day_advanced, game_over), `var state`, and the existing function that writes the state to user://save.json; reuse them, do not invent others",
        "ACTION TABLE (name {params}): " + ACTION_TABLE],
  steps=[
   "`tools/godot/golden_dispatch.mjs`: exports `ACTIONS` and `dispatch(state, action, params)`: ACTIONS maps each action name of the table to `(s, p) => <JS call>`: buy_car -> buyCar(s, p.listingId); rent_car -> rentCar(s, p.listingId); return_rental -> returnRental(s, p.carId); sell_to_dealer -> sellToDealer(s, p.carId); buy_slot -> buySlot(s); wait_day -> waitDay(s); service_car -> serviceCar(s, p.carId, p.kind); fix_fault -> fixFault(s, p.carId); restore_car -> restoreCar(s, p.carId); accept_job -> acceptJob(s, p.requestId, p.carId); advertise -> advertise(s, p.mediaId); reveal_stat -> revealStat(s, p.lotId, p.stat); consign_car -> consignCar(s, p.carId, p.reserve); unconsign -> unconsign(s, p.carId); place_bid -> placeBid(s, p.lotId, p.steps); attend_auction -> attendAuction(s). "
   "The module imports the JS functions from '../../src/sim/actions.js', garage.js, jobresolve.js, adsim.js and auction.js. `dispatch` returns `ACTIONS[action](state, params)` or `{ ok: false, msg: 'Unknown action: ' + action }` for a name not in the table.",
   "`tools/godot/golden_game_act.mjs` plays ONE scripted session on `fresh(3)` through `dispatch` and records it. `const first = (arr) => arr.length > 0 ? arr[0] : null;` ids: `carId = () => state.cars.length > 0 ? state.cars[0].id : 'c0'`. Intent list, in order (each intent is a function of the current state returning [action, params]): "
   "1 wait_day; 2 buy_car of the cheapest sale listing with price <= cash (listingId 'L0' if none); 3 service_car {carId: carId(), kind: 'quick'}; 4 service_car {carId: carId(), kind: 'bogus'}; 5 buy_slot; 6 advertise {mediaId: 'paper'}; 7 advertise {mediaId: 'nosuchad'}; 8 rent_car of the first rent listing (id 'L0' if none); "
   "9 accept_job {requestId: first request id or 'Q0', carId: carId()}; 10 fix_fault {carId: carId()}; 11 restore_car {carId: carId()}; 12 reveal_stat {lotId: lots[0].lotId, stat: 'desirability'}; 13 reveal_stat the same again (refused); 14 consign_car {carId: first OWNED car id or 'c0', reserve: 1000}; 15 unconsign the same car id; 16 place_bid {lotId: lots[0].lotId, steps: 1} (refused: not auction day); 17 sell_to_dealer {carId: first owned car or 'c0'}; 18 return_rental {carId: first rented car id or 'c0'}; "
   "then wait_day repeatedly until state.day === 24; then place_bid {lots[0], steps: 1}; place_bid {lots[1], steps: 3}; attend_auction; then wait_day x5. For every step record `{ action, params, result, day: s.day, cash: s.cash, reputation: s.reputation, buzz: s.buzz, cars: s.cars.length, gameOver: s.flags.gameOver }` right after the dispatch. The output is ONE case: `pureCase('session', 'scripted session seed 3', [3], { steps: <steps array>, final: <final state> })` (emitCases('game_act', [that case])). Run `sh tools/godot/golden_run.sh game_act`.",
   "Edit `godot/autoload/game.gd` (keep everything GDF10 wrote; add): `var autosave: bool = true`; `func new_game(seed_value: int = 1) -> void` (if it already exists change its body): `state = SimNewGame.start_game(seed_value)`, save when autosave, `changed.emit()`. "
   "`func act(action: String, params: Dictionary = {}) -> Dictionary`: (1) `state` empty -> return {ok false, msg \"No game in progress\"}; (2) `state[\"flags\"][\"gameOver\"]` true -> return {ok false, msg \"The year is over\"} (no toast); (3) remember `day_before = state[\"day\"]` and `over_before = false`; (4) `r = _dispatch(action, params)`; "
   "(5) if r.get(\"ok\") == true: if autosave then call the existing save function; `changed.emit()`; if state[\"day\"] != day_before: `day_advanced.emit()`; if state[\"flags\"][\"gameOver\"]: `game_over.emit()` (it cannot have been true before, step 2 returned already); "
   "(6) elif r.get(\"ok\") == false and str(r.get(\"msg\", \"\")) != \"\": `toast_requested.emit(r[\"msg\"])`; (7) return r. "
   "`func _dispatch(action: String, p: Dictionary) -> Dictionary`: first `var missing := _missing(action, p)`; if not empty return {ok false, msg \"Missing parameter: \" + missing}; then `match action:` calling SimActions.buy_car(state, p[\"listingId\"]), rent_car(listingId), return_rental(carId), sell_to_dealer(carId), buy_slot(), wait_day(), SimGarage.service_car(state, carId, kind), fix_fault(carId), restore_car(carId), SimJobResolve.accept_job(state, requestId, carId), SimAdSim.advertise(state, mediaId), SimAuction.reveal_stat(state, lotId, stat), consign_car(state, carId, reserve), unconsign(state, carId), place_bid(state, lotId, steps), attend_auction(state); default: {ok false, msg \"Unknown action: \" + action}. "
   "`func _missing(action: String, p: Dictionary) -> String` returns the first key from the ACTION TABLE (in the order written there) that p lacks, or \"\" (an unknown action returns \"\").",
   "`godot/tests/test_game_act.gd` (`extends \"res://tests/harness.gd\"`): build the instance with `var g = load(\"res://autoload/game.gd\").new()` (do NOT use the autoload singleton, so the tests do not touch the real game), set `g.autosave = false`, `g.new_game(3)`. Connect the signals with counters kept in an Array (`var n := [0, 0, 0, 0]` changed, toast, day, over; lambdas increment `n[i]`). Free the instance at the end of each test (`g.free()`). Tests: "
   "`test_session_replay`: load the golden case, for each step call `g.act(step.action, step.params)`, `_check`-style compare the returned Dictionary with step.result using GoldenUtil.diff (message names the step index), then compare g.state day, cash, reputation, buzz, cars.size(), flags.gameOver with the step record; after the last step GoldenUtil.diff(g.state, final) == \"\"; assert n[2] (day_advanced) equals the number of steps whose day differs from the previous step (the first step compares with day 1) and n[1] (toast) equals the number of steps whose result has ok == false. "
   "`test_unknown_action`: act(\"fly_to_moon\") -> ok false, msg \"Unknown action: fly_to_moon\", state unchanged (compare a duplicate(true) before and after). `test_missing_param`: act(\"buy_car\", {}) -> ok false, msg \"Missing parameter: listingId\"; act(\"service_car\", {\"carId\": \"c1\"}) -> msg \"Missing parameter: kind\". "
   "`test_game_over_blocks_actions`: set g.state[\"flags\"][\"gameOver\"] = true then act(\"wait_day\") -> ok false and day unchanged. `test_game_over_signal`: set day 365 and flags false; act(\"wait_day\") -> n[3] == 1 and g.state.flags.gameOver true and flags.reason \"year-end\" (a loss at the end of the year). "
   "`test_autosave`: set g.autosave = true, delete `user://save.json` if present (DirAccess.remove_absolute), act(\"wait_day\"), assert FileAccess.file_exists(\"user://save.json\") then delete it again (if the Save code writes elsewhere, use the path it uses)."],
  accept=["`sh tools/godot/golden_run.sh game_act` prints a last line starting `GOLDEN game_act OK`.", "`python3 -c \"import json;d=json.load(open('godot/tests/golden/game_act.json'));print(len(d['cases'][0]['result']['steps']))\"` prints a number >= 30.", "`sh tools/godot/gtest.sh test_game_act` prints a last line `GDTEST OK`."],
  oos=["Every file not listed under files; do not edit the sim ports, the Save code or scenes (only add to game.gd).", "No UI."]))

# ---------------------------------------------------------------------------------------------------------------- GDS21
BOT_PRIORITY = ("1 gameOver -> null. 2 isAuctionDay(state.day) -> ['attend_auction', {}]. 3 no cars: the sale listing with the lowest price that is <= cash (strictly lower price replaces the best) -> ['buy_car', {listingId}], none -> ['wait_day', {}]. "
                "4 the first car with a fault and cash >= fault.cost -> ['fix_fault', {carId}]. "
                "5 for each request in order that is not expired (expiresDay >= day): the FIRST car (in garage order) that isAvailable and has effD(model, car) >= minDesirability and effR >= minReliability and condition >= minCondition; among those requests the one with the highest fee (a strictly higher fee replaces) -> ['accept_job', {requestId, carId}]. "
                "6 cash > 6000 and buzz < 20 -> ['advertise', {mediaId: 'magazine'}]. 7 the first car with condition < 4 while cash > 400 -> ['service_car', {carId, kind: 'full'}]. 8 -> ['wait_day', {}].")
CARDS.append(dict(id="GDS21", title="Parity: scripted 60-day play on a fixed seed", needs=["GDS20"],
  files=["tools/godot/golden_bot.mjs", "tools/godot/golden_playthrough.mjs", "godot/tests/golden/playthrough.json", "godot/tests/test_playthrough.gd"],
  goal="End-to-end parity: a JS bot plays 60 turns on seed 11 through the dispatch table; the GDScript Game replays the exact same recorded actions and must produce the same cash, reputation, buzz and day series and the same final state. Also creates tools/godot/golden_bot.mjs, the bot that GDS22 ports.",
  read=[R_PR, R_GOLD, R_GR, "tests/playthrough.test.mjs (the original bot: functions bot and actOrWait; read all of it)", "tools/godot/golden_dispatch.mjs (GDS20)", "godot/autoload/game.gd (GDS20: Game.act)"],
  steps=[
   "`tools/godot/golden_bot.mjs` exports `chooseAction(state)` -> [action, params] or null, using `dispatch`-style action names (GDS20) and the JS helpers isAuctionDay, modelOf, effD, effR, isAvailable. Priority rules (first match wins): " + BOT_PRIORITY + " It also exports `runBot(state, maxCalls)`: loop up to maxCalls bot calls; each call: `a = chooseAction(state)`; null -> stop; `r = dispatch(state, a[0], a[1])`; record a step; if `r.ok` is false also run `dispatch(state, 'wait_day', {})` and record that as a second step (one bot call = one day); returns the array of recorded steps `{ action, params, result, day, cash, reputation, buzz, cars, gameOver }` (the same record shape as GDS20, taken after each dispatch).",
   "`tools/godot/golden_playthrough.mjs`: `const s = fresh(11); const steps = runBot(s, 60);` emits one case `pureCase('playthrough', 'seed 11, 60 bot calls', [11], { steps: steps, final: s })`. The script THROWS unless steps contains at least 6 distinct action names. Run `sh tools/godot/golden_run.sh playthrough`.",
   "`godot/tests/test_playthrough.gd` (`extends \"res://tests/harness.gd\"`): `test_replay_matches_js`: `var g = load(\"res://autoload/game.gd\").new()`, `g.autosave = false`, `g.new_game(int(a[0]))` (a = the case args), then for every recorded step call `g.act(step[\"action\"], step[\"params\"])` and compare: the result Dictionary with step.result (GoldenUtil.diff, message names the step index and action), then day, cash, reputation, buzz, cars.size() and flags.gameOver with the step's recorded values; at the end `GoldenUtil.diff(g.state, final) == \"\"` (so rng, headlines, listings, lots, stats all agree). Free the instance. `test_series_summary`: separately assert from the golden data (not from Godot) that the recorded cash series has 60 or more entries and that the last step's day is greater than 40."],
  accept=["`sh tools/godot/golden_run.sh playthrough` prints a last line starting `GOLDEN playthrough OK`.", "`python3 -c \"import json;d=json.load(open('godot/tests/golden/playthrough.json'));print(len(d['cases'][0]['result']['steps']))\"` prints a number >= 60.", "`sh tools/godot/gtest.sh test_playthrough` prints a last line `GDTEST OK`."],
  oos=["Every file not listed under files; if the replay finds a mismatch in a sim port, do NOT patch the port: finish with STATUS: BLOCKED naming the step, the action and the first diff text.", "No UI."]))

# ---------------------------------------------------------------------------------------------------------------- GDS22
CARDS.append(dict(id="GDS22", title="Parity: GDScript bot plays whole years like the JS bot", needs=["GDS21"],
  files=["tools/godot/golden_bot_years.mjs", "godot/tests/golden/bot_years.json", "godot/tests/sim_bot.gd", "godot/tests/test_bot_years.gd"],
  goal="Final parity gate: a GDScript port of the JS bot (`SimBot`) plays complete years on seeds 1..10 through Game.act and must end each game with exactly the day, cash, reputation, buzz, car count, end reason and rng value the JS bot reaches.",
  read=[R_PR, R_GOLD, R_GR, "tools/godot/golden_bot.mjs (GDS21: chooseAction and runBot; port it function by function) and tests/playthrough.test.mjs (the MAX_ACTIONS=400 loop)", "godot/autoload/game.gd (Game.act) and godot/sim/carstats.gd"],
  steps=[
   "`tools/godot/golden_bot_years.mjs`: imports chooseAction from golden_bot.mjs and dispatch from golden_dispatch.mjs. For seed in 1..10: `const s = fresh(seed); let calls = 0; while (calls < 400) { const a = chooseAction(s); if (a === null) break; const r = dispatch(s, a[0], a[1]); if (!r.ok) { dispatch(s, 'wait_day', {}); } calls++; }` (do not use runBot: this loop counts calls). Then `pureCase('bot_year', 'seed ' + seed, [seed], { calls: calls, reason: s.flags.reason, won: s.flags.won, day: s.day, cash: s.cash, reputation: s.reputation, buzz: s.buzz, cars: s.cars.length, rng: s.rng })`. The script THROWS unless every seed ends with s.flags.gameOver true. Run `sh tools/godot/golden_run.sh bot_years`.",
   "`godot/tests/sim_bot.gd`: `class_name SimBot`, `extends RefCounted`. `static func choose(state: Dictionary) -> Array`: returns [action, params] or an empty Array (= null in JS), the priority rules exactly as in tools/godot/golden_bot.mjs: " + BOT_PRIORITY + " (isAuctionDay -> CoreClock.is_auction_day; modelOf/effD/effR/isAvailable -> SimData.model_of, SimCarStats.eff_d/eff_r/is_available). "
   "`static func play(g, max_calls: int = 400) -> int`: `calls = 0`; while calls < max_calls: `d = choose(g.state)`; empty -> break; `r = g.act(d[0], d[1])`; if r.get(\"ok\") != true: `g.act(\"wait_day\", {})`; calls += 1; return calls. (g is a Game instance.)",
   "`godot/tests/test_bot_years.gd`: `test_bot_years`: for every golden case: `var g = load(\"res://autoload/game.gd\").new()`, `g.autosave = false`, `g.new_game(seed)`, `var calls := SimBot.play(g, 400)`; compare calls, reason (g.state.flags.reason), won, day, cash, reputation, buzz, cars (size), rng with the golden result (numbers with GoldenUtil.diff on a small Dictionary built from g.state, message names the seed); free g. Also `test_determinism`: playing seed 4 twice gives `GoldenUtil.same(g1.state, g2.state)`."],
  accept=["`sh tools/godot/golden_run.sh bot_years` prints a last line starting `GOLDEN bot_years OK`.", "`sh tools/godot/gtest.sh test_bot_years` prints a last line `GDTEST OK`."],
  oos=["Every file not listed under files; if a seed diverges, do NOT patch a sim port: finish with STATUS: BLOCKED naming the seed and the first differing field.", "No UI."]))
