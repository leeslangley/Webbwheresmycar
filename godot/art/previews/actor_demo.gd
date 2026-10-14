extends Node2D

# Preview: Mark and Dave side by side on a lilac backdrop, Mark talking. A character with no exported art yet is
# replaced by a label saying so.

const ACTOR_SCENE := preload("res://art/actor.tscn")

var _mark: Actor = null


func _ready() -> void:
	var backdrop := ColorRect.new()
	backdrop.size = Vector2(1280, 720)
	backdrop.color = Color("2b2550")
	add_child(backdrop)
	_mark = _spawn("mark", Vector2(300, 160))
	_spawn("dave", Vector2(700, 160))
	if _mark != null:
		_mark.talk("Where is my car")


func _spawn(char_id: String, at: Vector2) -> Actor:
	var actor := ACTOR_SCENE.instantiate() as Actor
	if actor.setup(char_id):
		actor.position = at
		add_child(actor)
		return actor
	actor.free()
	var label := Label.new()
	label.text = "no character art exported yet"
	label.position = at
	add_child(label)
	return null
