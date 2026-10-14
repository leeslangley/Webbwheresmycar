class_name Flow
extends Node

# Game flow controller, a child of Main. go() swaps the current room inside the SceneHost, through the
# Transitions node when there is one. open_overlay() shows one overlay room (for example settings) over
# the current room. Room signals are wired here: request_scene, chatter, toast, closed, finished.

signal scene_changed(id: StringName)

const ROOM_PATHS := {
	&"loading": "res://scenes/loading.tscn",
	&"title": "res://scenes/title.tscn",
	&"office": "res://scenes/office.tscn",
	&"garage": "res://scenes/garage.tscn",
	&"auction": "res://scenes/auction.tscn",
	&"endgame": "res://scenes/endgame.tscn",
	&"settings": "res://scenes/settings.tscn",
}
const CHROME_ROOMS := [&"office", &"garage", &"auction"]
const TRANSITION_TABLE := {
	"office>garage": "slide-left",
	"garage>office": "slide-right",
	"office>auction": "iris",
	"auction>office": "iris",
}

var room_paths: Dictionary = ROOM_PATHS.duplicate()
var auto_start := true
var main: Main = null
var host = null
var game = null
var current_id: StringName = &""
var current: Node = null
var overlay_id: StringName = &""
var overlay: Node = null
var transitions: Node = null


# Transition kind for a move between two rooms. "" for the first room (no transition).
static func transition_for(from_id: StringName, to_id: StringName) -> String:
	if from_id == &"":
		return ""
	var key := String(from_id) + ">" + String(to_id)
	if TRANSITION_TABLE.has(key):
		return TRANSITION_TABLE[key]
	if to_id == &"endgame":
		return "pageturn"
	return "fade"


func attach(main_node: Main) -> void:
	main = main_node
	host = main.scenes()
	var stage: Control = main.get_node("Stage")
	var overlays := Control.new()
	overlays.name = "Overlays"
	overlays.size = Vector2(1280, 720)
	overlays.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.add_child(overlays)
	stage.move_child(overlays, stage.get_node("Toasts").get_index())
	if ResourceLoader.exists("res://rooms/transitions.gd"):
		var script := load("res://rooms/transitions.gd") as GDScript
		transitions = script.new() as Node
		transitions.name = "Transitions"
		main.add_child(transitions)
	bind_game(_autoload_game())
	if auto_start:
		go(&"loading", {}, "")


# The Game autoload, looked up from the root with a relative name (absolute paths fail outside an active tree).
func _autoload_game() -> Node:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.root.get_node_or_null("Game")


func _exit_tree() -> void:
	_unbind_game()


func get_game() -> Object:
	if game != null:
		return game
	return get_node_or_null("/root/Game")


# Points the flow at a Game (the autoload, or a test instance). Disconnects the old one first.
func bind_game(g) -> void:
	_unbind_game()
	game = g
	if game == null:
		return
	if not game.is_connected("day_advanced", _on_day_advanced):
		game.connect("day_advanced", _on_day_advanced)
	if not game.is_connected("game_over", _on_game_over):
		game.connect("game_over", _on_game_over)


func _unbind_game() -> void:
	if game == null or not is_instance_valid(game):
		return
	if game.is_connected("day_advanced", _on_day_advanced):
		game.disconnect("day_advanced", _on_day_advanced)
	if game.is_connected("game_over", _on_game_over):
		game.disconnect("game_over", _on_game_over)


# NEW GAME: a fresh game through the Game (it saves and emits changed), then the office.
func new_game(seed_value: int = -1) -> void:
	get_game().new_game(seed_value)
	go(&"office", {}, "fade")


# CONTINUE: the Game toasts "No saved game" itself when there is nothing to load.
func continue_game() -> bool:
	if get_game().continue_game():
		go(&"office", {}, "fade")
		return true
	return false


func to_title() -> void:
	go(&"title", {}, "fade")


# Every day that passes: the room in front shows the news, when it can.
func _on_day_advanced() -> void:
	if current != null and current.has_method("show_news"):
		current.show_news()


