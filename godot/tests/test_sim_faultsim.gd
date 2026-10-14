extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("faultsim")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_roll_fault() -> void:
	var cs := _cases("roll_fault")
	ok(cs.size() >= 360, "roll_fault: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimFaultSim.roll_fault(st, SimData.model_of(a[0]), {"condition": a[1]}, a[2]), st)


func test_apply_fault() -> void:
	var cs := _cases("apply_fault")
	ok(cs.size() >= 3, "apply_fault: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var car: Dictionary = GoldenUtil.copy(a[0])
		var fault: Dictionary = GoldenUtil.copy(a[1])
		SimFaultSim.apply_fault(car, fault)
		_check(c, car)
		fault["cost"] = 1
		ok(car["fault"]["cost"] != 1, c["name"] + " car does not share the fault object")


func test_roll_fault_leaves_car_alone() -> void:
	var car := {"condition": 4.0, "fault": null}
	var before: Dictionary = GoldenUtil.copy(car)
	SimFaultSim.roll_fault({"rng": 7}, SimData.model_of("t1_allergy"), car)
	eq(car, before, "roll_fault must not modify the car")
