extends "res://tests/harness.gd"

const TMP_SAVE := "user://test_save_tmp.json"
const TMP_SETTINGS := "user://test_settings_tmp.json"
const MISSING := "user://no_such_save_gdf09.json"


func _good() -> Dictionary:
	return {
		"v": 1,
		"day": 1,
		"cash": 20000,
		"reputation": 50,
		"buzz": 10,
		"garageSlots": 4,
		"cars": [],
		"shop": [],
		"requests": [],
		"auction": {},
		"stats": {"sold": 0},
		"plates": [],
		"flags": {},
		"rng": 5,
	}


func _rm(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _write(path: String, text: String) -> void:
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string(text)
	f.close()


func test_roundtrip_string() -> void:
	var s := _good()
	eq(CoreSave.deserialize(CoreSave.serialize(s)), s, "string round trip")


func test_rejects() -> void:
	eq(CoreSave.deserialize("not json"), null, "not JSON")
	eq(CoreSave.deserialize("[1,2]"), null, "array is not an object")
	eq(CoreSave.deserialize("null"), null, "null")
	var s2 := _good()
	s2["v"] = 2
	eq(CoreSave.deserialize(CoreSave.serialize(s2)), null, "v 2 rejected")
	var s2b := _good()
	s2b["v"] = "1"
	eq(CoreSave.deserialize(CoreSave.serialize(s2b)), null, "v as string rejected")
	var s3 := _good()
	s3.erase("v")
	eq(CoreSave.deserialize(CoreSave.serialize(s3)), null, "missing v rejected")
	for key in CoreSave.REQUIRED_KEYS:
		var s := _good()
		s.erase(key)
		eq(CoreSave.deserialize(CoreSave.serialize(s)), null, "missing " + key + " rejected")
	var s4 := _good()
	s4["cars"] = {}
	eq(CoreSave.deserialize(CoreSave.serialize(s4)), null, "cars as dictionary rejected")


func test_extra_keys_ok() -> void:
	var s := _good()
	s["extra"] = "x"
	var back: Variant = CoreSave.deserialize(CoreSave.serialize(s))
	ok(back is Dictionary, "extra keys tolerated")
	if back is Dictionary:
		eq(back["extra"], "x", "extra key kept")


func test_file_roundtrip() -> void:
	_rm(TMP_SAVE)
	var s := _good()
	ok(CoreSave.save_to(s, TMP_SAVE), "save_to true")
	ok(CoreSave.has_save(TMP_SAVE), "has_save true after save")
	eq(CoreSave.load_from(TMP_SAVE), s, "load_from gives the same state")
	ok(CoreSave.clear_save(TMP_SAVE), "clear_save true")
	ok(not CoreSave.has_save(TMP_SAVE), "has_save false after clear")
	ok(CoreSave.clear_save(TMP_SAVE), "clear_save again true")


func test_load_missing_is_null() -> void:
	_rm(MISSING)
	eq(CoreSave.load_from(MISSING), null, "missing file loads as null")
	ok(not CoreSave.has_save(MISSING), "missing file has no save")


func test_save_to_bad_path() -> void:
	ok(not CoreSave.save_to(_good(), "user://no_such_dir_xyz/s.json"), "save to a missing directory is false")


func test_default_settings_fresh() -> void:
	var d := CoreSave.default_settings()
	d["crt"] = true
	eq(CoreSave.default_settings(), {"crt": false, "sound": true, "music": true}, "defaults unchanged by edits")


func test_settings() -> void:
	_rm(TMP_SETTINGS)
	eq(CoreSave.load_settings(TMP_SETTINGS), CoreSave.default_settings(), "missing file gives defaults")
	var want := {"crt": true, "sound": false, "music": true}
	ok(CoreSave.save_settings(want, TMP_SETTINGS), "save_settings true")
	eq(CoreSave.load_settings(TMP_SETTINGS), want, "settings round trip")
	_write(TMP_SETTINGS, '{"crt": 1, "sound": 0}')
	eq(CoreSave.load_settings(TMP_SETTINGS), {"crt": false, "sound": true, "music": true}, "non-boolean values give crt false, sound true")
	_write(TMP_SETTINGS, "garbage")
	eq(CoreSave.load_settings(TMP_SETTINGS), CoreSave.default_settings(), "garbage gives defaults")
	_rm(TMP_SETTINGS)
