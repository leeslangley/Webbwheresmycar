class_name ChannelBase
extends Control

# The contract every TV channel scene extends (docs/GODOT.md): enter(game) / leave(), signal done, refresh(),
# _paint(). A channel draws inside the TV screen (640x448). Subclasses override the hooks below.

signal done

const MIN_TOUCH := 72

var game: Object = null
var title: String = "NO SIGNAL"
var placeholder: bool = false

static var _models: Dictionary = {}


func _init() -> void:
	size = Vector2(640, 448)
	custom_minimum_size = Vector2(640, 448)
	mouse_filter = MOUSE_FILTER_STOP
	clip_contents = true


func enter(g: Object) -> void:
	game = g
	if not g.changed.is_connected(_on_game_changed):
		g.changed.connect(_on_game_changed)
	_on_enter()
	refresh()
	queue_redraw()


func leave() -> void:
	if game != null and game.changed.is_connected(_on_game_changed):
		game.changed.disconnect(_on_game_changed)
	_on_leave()
	game = null


# Hooks: empty in the base class.
func _on_enter() -> void:
	pass


func _on_leave() -> void:
	pass


func refresh() -> void:
	pass


func _paint() -> void:
	pass


func on_ok() -> void:
	pass


# true = handled here, so the manager does not leave the TV.
func on_back() -> bool:
	return false


func _on_game_changed() -> void:
	refresh()
	queue_redraw()


func state() -> Dictionary:
	return game.state if game != null else {}


func toast(text: String) -> void:
	if game != null:
		game.toast_requested.emit(text)


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), UiTheme.color("blue"))
	draw_rect(Rect2(0, 0, 640, 40), UiTheme.color("night"))
	draw_rect(Rect2(0, 38, 640, 2), UiTheme.color("lightblue"))
	UiTheme.draw_text(self, title, Vector2(12, 12), "h3", UiTheme.color("phosphor"))
	UiTheme.draw_text(self, "DAY %d" % int(state().get("day", 1)), Vector2(0, 12), "caption", UiTheme.color("cream"), 628, HORIZONTAL_ALIGNMENT_RIGHT)
	if placeholder:
		UiTheme.draw_text(self, "NO SIGNAL", Vector2(0, 200), "h2", UiTheme.color("white"), 640, HORIZONTAL_ALIGNMENT_CENTER)
	_paint()


static func models_by_id() -> Dictionary:
	if _models.is_empty():
		for m in Data.cars():
			_models[str(m.get("id", ""))] = m
	return _models


static func reset_cache() -> void:
	_models = {}


static func model_of(id: String) -> Dictionary:
	return models_by_id().get(id, {})


static func paint_of(id: String) -> Color:
	return Color(Data.paint_of(id))


static func job_name(id: String) -> String:
	return str(Data.job_type_by_id(id).get("name", id.to_upper()))
