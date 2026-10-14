extends "res://tests/harness.gd"

# Tests for the Game singleton (autoload/game.gd). The Game is made by hand (not the autoload),
# so _ready does not run and the tests point its save files at temp paths.

const TMP_SAVE := "user://test_game_save.json"
const TMP_SETTINGS := "user://test_game_settings.json"
const FAKE := "res://tests/fake_actions.gd"


func _rm(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _make():
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)
	var g = load("res://autoload/game.gd").new()
	g.save_path = TMP_SAVE
	g.settings_path = TMP_SETTINGS
	g.register_action("double_cash", FAKE, "double_cash", ["n"])
	g.register_action("refuse", FAKE, "refuse", [])
	g.register_action("end_it", FAKE, "end_it", [])
	g.register_action("plain", FAKE, "plain", [])
	return g


func _done(g) -> void:
	g.free()
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)


func test_no_game() -> void:
	var g = _make()
	var r: Dictionary = g.act("double_cash", {"n": 2})
	eq(r.get("ok"), false, "no game is not ok")
	eq(r.get("msg"), "No game running", "no game message")
	_done(g)


func test_new_game() -> void:
	var g = _make()
	g.new_game(7)
	eq(g.state.seed, 7, "seed is 7")
	eq(g.state.day, 1, "day 1")
	eq(g.state.cash, 20000, "starting cash")
	ok(g.has_save(), "new game is saved")
	_done(g)


func test_unknown_action() -> void:
	var g = _make()
	g.new_game(7)
	var r: Dictionary = g.act("nope")
	eq(r.get("msg"), "Unknown action: nope", "unknown action message")
	eq(r.get("ok"), false, "unknown action is not ok")
	_done(g)


func test_missing_param() -> void:
	var g = _make()
	g.new_game(7)
	var r: Dictionary = g.act("double_cash", {})
	eq(r.get("msg"), "Missing parameter: n", "missing parameter message")
	eq(r.get("ok"), false, "missing parameter is not ok")
	_done(g)


func test_success() -> void:
	var g = _make()
	g.new_game(7)
	var changes: Array = [0]
	var days: Array = [0]
	var toasts: Array = []
	g.changed.connect(func() -> void: changes[0] += 1)
	g.day_advanced.connect(func() -> void: days[0] += 1)
	g.toast_requested.connect(func(t: String) -> void: toasts.append(t))
	var r: Dictionary = g.act("double_cash", {"n": 2})
	eq(r.get("ok"), true, "success is ok")
	eq(g.state.cash, 40000, "cash doubled")
	eq(changes[0], 1, "changed once")
	eq(days[0], 1, "day_advanced once")
	eq(toasts.size(), 0, "no toast on success")
	g.state = {}
	ok(g.continue_game(), "continue_game works after a success")
	eq(g.state.cash, 40000, "saved state restores cash 40000")
	_done(g)


func test_refused() -> void:
	var g = _make()
	g.new_game(7)
	var changes: Array = [0]
	var days: Array = [0]
	var toasts: Array = []
	g.changed.connect(func() -> void: changes[0] += 1)
	g.day_advanced.connect(func() -> void: days[0] += 1)
	g.toast_requested.connect(func(t: String) -> void: toasts.append(t))
	var r: Dictionary = g.act("refuse")
	eq(r.get("ok"), false, "refusal is not ok")
	eq(toasts, ["No way"], "refusal text becomes a toast")
	eq(days[0], 0, "no day_advanced on refusal")
	eq(changes[0], 0, "no changed on refusal")
	_done(g)


func test_game_over_signal() -> void:
	var g = _make()
	g.new_game(7)
	var overs: Array = [0]
	g.game_over.connect(func() -> void: overs[0] += 1)
	g.act("end_it")
	eq(overs[0], 1, "game_over emitted once")
	eq(g.state.flags.gameOver, true, "gameOver flag set")
	_done(g)


func test_passthrough() -> void:
	var g = _make()
	g.new_game(7)
	var signals_seen: Array = [0]
	g.changed.connect(func() -> void: signals_seen[0] += 1)
	g.day_advanced.connect(func() -> void: signals_seen[0] += 1)
	g.toast_requested.connect(func(_t: String) -> void: signals_seen[0] += 1)
	g.game_over.connect(func() -> void: signals_seen[0] += 1)
	var r = g.act("plain")
	eq(r, 5, "result without ok passes through")
	eq(signals_seen[0], 0, "no signals for a plain result")
	_done(g)


func test_not_built_yet() -> void:
	var g = _make()
	g.new_game(7)
	var r = g.act("buy_car", {"listing_id": 1})
	ok(r is Dictionary, "returns a Dictionary")
	if r is Dictionary:
		eq(r.get("ok"), false, "not built yet is not ok")
	_done(g)


func test_has_action() -> void:
	var g = _make()
	ok(g.has_action("buy_car"), "buy_car is in the table")
	ok(g.has_action("accept_job"), "accept_job is in the table")
	ok(g.has_action("advertise"), "advertise is in the table")
	ok(not g.has_action("nope"), "nope is not in the table")
	_done(g)


func test_continue_without_save() -> void:
	var g = _make()
	var toasts: Array = []
	g.toast_requested.connect(func(t: String) -> void: toasts.append(t))
	ok(not g.continue_game(), "continue without a save returns false")
	eq(toasts, ["No saved game"], "toast says no saved game")
	_done(g)


func test_settings_roundtrip() -> void:
	var g = _make()
	g.settings = {"crt": true, "sound": false, "music": true}
	ok(g.save_settings(), "save_settings returns true")
	g.settings = CoreSave.default_settings()
	g.load_settings()
	eq(g.settings.crt, true, "crt kept")
	eq(g.settings.sound, false, "sound kept")
	eq(g.settings.music, true, "music kept")
	_done(g)
