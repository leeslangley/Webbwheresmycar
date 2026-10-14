extends Control

# Generic screenshot scene for one TV channel. The scene sets meta "channel" (res:// path of the channel scene)
# and optionally meta "calls" (Array of [method_name, args_array]) run after enter(). Size 1280x720.

var _game: TestFakeGame


func _ready() -> void:
	size = Vector2(1280, 720)
	var bg := ColorRect.new()
	bg.color = Color("#14102A")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_game = TestFakeGame.new()
	var ps := load(str(get_meta("channel"))) as PackedScene
	var ch = ps.instantiate()
	ch.position = Vector2(320, 136)
	add_child(ch)
	ch.enter(_game)
	for c in get_meta("calls", []):
		ch.callv(c[0], c[1])
