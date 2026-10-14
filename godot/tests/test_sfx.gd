extends "res://tests/harness.gd"

# Tests for godot/autoload/sfx.gd (the port of src/audio/sfx.js SOUNDS and sound building).

const NAMES := ["bid", "cash", "click", "crash", "fail", "fanfare", "paper", "ring", "tada"]


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
