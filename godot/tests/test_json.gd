extends "res://tests/harness.gd"


func test_normalize() -> void:
	ok(typeof(CoreJson.normalize(1.0)) == TYPE_INT, "1.0 becomes int")
	eq(CoreJson.normalize(1.0), 1, "1.0 value")
	ok(typeof(CoreJson.normalize(2.5)) == TYPE_FLOAT, "2.5 stays float")
	near(CoreJson.normalize(2.5), 2.5, 1e-9, "2.5 value")
	var n: Dictionary = CoreJson.normalize({"a": [1.0, 2.5, {"b": 3.0}]})
	var a: Array = n["a"]
	ok(typeof(a[0]) == TYPE_INT and a[0] == 1, "a[0] is int 1")
	ok(typeof(a[1]) == TYPE_FLOAT and a[1] == 2.5, "a[1] is float 2.5")
	ok(typeof(a[2]["b"]) == TYPE_INT and a[2]["b"] == 3, "a[2].b is int 3")
	ok(CoreJson.normalize("text") == "text", "string unchanged")
	ok(CoreJson.normalize(true) == true, "bool unchanged")
	ok(CoreJson.normalize(null) == null, "null unchanged")
	ok(typeof(CoreJson.normalize(1.0e16)) == TYPE_FLOAT, "1.0e16 stays float")


func test_parse() -> void:
	var p: Variant = CoreJson.parse('{"x":5,"y":[1,2.5]}')
	ok(typeof(p["x"]) == TYPE_INT and p["x"] == 5, "x is int 5")
	ok(typeof(p["y"][0]) == TYPE_INT and p["y"][0] == 1, "y[0] is int 1")
	ok(typeof(p["y"][1]) == TYPE_FLOAT and p["y"][1] == 2.5, "y[1] is float 2.5")
	ok(CoreJson.parse("nope") == null, "bad text parses to null")
	ok(CoreJson.try_parse("nope")["ok"] == false, "try_parse bad text is not ok")
	ok(CoreJson.try_parse("null")["ok"] == true, "try_parse null is ok")
	ok(CoreJson.try_parse("null")["value"] == null, "try_parse null value is null")


func test_stringify_sorted() -> void:
	eq(CoreJson.stringify({"b": 1, "a": 2}), '{"a":2,"b":1}', "keys sorted, compact")


func test_file_roundtrip() -> void:
	ok(CoreJson.save_file("user://gdf15_tmp.json", {"n": 7, "s": "hi"}), "save_file returns true")
	var got: Variant = CoreJson.load_file("user://gdf15_tmp.json")
	ok(got is Dictionary, "load_file gives a dictionary")
	if got is Dictionary:
		ok(typeof(got["n"]) == TYPE_INT and got["n"] == 7, "n is int 7")
		eq(got["s"], "hi", "s is hi")
	DirAccess.remove_absolute(ProjectSettings.globalize_path("user://gdf15_tmp.json"))
	ok(CoreJson.load_file("user://does_not_exist.json") == null, "missing file loads as null")
