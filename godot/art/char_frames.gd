class_name CharFrames
extends RefCounted

# Turns the JSON written by tools/art/export_char_frames.py (res://art/chars/<char>.json) into a
# SpriteFrames for an AnimatedSprite2D. Texture loading goes through a Callable so tests need no PNGs.


static func load_doc(char_id: String) -> Dictionary:
	var path: String = "res://art/chars/%s.json" % char_id
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if parsed is Dictionary:
		return parsed
	return {}


static func default_loader(char_id: String) -> Callable:
	return func(id: String) -> Texture2D:
		return load("res://art/chars/%s/%s.png" % [char_id, id]) as Texture2D


static func build(doc: Dictionary, loader: Callable) -> SpriteFrames:
	var sf := SpriteFrames.new()
	sf.remove_animation("default")
	for clip_name in clip_names(doc):
		var clip: Dictionary = _clip(doc, clip_name)
		sf.add_animation(clip_name)
		sf.set_animation_speed(clip_name, float(clip.get("fps", 1)))
		sf.set_animation_loop(clip_name, bool(clip.get("loop", false)))
		var textures: Array[Texture2D] = []
		for fr in _array(clip.get("frames", [])):
			var tex: Texture2D = loader.call(str(_dict(fr).get("id", "")))
			if tex != null:
				textures.append(tex)
		var last: int = textures.size() - 1
		for i in textures.size():
			# The hold value keeps the last picture on screen: it extends the last frame's duration.
			var hold_extra: float = float(clip.get("hold", 0)) if i == last else 0.0
			sf.add_frame(clip_name, textures[i], 1.0 + hold_extra)
	return sf


static func build_char(char_id: String) -> SpriteFrames:
	return build(load_doc(char_id), default_loader(char_id))


static func neck(doc: Dictionary, clip: String, frame: int) -> Vector2:
	var frames: Array = _array(_clip(doc, clip).get("frames", []))
	if frame < 0 or frame >= frames.size():
		return Vector2.ZERO
	var n: Array = _array(_dict(frames[frame]).get("neck", []))
	if n.size() < 2:
		return Vector2.ZERO
	return Vector2(float(n[0]), float(n[1]))


static func clip_view(doc: Dictionary, clip: String) -> String:
	var view: String = str(_clip(doc, clip).get("view", "front"))
	return view if view == "back" else "front"


static func head_id(doc: Dictionary, face: String, angle: String) -> String:
	var heads: Dictionary = _dict(doc.get("heads", {}))
	var face_angles: Dictionary = _dict(heads.get(face, {}))
	if face_angles.has(angle):
		return str(face_angles[angle])
	var neutral: Dictionary = _dict(heads.get("neutral", {}))
	if neutral.has(angle):
		return str(neutral[angle])
	if neutral.has("fwd"):
		return str(neutral["fwd"])
	return ""


static func clip_names(doc: Dictionary) -> PackedStringArray:
	var names := PackedStringArray()
	for key in _dict(doc.get("clips", {})).keys():
		names.append(str(key))
	names.sort()
	return names


static func _dict(value: Variant) -> Dictionary:
	return value if value is Dictionary else {}


static func _array(value: Variant) -> Array:
	return value if value is Array else []


static func _clip(doc: Dictionary, clip: String) -> Dictionary:
	return _dict(_dict(doc.get("clips", {})).get(clip, {}))
