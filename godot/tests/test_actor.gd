extends "res://tests/harness.gd"

const ACTOR_SCENE := preload("res://art/actor.tscn")
const ActorScript := preload("res://art/actor.gd")


func _doc() -> Dictionary:
	return {
		"version": 1,
		"char": "mark",
		"scale": 2,
		"head": {"pivot": [40, 66]},
		"head_back": "m_head_back",
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
			"neutral": {"fwd": "m_head_neutral"},
			"blink": {"fwd": "m_head_blink"},
			"talk_A": {"fwd": "m_head_talk_A"},
			"talk_E": {"fwd": "m_head_talk_E"},
			"talk_O": {"fwd": "m_head_talk_O"},
			"talk_M": {"fwd": "m_head_talk_M"},
		},
	}


# Returns a loader that remembers the last texture id asked for in seen["id"].
func _loader(seen: Dictionary) -> Callable:
	return func(id: String) -> Texture2D:
		seen["id"] = id
		return ImageTexture.create_from_image(Image.create(4, 4, false, Image.FORMAT_RGBA8))


func _make(seen: Dictionary) -> Node:
	var node = ACTOR_SCENE.instantiate()
	node.build()
	node.setup_from(_doc(), _loader(seen))
	return node


func test_setup_from() -> void:
	var seen := {"id": ""}
	var node = ACTOR_SCENE.instantiate()
	node.build()
	ok(node.setup_from(_doc(), _loader(seen)), "setup_from with clips is true")
	eq(node.scale, Vector2(2, 2), "scale from doc")
	eq(node.clip_name, "idle", "idle is the starting clip")
	ok(node.get_node("Body").sprite_frames.has_animation("talk"), "sprite frames built")
	node.free()


func test_setup_from_empty() -> void:
	var seen := {"id": ""}
	var node = ACTOR_SCENE.instantiate()
	node.build()
	ok(not node.setup_from({}, _loader(seen)), "doc without clips is false")
	node.free()


func test_head_position() -> void:
	var seen := {"id": ""}
	var node = _make(seen)
	eq(node.get_node("Head").position, Vector2(72 - 40, 75 - 66), "head at neck minus pivot for frame 0")
	eq(seen["id"], "m_head_neutral", "head texture id is the neutral front head")
	node.free()


func test_play() -> void:
	var seen := {"id": ""}
	var node = _make(seen)
	ok(node.play("talk"), "play talk is true")
	eq(node.clip_name, "talk", "clip name stored")
	ok(not node.play("zzz"), "play unknown clip is false")
	eq(node.clip_name, "talk", "unknown clip leaves clip name alone")
	node.free()


func test_back_view() -> void:
	var seen := {"id": ""}
	var node = _make(seen)
	ok(node.play("back_idle"), "play back_idle")
	eq(seen["id"], "m_head_back", "back view uses the head_back id")
	node.free()


func test_mouth_schedule() -> void:
	eq(Array(ActorScript.mouth_schedule("Oh no")), ["talk_O", "talk_O", "neutral", "neutral", "talk_O"], "Oh no")
	eq(ActorScript.mouth_for("a", "neutral"), "talk_A", "a is talk_A")
	eq(ActorScript.mouth_for("e", "neutral"), "talk_E", "e is talk_E")
	eq(ActorScript.mouth_for("o", "neutral"), "talk_O", "o is talk_O")
	eq(ActorScript.mouth_for("x", "talk_A"), "talk_A", "other letter keeps previous mouth")
	eq(ActorScript.mouth_for("M", "neutral"), "talk_M", "capital M is talk_M")
	eq(ActorScript.mouth_for("3", "talk_E"), "talk_E", "digit keeps previous mouth")
	eq(ActorScript.mouth_for(" ", "talk_O"), "neutral", "space is neutral")


func test_talk() -> void:
	var seen := {"id": ""}
	var node = _make(seen)
	near(node.talk("Mum"), 0.27, 1e-9, "talk returns length times MOUTH_SEC")
	ok(node.is_talking(), "talking after talk")
	eq(Array(ActorScript.mouth_schedule("Mum")), ["talk_M", "talk_O", "talk_M"], "schedule for Mum")
	node._process(0.1)
	eq(seen["id"], "m_head_talk_O", "after 0.1 s the mouth is talk_O")
	node._process(0.3)
	ok(not node.is_talking(), "talk ends after the text time")
	eq(seen["id"], "m_head_neutral", "face back to neutral when talk ends")
	node.free()


func test_blink() -> void:
	var seen := {"id": ""}
	var node = _make(seen)
	node._process(3.25)
	eq(seen["id"], "m_head_blink", "blink face inside the blink window")
	node._process(0.1)
	eq(seen["id"], "m_head_neutral", "eyes open again after the blink")
	node.free()


func test_set_face() -> void:
	var seen := {"id": ""}
	var node = _make(seen)
	node.set_face("talk_A")
	eq(seen["id"], "m_head_talk_A", "talk_A head id")
	node.set_face("happy")
	eq(seen["id"], "m_head_neutral", "a face with no head in this doc falls back to neutral")
	node.set_face("talk_E")
	eq(seen["id"], "m_head_talk_E", "talk_E head id")
	node.free()
