[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF03 Godot: data export tool and Data autoload

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF03
Needs (already merged into `dev`): GDF01, GDF02, GDF15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Export every `src/data/*.js` table to JSON under `godot/data/` with a script (never by hand), and the `Data` autoload that serves them: one accessor per JS data module.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules)
- src/data/*.js (the export lists: adverts.js, cars.js, chatter.js, faults.js, headlines.js, jobtypes.js, names.js, owners.js, paint.js)
- tools/art/export_profiles.mjs (the existing jsc export style)
- godot/core/json.gd (GDF15)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- GDScript's JSON parser returns EVERY number as float; `CoreJson` (GDF15) turns whole numbers back into int. GDScript `/` on two ints truncates: always convert with `float()` first when a JS division is meant

## Files you may change (and nothing else)
- `tools/godot/export_data.mjs`
- `tools/godot/export_data.sh`
- `godot/autoload/data.gd`
- `godot/data/adverts.json`
- `godot/data/archetypes.json`
- `godot/data/cars.json`
- `godot/data/chatter.json`
- `godot/data/faults.json`
- `godot/data/headlines.json`
- `godot/data/jobtypes.json`
- `godot/data/names.json`
- `godot/data/owners.json`
- `godot/data/paint.json`
- `godot/tests/golden/data_counts.json`
- `godot/tests/test_data.gd`

## Steps
1. `tools/godot/export_data.mjs` (run as `jsc -m tools/godot/export_data.mjs` from the repo root; jsc has no console: use `print`). Import (paths relative to the file: `../../src/data/...`): `ADVERTS` from adverts.js; `CARS`, `ARCHETYPES` from cars.js; `CHATTER` from chatter.js; `FAULTS`, `TIER_MULT` from faults.js; `GENERIC`, `CARWORLD`, `REACTIVE` from headlines.js; `JOB_TYPES` from jobtypes.js; `FIRST`, `LAST`, `PREFIX` from names.js; `OWNERS` from owners.js; `PAINT` from paint.js. Build `OUT` = an ordered list of `[stem, value]`: `adverts`=ADVERTS, `archetypes`=ARCHETYPES, `cars`=CARS, `chatter`=CHATTER, `faults`=`{faults: FAULTS, tier_mult: TIER_MULT}`, `headlines`=`{generic: GENERIC, carworld: CARWORLD, reactive: REACTIVE}`, `jobtypes`=JOB_TYPES, `names`=`{first: FIRST, last: LAST, prefix: PREFIX}`, `owners`=OWNERS, `paint`=PAINT. For each pair print TWO lines: `@@<stem>` then `JSON.stringify(value)`. Last, print `@@_counts` and the JSON of an object with these keys (a count is `.length` for an array and `Object.keys(x).length` for an object): `adverts`, `archetypes`, `cars`, `chatter`, `faults` (FAULTS), `faults_tier_mult`, `headlines_generic`, `headlines_carworld`, `headlines_reactive`, `jobtypes`, `names_first`, `names_last`, `names_prefix`, `owners`, `paint`.
2. `tools/godot/export_data.sh` (POSIX sh, `set -eu`, `cd` to the repo root from `$(dirname "$0")/../..`; `JSC` defaults to `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`): `mkdir -p godot/data godot/tests/golden`; run the mjs into a `mktemp` file; then `python3 -I - "$TMP" <<'PY'` (a heredoc script that reads the file, walks the lines in pairs `@@name` / json, parses each JSON with `json.loads` and writes it with `json.dump(v, f, ensure_ascii=True, separators=(',', ':'))` to `godot/data/<name>.json`, except `_counts` which goes to `godot/tests/golden/data_counts.json`) and finally prints `EXPORTED <n> files` (n counts all files written, 11 expected). Delete the temp file. Run it and commit the generated JSON.
3. `godot/autoload/data.gd` (replace the stub): `extends Node`. `var _cache: Dictionary = {}`. `func _table(stem: String) -> Variant`: if not cached, `_cache[stem] = CoreJson.load_file("res://data/" + stem + ".json")`; return it. One accessor per module, each `return _table("<stem>")` with a typed return: `func adverts() -> Array`, `func archetypes() -> Array`, `func cars() -> Array`, `func chatter() -> Dictionary`, `func faults() -> Array` (the `faults` list inside faults.json), `func faults_tier_mult() -> Dictionary` (keys are the STRINGS "1", "2", "3"), `func headlines() -> Dictionary` (keys generic, carworld, reactive), `func jobtypes() -> Array`, `func jobs() -> Array` (alias of jobtypes, the name the shared contract uses), `func names() -> Dictionary` (keys first, last, prefix), `func owners() -> Array`, `func paint() -> Dictionary`. Lookup helpers (return `{}` / `""` when unknown, never an error): `func car_by_id(id: String) -> Dictionary`, `func job_type_by_id(id: String) -> Dictionary`, `func advert_by_id(id: String) -> Dictionary`, `func fault_by_id(id: String) -> Dictionary`, `func paint_of(id: String) -> String` (`"#888888"` for an unknown id, like the JS). Build each lookup by a linear scan; no caching needed. JS data-module FUNCTIONS (chatterFor, ownerName, customerName, fillText...) are NOT ported here; sim cards do that.
4. `godot/tests/test_data.gd`: `var d := autoload("Data")`. `test_counts_match_js`: `var c = CoreJson.load_file("res://tests/golden/data_counts.json")` and check `d.adverts().size() == c.adverts`, `archetypes`, `cars`, `chatter().size()`, `faults()`, `faults_tier_mult()`, `headlines().generic.size()` == `headlines_generic`, `.carworld`, `.reactive.size()`, `jobtypes()`, `jobs().size() == jobtypes().size()`, `names().first/last/prefix`, `owners()`, `paint().size()`. `test_spot_values`: `d.cars()[0].id == "t1_allergy"` and `d.cars()[0].basePrice == 3500` and `typeof(d.cars()[0].basePrice) == TYPE_INT`; `d.car_by_id("t3_aston").tier == 3`; `d.car_by_id("nope") == {}`; `d.paint()["t1_robbin"] == "#C9A227"`; `d.paint_of("nope") == "#888888"`; `d.faults_tier_mult()["2"]` near 1.8; `d.fault_by_id("puncture").severity == "minor"`; `d.advert_by_id("paper").name == "Parish Pump Gazette"`; `d.owners()[0]` is a String; `d.archetypes()[0] == "micro"`. `test_cars_unique_ids`: every id in `d.cars()` is unique and every car has keys `id, name, year, archetype, tier, basePrice`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/export_data.sh` prints `EXPORTED 11 files`, and running it a second time leaves `git status --short godot/data godot/tests/golden/data_counts.json` showing no further changes.
- `python3 -c "import json;c=json.load(open('godot/tests/golden/data_counts.json'));print(c['cars'],c['jobtypes'],c['paint'])"` prints three numbers (31 16 31 at the time of writing).
- `sh tools/godot/gtest.sh test_data | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Porting the JS functions that live in data modules. Hand-editing JSON. The `src/data` JS.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF03: Godot: data export tool and Data autoload`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
