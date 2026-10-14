extends "res://tests/harness.gd"

# Flow game over and settings (GDR31): the TV news comes before the endgame, the office is never shown once the
# year is over, and the CRT and sound settings reach the room in front and the Sfx autoload. A real Game instance
# saves to temp files; the rooms are FakeRooms, except the settings overlay, which is the real settings scene.
# The runner does not fire _ready on add_child, so Main's _ready is called by hand (as in test_flow_lifecycle).

const FAKE := "res://tests/fake_room.tscn"
const SETTINGS := "res://scenes/settings.tscn"
const TMP_SAVE := "user://test_flow_gameover_save.json"
const TMP_SETTINGS := "user://test_flow_gameover_settings.json"


func _rm(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


# Returns [main, game]: a Main with the flow bound to a fresh Game and fake rooms for the flow's screens.
func _setup() -> Array:
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)
	var g = load("res://autoload/game.gd").new()
	g.save_path = TMP_SAVE
	g.settings_path = TMP_SETTINGS
	g.erase_save()
	var main = load("res://scenes/main.tscn").instantiate()
	main.auto_start = false
	tree().root.add_child(main)
	main._ready()
	var flow: Flow = main.flow
	flow.room_paths = {&"office": FAKE, &"title": FAKE, &"endgame": FAKE, &"settings": FAKE}
	flow.bind_game(g)
	return [main, g]


func _teardown(main, g) -> void:
	if main.is_inside_tree():
		tree().root.remove_child(main)
	main.free()
	g.erase_save()
	g.free()
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)


# Sets state.flags.gameOver without emitting anything.
func _set_over(g, on: bool) -> void:
	var flags: Dictionary = g.state.get("flags", {})
	flags["gameOver"] = on
	g.state["flags"] = flags


func test_game_over_news_then_endgame() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(3)
	eq(flow.current_id, &"office", "NEW GAME enters the office")
	_set_over(g, true)
	g.game_over.emit()
	eq(flow.current.news_calls, 1, "game over shows the news once")
	eq(flow.current_id, &"office", "the office stays on screen while the news runs")
	flow.current.news_closed.emit()
	eq(flow.current_id, &"endgame", "closing the news goes to the endgame")
	eq(flow._end_pending, false, "_end_pending is cleared after the endgame")
	_teardown(main, g)


func test_day_and_game_over_news_once() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(3)
	var office = flow.current
	_set_over(g, true)
	g.day_advanced.emit()
	g.game_over.emit()
	eq(office.news_calls, 1, "day_advanced and game_over together show the news exactly once")
	eq(flow.current_id, &"office", "still in the office until the news closes")
	office.news_closed.emit()
	eq(flow.current_id, &"endgame", "then the endgame")
	_teardown(main, g)


func test_game_over_without_room() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(3)
	flow.current = null
	_set_over(g, true)
	g.game_over.emit()
	eq(flow.current_id, &"endgame", "with no room in front, game over goes straight to the endgame")
	_teardown(main, g)


func test_office_redirects_when_over() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(3)
	_set_over(g, true)
	flow.go(&"office")
	eq(flow.current_id, &"endgame", "entering the office while the year is over goes to the endgame")
	eq(flow._end_pending, false, "no news is pending after the redirect")
	_teardown(main, g)


func test_continue_finished_save_goes_to_endgame() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(4)
	_set_over(g, true)
	g.save_now()
	flow.to_title()
	g.state = {}
	ok(flow.continue_game(), "continue returns true when a save exists")
	eq(flow.current_id, &"endgame", "continuing a finished save goes to the endgame")
	_teardown(main, g)


func test_settings_apply_to_room_and_sound() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	var sfx = tree().root.get_node("Sfx")
	flow.new_game(3)
	var office = flow.current
	g.settings["crt"] = true
	flow.apply_settings()
	eq(office.crt_calls.back(), true, "CRT on reaches the room in front")
	g.settings["sound"] = false
	flow.apply_settings()
	eq(sfx.muted, true, "sound off mutes the Sfx autoload")
	flow.go(&"office")
	eq(flow.current.crt_calls, [true], "a new office gets the CRT choice when it is shown")
	sfx.set_muted(false)
	_teardown(main, g)


func test_settings_overlay_change_reapplies() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	var sfx = tree().root.get_node("Sfx")
	flow.room_paths[&"settings"] = SETTINGS
	flow.new_game(3)
	var office = flow.current
	g.settings["crt"] = true
	flow.apply_settings()
	ok(flow.open_overlay(&"settings", {}), "the settings overlay opens")
	flow.overlay._ready()
	g.settings["crt"] = false
	flow.overlay.toggle("music")
	eq(office.crt_calls.back(), false, "a setting change from the overlay re-applies the CRT choice")
	flow.overlay.toggle("crt")
	eq(g.settings["crt"], true, "the CRT row turns it back on")
	eq(office.crt_calls.back(), true, "and the TV gets it")
	flow.close_overlay()
	sfx.set_muted(false)
	_teardown(main, g)
