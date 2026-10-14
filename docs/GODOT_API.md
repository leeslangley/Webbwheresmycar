# Godot API reference

Written from the code as built (card GDF14). Read this before writing any Godot card.
Paths are relative to the repo root. Only public names are listed; names starting with `_` are private.
Behaviour notes are added only where they matter for ports or where the JS differs.

## Project layout

- `godot/` is the Godot 4.7 project (`godot/project.godot`, Compatibility renderer, base 1280x720).
- `godot/autoload/` singletons: `game.gd` (Game), `data.gd` (Data), `sfx.gd` (Sfx). `save.gd` is `CoreSave`, a class_name, not an autoload.
- `godot/core/` pure static helpers with class_name: `json.gd`, `rng.gd`, `clock.gd`, `format.gd`, `state.gd`.
- `godot/sim/` ports of src/sim/*.js (only `simutil.gd` and `simdata.gd` exist so far).
- `godot/data/` JSON tables exported from src/data/*.js (never hand-edited).
- `godot/scenes/` scenes (`hello.tscn` so far; `scenes/dev/` for dev demos).
- `godot/tv/` the TV node and its channels.
- `godot/ui/` theme, `tokens.gd` (UiTokens), widgets and fonts (`ui/fonts/`).
- `godot/art/` imported sprites, car models, room plates, shaders, fx scenes.
- `godot/tests/` `test_*.gd` files, `harness.gd`, `runner.gd`, `golden_util.gd`, golden fixtures in `tests/golden/`.
- Also `godot/rooms/` (room transitions) and `godot/shaders/` (iris and static wipes).
- Autoloads are registered in `godot/project.godot` under `[autoload]`: `Game="*res://autoload/game.gd"`, `Data="*res://autoload/data.gd"`, `Sfx="*res://autoload/sfx.gd"`.

## CoreJson

File `godot/core/json.gd`, `class_name CoreJson`. The one way the game reads and writes JSON. GDScript returns every number as float, so `normalize()` turns whole numbers back into int.

- `static func normalize(v: Variant) -> Variant` - whole floats below 9e15 become int, recursively through arrays and dictionaries.
- `static func try_parse(text: String) -> Dictionary` - returns `{ok: bool, value: Variant}`; value is null on a parse error.
- `static func parse(text: String) -> Variant` - the parsed value only (null on error).
- `static func load_file(path: String) -> Variant` - parsed file; null when the file cannot be opened.
- `static func stringify(v: Variant) -> String` - JSON text with no indentation and sorted keys.
- `static func save_file(path: String, v: Variant) -> bool` - false when the file cannot be opened.

## CoreRng

File `godot/core/rng.gd`, `class_name CoreRng`. Exact port of src/core/rng.js. The random state is `state.rng` (uint32) inside the state Dictionary.

- `static func seed_rng(state: Dictionary, seed_value: int) -> void` - any int is masked to uint32 (-1 becomes 4294967295); seed 0 is allowed.
- `static func rand(state: Dictionary) -> float` - uniform in [0, 1); one draw.
- `static func rand_int(state: Dictionary, lo: int, hi: int) -> int` - integer in [lo, hi], inclusive at both ends.
- `static func chance(state: Dictionary, p: float) -> bool` - true with probability p; one draw.
- `static func pick(state: Dictionary, arr: Array) -> Variant` - uniform pick; an empty array returns null and draws nothing.
- `static func weighted(state: Dictionary, items: Array) -> Variant` - items are `{w: number >= 0, ...}`; one draw; no positive weight returns `{}` and draws nothing.
- `static func round_to(x: float, step_size: float) -> float` - JS Math.round rule: halves round up.
- `static func clamp_value(x: float, lo: float, hi: float) -> float` - clamps x into [lo, hi].

## CoreClock

File `godot/core/clock.gd`, `class_name CoreClock`. Calendar for the 365-day game year: no leap years, no time zones. Days are numbered 1 to 365.

- `const MONTH_NAMES: Array[String]` - January to December.
- `const MONTH_LENGTHS: Array[int]` - 31, 28, 31, 30, ... (February is 28).
- `const DAYS_IN_YEAR := 365` - the last valid day number.
- `const AUCTION_DAY_OF_MONTH := 24` - the auction falls on the 24th.
- `static func valid_day(day: Variant) -> bool` - an int or a whole float from 1 to 365.
- `static func date_of(day: Variant) -> Dictionary` - `{month, dayOfMonth, monthName}`; `{}` when the day is invalid.
- `static func day_of_year_start(month: int) -> int` - day number of the 1st of the month; -1 when month is not 1..12.
- `static func is_month_start(day: Variant) -> bool` - true on the 1st of a month; false when invalid.
- `static func is_auction_day(day: Variant) -> bool` - true on the 24th; false when invalid.
- `static func days_left_in_month(day: Variant) -> int` - days after this one until month end (0 on the last day); -1 when invalid.

## CoreFormat

File `godot/core/format.gd`, `class_name CoreFormat`. Player text helpers. The pound sign and the stars are built from char codes, so the source stays ASCII.

- `static func pound() -> String` - the pound sign (char 163). `money()` uses it; use `money()` for player text.
- `static func money(n: float) -> String` - pound sign, comma thousands, whole pounds; halves round up, so 12.6 gives the pound sign then "13".
- `static func one_dp(n: float) -> String` - one decimal place; never "-0.0".
- `static func date_text(day: int) -> String` - e.g. "24 February"; "" outside 1..365.
- `static func stars(n: float) -> String` - always 10 characters: filled stars then empty ones; n is rounded and clamped to 0..10.
- `static func plural(n: int, one: String, many: String) -> String` - "1 car" or "3 cars".

## CoreState

File `godot/core/state.gd`, `class_name CoreState`. Port of src/core/state.js. Keys keep the JS camelCase names.

- `const PLATE_KEYS: Array[String]` - `["fatcat", "stable", "household", "hammer"]`, the four Gold Number Plates in win-check order.
- `static func new_game_state(seed_value: int = 1) -> Dictionary` - a fresh state (v 1, day 1, cash 20000, reputation 40, garageSlots 3) with rng seeded from seed_value. No containers are shared between states.

## CoreSave

File `godot/autoload/save.gd`, `class_name CoreSave`. Not an autoload: static helpers only. Files live under `user://`.

- `const SAVE_PATH := "user://save.json"`
- `const SETTINGS_PATH := "user://settings.json"`
- `const REQUIRED_KEYS: Array[String]` - the 13 keys a save must hold: day, cash, reputation, buzz, garageSlots, cars, shop, requests, auction, stats, plates, flags, rng.
- `static func serialize(state: Dictionary) -> String` - state as JSON text (via CoreJson.stringify).
- `static func deserialize(text: String) -> Variant` - the state Dictionary, or null when the text is not JSON, not an object, has v other than 1, lacks a required key, or has cars that is not an Array.
- `static func save_to(state: Dictionary, path: String = SAVE_PATH) -> bool` - writes the state; false when the file cannot be opened.
- `static func load_from(path: String = SAVE_PATH) -> Variant` - the state, or null when the file is missing or invalid.
- `static func has_save(path: String = SAVE_PATH) -> bool` - true when load_from() gives a state.
- `static func clear_save(path: String = SAVE_PATH) -> bool` - true when the file is gone afterwards (also when it never existed).
- `static func default_settings() -> Dictionary` - `{crt: false, sound: true, music: true}`.
- `static func load_settings(path: String = SETTINGS_PATH) -> Dictionary` - defaults when the file is missing or corrupt; crt is true only when stored as true; sound and music are false only when stored as false.
- `static func save_settings(settings: Dictionary, path: String = SETTINGS_PATH) -> bool` - writes the settings; false when the file cannot be opened.

## Game

File `godot/autoload/game.gd`, autoload `Game` (extends Node). Owns the state, starts and continues games, and dispatches action NAMES to sim functions. Scenes read `Game.state` and call `Game.act` only.

- `signal changed` - emitted after a new game, a continue, or a successful action.
- `signal toast_requested(text: String)` - emitted for a failed action with a msg, and for "No saved game".
- `signal day_advanced` - emitted after a successful action.
- `signal game_over` - emitted after a successful action when `flags.gameOver` is true.
- `const ACTION_TABLE: Dictionary` - action name to `[script path, function name, param keys]`. 11 actions: buy_car, rent_car, return_rental, sell_to_dealer, buy_slot, wait_day, service_car, fix_fault, restore_car, accept_job, advertise.
- `var state: Dictionary` - the live game state; `{}` before a game starts.
- `var settings: Dictionary` - loaded from `settings_path` by `load_settings()`.
- `var save_path: String` - defaults to `CoreSave.SAVE_PATH`.
- `var settings_path: String` - defaults to `CoreSave.SETTINGS_PATH`.
- `func register_action(action: String, script_path: String, func_name: String, param_keys: Array) -> void` - adds or replaces one action in the table.
- `func has_action(action: String) -> bool` - true when the action name is registered.
- `func act(action: String, params: Dictionary = {}) -> Variant` - runs one action and returns the sim result unchanged. Returns `{ok: false, msg}` when no game runs, the action is unknown, a param is missing, or the script is not built yet. On ok true it saves, emits day_advanced and changed, and plays the cash sound.
- `func new_game(seed_value: int = -1) -> void` - -1 seeds from the system clock; uses `res://sim/newgame.gd` `start_game` when that file exists, else `CoreState.new_game_state`. Saves at once.
- `func continue_game() -> bool` - loads the save into `state`; false with a toast "No saved game" when there is none.
- `func has_save() -> bool` - true when a valid save file exists.
- `func erase_save() -> bool` - deletes the save file; true when it is gone afterwards.
- `func save_now() -> bool` - writes `state` to `save_path`.
- `func load_settings() -> void` - reads `settings_path` into `settings`.
- `func save_settings() -> bool` - writes `settings` to `settings_path`.

## Data

File `godot/autoload/data.gd`, autoload `Data` (extends Node). Serves the JSON tables in `godot/data/`, read once and cached. Lookups return `{}` or `""` for unknown ids and never error. The JS data-module functions (chatterFor, ownerName, customerName, fillText, modelOf and so on) are NOT here: sim cards port them.

- `const FALLBACK_PAINT: String = "#888888"` - colour used by `paint_of()` for an unknown id.
- `func adverts() -> Array` - data/adverts.json.
- `func archetypes() -> Array` - data/archetypes.json.
- `func cars() -> Array` - data/cars.json.
- `func chatter() -> Dictionary` - data/chatter.json.
- `func faults() -> Array` - the `faults` list inside data/faults.json.
- `func faults_tier_mult() -> Dictionary` - the `tier_mult` table inside data/faults.json.
- `func headlines() -> Dictionary` - data/headlines.json.
- `func jobtypes() -> Array` - data/jobtypes.json.
- `func jobs() -> Array` - same result as `jobtypes()`.
- `func names() -> Dictionary` - data/names.json.
- `func owners() -> Array` - data/owners.json.
- `func paint() -> Dictionary` - data/paint.json (paint id to hex colour).
- `func car_by_id(id: String) -> Dictionary` - the car entry, or `{}`.
- `func job_type_by_id(id: String) -> Dictionary` - the job type entry, or `{}`.
- `func advert_by_id(id: String) -> Dictionary` - the advert entry, or `{}`.
- `func fault_by_id(id: String) -> Dictionary` - the fault entry, or `{}`.
- `func paint_of(id: String) -> String` - the hex colour for a paint id, else `FALLBACK_PAINT`.

## Sfx

File `godot/autoload/sfx.gd`, autoload `Sfx` (extends Node). Synthesised sounds (port of the src/audio/sfx.js SOUNDS table). No audio files: `build_stream()` makes a 16-bit mono AudioStreamWAV.

- `const RATE := 22050` - sample rate in Hz.
- `const SOUNDS: Dictionary` - sound name to its list of note events (type, freq, end_freq, start, dur, vol).
- `const POOL := 4` - number of AudioStreamPlayers used in turn.
- `var muted: bool = false` - when true, `play()` does nothing.
- `var music_ducked: bool = false` - when true, `play()` uses -8 dB; only the flag is kept, the music card gives it its effect.
- `func sound_names() -> Array` - the SOUNDS keys.
- `func duration_of(sound: String) -> float` - seconds until the last note event ends; 0.0 for an unknown sound.
- `func build_stream(sound: String) -> AudioStreamWAV` - the WAV for a sound; null for an unknown sound.
- `func play(sound: String, pitch: float = 1.0) -> bool` - pitch is clamped to 0.5..2.0. Returns false when muted, the sound is unknown, the node is not in the tree, or `Game.settings.sound` is false.
- `func set_muted(on: bool) -> void` - sets `muted`.
- `func set_music_duck(on: bool) -> void` - sets `music_ducked`.
- `func unlock() -> void` - no-op, kept so call sites match the JS.

## UiTokens

File `godot/ui/tokens.gd`, `class_name UiTokens`. Static design tokens: port of src/ui/tokens.js and the PALETTE of src/ui/theme.js. Colours stay hex strings as the JS writes them.

- `const FONT_TITLE := "res://art/fonts/PressStart2P-Regular.ttf"` - NOTE: this path does not exist; the font files are in `godot/ui/fonts/` (see `ui_theme.gd`, which uses `res://ui/fonts/`).
- `const FONT_BODY := "res://art/fonts/VT323-Regular.ttf"` - same NOTE as FONT_TITLE.
- `const PALETTE: Dictionary` - the 23 theme.js colours (black, white, red, cyan, ... gold).
- `const COLOR: Dictionary` - the named UI colours (ink, night, woodLight, brass, enamelRed, cashGreen, ...).
- `const SPACE: Dictionary` - spacing grid `{1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48}`.
- `const ZONES: Dictionary` - logical 1280-wide zones: banner y 0 h 120, tableau y 120 h 470, hud y 590 h 130.
- `const FLOOR: Dictionary` - smallest allowed px: title 16, body 22.
- `const TYPE: Dictionary` - type roles (logo, h1, h2, h3, button, bannerText, hero, body, caption), each with kind (title or body) and px.
- `const MOTION: Dictionary` - motion timings in milliseconds (tap 90, toast 260, count 700, ...).
- `const EASE_NAMES: Array[String]` - linear, outQuad, outCubic, inOutQuad, outBack, outBounce.
- `const C1: float = 1.70158` - easing constant for outBack.
- `const C3: float = C1 + 1.0` - easing constant for outBack.
- `const N1: float = 7.5625` - easing constant for outBounce.
- `const D1: float = 2.75` - easing constant for outBounce.
- `static func col(key: String) -> Color` - a COLOR key, else a PALETTE key, else magenta with push_error.
- `static func sp(n: int) -> int` - SPACE[n] for n in 1..7; any other n push_errors and returns 0.
- `static func font_path(role: String) -> String` - FONT_TITLE for a title-kind role, FONT_BODY for a body-kind role, "" for an unknown role.
- `static func clamp01(u: float) -> float` - clamps u into 0..1.
- `static func lerp_to(a: float, b: float, u: float) -> float` - a + (b - a) * u; u is not clamped.
- `static func ease_named(curve: String, u: float) -> float` - applies a named curve to u clamped to 0..1; an unknown curve push_errors and returns u.

## Tests

- Run all tests: `sh tools/godot/gtest.sh` or `make gtest`. Run one: `sh tools/godot/gtest.sh test_rng` (the stem, without `test_` or `.gd`, also works).
- Godot never runs on the Mac. The wrapper rsyncs `godot/` to CASE and runs it headless there. Last line `GDTEST OK` (exit 0) or `GDTEST FAIL` (exit 1). Script or parse errors print `GDTEST FAIL (script errors above)` and exit 1.
- A test file is `godot/tests/test_<name>.gd` and starts with `extends "res://tests/harness.gd"`. Every `func test_*()` runs. A test that makes no checks fails.
- Harness members: `failures`, `checks`, `current_test` (vars); `before_each()`; `ok(cond: bool, msg: String = "")`; `eq(a, b, msg: String = "")` (arrays and dictionaries compare by JSON text); `near(a: float, b: float, eps: float = 1e-9, msg: String = "")`; `fail(msg: String)`; `autoload(autoload_name: String) -> Node`; `tree() -> SceneTree`.
- `autoload("Game")` returns the running singleton, or a fresh instance of `res://autoload/game.gd`. It works for the three autoloads only (Game, Data, Sfx); it does not load CoreSave or the core classes.
- Golden fixtures are loaded with `GoldenUtil` (see below).
- Scenes: `sh tools/godot/gshot.sh scenes/hello.tscn /tmp/x.png [frames] [WxH]` renders the scene on CASE under Xvfb (default 8 frames, 1280x720) and copies the PNG back. Nothing opens on the Mac. Look at the PNG with the Read tool.

## Golden fixtures

Golden fixtures pin a Godot port to the JS reference. Four steps:

1. Write `tools/godot/golden_<name>.mjs`. Import `emit` from `./golden_common.mjs` and call `emit(obj)` once. `SEEDS` in golden_common.mjs lists the rng seeds sim fixtures should cover.
2. Run `sh tools/godot/golden.sh <name>`. It runs the script under macOS jsc and writes `godot/tests/golden/<name>.json` as pure ASCII.
3. Load it in the test with `GoldenUtil.fixture("<name>")`. Integral floats come back as int.
4. Compare with `GoldenUtil.diff(got, want)`: "" when equal, otherwise the first difference by path, e.g. `$.a[1]: 2 != 3`. `GoldenUtil.same(got, want)` is the bool form.

- `const EPS := 1e-9` - float tolerance used by `diff()`.
- `static func load_golden(name: String) -> Dictionary` - reads `res://tests/golden/<name>.json` with ints restored; push_error and `{}` when missing or not an object.
- `static func intify(v: Variant) -> Variant` - copies with integral floats below 1e15 turned into int.
- `static func copy(v: Variant) -> Variant` - deep copy of arrays and dictionaries.
- `static func diff(got: Variant, want: Variant, path: String = "$") -> String` - see step 4; ints must be exactly equal, floats within EPS.
- `static func same(got: Variant, want: Variant) -> bool` - true when `diff()` is "".
- `static func fixture(name: String) -> Variant` - parses `res://tests/golden/<name>.json` with CoreJson.

Existing fixtures in `godot/tests/golden/`: clock, data_counts, example, format, rng, selftest, simdata, state, tokens.

## Conventions

- Sim ports: file `godot/sim/<stem>.gd`, where the stem is the JS file name (`jobresolve.gd` for src/sim/jobresolve.js), class_name `Sim` plus PascalCase of the stem (`SimJobResolve`).
- Sim functions are `static`, take the state Dictionary first, and use the JS names in snake_case (`acceptJob` becomes `accept_job`).
- State keys keep the JS camelCase names (`garageSlots`, `nextId`, `reputation`).
- Every action returns `{ok: bool, msg: String}`.
- Whole JSON numbers are ints. GDScript `/` on two ints truncates, so convert with `float()` first.
- No `randf()`, `randi()` or `Time` in sim code. Use `CoreRng` with `state.rng`.
- Player text is ASCII only. The pound sign comes only from `CoreFormat.money()`; stars only from `CoreFormat.stars()`.
- Scenes read `Game.state` and call `Game.act(name, params)` only.
- The JS data-module functions (chatterFor, ownerName, customerName, fillText, modelOf, ...) are ported by sim cards. `Data` only serves tables.
- Where the JS threw an error, the GDScript returns a sentinel: `{}`, -1, `""`, null or false.
- Tabs for indentation, typed signatures (`-> int`), no debug `print` left behind.
- Save format: the state Dictionary as JSON in `user://save.json`, with a `v` field that must be 1.
