extends "res://tests/harness.gd"

# StageFit: the strip sizes for a wide window, the safe rect, the four strips in a room's Background layer,
# and the Flow hook that fills them for an installed room. Tests run outside the tree, so _ready is called by hand.

const FAKE := "res://tests/fake_room.tscn"


func _drop(main: Node) -> void:
	tree().root.remove_child(main)
	main.free()


func test_strip_size() -> void:
	eq(StageFit.strip_size(Vector2(1280, 720)), Vector2.ZERO, "the stage size has no strips")
	eq(StageFit.strip_size(Vector2(1600, 720)), Vector2(160, 0), "a wide window gives 160 px each side")
	eq(StageFit.strip_size(Vector2(1568, 720)), Vector2(144, 0), "a 1568 wide window gives 144 px each side")
	eq(StageFit.strip_size(Vector2(1280, 960)), Vector2(0, 120), "a tall window gives 120 px above and below")
	eq(StageFit.strip_size(Vector2(1000, 500)), Vector2.ZERO, "a window smaller than the stage gives no strips")


func test_safe_rect() -> void:
	eq(StageFit.safe_rect({"left": 40.0, "right": 40.0, "top": 40.0, "bottom": 40.0}), Rect2(40, 40, 1200, 640), "insets shrink the stage on all sides")
	eq(StageFit.safe_rect({"left": 0.0, "right": 0.0, "top": 0.0, "bottom": 0.0}), Rect2(0, 0, 1280, 720), "zero insets give the whole stage")


func test_add_strips() -> void:
	var r := RoomBase.new()
	r.build_layers()
	StageFit.add_strips(r, Color.RED)
	var bg := r.get_node("Background")
	var names := []
	for i in range(4):
		names.append(bg.get_child(i).name)
	eq(names, ["StripL", "StripR", "StripT", "StripB"], "the four strips are the first four children")
	for i in range(4):
		var box := bg.get_child(i) as ColorRect
		eq(box.color, Color.RED, "strip colour is the colour passed in")
		eq(box.mouse_filter, Control.MOUSE_FILTER_IGNORE, "strips ignore the mouse")
	eq((bg.get_node("StripR") as Control).position, Vector2(1280, 0), "the right strip starts at the stage edge")
	eq(bg.get_child_count(), 6, "the Plate and the placeholder remain")
	StageFit.add_strips(r, Color.RED)
	eq(bg.get_child_count(), 6, "a second call adds nothing")
	eq(bg.get_child(4).name, "Plate", "the Plate sprite is child index 4")
	r.free()


func test_flow_installs_strips() -> void:
	var main = load("res://scenes/main.tscn").instantiate()
	main.auto_start = false
	tree().root.add_child(main)
	main._ready()
	var flow: Flow = main.flow
	flow.room_paths = {&"a": FAKE}
	ok(flow.go(&"a"), "go to a returns true")
	var room = flow.current
	ok(room.get_node_or_null("Background/StripL") != null, "the flow adds the strips to an installed room")
	eq((room.get_node("Background/StripL") as ColorRect).color, Color("14102A"), "the strips use the room's strip_color")
	eq(room.strip_color, Color("14102A"), "the default strip colour")
	var safe: Dictionary = flow.stage_safe()
	ok(safe.has("left") and safe.has("right") and safe.has("top") and safe.has("bottom"), "stage_safe has the four inset keys")
	_drop(main)
