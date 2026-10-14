extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("newgame")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_start_game() -> void:
	var cs := _cases("start_game")
	ok(cs.size() >= 10, "start_game: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimNewGame.start_game(int(a[0])))


func test_start_game_basics() -> void:
	var s := SimNewGame.start_game(5)
	eq(s["day"], 1, "day")
	eq(s["cash"], 20000, "cash")
	eq(s["reputation"], 40, "reputation")
	eq(s["garageSlots"], 3, "garageSlots")
	eq(s["shop"]["listings"].size(), 8, "shop listings")
	eq(s["auction"]["lots"].size(), 6, "auction lots")
	eq(s["flags"]["gameOver"], false, "gameOver")
	ok(GoldenUtil.same(SimNewGame.start_game(5), SimNewGame.start_game(5)), "two calls with seed 5 are equal")
