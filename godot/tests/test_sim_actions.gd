extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("actions")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_buy_car() -> void:
	var cs := _cases("buy_car")
	ok(cs.size() >= 7, "buy_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.buy_car(st, a[0]), st)


func test_rent_car() -> void:
	var cs := _cases("rent_car")
	ok(cs.size() >= 6, "rent_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.rent_car(st, a[0]), st)


func test_return_rental() -> void:
	var cs := _cases("return_rental")
	ok(cs.size() >= 6, "return_rental: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.return_rental(st, a[0]), st)


func test_sell_to_dealer() -> void:
	var cs := _cases("sell_to_dealer")
	ok(cs.size() >= 4, "sell_to_dealer: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.sell_to_dealer(st, a[0]), st)


func test_buy_slot() -> void:
	var cs := _cases("buy_slot")
	ok(cs.size() >= 3, "buy_slot: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.buy_slot(st), st)


func test_wait_day() -> void:
	var cs := _cases("wait_day")
	ok(cs.size() >= 3, "wait_day: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimActions.wait_day(st), st)
