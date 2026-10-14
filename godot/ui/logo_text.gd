class_name UiLogoText
extends Control

# Big display lettering in the painted-cartoon style: a soft drop shadow, a coloured outer rim, a thick ink
# outline and a glossy gradient fill with a shine band that can sweep across (set shine, local x px).
# Text is centred in the node's width; the baseline sits at `baseline` px from the top. Drawn with Inter
# (UiSkin.display_font). The fill is a child canvas item with res://art/ui/logo_fill.gdshader.

const SHADER := "res://art/ui/logo_fill.gdshader"

var text: String = "":
	set(v):
		text = v
		_dirty()
var font_px: int = 96:
	set(v):
		font_px = v
		_dirty()
var weight: int = 900
var baseline: float = 90.0
var fill_top: Color = Color("FFF3B0")
var fill_bottom: Color = Color("FF9A1F")
var outline: Color = UiTheme.INK
var outline_px: int = 18
var rim: Color = Color("E8304A")
var rim_px: int = 34
var shadow: Vector2 = Vector2(0, 10)
var shine: float = -1000.0:
	set(v):
		shine = v
		if _mat != null:
			_mat.set_shader_parameter("shine", v)

var _fill: Control
var _mat: ShaderMaterial


class Fill extends Control:
	var painter: Callable

	func _draw() -> void:
		if painter.is_valid():
			painter.call(self)


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_fill = Fill.new()
	_fill.name = "Fill"
	_fill.painter = _draw_fill
	_fill.mouse_filter = MOUSE_FILTER_IGNORE
	_fill.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_fill.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(_fill)
	if ResourceLoader.exists(SHADER):
		_mat = ShaderMaterial.new()
		_mat.shader = load(SHADER) as Shader
		_fill.material = _mat


func _dirty() -> void:
	queue_redraw()
	if _fill != null:
		_fill.queue_redraw()


# Updates the gradient band to the current font size (cap height of Inter is about 0.73 em).
func _sync_shader() -> void:
	if _mat == null:
		return
	var cap := float(font_px) * 0.73
	_mat.set_shader_parameter("top_color", fill_top)
	_mat.set_shader_parameter("bottom_color", fill_bottom)
	_mat.set_shader_parameter("y_top", baseline - cap)
	_mat.set_shader_parameter("y_bottom", baseline)
	_mat.set_shader_parameter("gloss_y", baseline - cap * 0.52)
	_mat.set_shader_parameter("shine", shine)


func _origin(f: Font) -> Vector2:
	var w := f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px).x
	return Vector2(round((size.x - w) * 0.5), baseline)


func _draw() -> void:
	if text == "":
		return
	var f := UiSkin.display_font(weight)
	var o := _origin(f)
	if shadow != Vector2.ZERO:
		draw_string_outline(f, o + shadow, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px, rim_px, Color(0, 0, 0, 0.45))
	if rim_px > 0:
		draw_string_outline(f, o, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px, rim_px, rim)
		draw_string_outline(f, o, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px, rim_px - 8, rim.lightened(0.25))
	draw_string_outline(f, o, text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px, outline_px, outline)
	_sync_shader()


func _draw_fill(on: Control) -> void:
	if text == "":
		return
	var f := UiSkin.display_font(weight)
	on.draw_string(f, _origin(f), text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px, Color.WHITE)
