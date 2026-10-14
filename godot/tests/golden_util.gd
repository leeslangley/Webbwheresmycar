class_name GoldenUtil
extends RefCounted

# Loads golden fixtures (godot/tests/golden/<name>.json, written by tools/godot/golden_run.sh) and compares values.
# Ints compare exactly, floats within EPS, arrays and dictionaries deeply. diff() names the FIRST difference found.

const EPS := 1e-9


# Read res://tests/golden/<name>.json with every integral float turned back into an int.
# A missing file or a parse error reports push_error and returns an empty Dictionary.
static func load_golden(name: String) -> Dictionary:
	var path := "res://tests/golden/%s.json" % name
	if not FileAccess.file_exists(path):
		push_error("golden fixture missing: " + path)
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("golden fixture is not a JSON object: " + path)
		return {}
	return intify(parsed) as Dictionary


# Recursively copy Arrays and Dictionaries; a float with an integral value below 1e15 becomes an int.
static func intify(v: Variant) -> Variant:
	if v is Array:
		var out_array: Array = []
		for item in v:
			out_array.append(intify(item))
		return out_array
	if v is Dictionary:
		var out_dict: Dictionary = {}
		for key in v:
			out_dict[key] = intify(v[key])
		return out_dict
	if typeof(v) == TYPE_FLOAT:
		var f: float = v
		if absf(f) < 1e15 and f == floorf(f):
			return int(f)
	return v


# Arrays and Dictionaries are duplicated deeply; any other value is returned as it is.
static func copy(v: Variant) -> Variant:
	if v is Array or v is Dictionary:
		return v.duplicate(true)
	return v


# "" when equal, else text naming the first difference, e.g. "$.a[1]: 2 != 3".
# Two ints must be exactly equal. An int or float against another number is equal within EPS.
# A type mismatch (for example bool against number) is a difference.
static func diff(got: Variant, want: Variant, path: String = "$") -> String:
	if _is_number(got) or _is_number(want):
		if not (_is_number(got) and _is_number(want)):
			return "%s: %s != %s" % [path, str(got), str(want)]
		if typeof(got) == TYPE_INT and typeof(want) == TYPE_INT:
			if got == want:
				return ""
			return "%s: %s != %s" % [path, str(got), str(want)]
		if absf(float(got) - float(want)) <= EPS:
			return ""
		return "%s: %s != %s" % [path, str(got), str(want)]
	if typeof(got) != typeof(want):
		return "%s: %s != %s" % [path, str(got), str(want)]
	if typeof(got) == TYPE_ARRAY:
		var got_array: Array = got
		var want_array: Array = want
		if got_array.size() != want_array.size():
			return "%s: array size %d != %d" % [path, got_array.size(), want_array.size()]
		for i in range(got_array.size()):
			var item_diff := diff(got_array[i], want_array[i], "%s[%d]" % [path, i])
			if item_diff != "":
				return item_diff
		return ""
	if typeof(got) == TYPE_DICTIONARY:
		var got_dict: Dictionary = got
		var want_dict: Dictionary = want
		for key in want_dict.keys():
			if not got_dict.has(key):
				return "%s.%s: missing" % [path, str(key)]
		for key in got_dict.keys():
			if not want_dict.has(key):
				return "%s.%s: unexpected" % [path, str(key)]
		for key in want_dict.keys():
			var value_diff := diff(got_dict[key], want_dict[key], "%s.%s" % [path, str(key)])
			if value_diff != "":
				return value_diff
		return ""
	if got == want:
		return ""
	return "%s: %s != %s" % [path, str(got), str(want)]


static func same(got: Variant, want: Variant) -> bool:
	return diff(got, want) == ""


static func _is_number(v: Variant) -> bool:
	return typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT


# Fixture by name (GDF04 API): res://tests/golden/<name>.json parsed with CoreJson (integral floats become ints).
static func fixture(name: String) -> Variant:
	return CoreJson.load_file("res://tests/golden/" + name + ".json")
