class_name UiSalesChart
extends Control

# The small white SALES chart panel of the bottom HUD: a line over the recent cash values.
# Drawn with UiTheme helpers; scale_points() is the pure mapping from values to pixels.

var values: Array[float] = []


func _init() -> void:
	size = Vector2(320, 114)
	mouse_filter = MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


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


# White card with a blue header ribbon; dashed gridlines, a filled area under a thick outlined line,
# dots on each day and a glowing marker on today (green when up on the period, red when down).
func _draw() -> void:
	if UiSkin.tex("chart_card") != null:
		UiSkin.blit(self, "chart_card", Vector2(-8, -8))
	else:
		UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("chartWhite"), UiTheme.color("ink"), 4, true)
	UiSkin.role_text(self, "SALES", Vector2(14, 8), "h3", UiTheme.color("white"), UiTheme.INK, 4)
	var r: Rect2 = plot_rect()
	var grid := Color(0.42, 0.52, 0.72, 0.35)
	for t in [0.0, 0.5, 1.0]:
		var gy: float = round(r.end.y - r.size.y * float(t)) + 0.5
		var x := r.position.x
		while x < r.end.x:
			draw_line(Vector2(x, gy), Vector2(minf(x + 6.0, r.end.x), gy), grid, 1.0)
			x += 10.0
	if values.size() >= 2:
		var pts: PackedVector2Array = scale_points(values, r)
		var up: bool = values[values.size() - 1] >= values[0]
		var col: Color = Color("2FB84F") if up else Color("E0443A")
		_trend_badge(up)
		var area := PackedVector2Array(pts)
		area.append(Vector2(r.end.x, r.end.y + 4.0))
		area.append(Vector2(r.position.x, r.end.y + 4.0))
		var cols := PackedColorArray()
		for p in pts:
			cols.append(UiSkin.fade(col, 0.35))
		cols.append(UiSkin.fade(col, 0.02))
		cols.append(UiSkin.fade(col, 0.02))
		draw_polygon(area, cols)
		draw_polyline(pts, UiTheme.INK, 6.0, true)
		draw_polyline(pts, col, 3.0, true)
		for i in range(pts.size() - 1):
			draw_circle(pts[i], 3.0, UiTheme.INK)
			draw_circle(pts[i], 1.6, Color.WHITE)
		var last: Vector2 = pts[pts.size() - 1]
		draw_circle(last, 9.0, UiSkin.fade(col, 0.25))
		draw_circle(last, 5.5, UiTheme.INK)
		draw_circle(last, 4.0, col.lerp(Color.WHITE, 0.2))
		draw_circle(last + Vector2(-1.2, -1.2), 1.4, Color(1, 1, 1, 0.9))
	else:
		var cy: float = r.get_center().y - float(UiTheme.size_for("caption")) / 2.0
		UiTheme.draw_text(self, "no sales yet", Vector2(r.position.x, cy), "caption", Color("8A8478"), r.size.x, HORIZONTAL_ALIGNMENT_CENTER)


# A small up or down arrow on the right of the header ribbon.
func _trend_badge(up: bool) -> void:
	var c := Vector2(size.x - 24.0, 15.0)
	var tri: PackedVector2Array
	if up:
		tri = PackedVector2Array([c + Vector2(0, -7), c + Vector2(8, 5), c + Vector2(-8, 5)])
	else:
		tri = PackedVector2Array([c + Vector2(0, 7), c + Vector2(-8, -5), c + Vector2(8, -5)])
	var outline := PackedVector2Array(tri)
	outline.append(tri[0])
	draw_polyline(outline, UiTheme.INK, 5.0, true)
	draw_colored_polygon(tri, Color("7CFF8A") if up else Color("FF7A6A"))
