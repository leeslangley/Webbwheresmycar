extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("shop")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_make_listing() -> void:
	var cs := _cases("make_listing")
	ok(cs.size() >= 24, "make_listing: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimShop.make_listing(st, a[0]), st)


func test_init_shop() -> void:
	var cs := _cases("init_shop")
	ok(cs.size() >= 5, "init_shop: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimShop.init_shop(st)
		_check(c, null, st)


func test_should_refresh() -> void:
	var cs := _cases("should_refresh")
	ok(cs.size() >= 10, "should_refresh: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimShop.should_refresh(a[0]))


func test_refresh_shop() -> void:
	var cs := _cases("refresh_shop")
	ok(cs.size() >= 8, "refresh_shop: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimShop.refresh_shop(st)
		_check(c, null, st)
