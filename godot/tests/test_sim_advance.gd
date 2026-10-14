extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("advance")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_advance_day() -> void:
	var cs := _cases("advance_day")
	ok(cs.size() >= 19, "advance_day: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimAdvance.advance_day(st)
		_check(c, null, st)


func test_advance_seq() -> void:
	var cs := _cases("advance_seq")
	ok(cs.size() >= 1, "advance_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		for i in range(int(a[0])):
			SimAdvance.advance_day(st)
			out.append([st["day"], st["cash"], st["reputation"], st["buzz"], st["today"]["headline"], st["today"]["events"].size(), st["requests"].size()])
		_check(c, out, st)


func test_start_of_day_flags() -> void:
	var cs := _cases("start_of_day_flags")
	ok(cs.size() >= 4, "start_of_day_flags: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAdvance.start_of_day_flags(st), st)
