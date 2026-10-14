extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("jobresolve")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_accept_job() -> void:
	var cs := _cases("accept_job")
	ok(cs.size() >= 25, "accept_job: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var skip: bool = c["result"].has("outcome") and c["result"]["outcome"]["type"] == "disaster"
		if skip:
			continue
		_check(c, SimJobResolve.accept_job(st, a[0], a[1]), st)


func test_golden_has_all_kinds() -> void:
	var types := {}
	var has_bigwin := false
	for c: Dictionary in _cases("accept_job"):
		if c["result"].has("outcome"):
			types[c["result"]["outcome"]["type"]] = true
		if c["name"] == "bigwin":
			has_bigwin = true
	for t in ["success", "mishap", "breakdown", "disaster"]:
		ok(types.has(t), "golden has outcome type %s" % t)
	ok(has_bigwin, "golden has a bigwin case")
