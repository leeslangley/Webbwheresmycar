extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("news")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_choose_headline() -> void:
	var cs := _cases("choose_headline")
	ok(cs.size() >= 50, "choose_headline: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		_check(c, SimNews.choose_headline(st, a[0], a[1]), st)


func test_choose_headline_seq() -> void:
	var cs := _cases("choose_headline_seq")
	ok(cs.size() >= 1, "choose_headline_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		var sits := [[], ["broke"], ["rich", "monthend"], ["viral", "bigwin", "zzz"]]
		for i in range(int(a[0])):
			var ctx := {"cash": 1000 * i}
			if i % 2 == 1:
				ctx["car"] = "Fjord Capri"
				ctx["customer"] = "Kevin Pumphrey"
			out.append(SimNews.choose_headline(st, sits[i % 4], ctx))
		_check(c, out, st)
