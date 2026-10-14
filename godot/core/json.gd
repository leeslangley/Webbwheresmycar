class_name CoreJson
extends RefCounted

# The one way the game reads and writes JSON. GDScript's JSON parser returns every number as a float;
# normalize() turns whole numbers back into int. Pure static helpers, no state.


static func normalize(v: Variant) -> Variant:
	if v is float:
		var f: float = v
		if f == floor(f) and absf(f) < 9.0e15:
			return int(f)
		return f
	if v is Array:
		var out: Array = []
		for item in (v as Array):
			out.append(normalize(item))
		return out
	if v is Dictionary:
		var d: Dictionary = {}
		var src: Dictionary = v
		for key in src:
			d[key] = normalize(src[key])
		return d
	return v


static func try_parse(text: String) -> Dictionary:
	var j := JSON.new()
	var err: Error = j.parse(text)
	if err != OK:
		return {"ok": false, "value": null}
	return {"ok": true, "value": normalize(j.data)}


static func parse(text: String) -> Variant:
	return try_parse(text)["value"]


static func load_file(path: String) -> Variant:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return null
	return parse(f.get_as_text())


static func stringify(v: Variant) -> String:
	return JSON.stringify(v, "", true)


static func save_file(path: String, v: Variant) -> bool:
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(stringify(v))
	return true
