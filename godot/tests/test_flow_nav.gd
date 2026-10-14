extends "res://tests/harness.gd"

# Flow navigation: room swaps, chrome visibility, signal wiring and the single overlay.
# The runner does not fire _ready on add_child, so Main's _ready is called by hand (as in test_main).

const FAKE := "res://tests/fake_room.tscn"


func _main() -> Node:
	var main = load("res://scenes/main.tscn").instantiate()
	main.auto_start = false
	tree().root.add_child(main)
	main._ready()
	var flow: Flow = main.flow
	flow.room_paths = {&"a": FAKE, &"b": FAKE, &"office": FAKE, &"settings": FAKE, &"title": FAKE}
	return main


func _drop(main: Node) -> void:
	tree().root.remove_child(main)
	main.free()


func test_transition_table() -> void:
	eq(Flow.transition_for(&"", &"title"), "", "the first room has no transition")
	eq(Flow.transition_for(&"office", &"garage"), "slide-left", "office to garage")
	eq(Flow.transition_for(&"garage", &"office"), "slide-right", "garage to office")
	eq(Flow.transition_for(&"office", &"auction"), "iris", "office to auction")
	eq(Flow.transition_for(&"auction", &"office"), "iris", "auction to office")
	eq(Flow.transition_for(&"title", &"office"), "fade", "title to office")
	eq(Flow.transition_for(&"garage", &"title"), "fade", "garage to title")
	eq(Flow.transition_for(&"office", &"endgame"), "pageturn", "anything to endgame is a page turn")
	eq(Flow.transition_for(&"auction", &"endgame"), "pageturn", "auction to endgame is a page turn")


func test_navigation() -> void:
	var main = _main()
	var flow: Flow = main.flow
	ok(flow.go(&"a", {"x": 1}), "go to a returns true")
	eq(flow.current_id, &"a", "current_id is a")
	eq(main.scenes().depth(), 1, "one room on the stack")
	var first = flow.current
	eq(first.entered_with, {"x": 1}, "enter got the params")
	ok(main.scenes().current() == first, "SceneHost shows the flow's current room")
	flow.go(&"b")
	ok(first.left, "the old room got exit()")
	eq(main.scenes().depth(), 1, "still one room after the swap")
	eq(flow.current_id, &"b", "current_id is b")
	ok(not flow.go(&"nope"), "an unknown room returns false")
	eq(flow.current_id, &"b", "an unknown room leaves the current room alone")
	_drop(main)


func test_chrome() -> void:
	var main = _main()
	var flow: Flow = main.flow
	flow.go(&"office")
	ok(main.get_node("Stage/Hud").visible, "HUD shown in the office")
	ok(main.get_node("Stage/Banner").visible, "banner shown in the office")
	flow.go(&"a")
	ok(not main.get_node("Stage/Hud").visible, "HUD hidden in a plain room")
	ok(not main.get_node("Stage/Banner").visible, "banner hidden in a plain room")
	_drop(main)


func test_wiring() -> void:
	var main = _main()
	var flow: Flow = main.flow
	flow.go(&"a")
	var room = flow.current
	room.request_scene.emit(&"b", {})
	eq(flow.current_id, &"b", "request_scene swaps the room")
	var room2 = flow.current
	room2.chatter.emit("hi")
	eq(main.get_node("Stage/Banner").full_text, "HI", "chatter goes to the banner")
	room2.toast.emit("T")
	eq(main.get_node("Stage/Toasts").texts(), ["T"], "toast goes to the toast layer")
	room2.finished.emit()
	eq(flow.current_id, &"title", "finished goes to the title room")
	_drop(main)


func test_overlay() -> void:
	var main = _main()
	var flow: Flow = main.flow
	flow.go(&"b")
	var room = flow.current
	var overlays: Node = main.get_node("Stage/Overlays")
	room.request_scene.emit(&"settings", {"overlay": true})
	eq(flow.overlay_id, &"settings", "an overlay request opens the overlay")
	eq(overlays.get_child_count(), 1, "one node in Stage/Overlays")
	ok(flow.current == room, "the room under the overlay is unchanged")
	eq(flow.current_id, &"b", "current_id unchanged under an overlay")
	var ov = flow.overlay
	ov.closed.emit()
	eq(overlays.get_child_count(), 0, "closed removes the overlay")
	eq(flow.overlay_id, &"", "overlay_id cleared")

	room.request_scene.emit(&"settings", {"overlay": true})
	flow.go(&"a")
	eq(flow.overlay_id, &"", "go closes an open overlay")
	eq(overlays.get_child_count(), 0, "go leaves no overlay node behind")
	_drop(main)


func test_scene_changed_and_order() -> void:
	var main = _main()
	var flow: Flow = main.flow
	var seen := []
	flow.scene_changed.connect(func(id: StringName) -> void: seen.append(id))
	flow.go(&"a")
	flow.go(&"office")
	eq(seen, ["a", "office"], "scene_changed fires with each room id")
	var stage: Node = main.get_node("Stage")
	ok(stage.get_node("Overlays").get_index() < stage.get_node("Toasts").get_index(), "Overlays sits below Toasts")
	_drop(main)
