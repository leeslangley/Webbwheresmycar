extends Node

# Sfx singleton: the nine synthesised sounds of src/audio/sfx.js (its SOUNDS table is the spec).
# No audio files: build_stream() makes a 16-bit mono AudioStreamWAV from note events.

const RATE := 22050

# One note event per Dictionary: type (square|triangle|noise), freq, end_freq (equals freq unless
# the pitch, or for noise the lowpass cutoff, glides), start, dur (seconds), vol.
const SOUNDS: Dictionary = {
	"click": [
		{"type": "square", "freq": 880.0, "end_freq": 880.0, "start": 0.0, "dur": 0.04, "vol": 0.2},
	],
	"cash": [
		{"type": "square", "freq": 1200.0, "end_freq": 1200.0, "start": 0.0, "dur": 0.06, "vol": 0.2},
		{"type": "square", "freq": 1800.0, "end_freq": 1800.0, "start": 0.06, "dur": 0.06, "vol": 0.2},
	],
	"fail": [
		{"type": "triangle", "freq": 330.0, "end_freq": 330.0, "start": 0.0, "dur": 0.12, "vol": 0.3},
		{"type": "triangle", "freq": 262.0, "end_freq": 262.0, "start": 0.12, "dur": 0.12, "vol": 0.3},
		{"type": "triangle", "freq": 196.0, "end_freq": 196.0, "start": 0.24, "dur": 0.12, "vol": 0.3},
	],
	"fanfare": [
		{"type": "square", "freq": 262.0, "end_freq": 262.0, "start": 0.0, "dur": 0.1, "vol": 0.2},
		{"type": "square", "freq": 330.0, "end_freq": 330.0, "start": 0.1, "dur": 0.1, "vol": 0.2},
		{"type": "square", "freq": 392.0, "end_freq": 392.0, "start": 0.2, "dur": 0.1, "vol": 0.2},
		{"type": "square", "freq": 523.0, "end_freq": 523.0, "start": 0.3, "dur": 0.1, "vol": 0.2},
		{"type": "square", "freq": 659.0, "end_freq": 659.0, "start": 0.4, "dur": 0.1, "vol": 0.2},
	],
	"ring": [
		{"type": "square", "freq": 400.0, "end_freq": 400.0, "start": 0.0, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 450.0, "end_freq": 450.0, "start": 0.0, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 400.0, "end_freq": 400.0, "start": 0.25, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 450.0, "end_freq": 450.0, "start": 0.25, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 400.0, "end_freq": 400.0, "start": 0.5, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 450.0, "end_freq": 450.0, "start": 0.5, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 400.0, "end_freq": 400.0, "start": 0.75, "dur": 0.15, "vol": 0.2},
		{"type": "square", "freq": 450.0, "end_freq": 450.0, "start": 0.75, "dur": 0.15, "vol": 0.2},
	],
	"tada": [
		{"type": "triangle", "freq": 392.0, "end_freq": 392.0, "start": 0.0, "dur": 0.4, "vol": 0.2},
		{"type": "triangle", "freq": 494.0, "end_freq": 494.0, "start": 0.0, "dur": 0.4, "vol": 0.2},
		{"type": "triangle", "freq": 587.0, "end_freq": 587.0, "start": 0.0, "dur": 0.4, "vol": 0.2},
	],
	"crash": [
		{"type": "noise", "freq": 2400.0, "end_freq": 200.0, "start": 0.0, "dur": 0.3, "vol": 0.4},
	],
	"paper": [
		{"type": "noise", "freq": 3000.0, "end_freq": 3000.0, "start": 0.0, "dur": 0.12, "vol": 0.25},
	],
	"bid": [
		{"type": "triangle", "freq": 660.0, "end_freq": 660.0, "start": 0.0, "dur": 0.08, "vol": 0.25},
	],
}

var muted: bool = false
var music_ducked: bool = false
var _player: AudioStreamPlayer
var _streams: Dictionary = {}


func sound_names() -> Array:
	return SOUNDS.keys()


func duration_of(sound: String) -> float:
	if not SOUNDS.has(sound):
		return 0.0
	var best: float = 0.0
	for e in SOUNDS[sound]:
		var finish: float = float(e["start"]) + float(e["dur"])
		best = maxf(best, finish)
	return best


func build_stream(sound: String) -> AudioStreamWAV:
	if not SOUNDS.has(sound):
		return null
	var n: int = int(ceil(duration_of(sound) * RATE))
	var samples := PackedFloat32Array()
	samples.resize(n)
	for e in SOUNDS[sound]:
		_mix_event(samples, e)
	var bytes := PackedByteArray()
	bytes.resize(n * 2)
	for i in range(n):
		bytes.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 32767.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.stereo = false
	w.data = bytes
	return w


# Adds one note event into samples. Each event starts its own phase and noise seed.
func _mix_event(samples: PackedFloat32Array, e: Dictionary) -> void:
	var kind: String = e["type"]
	var freq: float = e["freq"]
	var end_freq: float = e["end_freq"]
	var start: float = e["start"]
	var dur: float = e["dur"]
	var vol: float = e["vol"]
	var first: int = int(start * RATE)
	var last: int = mini(int((start + dur) * RATE), samples.size())
	var attack: float = minf(0.01, dur / 4.0)
	var release: float = minf(0.03, dur / 4.0)
	var noise_seed: int = 12345
	var phase: float = 0.0
	var y: float = 0.0
	for i in range(first, last):
		var u: float = float(i - first) / RATE
		var f: float = freq + (end_freq - freq) * (u / dur)
		var env: float = clampf(minf(u / attack, (dur - u) / release), 0.0, 1.0)
		var wave: float = 0.0
		if kind == "noise":
			noise_seed = (noise_seed * 1664525 + 1013904223) & 0xFFFFFFFF
			var white: float = float(noise_seed) / 2147483648.0 - 1.0
			y += clampf(TAU * f / RATE, 0.0, 1.0) * (white - y)
			wave = y
		elif kind == "square":
			wave = 1.0 if sin(phase) >= 0.0 else -1.0
		else:
			wave = asin(sin(phase)) * 2.0 / PI
		samples[i] += vol * wave * env
		phase += TAU * f / RATE


func play(sound: String) -> bool:
	if muted or not SOUNDS.has(sound) or not is_inside_tree():
		return false
	if _player == null:
		_player = AudioStreamPlayer.new()
		add_child(_player)
	if not _streams.has(sound):
		_streams[sound] = build_stream(sound)
	_player.stream = _streams[sound]
	_player.play()
	return true


func set_muted(on: bool) -> void:
	muted = on


# Only records the flag, like the JS version; the music card gives it an effect.
func set_music_duck(on: bool) -> void:
	music_ducked = on


# Empty: kept so call sites match the JS. Nothing to unlock on the Godot side.
func unlock() -> void:
	pass
