class_name UiCounter
extends Control

# Animated number: rolls to a new value over DURATION (ease-out cubic, port of MOTION.count 700 ms) and
# flashes "good" green while rising, "bad" red while falling. Drawn in _draw(). Time is stepped by advance(dt).

const DURATION := 0.7

var money_mode: bool = true:
	set(v):
		money_mode = v
		queue_redraw()

var prefix: String = "":
	set(v):
		prefix = v
		queue_redraw()

var suffix: String = "":
	set(v):
		suffix = v
		queue_redraw()

var role: String = "h2":
	set(v):
		role = v
		queue_redraw()

var align: int = HORIZONTAL_ALIGNMENT_LEFT:
	set(v):
		align = v
		queue_redraw()

var base_color: Color = UiTheme.color("white"):
	set(v):
		base_color = v
		queue_redraw()

var _from: float = 0.0
var _to: float = 0.0
var _shown: float = 0.0
var _elapsed: float = DURATION
var _dir: int = 0


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	size = Vector2(240, 48)


func set_value(v: float, animate: bool = true) -> void:
	if not animate or v == _shown:
		_from = v
		_to = v
		_shown = v
		_elapsed = DURATION
		_dir = 0
	else:
		_from = _shown
		_to = v
		_elapsed = 0.0
		_dir = 1 if v > _shown else -1
	queue_redraw()


func advance(dt: float) -> void:
	if _elapsed >= DURATION:
		return
	_elapsed = minf(DURATION, _elapsed + dt)
	var u: float = _elapsed / DURATION
	var e: float = 1.0 - pow(1.0 - u, 3.0)
	_shown = _from + (_to - _from) * e
	if _elapsed >= DURATION:
		_shown = _to
		_dir = 0
	queue_redraw()


func _process(dt: float) -> void:
	advance(dt)


func value_shown() -> float:
	return _shown


func target() -> float:
	return _to


func is_animating() -> bool:
	return _elapsed < DURATION


func text() -> String:
	var n: int = int(floor(_shown + 0.5))
	if money_mode:
		return prefix + CoreFormat.money(n) + suffix
	return prefix + str(n) + suffix


func current_color() -> Color:
	if _dir == 1:
		return UiTheme.color("good")
	if _dir == -1:
		return UiTheme.color("bad")
	return base_color


func _draw() -> void:
	UiTheme.draw_text(self, text(), Vector2(0, (size.y - UiTheme.size_for(role)) / 2.0), role, current_color(), size.x, align)
