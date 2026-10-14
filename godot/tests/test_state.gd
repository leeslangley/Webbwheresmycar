extends "res://tests/harness.gd"

# Tests for godot/core/state.gd: the fixture from src/core/state.js (tools/godot/golden_state.mjs),
# fresh containers, JSON round trip and the seeded rng.

const JS_KEYS := [
	"v", "seed", "rng", "day", "cash", "reputation", "buzz", "garageSlots", "nextId",
	"market", "cars", "shop", "requests", "auction", "stats", "plates",
	"headlines", "pending", "sit", "today", "lastMonthReport", "flags", "log",
]


func test_matches_js() -> void:
	var fx: Variant = GoldenUtil.fixture("state")
	if typeof(fx) != TYPE_DICTIONARY:
		fail("state fixture missing")
		return
	var states: Array = fx["states"]
	eq(states.size(), 4, "four seeds in the fixture")
	for entry in states:
		var label: String = "seed %s" % str(entry["seed"])
		var got: Dictionary = CoreState.new_game_state(int(entry["seed"]))
		eq(GoldenUtil.diff(got, entry["state"]), "", label + " matches JS state")
	var default_got: Dictionary = CoreState.new_game_state()
	eq(GoldenUtil.diff(default_got, fx["defaultSeed"]), "", "default seed matches JS defaultSeed")


func test_plate_keys() -> void:
	var fx: Variant = GoldenUtil.fixture("state")
	if typeof(fx) != TYPE_DICTIONARY:
		fail("state fixture missing")
		return
	eq(CoreState.PLATE_KEYS, fx["plateKeys"], "PLATE_KEYS matches JS PLATE_KEYS")
	var s: Dictionary = CoreState.new_game_state(3)
	eq(s["plates"].keys(), CoreState.PLATE_KEYS, "PLATE_KEYS equals the keys of state.plates")
	for key in CoreState.PLATE_KEYS:
		eq(s["plates"][key], false, str(key) + " starts false")
	var top: Array = CoreState.new_game_state(3).keys()
	eq(top, JS_KEYS, "exactly the 23 top-level keys in JS order")


func test_fresh_containers() -> void:
	var a: Dictionary = CoreState.new_game_state(5)
	var b: Dictionary = CoreState.new_game_state(5)
	a["cars"].append({"id": 1})
	a["plates"]["fatcat"] = true
	a["market"]["priceMult"] = 2
	a["today"]["events"].append("event")
	a["flags"]["gameOver"] = true
	eq(b["cars"].size(), 0, "other state cars still empty")
	eq(b["plates"]["fatcat"], false, "other state plates untouched")
	eq(b["market"]["priceMult"], 1, "other state market untouched")
	eq(b["today"]["events"].size(), 0, "other state today untouched")
	eq(b["flags"]["gameOver"], false, "other state flags untouched")
	var c: Dictionary = CoreState.new_game_state(5)
	eq(c["cars"].size(), 0, "a third state is fresh too")


func test_json_roundtrip() -> void:
	var s: Dictionary = CoreState.new_game_state(9)
	var back: Variant = CoreJson.parse(CoreJson.stringify(s))
	ok(back is Dictionary, "parsed back to a dictionary")
	ok(GoldenUtil.same(back, s), "JSON round trip is equal: " + GoldenUtil.diff(back, s))


func test_rng_seeded() -> void:
	eq(CoreState.new_game_state(42)["rng"], 42, "seed 42 sets rng to 42")
	eq(CoreState.new_game_state(4294967295)["rng"], 4294967295, "seed 4294967295 sets rng to 4294967295")
	eq(CoreState.new_game_state(42)["seed"], 42, "seed 42 is stored as seed")
