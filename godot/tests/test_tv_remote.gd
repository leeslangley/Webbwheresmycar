extends "res://tests/harness.gd"

# Tests for the TV remote buttons (tv/tv_remote.gd) and their wiring into the Tv node. _ready does not
# fire under the runner, so each test adds the node to the tree and calls _ready by hand.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _make_remote() -> TvRemote:
	var r := TvRemote.new()
	tree().root.add_child(r)
	r.call("_ready")
	return r


func test_keys() -> void:
	eq(TvRemote.key_to_action(KEY_LEFT), "ch_prev", "left arrow is ch_prev")
	eq(TvRemote.key_to_action(KEY_RIGHT), "ch_next", "right arrow is ch_next")
	eq(TvRemote.key_to_action(KEY_ENTER), "ok", "enter is ok")
	eq(TvRemote.key_to_action(KEY_KP_ENTER), "ok", "keypad enter is ok")
	eq(TvRemote.key_to_action(KEY_SPACE), "ok", "space is ok")
	eq(TvRemote.key_to_action(KEY_ESCAPE), "back", "escape is back")
	eq(TvRemote.key_to_action(KEY_BACKSPACE), "back", "backspace is back")
	eq(TvRemote.key_to_action(KEY_A), "", "other keys give nothing")


func test_buttons() -> void:
	var r := _make_remote()
	var got: Array[String] = []
	r.action.connect(func(a: String): got.append(a))
	var labels: Array[String] = ["CH-", "CH+", "OK", "BACK"]
	var names: Array[String] = ["ChPrev", "ChNext", "Ok", "Back"]
	for i in range(4):
		var b := r.get_node_or_null(names[i]) as UiButton
		ok(b != null, "button " + names[i] + " exists")
		if b == null:
			continue
		eq(b.size, Vector2(96, 64), names[i] + " size")
		ok(b.size.y >= 64.0, names[i] + " height is at least 64")
		eq(b.position.x, i * 120.0, names[i] + " x position")
		eq(b.text, labels[i], names[i] + " label")
		eq(b.kind, "remote", names[i] + " kind")
	var ok_btn := r.get_node("Ok") as UiButton
	ok_btn.handle_event(_mb(Vector2(10, 10), true))
	ok_btn.handle_event(_mb(Vector2(10, 10), false))
	eq(got, ["ok"], "tap on Ok emits ok")
	var back_btn := r.get_node("Back") as UiButton
	back_btn.handle_event(_mb(Vector2(10, 10), true))
	back_btn.handle_event(_mb(Vector2(10, 10), false))
	eq(got, ["ok", "back"], "tap on Back adds back")
	r.press_action("ch_next")
	eq(got, ["ok", "back", "ch_next"], "press_action emits its name")
	r.free()


func test_in_tv() -> void:
	var tv := (load("res://tv/tv.tscn") as PackedScene).instantiate() as Tv
	tree().root.add_child(tv)
	tv.call("_ready")
	var remote_node := tv.get_node_or_null("Remote") as TvRemote
	ok(remote_node != null, "Remote exists in Tv")
	if remote_node != null:
		# Tv._ready added the Remote, but its own _ready does not fire under the runner: call it by hand.
		remote_node.call("_ready")
		eq(remote_node.position, Vector2(152, 484), "Remote position in Tv")
		ok(remote_node.position.y + remote_node.size.y <= 560.0, "Remote fits inside the Tv height")
	var got: Array[String] = []
	tv.remote.connect(func(a: String): got.append(a))
	var next_btn := tv.get_node_or_null("Remote/ChNext") as UiButton
	ok(next_btn != null, "Remote/ChNext exists")
	if next_btn != null:
		next_btn.handle_event(_mb(Vector2(10, 10), true))
		next_btn.handle_event(_mb(Vector2(10, 10), false))
	eq(got, ["ch_next"], "tap on ChNext makes the Tv emit ch_next")
	tv.free()
