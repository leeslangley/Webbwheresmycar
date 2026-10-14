class_name UiSalesChart
extends Control

# The small white SALES chart panel of the bottom HUD: a line over the recent cash values.
# Drawn with UiTheme helpers; scale_points() is the pure mapping from values to pixels.

var values: Array[float] = []


func _init() -> void:
	size = Vector2(320, 114)
	mouse_filter = MOUSE_FILTER_IGNORE


func set_values(v: Array) -> void:
	values.clear()
	for x in v:
		values.append(float(x))
	queue_redraw()


# The area inside the panel where the title sits above and the line is drawn.
func plot_rect() -> Rect2:
	return Rect2(12, 34, size.x - 24, size.y - 46)


# Map values to points inside r. One value sits in the centre; a flat series sits in the middle row.
static func scale_points(vals: Array, r: Rect2) -> PackedVector2Array:
	var out := PackedVector2Array()
	var n: int = vals.size()
	if n == 0:
		return out
	if n == 1:
		out.append(r.get_center())
		return out
	var lo: float = float(vals[0])
	var hi: float = lo
	for v in vals:
		var f: float = float(v)
		lo = minf(lo, f)
		hi = maxf(hi, f)
	for i in range(n):
		var x: float = r.position.x + float(i) * r.size.x / float(n - 1)
		var y: float
		if hi == lo:
			y = r.position.y + r.size.y / 2.0
		else:
			y = r.end.y - (float(vals[i]) - lo) / (hi - lo) * r.size.y
		out.append(Vector2(x, y))
	return out


func _draw() -> void:
	UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("chartWhite"), UiTheme.color("ink"), 4, true)
	UiTheme.draw_text(self, "SALES", Vector2(12, 10), "h3", UiTheme.color("ink"))
	var r: Rect2 = plot_rect()
	for t in [0.0, 0.5, 1.0]:
		var gy: float = r.end.y - r.size.y * float(t)
		draw_line(Vector2(r.position.x, gy), Vector2(r.end.x, gy), UiTheme.color("paperShade"), 1.0)
	if values.size() >= 2:
		var pts: PackedVector2Array = scale_points(values, r)
		draw_polyline(pts, UiTheme.color("cashDark"), 3.0)
		var last: Vector2 = pts[pts.size() - 1]
		var col: Color = UiTheme.color("good") if values[values.size() - 1] >= values[0] else UiTheme.color("bad")
		draw_rect(Rect2(last - Vector2(3, 3), Vector2(6, 6)), col)
	else:
		var cy: float = r.get_center().y - float(UiTheme.size_for("caption")) / 2.0
		UiTheme.draw_text(self, "no sales yet", Vector2(r.position.x, cy), "caption", UiTheme.color("midgrey"), r.size.x, HORIZONTAL_ALIGNMENT_CENTER)
