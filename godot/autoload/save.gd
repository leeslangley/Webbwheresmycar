class_name CoreSave
extends RefCounted

# Save and load of the game state and of the settings, as JSON files under user://.
# Same validity rules as src/save/save.js. Static helpers only, no state. Not an autoload.

const SAVE_PATH := "user://save.json"
const SETTINGS_PATH := "user://settings.json"
const REQUIRED_KEYS: Array[String] = ["day", "cash", "reputation", "buzz", "garageSlots", "cars", "shop", "requests", "auction", "stats", "plates", "flags", "rng"]


static func serialize(state: Dictionary) -> String:
	return CoreJson.stringify(state)


# Returns the state Dictionary, or null when the text is not JSON, not an object,
# has v other than 1, is missing a required key or has cars that is not an Array.
static func deserialize(text: String) -> Variant:
	var parsed: Dictionary = CoreJson.try_parse(text)
	if not parsed["ok"]:
		return null
	var state: Variant = parsed["value"]
	if not (state is Dictionary):
		return null
	var d: Dictionary = state
	var v: Variant = d.get("v")
	if not (v is int or v is float) or float(v) != 1.0:
		return null
	for key in REQUIRED_KEYS:
		if not d.has(key):
			return null
	if not (d["cars"] is Array):
		return null
	return d


static func save_to(state: Dictionary, path: String = SAVE_PATH) -> bool:
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(serialize(state))
	f.close()
	return true


static func load_from(path: String = SAVE_PATH) -> Variant:
	if not FileAccess.file_exists(path):
		return null
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return null
	var text: String = f.get_as_text()
	f.close()
	return deserialize(text)


static func has_save(path: String = SAVE_PATH) -> bool:
	return load_from(path) != null


# True when the file is gone afterwards (also true when it never existed).
static func clear_save(path: String = SAVE_PATH) -> bool:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	return not FileAccess.file_exists(path)


static func default_settings() -> Dictionary:
	return {"crt": false, "sound": true, "music": true}


# Defaults when the file is missing, corrupt or not an object. crt is true only when
# stored as exactly true; sound and music are false only when stored as exactly false.
static func load_settings(path: String = SETTINGS_PATH) -> Dictionary:
	var out: Dictionary = default_settings()
	if not FileAccess.file_exists(path):
		return out
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return out
	var text: String = f.get_as_text()
	f.close()
	var parsed: Dictionary = CoreJson.try_parse(text)
	if not parsed["ok"] or not (parsed["value"] is Dictionary):
		return out
	var stored: Dictionary = parsed["value"]
	var crt: Variant = stored.get("crt")
	var sound: Variant = stored.get("sound")
	var music: Variant = stored.get("music")
	out["crt"] = typeof(crt) == TYPE_BOOL and crt == true
	out["sound"] = not (typeof(sound) == TYPE_BOOL and sound == false)
	out["music"] = not (typeof(music) == TYPE_BOOL and music == false)
	return out


static func save_settings(settings: Dictionary, path: String = SETTINGS_PATH) -> bool:
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(CoreJson.stringify(settings))
	f.close()
	return true
