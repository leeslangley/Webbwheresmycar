class_name RoomBase
extends Control

# Base class of every room scene. build_layers() makes the five art layers (Background, Props,
# Characters, Lights, Front), a Ui layer for panels and labels, and a Hotspots layer for tap rects
# and buttons. Each art layer has a Plate sprite (the real art, set by art cards with set_plate) and
# a Placeholder node (flat-colour builders, shown while there is no plate). Static builders make the
# placeholder boxes, panels and labels.

const STAGE_SIZE := Vector2(1280, 720)
const LAYER_NAMES := ["Background", "Props", "Characters", "Lights", "Front"]

signal request_scene(scene_id: StringName, params: Dictionary)
signal chatter(text: String)
signal toast(text: String)

var game = null
var hotspots: Dictionary = {}
var strip_color := Color("14102A")
var parallax: RoomParallax = null


func get_game() -> Object:
	if game != null:
		return game
	game = get_node_or_null("/root/Game")
	return game


# Virtuals. Rooms override these; the base does nothing.
func enter(_params: Dictionary = {}) -> void:
	pass


func exit() -> void:
	pass


func _on_hotspot(_id: StringName) -> void:
	pass


func _on_button_blocked(_id: StringName) -> void:
	pass


func _on_button_down(_id: StringName) -> void:
	pass


func build_layers() -> void:
	if has_node("Background"):
		return
	size = STAGE_SIZE
	custom_minimum_size = STAGE_SIZE
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	for layer_name in LAYER_NAMES:
		var layer_node := Node2D.new()
		layer_node.name = layer_name
		var plate := Sprite2D.new()
		plate.name = "Plate"
		plate.centered = false
		layer_node.add_child(plate)
		var placeholder_node := Node2D.new()
		placeholder_node.name = "Placeholder"
		layer_node.add_child(placeholder_node)
		add_child(layer_node)
	var ui_node := Control.new()
	ui_node.name = "Ui"
	ui_node.size = STAGE_SIZE
	ui_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(ui_node)
	var hot_node := Control.new()
	hot_node.name = "Hotspots"
	hot_node.size = STAGE_SIZE
	hot_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hot_node)
	parallax = RoomParallax.new()
	parallax.name = "Parallax"
	add_child(parallax)
	parallax.attach(self)


func layer(layer_name: String) -> Node2D:
	return get_node(layer_name) as Node2D


func placeholder(layer_name: String) -> Node2D:
	return get_node(layer_name + "/Placeholder") as Node2D


func ui() -> Control:
	return get_node("Ui") as Control


# Sets the real plate of a layer and hides its flat placeholder. A null texture shows the placeholder again.
func set_plate(layer_name: String, tex: Texture2D, pos := Vector2.ZERO) -> void:
	var plate := get_node(layer_name + "/Plate") as Sprite2D
	plate.texture = tex
	plate.position = pos
	placeholder(layer_name).visible = (tex == null)


func add_hotspot(hs_id: StringName, rect: Rect2) -> RoomHotspot:
	var hs := RoomHotspot.make(hs_id, rect)
	get_node("Hotspots").add_child(hs)
	hs.tapped.connect(_on_hotspot)
	hs.pressed_down.connect(_on_button_down)
	hotspots[hs_id] = hs
	return hs


func add_button(btn_id: StringName, rect: Rect2, text: String, kind := "normal") -> UiButton:
	var b := UiButton.new()
	b.name = "Btn_" + String(btn_id)
	var r := RoomHotspot.fit_rect(rect)
	b.position = r.position
	b.size = r.size
	b.text = text
	b.kind = kind
	get_node("Hotspots").add_child(b)
	b.activated.connect(_on_hotspot.bind(btn_id))
	b.blocked.connect(_on_button_blocked.bind(btn_id))
	b.gui_input.connect(func(ev): if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT: _on_button_down(btn_id))
	hotspots[btn_id] = b
	return b


static func add_box(parent: Node, node_name: String, rect: Rect2, color: Color, caption := "") -> ColorRect:
	var box := ColorRect.new()
	box.name = node_name
	box.position = rect.position
	box.size = rect.size
	box.color = color
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(box)
	if caption != "":
		var text_col := Color.WHITE if color.get_luminance() < 0.5 else Color("14102A")
		add_label(box, "Caption", caption, Vector2(4, 2), 14, text_col)
	return box


static func add_panel(parent: Node, node_name: String, rect: Rect2, fill := Color("FFF7DC")) -> Panel:
	var panel := Panel.new()
	panel.name = node_name
	panel.position = rect.position
	panel.size = rect.size
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sb := StyleBoxFlat.new()
	sb.bg_color = fill
	sb.border_width_left = 4
	sb.border_width_top = 4
	sb.border_width_right = 4
	sb.border_width_bottom = 4
	sb.border_color = Color("14102A")
	panel.add_theme_stylebox_override("panel", sb)
	parent.add_child(panel)
	return panel


static func add_label(parent: Node, node_name: String, text: String, pos: Vector2, font_px: int, color: Color, width := 0.0, center := false) -> Label:
	var label := Label.new()
	label.name = node_name
	label.text = text
	label.position = pos
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_override("font", pixel_font("body"))
	label.add_theme_font_size_override("font_size", font_px)
	label.add_theme_color_override("font_color", color)
	if width > 0.0:
		label.size = Vector2(width, font_px * 1.6)
	if center:
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(label)
	return label


static func pixel_font(kind: String) -> Font:
	if kind == "title":
		return UiTheme.title_font()
	return UiTheme.body_font()
