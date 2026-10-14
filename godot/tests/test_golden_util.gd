extends "res://tests/harness.gd"


func test_intify() -> void:
	var v: Dictionary = GoldenUtil.intify({"a": 3.0, "b": [1.5, 2.0], "c": "x"})
	eq(typeof(v["a"]), TYPE_INT, "3.0 becomes int")
	eq(typeof(v["b"][0]), TYPE_FLOAT, "1.5 stays float")
	eq(v["b"][0], 1.5, "1.5 value kept")
	eq(typeof(v["b"][1]), TYPE_INT, "2.0 becomes int")
	eq(v["c"], "x", "string kept")


func test_same_numbers() -> void:
	ok(GoldenUtil.same(1, 1.0), "1 equals 1.0")
	ok(GoldenUtil.same(0.1 + 0.2, 0.3), "0.1 + 0.2 equals 0.3 within EPS")
	ok(not GoldenUtil.same(1, 2), "1 differs from 2")
	ok(not GoldenUtil.same(1.5, 1.6), "1.5 differs from 1.6")
	ok(not GoldenUtil.same(true, 1), "bool differs from number")


func test_diff_paths() -> void:
	ok(GoldenUtil.diff({"a": [1, 2]}, {"a": [1, 3]}).begins_with("$.a[1]"), "path of element 1 in $.a")
	ok(GoldenUtil.diff({"a": 1}, {"a": 1, "b": 2}).contains("missing"), "key missing in got")
	ok(GoldenUtil.diff({"a": 1, "b": 2}, {"a": 1}).contains("unexpected"), "key unexpected in got")
	ok(GoldenUtil.diff([1], [1, 2]).contains("array size"), "array size differs")
	eq(GoldenUtil.diff({}, {}), "", "empty dictionaries equal")


func test_copy_is_deep() -> void:
	var orig: Dictionary = {"n": {"x": 1}, "list": [1, 2]}
	var c: Dictionary = GoldenUtil.copy(orig)
	c["n"]["x"] = 99
	c["list"].append(3)
	eq(orig["n"]["x"], 1, "nested dictionary unchanged")
	eq(orig["list"].size(), 2, "nested array unchanged")


func test_selftest_fixture() -> void:
	var cs: Array = GoldenUtil.load_golden("selftest")["cases"]
	eq(cs.size(), 3, "three cases")
	eq(cs[0]["result"], 5, "add result")
	eq(typeof(cs[0]["result"]), TYPE_INT, "add result is int")
	ok(GoldenUtil.same(cs[1]["after"], {"n": 6, "list": [1, 2, 5]}), "bump after state")
	eq(cs[1]["state"]["n"], 1, "bump input state kept")
	eq(cs[2]["result"]["text"], "Price " + char(163) + " 5", "text with pound sign")
	near(cs[2]["result"]["sum"], 0.3, 1e-9, "float sum")
