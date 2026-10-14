class_name TvStatic
extends ColorRect

# Full-screen snow shown between TV channels. Intensity ramps up to a peak at the half-way
# point (midpoint: the channel is swapped there), then back down (finished). Blocks taps while playing.

signal midpoint
signal finished

var duration: float = 0.4
var _elapsed: float = 0.0
var _playing: bool = false
var _mid_done: bool = false


func _init() -> void:
	size = Vector2(640, 448)
	color = Color.WHITE
	visible = false
	mouse_filter = MOUSE_FILTER_IGNORE


func _ready() -> void:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://tv/static.gdshader") as Shader
	material = mat


static func intensity_at(u: float) -> float:
	return clampf(1.0 - absf(2.0 * u - 1.0), 0.0, 1.0)


func play(d: float = 0.4) -> void:
	duration = d
	_elapsed = 0.0
	_playing = true
	_mid_done = false
	visible = true
	mouse_filter = MOUSE_FILTER_STOP
	_apply()


func is_playing() -> bool:
	return _playing


func progress() -> float:
	return clampf(_elapsed / duration, 0.0, 1.0)


func advance(dt: float) -> void:
	if not _playing:
		return
	_elapsed += dt
	if not _mid_done and _elapsed >= duration * 0.5:
		_mid_done = true
		midpoint.emit()
	if _elapsed >= duration:
		_playing = false
		visible = false
		mouse_filter = MOUSE_FILTER_IGNORE
		finished.emit()
	else:
		_apply()


func _process(dt: float) -> void:
	advance(dt)


func _apply() -> void:
	if material is ShaderMaterial:
		(material as ShaderMaterial).set_shader_parameter("intensity", intensity_at(progress()))
