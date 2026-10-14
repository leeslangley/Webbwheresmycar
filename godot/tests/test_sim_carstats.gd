extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("carstats")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_eff_d() -> void:
	var cs := _cases("eff_d")
	ok(cs.size() >= 25, "eff_d: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.eff_d(SimData.model_of(a[0]), {"condition": a[1]}))


func test_eff_r() -> void:
	var cs := _cases("eff_r")
	ok(cs.size() >= 25, "eff_r: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.eff_r(SimData.model_of(a[0]), {"condition": a[1]}))


func test_maint_mult() -> void:
	var cs := _cases("maint_mult")
	ok(cs.size() >= 25, "maint_mult: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.maint_mult({"condition": a[1]}))


func test_value_factor() -> void:
	var cs := _cases("value_factor")
	ok(cs.size() >= 25, "value_factor: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.value_factor({"condition": a[1]}))


func test_running_cost() -> void:
	var cs := _cases("running_cost")
	ok(cs.size() >= 25, "running_cost: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.running_cost(SimData.model_of(a[0]), {"condition": a[1]}))


func test_idle_decay() -> void:
	var cs := _cases("idle_decay")
	ok(cs.size() >= 25, "idle_decay: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimCarStats.idle_decay(SimData.model_of(a[0])))


func test_market_value() -> void:
	var cs := _cases("market_value")
	ok(cs.size() >= 75, "market_value: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimCarStats.market_value(st, SimData.model_of(a[0]), {"condition": a[1]}), st)


func test_change_condition() -> void:
	var cs := _cases("change_condition")
	ok(cs.size() >= 10, "change_condition: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var car := {"condition": a[0]}
		_check(c, SimCarStats.change_condition(car, a[1]))
		ok(is_equal_approx(car["condition"], c["result"]), c["name"] + " stored on the car")


func test_is_available() -> void:
	var cs := _cases("is_available")
	ok(cs.size() >= 5, "is_available: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimCarStats.is_available(st, a[0]), st)
