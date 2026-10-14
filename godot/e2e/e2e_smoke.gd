extends "res://tests/harness.gd"

# End-to-end smoke test (GDR16): the real Main, Flow, rooms, TV, Game autoload and sim, played headless.
# Boot, NEW GAME, ten kettle days, garage, settings overlay, auction day, CONTINUE from the title, a forced
# game over that redirects to the endgame, and PLAY AGAIN. Steps run in order from one test method, because
# the runner sorts test_* names and each step depends on the one before. Taps go through TapUtil.
# Main's _ready is called by hand only when the runner has not fired it (add_child does not, under the runner).

const SAVE := "user://e2e_save.json"
const SETTINGS := "user://e2e_settings.json"

var _game
var _main
var _flow


func _rm(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func test_e2e_smoke() -> void:
	if not _boot():
		return
	_step_boot_and_new_game()
	_step_ten_days()
	_step_garage_and_settings()
	_step_auction_day()
	_step_continue()
	_step_game_over_redirect()
	_finish()


# Points the real Game autoload at temp files, starts from an empty save and builds Main with the Flow.
func _boot() -> bool:
	_game = tree().root.get_node_or_null("Game")
	if _game == null:
		fail("the Game autoload is missing")
		return false
	_game.save_path = SAVE
	_game.settings_path = SETTINGS
	_game.erase_save()
	_rm(SETTINGS)
	_main = load("res://scenes/main.tscn").instantiate()
	_main.auto_start = false
	tree().root.add_child(_main)
	if not _main.is_node_ready():
		_main._ready()
	_flow = _main.flow
	if _flow == null:
		fail("Main made no Flow")
		return false
	ok(_flow.go(&"loading"), "the loading room opens")
	ok(_flow.go(&"title"), "the title room opens")
	eq(_flow.current_id, &"title", "boot ends on the title")
	ok(not _game.has_save(), "no save before NEW GAME")
	var room = _flow.current
	eq(room.hotspots[&"continue"].enabled, false, "CONTINUE is greyed out with no save")
	return true


func _step_boot_and_new_game() -> void:
	var room = _flow.current
	TapUtil.tap(room.hotspots[&"new_game"])
	eq(_flow.current_id, &"office", "NEW GAME enters the office")
	eq(_game.state.day, 1, "a new game starts on day 1")
	eq(_game.state.cash, 20000, "a new game starts with 20000 cash")
	ok(_game.has_save(), "NEW GAME saves")
	ok(_main.get_node("Stage/Hud").visible, "the HUD shows in the office")


func _step_ten_days() -> void:
	for i in range(10):
		var before: int = _game.state.day
		TapUtil.tap(_flow.current.hotspots[&"kettle"])
		eq(_game.state.day, before + 1, "kettle press %d moves the day on" % (i + 1))
	eq(_game.state.day, 11, "after ten kettle presses it is day 11")
	eq(_main.scenes().depth(), 1, "still one room on the stack")
	ok(_main.get_node("Stage/Banner").full_text != "", "the banner has Dave's line")


func _step_garage_and_settings() -> void:
	_flow.go(&"garage")
	eq(_flow.current_id, &"garage", "the garage opens")
	TapUtil.tap(_flow.current.hotspots[&"back"])
	eq(_flow.current_id, &"office", "garage BACK returns to the office")
	ok(_flow.open_overlay(&"settings"), "the settings overlay opens")
	eq(_flow.overlay_id, &"settings", "overlay_id is settings")
	TapUtil.tap(_flow.overlay.hotspots[&"crt"])
	eq(_game.settings.get("crt", false), true, "CRT FILTER on")
	TapUtil.tap(_flow.overlay.hotspots[&"crt"])
	eq(_game.settings.get("crt", false), false, "CRT FILTER off again")
	TapUtil.tap(_flow.overlay.hotspots[&"back"])
	eq(_flow.overlay_id, &"", "settings BACK closes the overlay")


func _step_auction_day() -> void:
	_game.state.day = 24
	_game.changed.emit()
	_flow.go(&"office")
	var room = _flow.current
	ok(room.hotspots[&"poster"].glow, "the poster glows on auction day")
	TapUtil.tap(room.hotspots[&"poster"])
	eq(_flow.current_id, &"auction", "the poster opens the auction")
	var lot_no: String = _flow.current.get_node("Ui/LotNo").text
	ok(lot_no.begins_with("LOT 1/"), "the auction shows LOT 1, got '" + lot_no + "'")
	TapUtil.tap(_flow.current.hotspots[&"back"])
	eq(_flow.current_id, &"office", "auction BACK returns to the office")


func _step_continue() -> void:
	var saved: Variant = CoreSave.load_from(SAVE)
	ok(saved is Dictionary, "the save file reads back")
	var saved_day := int((saved as Dictionary).get("day", -1))
	_flow.go(&"title")
	var room = _flow.current
	ok(room.hotspots[&"continue"].enabled, "CONTINUE is enabled once a save exists")
	TapUtil.tap(room.hotspots[&"continue"])
	eq(_flow.current_id, &"office", "CONTINUE enters the office")
	eq(_game.state.day, saved_day, "CONTINUE restores the saved day")


func _step_game_over_redirect() -> void:
	_game.state.flags = {"gameOver": true, "won": false, "reason": "year-end"}
	_game.game_over.emit()
	if _flow.current_id == &"office":
		# The real TV needs frames to close its channel, so the news close is sent by hand.
		_flow.current.news_closed.emit()
	eq(_flow.current_id, &"endgame", "game over goes to the endgame")
	var heading: String = _flow.current.get_node("Ui/Heading").text
	eq(heading, EndgameRoom.heading_for(_game.state.flags), "the endgame heading matches the reason")
	_flow.go(&"office")
	eq(_flow.current_id, &"endgame", "going to the office after game over still ends in the endgame")
	TapUtil.tap(_flow.current.hotspots[&"again"])
	eq(_flow.current_id, &"office", "PLAY AGAIN enters the office")
	eq(_game.state.day, 1, "PLAY AGAIN starts day 1")
	ok(not bool(_game.state.flags.get("gameOver", false)), "PLAY AGAIN clears gameOver")
	_flow.to_title()
	eq(_flow.current_id, &"title", "to_title goes to the title")


func _finish() -> void:
	if _main != null:
		if _main.is_inside_tree():
			tree().root.remove_child(_main)
		_main.free()
	_game.erase_save()
	_rm(SETTINGS)
	_game.save_path = CoreSave.SAVE_PATH
	_game.settings_path = CoreSave.SETTINGS_PATH
	_game.state = {}
	_game.settings = CoreSave.default_settings()
