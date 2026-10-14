extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("endgame")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_net_worth() -> void:
	var cs := _cases("net_worth")
	ok(cs.size() >= 4, "net_worth: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimEndGame.net_worth(st), st)


func test_evaluate_plates() -> void:
	var cs := _cases("evaluate_plates")
	ok(cs.size() >= 10, "evaluate_plates: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimEndGame.evaluate_plates(st), st)


func test_final_score() -> void:
	var cs := _cases("final_score")
	ok(cs.size() >= 4, "final_score: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimEndGame.final_score(st), st)


func test_rank_of() -> void:
	var cs := _cases("rank_of")
	ok(cs.size() >= 11, "rank_of: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimEndGame.rank_of(a[0]))


func test_check_end() -> void:
	var cs := _cases("check_end")
	ok(cs.size() >= 5, "check_end: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimEndGame.check_end(st)
		_check(c, null, st)


func test_plate_info() -> void:
	var cs := _cases("plate_info")
	ok(cs.size() >= 1, "plate_info: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimEndGame.plate_info())
