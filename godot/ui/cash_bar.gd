class_name UiCashBar
extends Control

# The green CASH bar of the bottom HUD strip. The bar fills towards the Fat Cat plate target (TARGET);
# the money figure is a UiCounter child named "Counter" that rolls to each new value. A negative
# balance shows the counter in "bad" red.

const TARGET := 100000.0


var cash: float = 0.0


func _init() -> void:
	size = Vector2(280, 44)
	mouse_filter = MOUSE_FILTER_IGNORE


func _ready() -> void:
	var counter := UiCounter.new()
	counter.name = "Counter"
	counter.position = Vector2(88, 0)
	counter.size = Vector2(184, 44)
	counter.role = "h3"
	counter.align = HORIZONTAL_ALIGNMENT_RIGHT
	counter.money_mode = true
	add_child(counter)


static func fill_ratio(c: float) -> float:
	return clampf(c / TARGET, 0.0, 1.0)


func set_cash(c: float, animate: bool = true) -> void:
	cash = c
	var counter: UiCounter = $Counter
	counter.set_value(c, animate)
	counter.base_color = UiTheme.color("bad") if c < 0.0 else UiTheme.color("white")
	queue_redraw()


func _draw() -> void:
	UiTheme.draw_bar(self, Rect2(Vector2.ZERO, size), fill_ratio(cash), UiTheme.color("cashGreen"), UiTheme.color("cashDark"))
	UiTheme.draw_text(self, "CASH", Vector2(12.0, 14.0), "h3", UiTheme.color("cream"))
