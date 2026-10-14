extends "res://tests/harness.gd"

# Tests for the channel contract (tv/channel_base.gd), the channel manager (tv/channel_manager.gd) and the
# Tv wiring (tv/tv.gd). _ready does not fire under the runner, so the Tv and remote tests call it by hand.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _host() -> Control:
	var host := Control.new()
	var black := ColorRect.new()
	black.color = Color.BLACK
	host.add_child(black)
	return host


func _three() -> Array:
	return [
		{"id": "a", "title": "A", "scene": "res://nope_a.tscn"},
		{"id": "b", "title": "B", "scene": "res://nope_b.tscn"},
		{"id": "c", "title": "C", "scene": "res://nope_c.tscn"},
	]


func test_base_contract() -> void:
	var c := ChannelBase.new()
	eq(c.size, Vector2(640, 448), "channel size")
	eq(c.on_back(), false, "on_back is false by default")
	var g := TestFakeGame.new()
	c.toast("x")
	eq(g.toasts, [], "toast before enter does nothing")
	c.enter(g)
	ok(c.game == g, "enter stores the game")
	ok(g.changed.is_connected(c._on_game_changed), "enter connects changed")
	c.toast("x")
	eq(g.toasts, ["x"], "toast after enter reaches the game")
	c.leave()
	ok(c.game == null, "leave clears the game")
	ok(not g.changed.is_connected(c._on_game_changed), "leave disconnects changed")
	c.free()


func test_state_helper() -> void:
	var c := ChannelBase.new()
	var g := TestFakeGame.new()
	eq(c.state(), {}, "state is empty before enter")
	c.enter(g)
	eq(c.state().get("day", 0), 12, "state reads the game state")
	c.leave()
	c.free()


func test_model_helpers() -> void:
	eq(ChannelBase.model_of("t1_allergy").get("name", ""), "Austen Allergy", "model name")
	eq(ChannelBase.model_of("zzz"), {}, "unknown model is empty")
	eq(ChannelBase.paint_of("t1_robbin"), Color("#C9A227"), "paint colour")
	eq(ChannelBase.job_name("wedding"), "Wedding", "job name")
	eq(ChannelBase.job_name("zzz"), "ZZZ", "unknown job name falls back to the id")


func test_manager_basic() -> void:
	var host := _host()
	var m := ChannelManager.new()
	m.channels = _three()
	m.setup(host, TestFakeGame.new(), null)
	var got: Array[String] = []
	m.tuned.connect(func(id: String, _t: String, _i: int): got.append(id))
	var exits := [0]
	m.exit_requested.connect(func(): exits[0] += 1)

	ok(m.tune("a"), "tune a is true")
	eq(m.current_id(), "a", "current is a")
	eq(host.get_child_count(), 2, "black background plus one channel")
	ok(m.current().placeholder, "unknown scene gives a placeholder")
	eq(m.current().title, "A", "placeholder takes the entry title")

	m.step(1)
	eq(m.current_id(), "b", "step +1 to b")
	m.step(1)
	eq(m.current_id(), "c", "step +1 to c")
	m.step(1)
	eq(m.current_id(), "a", "step +1 wraps to a")
	m.step(-1)
	eq(m.current_id(), "c", "step -1 wraps to c")
	ok(not m.tune("zzz"), "unknown id is false")
	eq(got, ["a", "b", "c", "a", "c"], "tuned ids in order")
	eq(host.get_child_count(), 2, "old channels are queued for deletion, host keeps two children")

	ok(not m.back(), "back on a plain channel returns false")
	eq(exits[0], 1, "back emits exit_requested once")

	var fresh := ChannelManager.new()
	fresh.channels = _three()
	var host2 := _host()
	fresh.setup(host2, TestFakeGame.new(), null)
	fresh.step(-1)
	eq(fresh.current_id(), "c", "first step -1 tunes the last channel")
	fresh.stop()
	fresh.free()
	host2.free()

	m.free()
	host.free()


func test_manager_static() -> void:
	var host := _host()
	var fx := TvStatic.new()
	var m := ChannelManager.new()
	m.channels = _three()
	m.setup(host, TestFakeGame.new(), fx)

	ok(m.tune("a"), "tune a")
	eq(m.current_id(), "a", "first channel is immediate")
	ok(not fx.is_playing(), "no static for the first channel")

	m.tune("b")
	eq(m.current_id(), "a", "still a while the static starts")
	ok(fx.is_playing(), "static is playing")
	fx.advance(0.1)
	eq(m.current_id(), "a", "still a at 0.1 s")
	fx.advance(0.15)
	eq(m.current_id(), "b", "b once the midpoint (0.2 s) has passed")
	ok(fx.is_playing(), "static still playing in its second half")

	m.tune("c")
	eq(m.current_id(), "b", "tune c in the second half waits")
	fx.advance(1.0)
	ok(fx.is_playing(), "the first transition ends and a new one starts")
	eq(m.current_id(), "b", "still b while the new static starts")
	fx.advance(0.25)
	eq(m.current_id(), "c", "c once the second transition reaches its midpoint")

	fx.advance(1.0)
	ok(not fx.is_playing(), "static finished")
	m.free()
	host.free()
	fx.free()


func test_default_registry() -> void:
	var ids: Array[String] = []
	for e in ChannelManager.DEFAULTS:
		ids.append(str(e.get("id", "")))
	eq(ids, ["shop", "news", "adverts", "ledger", "bookings"], "default channel ids in order")
	var m := ChannelManager.new()
	eq(m.index_of("ledger"), 3, "ledger index")
	eq(m.index_of("zzz"), -1, "unknown index")
	m.free()


func test_tv_wiring() -> void:
	var tv := (load("res://tv/tv.tscn") as PackedScene).instantiate() as Tv
	tree().root.add_child(tv)
	tv.call("_ready")
	var remote_node := tv.get_node("Remote") as TvRemote
	remote_node.call("_ready")
	tv.setup(TestFakeGame.new())
	var fx_node := tv.get_node("Viewport/Static")

	var closed_count := [0]
	tv.closed.connect(func(): closed_count[0] += 1)

	ok(tv.tune("news"), "tune news is true")
	eq(tv.channels.current_id(), "news", "manager on news")
	ok(tv.get_node_or_null("Viewport/Static") != null, "Static exists in the viewport")
	var vp := tv.get_node("Viewport")
	var osd := vp.get_node("Osd") as Label
	eq(osd.text, "CH 2  NEWS", "OSD names the channel and its number")
	ok(osd.visible, "OSD is shown after a tune")
	# Static is on top of the channels; the OSD sits just above it.
	eq(vp.get_child(vp.get_child_count() - 2), fx_node, "Static is the child before the OSD")
	tv.call("_process", 1.0)
	ok(osd.visible, "OSD still shown after 1 s")
	tv.call("_process", 1.5)
	ok(not osd.visible, "OSD hidden after 2.5 s")

	var next_btn := remote_node.get_node("ChNext") as UiButton
	next_btn.handle_event(_mb(Vector2(10, 10), true))
	next_btn.handle_event(_mb(Vector2(10, 10), false))
	tv.static_fx.advance(1.0)
	eq(tv.channels.current_id(), "adverts", "ChNext moves to adverts")

	var back_btn := remote_node.get_node("Back") as UiButton
	back_btn.handle_event(_mb(Vector2(10, 10), true))
	back_btn.handle_event(_mb(Vector2(10, 10), false))
	eq(closed_count[0], 1, "Back makes the Tv emit closed once")
	tv.free()
