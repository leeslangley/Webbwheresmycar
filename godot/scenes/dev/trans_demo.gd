extends Control

# Dev scene for GDR23: the iris and static transition overlays frozen at u = 0.25 over eight colour stripes.
# Left half: iris (hole radius from TransMath). Right half: static wipe at coverage 0.5, frame 3.


func _ready() -> void:
	var colors := [
		Color("e63946"), Color("f4a261"), Color("e9c46a"), Color("2a9d8f"),
		Color("264653"), Color("457b9d"), Color("8338ec"), Color("ff006e"),
	]
	for k in range(colors.size()):
		var stripe := ColorRect.new()
		stripe.position = Vector2(160.0 * k, 0.0)
		stripe.size = Vector2(160.0, 720.0)
		stripe.color = colors[k]
		stripe.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(stripe)

	var half := Vector2(640.0, 720.0)
	var t := Transitions.new()
	var iris_ov := t.make_overlay("iris", half)
	t.apply_overlay(iris_ov, "iris", 0.25, half)
	iris_ov.position = Vector2.ZERO
	add_child(iris_ov)

	var static_ov := t.make_overlay("static", half)
	t.apply_overlay(static_ov, "static", 0.25, half)
	(static_ov.material as ShaderMaterial).set_shader_parameter("frame", 3)
	static_ov.position = Vector2(640.0, 0.0)
	add_child(static_ov)
	t.free()

	_add_label("IRIS u=0.25", Vector2(16.0, 16.0))
	_add_label("STATIC u=0.25", Vector2(656.0, 16.0))


func _add_label(text: String, pos: Vector2) -> void:
	var l := Label.new()
	l.text = text
	l.position = pos
	l.add_theme_font_size_override("font_size", 32)
	l.add_theme_color_override("font_color", Color.WHITE)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(l)
