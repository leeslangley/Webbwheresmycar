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
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


func _ready() -> void:
	var counter := UiCounter.new()
	counter.name = "Counter"
	counter.position = Vector2(126, 1)
	counter.size = Vector2(138, 44)
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
	counter.base_color = UiTheme.color("bad") if c < 0.0 else UiTheme.color("phosphor")
	queue_redraw()


# Brass-rimmed glass tube; the green LED liquid fills it to fill_ratio; the digits sit on a dark readout.
func _draw() -> void:
	if UiSkin.tex("cash_frame") == null:
		UiTheme.draw_bar(self, Rect2(Vector2.ZERO, size), fill_ratio(cash), UiTheme.color("cashGreen"), UiTheme.color("cashDark"))
		UiTheme.draw_text(self, "CASH", Vector2(12.0, 14.0), "h3", UiTheme.color("cream"))
		return
	UiSkin.blit(self, "cash_frame", Vector2.ZERO)
	var r := fill_ratio(cash)
	if r > 0.0:
		var w := 6.0 + (size.x - 12.0) * r
		var fill := UiSkin.tex("cash_fill")
		draw_texture_rect_region(fill, Rect2(0, 0, w, size.y), Rect2(0, 0, w, size.y))
		if w < size.x - 8.0:
			draw_rect(Rect2(w - 2.0, 7.0, 2.0, size.y - 14.0), Color(0.85, 1.0, 0.85, 0.9))
	UiSkin.blit(self, "cash_glass", Vector2.ZERO)
	UiSkin.role_text(self, "CASH", Vector2(14.0, 14.0), "h3", UiTheme.color("cream"), UiTheme.INK, 5)
