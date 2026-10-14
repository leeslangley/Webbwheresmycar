class_name PostFx
extends CanvasLayer

# Full-screen post-process layer (CRT look). Off until the settings turn it on.

const PARAMS: Array[String] = ["vignette", "grain", "glow", "glow_threshold", "scanlines"]

var _t := 0.0


func _ready() -> void:
	set_enabled(false)


func _process(delta: float) -> void:
	_t += delta
	$Rect.material.set_shader_parameter("time_s", _t)


func set_enabled(on: bool) -> void:
	visible = on
	set_process(on)


func is_enabled() -> bool:
	return visible


func set_param(name: String, v: float) -> bool:
	if not PARAMS.has(name):
		return false
	$Rect.material.set_shader_parameter(name, v)
	return true


func get_param(name: String) -> float:
	return float($Rect.material.get_shader_parameter(name))


func apply_settings(s: Dictionary) -> void:
	set_enabled(bool(s.get("crt", false)))
	if s.has("scanlines") and typeof(s["scanlines"]) in [TYPE_INT, TYPE_FLOAT]:
		set_param("scanlines", float(s["scanlines"]))
