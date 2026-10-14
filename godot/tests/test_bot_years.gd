extends "res://tests/harness.gd"

# Parity years (GDS22): the GDScript SimBot (tests/sim_bot.gd, a port of the GDS21 bot) plays each whole game year
# on seeds 1..10 through Game.act. Each game must end with the same call count, end reason, won flag, day, cash,
# reputation, buzz, car count and rng value as the JS bot (fixture godot/tests/golden/bot_years.json).
# Fixture: sh tools/godot/golden_run.sh bot_years


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("bot_years")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _play(seed_value: int) -> Dictionary:
	var g = load("res://autoload/game.gd").new()
	g.autosave = false
	g.new_game(seed_value)
	var calls := SimBot.play(g, 400)
	var s: Dictionary = g.state
	var got := {
		"calls": calls,
		"reason": s["flags"].get("reason"),
		"won": s["flags"].get("won"),
		"day": s["day"],
		"cash": s["cash"],
		"reputation": s["reputation"],
		"buzz": s["buzz"],
		"cars": s["cars"].size(),
		"rng": s["rng"],
	}
	var state_copy: Dictionary = s.duplicate(true)
	g.free()
	return {"got": got, "state": state_copy}


func test_bot_years() -> void:
	var cs := _cases("bot_year")
	ok(cs.size() == 10, "bot_years: ten seeds in the fixture, got %d" % cs.size())
	for c in cs:
		var seed_value := int(c["args"][0])
		var played: Dictionary = _play(seed_value)
		var d := GoldenUtil.diff(played["got"], c["result"])
		ok(d == "", "seed %d: %s" % [seed_value, d])
		ok(played["got"]["reason"] != null, "seed %d: the year ended (reason set)" % seed_value)


func test_determinism() -> void:
	var a: Dictionary = _play(4)
	var b: Dictionary = _play(4)
	ok(GoldenUtil.same(a["state"], b["state"]), "seed 4 played twice gives the same state")
