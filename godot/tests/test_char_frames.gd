extends "res://tests/harness.gd"

const CF = preload("res://art/char_frames.gd")


func _doc() -> Dictionary:
	return {
		"version": 1,
		"char": "mark",
		"clips": {
			"idle": {"view": "front", "fps": 3, "loop": true, "hold": 0, "frames": [
				{"id": "m_idle_00", "neck": [72, 75], "angle": "fwd"},
				{"id": "m_idle_01", "neck": [72, 76], "angle": "fwd"},
			]},
			"talk": {"view": "front", "fps": 6, "loop": true, "hold": 2, "frames": [
				{"id": "m_talk_00", "neck": [72, 75], "angle": "fwd"},
				{"id": "m_talk_01", "neck": [72, 75], "angle": "fwd"},
				{"id": "m_talk_02", "neck": [72, 75], "angle": "fwd"},
			]},
			"back_idle": {"view": "back", "fps": 2, "loop": false, "hold": 0, "frames": [
				{"id": "m_back_00", "neck": [70, 74], "angle": "fwd"},
			]},
		},
		"heads": {
			"neutral": {"fwd": "m_head_fwd_neutral", "tilt_l": "m_head_tilt_l_neutral"},
			"talk_A": {"fwd": "m_head_fwd_talk_A"},
		},
	}


func _loader() -> Callable:
	return func(_id: String) -> Texture2D:
		return ImageTexture.create_from_image(Image.create(4, 4, false, Image.FORMAT_RGBA8))


func _loader_missing_one() -> Callable:
	return func(id: String) -> Texture2D:
		if id == "m_talk_01":
			return null
		return ImageTexture.create_from_image(Image.create(4, 4, false, Image.FORMAT_RGBA8))


func test_load_doc_missing() -> void:
	eq(CF.load_doc("nobody"), {}, "missing char json gives an empty dict")


func test_clip_names() -> void:
	eq(Array(CF.clip_names(_doc())), ["back_idle", "idle", "talk"], "clip names sorted")
	eq(Array(CF.clip_names({})), [], "no clips gives no names")


func test_build_animations() -> void:
	var sf: SpriteFrames = CF.build(_doc(), _loader())
	var names: Array = Array(sf.get_animation_names())
	names.sort()
	eq(names, ["back_idle", "idle", "talk"], "exactly the three clips, no default")
	eq(sf.get_frame_count("idle"), 2, "idle frame count")
	eq(sf.get_frame_count("talk"), 3, "talk frame count")
	eq(sf.get_frame_count("back_idle"), 1, "back_idle frame count")
	near(sf.get_animation_speed("idle"), 3.0, 1e-9, "idle fps")
	near(sf.get_animation_speed("talk"), 6.0, 1e-9, "talk fps")
	near(sf.get_animation_speed("back_idle"), 2.0, 1e-9, "back_idle fps")
	eq(sf.get_animation_loop("idle"), true, "idle loops")
	eq(sf.get_animation_loop("talk"), true, "talk loops")
	eq(sf.get_animation_loop("back_idle"), false, "back_idle does not loop")
	near(sf.get_frame_duration("talk", 2), 3.0, 1e-9, "hold 2 added to last talk frame")
	near(sf.get_frame_duration("talk", 0), 1.0, 1e-9, "first talk frame keeps duration 1")
	near(sf.get_frame_duration("idle", 1), 1.0, 1e-9, "idle has no hold")


func test_build_skips_null_frames() -> void:
	var sf: SpriteFrames = CF.build(_doc(), _loader_missing_one())
	eq(sf.get_frame_count("talk"), 2, "null texture drops one talk frame")
	eq(sf.get_frame_count("idle"), 2, "other clips unaffected")
	near(sf.get_frame_duration("talk", 1), 3.0, 1e-9, "hold lands on the new last talk frame")


func test_neck() -> void:
	var doc := _doc()
	eq(CF.neck(doc, "idle", 1), Vector2(72, 76), "neck of idle frame 1")
	eq(CF.neck(doc, "idle", 9), Vector2.ZERO, "out of range frame gives zero")
	eq(CF.neck(doc, "idle", -1), Vector2.ZERO, "negative frame gives zero")
	eq(CF.neck(doc, "nope", 0), Vector2.ZERO, "unknown clip gives zero")


func test_clip_view() -> void:
	var doc := _doc()
	eq(CF.clip_view(doc, "back_idle"), "back", "back view")
	eq(CF.clip_view(doc, "idle"), "front", "front view")
	eq(CF.clip_view(doc, "nope"), "front", "unknown clip defaults to front")


func test_head_id() -> void:
	var doc := _doc()
	eq(CF.head_id(doc, "talk_A", "fwd"), "m_head_fwd_talk_A", "own face and angle")
	eq(CF.head_id(doc, "talk_A", "tilt_l"), "m_head_tilt_l_neutral", "falls back to neutral same angle")
	eq(CF.head_id(doc, "zzz", "up"), "m_head_fwd_neutral", "falls back to neutral fwd")
	eq(CF.head_id({}, "neutral", "fwd"), "", "no heads gives empty string")
