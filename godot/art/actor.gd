class_name Actor
extends Node2D

# One character on screen (Mark, Dave or a customer): a body AnimatedSprite2D playing a clip, with the head sprite on
# the neck position of the current frame. talk(text) swaps mouth shapes on a timer; the head blinks while idle.
# Port of the idea of GC23 (animation clock, blink, mouth shapes). No lip-sync; callers decide what is said.

signal clip_finished(clip: String)

const MOUTH_SEC: float = 0.09
const BLINK_EVERY: float = 3.2
const BLINK_SEC: float = 0.12

var clip_name: String = ""
var _doc: Dictionary = {}
var _loader: Callable = Callable()
var _body: AnimatedSprite2D = null
var _head: Sprite2D = null
var _face: String = "neutral"
var _schedule: PackedStringArray = PackedStringArray()
var _talk_t: float = 0.0
var _talking: bool = false
var _blink_t: float = 0.0
var _last_shown: String = ""


func _ready() -> void:
	build()


func build() -> void:
	if _body != null:
		return
	_body = AnimatedSprite2D.new()
	_body.name = "Body"
	_body.centered = false
	add_child(_body)
	_head = Sprite2D.new()
	_head.name = "Head"
	_head.centered = false
	add_child(_head)
	_body.frame_changed.connect(_place_head)
	_body.animation_finished.connect(_on_finished)


func setup(char_id: String) -> bool:
	return setup_from(CharFrames.load_doc(char_id), CharFrames.default_loader(char_id))


func setup_from(doc: Dictionary, loader: Callable) -> bool:
	var names: PackedStringArray = CharFrames.clip_names(doc)
	if names.is_empty():
		return false
	build()
	_doc = doc
	_loader = loader
	_body.sprite_frames = CharFrames.build(doc, loader)
	var s: float = float(doc.get("scale", 1.0))
	scale = Vector2(s, s)
	play("idle" if names.has("idle") else names[0])
	return true


func play(clip: String) -> bool:
	build()
	if _body.sprite_frames == null or not _body.sprite_frames.has_animation(clip):
		return false
	clip_name = clip
	_body.play(clip)
	_body.set_frame_and_progress(0, 0.0)
	_place_head()
	return true


func talk(text: String) -> float:
	_schedule = mouth_schedule(text)
	_talk_t = 0.0
	if _schedule.is_empty():
		stop_talk()
		return 0.0
	_talking = true
	_face = _schedule[0]
	_place_head()
	return float(text.length()) * MOUTH_SEC


func stop_talk() -> void:
	_talking = false
	_schedule = PackedStringArray()
	_face = "neutral"
	_place_head()


func is_talking() -> bool:
	return _talking


func set_face(face_name: String) -> void:
	_face = face_name
	_place_head()


func _process(delta: float) -> void:
	_blink_t = fmod(_blink_t + delta, BLINK_EVERY + BLINK_SEC)
	if _talking:
		_talk_t += delta
		if _talk_t >= float(_schedule.size()) * MOUTH_SEC:
			stop_talk()
			return
		_face = _schedule[mini(int(_talk_t / MOUTH_SEC), _schedule.size() - 1)]
	if _shown_face() != _last_shown:
		_place_head()


static func mouth_for(ch: String, prev: String) -> String:
	var c: String = ch.to_lower()
	if c == "a":
		return "talk_A"
	if c == "e" or c == "i":
		return "talk_E"
	if c == "o" or c == "u":
		return "talk_O"
	if c == "m" or c == "b" or c == "p":
		return "talk_M"
	if c == " " or c == "," or c == "." or c == "!" or c == "?":
		return "neutral"
	var code: int = c.unicode_at(0) if c.length() > 0 else 0
	var is_letter: bool = code >= 97 and code <= 122
	var is_digit: bool = code >= 48 and code <= 57
	if is_letter or is_digit:
		return prev
	return "neutral"


static func mouth_schedule(text: String) -> PackedStringArray:
	var out := PackedStringArray()
	var prev: String = "neutral"
	for i in text.length():
		prev = mouth_for(text.substr(i, 1), prev)
		out.append(prev)
	return out


func _shown_face() -> String:
	if not _talking and _blink_t >= BLINK_EVERY:
		return "blink"
	return _face


func _place_head() -> void:
	if _head == null or _doc.is_empty() or clip_name == "":
		return
	var face: String = _shown_face()
	var frame: int = _body.frame
	var neck: Vector2 = CharFrames.neck(_doc, clip_name, frame)
	_head.position = neck - _pivot()
	var id: String = ""
	if CharFrames.clip_view(_doc, clip_name) == "back":
		id = str(_doc.get("head_back", ""))
	else:
		id = CharFrames.head_id(_doc, face, _angle_of_frame(frame))
	_last_shown = face
	if id == "":
		_head.texture = null
		return
	var tex: Texture2D = _loader.call(id)
	_head.texture = tex


func _pivot() -> Vector2:
	var head_doc: Variant = _doc.get("head", {})
	if head_doc is Dictionary:
		var p: Variant = head_doc.get("pivot", [])
		if p is Array and p.size() >= 2:
			return Vector2(float(p[0]), float(p[1]))
	return Vector2.ZERO


func _angle_of_frame(frame: int) -> String:
	var clip: Variant = _doc.get("clips", {})
	if not clip is Dictionary:
		return "fwd"
	var entry: Variant = clip.get(clip_name, {})
	if not entry is Dictionary:
		return "fwd"
	var frames: Variant = entry.get("frames", [])
	if not frames is Array or frame < 0 or frame >= frames.size():
		return "fwd"
	var fr: Variant = frames[frame]
	if not fr is Dictionary:
		return "fwd"
	return str(fr.get("angle", "fwd"))


func _on_finished() -> void:
	clip_finished.emit(clip_name)
