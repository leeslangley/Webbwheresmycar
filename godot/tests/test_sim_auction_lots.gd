extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("auction_lots")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_prepare_auction() -> void:
	var cs := _cases("prepare_auction")
	ok(cs.size() >= 18, "prepare_auction: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		SimAuction.prepare_auction(st)
		_check(c, null, st)


func test_lot_view() -> void:
	var cs := _cases("lot_view")
	ok(cs.size() >= 9, "lot_view: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.lot_view(st, a[0]), st)


func test_reveal_stat() -> void:
	var cs := _cases("reveal_stat")
	ok(cs.size() >= 7, "reveal_stat: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.reveal_stat(st, a[0], a[1]), st)


func test_consign_car() -> void:
	var cs := _cases("consign_car")
	ok(cs.size() >= 9, "consign_car: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.consign_car(st, a[0], a[1]), st)


func test_unconsign() -> void:
	var cs := _cases("unconsign")
	ok(cs.size() >= 2, "unconsign: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimAuction.unconsign(st, a[0]), st)
