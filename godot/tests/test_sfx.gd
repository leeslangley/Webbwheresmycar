extends "res://tests/harness.gd"

# Tests for godot/autoload/sfx.gd (the port of src/audio/sfx.js SOUNDS and sound building).

const NAMES := ["bid", "cash", "chime", "click", "crash", "door", "engine", "fail", "fanfare", "horn", "paper", "ring", "steam", "tada", "thud"]


# Untyped on purpose: sound_names() and friends are not Node methods.
func _make():
	return load("res://autoload/sfx.gd").new()


func _has_nonzero(bytes: PackedByteArray) -> bool:
	for b in bytes:
		if b != 0:
			return true
	return false


func test_names() -> void:
	var s = _make()
	var names: Array = s.sound_names()
	names.sort()
	eq(names, NAMES, "sound names")
	s.free()


func test_durations() -> void:
	var s = _make()
	near(s.duration_of("click"), 0.04, 1e-9, "click duration")
	near(s.duration_of("cash"), 0.12, 1e-9, "cash duration")
	near(s.duration_of("fail"), 0.36, 1e-9, "fail duration")
	near(s.duration_of("fanfare"), 0.5, 1e-9, "fanfare duration")
	near(s.duration_of("ring"), 0.9, 1e-9, "ring duration")
	near(s.duration_of("tada"), 0.4, 1e-9, "tada duration")
	near(s.duration_of("crash"), 0.3, 1e-9, "crash duration")
	near(s.duration_of("paper"), 0.12, 1e-9, "paper duration")
	near(s.duration_of("bid"), 0.08, 1e-9, "bid duration")
	near(s.duration_of("engine"), 0.6, 1e-9, "engine duration")
	near(s.duration_of("horn"), 0.35, 1e-9, "horn duration")
	near(s.duration_of("steam"), 0.5, 1e-9, "steam duration")
	near(s.duration_of("door"), 0.18, 1e-9, "door duration")
	near(s.duration_of("chime"), 0.49, 1e-9, "chime duration")
	near(s.duration_of("thud"), 0.2, 1e-9, "thud duration")
	near(s.duration_of("nope"), 0.0, 1e-9, "unknown duration")
	s.free()


func test_streams() -> void:
	var s = _make()
	for n in NAMES:
		var st: AudioStreamWAV = s.build_stream(n)
		ok(st != null, n + " builds a stream")
		if st == null:
			continue
		eq(st.format, AudioStreamWAV.FORMAT_16_BITS, n + " format")
		eq(st.mix_rate, 22050, n + " mix rate")
		eq(st.data.size(), 2 * int(ceil(s.duration_of(n) * 22050.0)), n + " data size")
		ok(_has_nonzero(st.data), n + " is not silent")

	var click = s.build_stream("click")
	var peak: float = 0.0
	for i in range(0, click.data.size(), 2):
		peak = maxf(peak, absf(float(click.data.decode_s16(i))))
	ok(peak <= 0.2 * 32767.0 + 1.0, "click peak not above its volume")
	ok(peak >= 3000.0, "click peak is audible")

	var thud = s.build_stream("thud")
	var thud_peak: float = 0.0
	for i in range(0, thud.data.size(), 2):
		thud_peak = maxf(thud_peak, absf(float(thud.data.decode_s16(i))))
	ok(thud_peak >= 3000.0, "thud peak is audible")
	ok(thud_peak <= 0.5 * 32767.0 + 1.0, "thud peak not above its volume")

	ok(s.build_stream("nope") == null, "unknown name gives null")
	s.free()


func test_deterministic() -> void:
	var s = _make()
	var a = s.build_stream("crash")
	var b = s.build_stream("crash")
	eq(a.data, b.data, "two crash builds are identical")
	s.free()


func test_mute() -> void:
	# Nodes added to the root during runner _initialize never enter the tree, so play() can only be
	# checked false here; the in-tree mute guard is not exercised by this headless runner.
	var s = _make()
	s.set_muted(true)
	eq(s.play("click"), false, "muted play is false")
	s.set_muted(false)
	eq(s.play("nope"), false, "unknown name is false")
	eq(s.play("click"), false, "outside the scene tree is false")
	s.free()


func test_pool() -> void:
	var s = _make()
	s._ensure_players()
	eq(s._players.size(), 4, "pool has four players")
	eq(s.get_child_count(), 4, "pool players are children")
	s._ensure_players()
	eq(s._players.size(), 4, "second ensure keeps four players")
	eq(s.get_child_count(), 4, "second ensure adds no children")
	eq(s._pick_player(), s._players[0], "first idle player is picked when none is playing")
	s.free()


func test_settings() -> void:
	# A stand-in Game autoload cannot be added to the tree from this runner, so only the rules that
	# hold outside the tree are checked: play() is false there, with or without a pitch.
	var s = _make()
	eq(s.play("click"), false, "click outside the tree is false")
	eq(s.play("click", 1.5), false, "click with pitch outside the tree is false")
	eq(s.play("nope"), false, "unknown name with pitch default is false")
	s.free()


func test_duck_flag() -> void:
	var s = _make()
	eq(s.music_ducked, false, "duck starts off")
	s.set_music_duck(true)
	eq(s.music_ducked, true, "set_music_duck(true) sets the flag")
	s.free()
