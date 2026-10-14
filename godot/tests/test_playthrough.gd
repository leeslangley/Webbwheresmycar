extends "res://tests/harness.gd"

# Parity playthrough (GDS21): the JS bot (tools/godot/golden_bot.mjs) played 60 calls on seed 11 through the
# dispatch table. Its recorded steps are replayed here through Game.act; each step's result and headline
# numbers must agree with the JS run, and the final state must match the JS final state.
# Fixture: godot/tests/golden/playthrough.json (sh tools/godot/golden_run.sh playthrough).


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("playthrough")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_replay_matches_js() -> void:
	var cs := _cases("playthrough")
	ok(cs.size() == 1, "playthrough: one golden case")
	if cs.size() != 1:
		return
	var c: Dictionary = cs[0]
	var a: Array = c["args"]
	var steps: Array = c["result"]["steps"]
	var g = load("res://autoload/game.gd").new()
	g.autosave = false
	g.new_game(int(a[0]))
	for i in range(steps.size()):
		var step: Dictionary = steps[i]
		var action: String = step["action"]
		var r: Variant = g.act(action, step["params"])
		var d := GoldenUtil.diff(r, step["result"])
		ok(d == "", "step %d %s result %s" % [i, action, d])
		eq(g.state["day"], step["day"], "step %d %s day" % [i, action])
		eq(g.state["cash"], step["cash"], "step %d %s cash" % [i, action])
		eq(g.state["reputation"], step["reputation"], "step %d %s reputation" % [i, action])
		near(float(g.state["buzz"]), float(step["buzz"]), GoldenUtil.EPS, "step %d %s buzz" % [i, action])
		eq(g.state["cars"].size(), step["cars"], "step %d %s cars" % [i, action])
		eq(g.state["flags"]["gameOver"], step["gameOver"], "step %d %s gameOver" % [i, action])
	var d_final := GoldenUtil.diff(g.state, c["result"]["final"])
	ok(d_final == "", "final state matches the JS run: %s" % d_final)
	g.free()


func test_series_summary() -> void:
	var cs := _cases("playthrough")
	ok(cs.size() == 1, "playthrough: one golden case")
	if cs.size() != 1:
		return
	var steps: Array = cs[0]["result"]["steps"]
	var cash_series: Array = []
	for step in steps:
		cash_series.append(step["cash"])
	ok(cash_series.size() >= 60, "recorded cash series has 60 or more entries, got %d" % cash_series.size())
	ok(steps.size() > 0 and int(steps[steps.size() - 1]["day"]) > 40, "last recorded day is greater than 40")