# Empty for now; GDR31 fills it in (the game over redirect).
func _on_game_over() -> void:
	pass


func go(id: StringName, params: Dictionary = {}, kind := "default") -> bool:
	if not room_paths.has(id) or not ResourceLoader.exists(room_paths[id]):
		push_error("Flow.go: unknown room " + String(id))
		return false
	close_overlay()
	var k: String = transition_for(current_id, id) if kind == "default" else kind
	var swap := _install.bind(id, params)
	if transitions != null and transitions.has_method("play"):
		transitions.call("play", k, swap, host)
	else:
		swap.call()
	return true


func _install(id: StringName, params: Dictionary) -> void:
	var node: Node = (load(room_paths[id]) as PackedScene).instantiate()
	if game != null and "game" in node:
		node.set("game", game)
	_wire(node, false)
	host.go(node, params)
	current = node
	current_id = id
	main.show_hud(CHROME_ROOMS.has(id))
	(main.get_node("Stage/Banner") as CanvasItem).visible = CHROME_ROOMS.has(id)
	_after_install(node)
	scene_changed.emit(id)


# Fills the wide-screen strips around the stage for every room installed by go().
func _after_install(node: Node) -> void:
	var room := node as RoomBase
	if room != null:
		StageFit.add_strips(room, room.strip_color)


# The safe-area insets (left, right, top, bottom) that rooms may use to keep edge buttons clear of a notch.
func stage_safe() -> Dictionary:
	return main.stage_safe


func open_overlay(id: StringName, params: Dictionary = {}) -> bool:
	if not room_paths.has(id) or not ResourceLoader.exists(room_paths[id]):
		push_error("Flow.open_overlay: unknown room " + String(id))
		return false
	close_overlay()
	var node: Node = (load(room_paths[id]) as PackedScene).instantiate()
	if game != null and "game" in node:
		node.set("game", game)
	_wire(node, true)
	if node is Control:
		(node as Control).set_anchors_preset(Control.PRESET_FULL_RECT)
	main.get_node("Stage/Overlays").add_child(node)
	overlay = node
	overlay_id = id
	if node.has_method("enter"):
		node.call("enter", params)
	return true


func close_overlay() -> void:
	if overlay == null:
		return
	var ov := overlay
	overlay = null
	overlay_id = &""
	if ov.has_method("exit"):
		ov.call("exit")
	var parent := ov.get_parent()
	if parent != null:
		parent.remove_child(ov)
	ov.queue_free()


# Connects the room's signals to the flow. closed only matters for overlays.
func _wire(node: Node, is_overlay: bool) -> void:
	if node.has_signal("request_scene"):
		node.connect("request_scene", _on_request_scene)
	if node.has_signal("chatter"):
		node.connect("chatter", func(text: String) -> void: say(text))
	if node.has_signal("toast"):
		node.connect("toast", func(text: String) -> void: show_toast(text))
	if is_overlay and node.has_signal("closed"):
		node.connect("closed", func() -> void: close_overlay())
	if node.has_signal("finished"):
		node.connect("finished", func() -> void: go(&"title"))
	if node.has_signal("new_game"):
		node.connect("new_game", func() -> void: new_game())
	if node.has_signal("continue_game"):
		node.connect("continue_game", func() -> void: continue_game())
	if node.has_signal("open_settings"):
		node.connect("open_settings", func() -> void: open_overlay(&"settings", {}))
	if node.has_signal("play_again"):
		node.connect("play_again", func() -> void: new_game())
	if node.has_signal("to_title"):
		node.connect("to_title", func() -> void: to_title())


func _on_request_scene(scene_id: StringName, params: Dictionary) -> void:
	if bool(params.get("overlay", false)):
		open_overlay(scene_id, params)
	else:
		go(scene_id, params)


func say(text: String) -> void:
	main.say(text)


func show_toast(text: String) -> void:
	(main.get_node("Stage/Toasts") as UiToast).show_text(text)
