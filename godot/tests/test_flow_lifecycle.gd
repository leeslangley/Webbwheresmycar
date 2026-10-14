extends "res://tests/harness.gd"

# Flow lifecycle: NEW GAME, CONTINUE, the news on every new day, and the title and endgame buttons.
# A real Game instance (not the autoload) saves to temp files; the rooms are FakeRooms.
# The runner does not fire _ready on add_child, so Main's _ready is called by hand (as in test_flow_nav).

const FAKE := "res://tests/fake_room.tscn"
const TMP_SAVE := "user://test_flow_save.json"
const TMP_SETTINGS := "user://test_flow_settings.json"

var _toasts: Array = []


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
	_toasts = []
	g.toast_requested.connect(func(t: String) -> void: _toasts.append(t))
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


func test_new_game() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(5)
	eq(g.state.seed, 5, "seed is 5")
	eq(g.state.day, 1, "day 1")
	eq(g.state.cash, 20000, "starting cash")
	ok(g.has_save(), "a new game is saved")
	eq(flow.current_id, &"office", "NEW GAME enters the office")
	_teardown(main, g)


func test_continue_without_save() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.to_title()
	eq(flow.current_id, &"title", "to_title goes to the title")
	ok(not flow.continue_game(), "no save: continue returns false")
	ok(_toasts.has("No saved game"), "the Game toasts No saved game")
	eq(flow.current_id, &"title", "still on the title with no save")
	_teardown(main, g)


func test_continue_with_save() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(9)
	g.state.cash = 777
	g.save_now()
	flow.to_title()
	g.state = {}
	ok(flow.continue_game(), "continue returns true when a save exists")
	eq(g.state.cash, 777, "the saved cash comes back")
	eq(flow.current_id, &"office", "CONTINUE enters the office")
	_teardown(main, g)


func test_news_on_each_day() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.new_game(5)
	var office = flow.current
	eq(office.news_calls, 0, "no news before a day passes")
	g.day_advanced.emit()
	eq(office.news_calls, 1, "a new day shows the news")
	_teardown(main, g)


func test_rebind_disconnects_old_game() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	var g2 = load("res://autoload/game.gd").new()
	flow.new_game(5)
	var office = flow.current
	flow.bind_game(g2)
	g.day_advanced.emit()
	eq(office.news_calls, 0, "the old game no longer shows news")
	g2.day_advanced.emit()
	eq(office.news_calls, 1, "the new game shows news")
	g2.free()
	_teardown(main, g)


func test_exit_disconnects() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	eq(g.get_signal_connection_list("day_advanced").size(), 1, "flow listens to day_advanced")
	# The runner's tree is not active here, so removing Main does not send the exit notification; call it directly.
	flow._exit_tree()
	eq(g.get_signal_connection_list("day_advanced").size(), 0, "leaving the tree disconnects day_advanced")
	eq(g.get_signal_connection_list("game_over").size(), 0, "leaving the tree disconnects game_over")
	tree().root.remove_child(main)
	main.free()
	g.erase_save()
	g.free()
	_rm(TMP_SAVE)
	_rm(TMP_SETTINGS)


func test_title_wiring() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.to_title()
	flow.current.new_game.emit()
	eq(g.state.cash, 20000, "the title's NEW GAME starts a game")
	eq(flow.current_id, &"office", "the title's NEW GAME enters the office")
	flow.to_title()
	flow.current.open_settings.emit()
	eq(flow.overlay_id, &"settings", "the title's SETTINGS opens the settings overlay")
	flow.close_overlay()
	flow.to_title()
	g.erase_save()
	_toasts = []
	flow.current.continue_game.emit()
	eq(flow.current_id, &"title", "the title's CONTINUE with no save stays on the title")
	ok(_toasts.has("No saved game"), "the title's CONTINUE toasts No saved game")
	_teardown(main, g)


func test_endgame_wiring() -> void:
	var s := _setup()
	var main = s[0]
	var g = s[1]
	var flow: Flow = main.flow
	flow.go(&"endgame")
	flow.current.to_title.emit()
	eq(flow.current_id, &"title", "TITLE on the endgame goes to the title")
	flow.go(&"endgame")
	flow.current.play_again.emit()
	eq(flow.current_id, &"office", "PLAY AGAIN enters the office")
	ok(g.has_save(), "PLAY AGAIN saves the new game")
	eq(g.state.cash, 20000, "PLAY AGAIN starts with the starting cash")
	_teardown(main, g)
