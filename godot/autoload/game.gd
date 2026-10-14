extends Node

# Game singleton (port of src/game.js createGame): owns state, starts / continues / erases games,
# saves after each successful action and dispatches action NAMES to the sim ports.
# Scenes only read Game.state and call Game.act.

signal changed
signal toast_requested(text: String)
signal day_advanced
signal game_over

# entry = [script path, function name, [param keys in call order]]
const ACTION_TABLE: Dictionary = {
	"buy_car": ["res://sim/actions.gd", "buy_car", ["listing_id"]],
	"rent_car": ["res://sim/actions.gd", "rent_car", ["listing_id"]],
	"return_rental": ["res://sim/actions.gd", "return_rental", ["car_id"]],
	"sell_to_dealer": ["res://sim/actions.gd", "sell_to_dealer", ["car_id"]],
	"buy_slot": ["res://sim/actions.gd", "buy_slot", []],
	"wait_day": ["res://sim/actions.gd", "wait_day", []],
	"service_car": ["res://sim/garage.gd", "service_car", ["car_id", "kind"]],
	"fix_fault": ["res://sim/garage.gd", "fix_fault", ["car_id"]],
	"restore_car": ["res://sim/garage.gd", "restore_car", ["car_id"]],
	"accept_job": ["res://sim/jobresolve.gd", "accept_job", ["request_id", "car_id"]],
	"advertise": ["res://sim/adsim.gd", "advertise", ["media_id"]],
	"reveal_stat": ["res://sim/auction.gd", "reveal_stat", ["lot_id", "stat"]],
	"consign_car": ["res://sim/auction.gd", "consign_car", ["car_id", "reserve"]],
	"unconsign": ["res://sim/auction.gd", "unconsign", ["car_id"]],
	"place_bid": ["res://sim/auction.gd", "place_bid", ["lot_id", "steps"]],
	"attend_auction": ["res://sim/auction.gd", "attend_auction", []],
}

var state: Dictionary = {}
# When false, successful actions and new games do not write the save file (tests turn it off).
var autosave: bool = true
var settings: Dictionary = CoreSave.default_settings()
var save_path: String = CoreSave.SAVE_PATH
var settings_path: String = CoreSave.SETTINGS_PATH

var _actions: Dictionary = ACTION_TABLE.duplicate(true)


func _ready() -> void:
	load_settings()


# Adds or replaces one action in the table. Later cards register their actions this way.
func register_action(action: String, script_path: String, func_name: String, param_keys: Array) -> void:
	_actions[action] = [script_path, func_name, param_keys.duplicate()]


func has_action(action: String) -> bool:
	return _actions.has(action)


# Runs one sim action by name. Returns the sim's result untouched (a Variant: a result without an
# ok field passes straight through). A success saves (when autosave), emits changed, emits
# day_advanced only when the day moved, and game_over when the year has ended. A refusal with
# text becomes a toast. Once the year is over nothing runs and nothing is toasted.
func act(action: String, params: Dictionary = {}) -> Variant:
	if state.is_empty():
		return {"ok": false, "msg": "No game running"}
	var flags_now: Dictionary = state.get("flags", {})
	if flags_now.get("gameOver") == true:
		return {"ok": false, "msg": "The year is over"}
	if not _actions.has(action):
		return {"ok": false, "msg": "Unknown action: " + action}
	var entry: Array = _actions[action]
	var path: String = entry[0]
	if not ResourceLoader.exists(path):
		return {"ok": false, "msg": "Action not built yet: " + action}
	var args: Array = []
	for key in entry[2]:
		if not params.has(key):
			return {"ok": false, "msg": "Missing parameter: " + str(key)}
		args.append(params[key])
	var day_before: int = int(state.get("day", 0))
	var r: Variant = load(path).callv(entry[1], [state] + args)
	if r is Dictionary:
		var rd: Dictionary = r
		if rd.get("ok") == true:
			if autosave:
				save_now()
			changed.emit()
			_play_cash()
			if int(state.get("day", 0)) != day_before:
				day_advanced.emit()
			var flags: Dictionary = state.get("flags", {})
			if flags.get("gameOver") == true:
				game_over.emit()
		elif rd.get("ok") == false and str(rd.get("msg", "")) != "":
			toast_requested.emit(str(rd["msg"]))
	return r


# Starts a new game (seed -1 picks one from the clock) and saves it when autosave is on.
func new_game(seed_value: int = -1) -> void:
	var seed_used: int = seed_value
	if seed_used == -1:
		seed_used = int(Time.get_unix_time_from_system()) + 1
	state = SimNewGame.start_game(seed_used)
	if autosave:
		save_now()
	changed.emit()


func continue_game() -> bool:
	var loaded: Variant = CoreSave.load_from(save_path)
	if loaded == null:
		toast_requested.emit("No saved game")
		return false
	state = loaded
	changed.emit()
	return true


func has_save() -> bool:
	return CoreSave.has_save(save_path)


func erase_save() -> bool:
	return CoreSave.clear_save(save_path)


func save_now() -> bool:
	return CoreSave.save_to(state, save_path)


func load_settings() -> void:
	settings = CoreSave.load_settings(settings_path)


func save_settings() -> bool:
	return CoreSave.save_settings(settings, settings_path)


# The cash sound, when the Sfx autoload is in the tree.
func _play_cash() -> void:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return
	var sfx: Node = tree.root.get_node_or_null("Sfx")
	if sfx != null and sfx.has_method("play"):
		sfx.call("play", "cash")
