extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("auction_bids")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_bid_step() -> void:
	var cs := _cases("bid_step")
	ok(cs.size() >= 5, "bid_step: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimAuction.bid_step({"reserve": a[0]}))


func test_min_bid() -> void:
	var cs := _cases("min_bid")
	ok(cs.size() >= 3, "min_bid: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimAuction.min_bid(a[0]))


func test_place_bid() -> void:
	var cs := _cases("place_bid")
	ok(cs.size() >= 12, "place_bid: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.place_bid(st, a[0], a[1]), st)
