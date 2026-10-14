class_name TvRemote
extends Control

# The four big remote buttons on the TV control plate (CH-, CH+, OK, BACK), 96x64 each, plus the
# keyboard shortcuts for the same actions. Emits action(name) with one of ACTIONS. Tap rule: UiButton.

signal action(name: String)

const ACTIONS: Array[String] = ["ch_prev", "ch_next", "ok", "back"]
const LABELS: Array[String] = ["CH-", "CH+", "OK", "BACK"]
const NODE_NAMES: Array[String] = ["ChPrev", "ChNext", "Ok", "Back"]


func _init() -> void:
	size = Vector2(456, 64)
	mouse_filter = MOUSE_FILTER_PASS


func _ready() -> void:
	for i in range(ACTIONS.size()):
		var b := UiButton.new()
		b.name = NODE_NAMES[i]
		b.kind = "remote"
		b.text = LABELS[i]
		b.position = Vector2(i * 120, 0)
		b.size = Vector2(96, 64)
		var a: String = ACTIONS[i]
		b.activated.connect(func(): press_action(a))
		add_child(b)


func press_action(a: String) -> void:
	action.emit(a)


static func key_to_action(keycode: int) -> String:
	match keycode:
		KEY_LEFT:
			return "ch_prev"
		KEY_RIGHT:
			return "ch_next"
		KEY_ENTER, KEY_KP_ENTER, KEY_SPACE:
			return "ok"
		KEY_ESCAPE, KEY_BACKSPACE:
			return "back"
	return ""


func _unhandled_key_input(event: InputEvent) -> void:
	var k := event as InputEventKey
	if k == null or not k.pressed or k.echo:
		return
	var a: String = key_to_action(k.keycode)
	if a != "":
		press_action(a)
		get_viewport().set_input_as_handled()
