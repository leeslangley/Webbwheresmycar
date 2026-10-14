extends "res://tests/harness.gd"


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func test_intensity() -> void:
	near(TvStatic.intensity_at(0.0), 0.0, 1e-9, "start")
	near(TvStatic.intensity_at(0.25), 0.5, 1e-9, "quarter")
	near(TvStatic.intensity_at(0.5), 1.0, 1e-9, "middle")
	near(TvStatic.intensity_at(0.75), 0.5, 1e-9, "three quarters")
	near(TvStatic.intensity_at(1.0), 0.0, 1e-9, "end")
	near(TvStatic.intensity_at(2.0), 0.0, 1e-9, "past end")


func test_play() -> void:
	var s := TvStatic.new()
	var log: Array = []
	s.midpoint.connect(func() -> void: log.append("midpoint"))
	s.finished.connect(func() -> void: log.append("finished"))

	s.play(0.5)
	ok(s.is_playing(), "playing after play()")
	ok(s.visible, "visible after play()")
	eq(s.mouse_filter, Control.MOUSE_FILTER_STOP, "blocks taps while playing")

	s.advance(0.125)
	near(s.progress(), 0.25, 1e-9, "progress at quarter")
	eq(log, [], "nothing fired at quarter")

	s.advance(0.125)
	eq(log, ["midpoint"], "midpoint at half-way")

	s.advance(0.25)
	eq(log, ["midpoint", "finished"], "finished at end")
	ok(not s.is_playing(), "not playing after finish")
	ok(not s.visible, "hidden after finish")
	eq(s.mouse_filter, Control.MOUSE_FILTER_IGNORE, "taps pass through after finish")
	s.free()


func test_one_big_step() -> void:
	var s := TvStatic.new()
	var log: Array = []
	s.midpoint.connect(func() -> void: log.append("midpoint"))
	s.finished.connect(func() -> void: log.append("finished"))

	s.play(0.4)
	s.advance(5.0)
	eq(log, ["midpoint", "finished"], "one big step fires midpoint then finished once")
	s.free()


func test_idle() -> void:
	var s := TvStatic.new()
	var log: Array = []
	s.midpoint.connect(func() -> void: log.append("midpoint"))
	s.finished.connect(func() -> void: log.append("finished"))

	s.advance(1.0)
	eq(log, [], "idle advance emits nothing")
	s.free()


func test_shader() -> void:
	var sh := load("res://tv/static.gdshader") as Shader
	ok(sh != null, "shader loads")
	ok(sh.code.contains("uniform float intensity"), "shader has intensity uniform")
