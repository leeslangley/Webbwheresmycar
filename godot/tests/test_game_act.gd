extends "res://tests/harness.gd"

# Tests for Game.act (autoload/game.gd, GDS20): the scripted JS session replayed step by step, and the
# act rules around it. The Game is made by hand (not the autoload), with autosave off unless a test says so.

const TMP_SAVE := "user://test_game_act_save.json"
const TMP_SETTINGS := "user://test_game_act_settings.json"


func _rm(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _make():
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)
	var g = load("res://autoload/game.gd").new()
	g.save_path = TMP_SAVE
	g.settings_path = TMP_SETTINGS
	g.autosave = false
	g.new_game(3)
	return g


# Counts: [changed, toast_requested, day_advanced, game_over]. Connected after new_game, so only acts count.
func _count(g) -> Array:
	var n := [0, 0, 0, 0]
	g.changed.connect(func() -> void: n[0] += 1)
	g.toast_requested.connect(func(_t: String) -> void: n[1] += 1)
	g.day_advanced.connect(func() -> void: n[2] += 1)
	g.game_over.connect(func() -> void: n[3] += 1)
	return n


func _done(g) -> void:
	g.free()
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)


func test_session_replay() -> void:
	var c: Dictionary = GoldenUtil.load_golden("game_act")["cases"][0]
	var steps: Array = c["result"]["steps"]
	ok(steps.size() >= 30, "session has at least 30 steps")
	var g = _make()
	var n := _count(g)
	var prev_day: int = 1
	var day_moves: int = 0
	var refusals: int = 0
	for i in range(steps.size()):
		var step: Dictionary = steps[i]
		var r: Variant = g.act(step["action"], step["params"])
		var d := GoldenUtil.diff(r, step["result"])
		ok(d == "", "step %d %s result %s" % [i, step["action"], d])
		eq(g.state["day"], step["day"], "step %d day" % i)
		eq(g.state["cash"], step["cash"], "step %d cash" % i)
		eq(g.state["reputation"], step["reputation"], "step %d reputation" % i)
		near(float(g.state["buzz"]), float(step["buzz"]), GoldenUtil.EPS, "step %d buzz" % i)
		eq(g.state["cars"].size(), step["cars"], "step %d cars" % i)
		eq(g.state["flags"]["gameOver"], step["gameOver"], "step %d gameOver" % i)
		if step["day"] != prev_day:
			day_moves += 1
		prev_day = step["day"]
		if step["result"]["ok"] == false:
			refusals += 1
	ok(GoldenUtil.diff(g.state, c["result"]["final"]) == "", "final state matches the JS session")
	eq(n[2], day_moves, "day_advanced once per step that moved the day")
	eq(n[1], refusals, "one toast per refused step")
	_done(g)


func test_unknown_action() -> void:
	var g = _make()
	var before: Dictionary = g.state.duplicate(true)
	var r: Dictionary = g.act("fly_to_moon")
	eq(r.get("ok"), false, "unknown action is not ok")
	eq(r.get("msg"), "Unknown action: fly_to_moon", "unknown action message")
	ok(GoldenUtil.diff(g.state, before) == "", "state unchanged by an unknown action")
	_done(g)


func test_missing_param() -> void:
	var g = _make()
	var r: Dictionary = g.act("buy_car", {})
	eq(r.get("ok"), false, "missing parameter is not ok")
	eq(r.get("msg"), "Missing parameter: listing_id", "buy_car names listing_id")
	var r2: Dictionary = g.act("service_car", {"car_id": "c1"})
	eq(r2.get("msg"), "Missing parameter: kind", "service_car names kind")
	_done(g)


func test_game_over_blocks_actions() -> void:
	var g = _make()
	var n := _count(g)
	g.state["flags"]["gameOver"] = true
	var day_before: int = g.state["day"]
	var r: Dictionary = g.act("wait_day")
	eq(r.get("ok"), false, "no action once the year is over")
	eq(r.get("msg"), "The year is over", "year-over message")
	eq(g.state["day"], day_before, "day unchanged once the year is over")
	eq(n[1], 0, "no toast once the year is over")
	_done(g)


func test_game_over_signal() -> void:
	var g = _make()
	var n := _count(g)
	g.state["day"] = 365
	g.state["flags"]["gameOver"] = false
	g.act("wait_day")
	eq(n[3], 1, "game_over emitted once when the year ends")
	eq(g.state["flags"]["gameOver"], true, "gameOver set")
	eq(g.state["flags"]["reason"], "year-end", "reason is year-end")
	_done(g)


func test_autosave() -> void:
	var g = _make()
	g.autosave = true
	g.save_path = TMP_SAVE
	_rm(TMP_SAVE)
	g.act("wait_day")
	ok(FileAccess.file_exists(TMP_SAVE), "a successful action writes the save file")
	ok(CoreSave.has_save(TMP_SAVE), "the saved file loads back as a game")
	_done(g)
