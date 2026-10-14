extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("garage")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_service_car() -> void:
	var cs := _cases("service_car")
	ok(cs.size() >= 8, "service_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimGarage.service_car(st, a[0], a[1]), st)


func test_fix_fault() -> void:
	var cs := _cases("fix_fault")
	ok(cs.size() >= 5, "fix_fault: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimGarage.fix_fault(st, a[0]), st)


func test_restore_car() -> void:
	var cs := _cases("restore_car")
	ok(cs.size() >= 6, "restore_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimGarage.restore_car(st, a[0]), st)
