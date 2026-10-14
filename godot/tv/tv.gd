class_name Tv
extends Control

# The Webb TV: a chunky wooden CRT cabinet drawn in code around a 600x420 glass. The glass shows a
# 640x448 SubViewport ("Viewport", channels go in host()) through crt.gdshader. Touches on the glass
# are mapped through the curved glass into the screen. The remote drives the ChannelManager (setup()).

signal closed
signal remote(action: String)

const SIZE := Vector2(760, 560)
const GLASS := Rect2(60, 50, 600, 420)
const SCREEN := Vector2(640, 448)

var curvature: float = CrtMath.DEFAULT_CURVATURE
var crt_material: ShaderMaterial
var channels: ChannelManager
var static_fx: TvStatic
var osd: Label

var _glass: TextureRect
var _osd_left: float = 0.0


func _init() -> void:
	size = SIZE
	custom_minimum_size = SIZE
	mouse_filter = MOUSE_FILTER_PASS


func _ready() -> void:
	var viewport := SubViewport.new()
	viewport.name = "Viewport"
	viewport.size = Vector2i(640, 448)
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.transparent_bg = false
	viewport.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	viewport.gui_disable_input = false
	add_child(viewport)

	var screen := Control.new()
	screen.name = "Screen"
	screen.size = SCREEN
	viewport.add_child(screen)

	var backdrop := ColorRect.new()
	backdrop.name = "Backdrop"
	backdrop.color = Color.BLACK
	backdrop.size = SCREEN
	screen.add_child(backdrop)

	crt_material = ShaderMaterial.new()
	crt_material.shader = load("res://tv/crt.gdshader") as Shader

	_glass = TextureRect.new()
	_glass.name = "Glass"
	_glass.position = GLASS.position
	_glass.size = GLASS.size
	_glass.texture = viewport.get_texture()
	_glass.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_glass.stretch_mode = TextureRect.STRETCH_SCALE
	_glass.mouse_filter = MOUSE_FILTER_STOP
	_glass.gui_input.connect(_on_glass_input)
	add_child(_glass)

	var r := TvRemote.new()
	r.name = "Remote"
	r.position = Vector2(152, 484)
	add_child(r)
	r.action.connect(func(a: String): remote.emit(a))

	set_crt(true)


func host() -> Control:
	return get_node("Viewport/Screen") as Control


# Call after the node is in the tree and _ready has run. Builds the static overlay, the channel OSD,
# the channel manager and the remote wiring.
func setup(game: Object) -> void:
	var vp := get_node("Viewport") as SubViewport

	static_fx = TvStatic.new()
	static_fx.name = "Static"
	vp.add_child(static_fx)

	osd = Label.new()
	osd.name = "Osd"
	osd.position = Vector2(24, 20)
	osd.add_theme_font_override("font", UiTheme.title_font())
	osd.add_theme_font_size_override("font_size", 24)
	osd.add_theme_color_override("font_color", UiTheme.color("phosphor"))
	osd.visible = false
	osd.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vp.add_child(osd)

	channels = ChannelManager.new()
	channels.name = "Channels"
	add_child(channels)
	channels.setup(host(), game, static_fx)
	channels.exit_requested.connect(func(): closed.emit())
	channels.tuned.connect(_on_tuned)
	remote.connect(_on_remote)


func tune(id: String) -> bool:
	return channels.tune(id)


func _on_remote(a: String) -> void:
	match a:
		"ch_next":
			channels.step(1)
		"ch_prev":
			channels.step(-1)
		"ok":
			channels.ok()
		"back":
			channels.back()


func _on_tuned(_id: String, title: String, index: int) -> void:
	osd.text = "CH %d  %s" % [index + 1, title]
	osd.visible = true
	_osd_left = 2.0


func _process(delta: float) -> void:
	if _osd_left > 0.0:
		_osd_left -= delta
		if _osd_left <= 0.0 and osd != null:
			osd.visible = false


func glass_to_screen(p: Vector2) -> Vector2:
	return CrtMath.glass_to_source(p, GLASS.size, SCREEN, curvature)


func set_crt(on: bool) -> void:
	if on:
		_glass.material = crt_material
		crt_material.set_shader_parameter("curvature", curvature)
	else:
		_glass.material = null


func crt_on() -> bool:
	return _glass != null and _glass.material != null


# Mouse events copied with their position mapped from glass space into screen space. Other events give null.
func convert_event(ev: InputEvent) -> InputEvent:
	if not (ev is InputEventMouseButton or ev is InputEventMouseMotion):
		return null
	var out := ev.duplicate() as InputEventMouse
	var p := glass_to_screen((ev as InputEventMouse).position)
	out.position = p
	out.global_position = p
	return out


func _on_glass_input(ev: InputEvent) -> void:
	var c := convert_event(ev)
	if c != null:
		(get_node("Viewport") as SubViewport).push_input(c, true)


func _draw() -> void:
	# (1) cabinet
	UiTheme.draw_box(self, Rect2(0, 0, 760, 560), UiTheme.color("woodDark"), UiTheme.color("ink"), 4, false)
	# (2) wood grain
	for y in range(12, 549, 16):
		draw_rect(Rect2(8, float(y), 744, 2), UiTheme.color("woodDark").lightened(0.08))
	# (3) bezel
	UiTheme.draw_box(self, Rect2(36, 30, 688, 448), Color("#2A2530"), UiTheme.color("ink"), 4, false)
	# (4) glass recess
	draw_rect(Rect2(56, 46, 608, 428), Color.BLACK)
	# (5) control plate
	UiTheme.draw_box(self, Rect2(36, 478, 688, 74), UiTheme.color("woodLight"), UiTheme.color("ink"), 4, false)
	# (6) two knobs
	for cx in [668.0, 700.0]:
		draw_circle(Vector2(cx, 516), 14.0, Color.BLACK)
		draw_arc(Vector2(cx, 516), 14.0, 0.0, TAU, 24, UiTheme.color("lightgrey"), 2.0)
	# (7) brand plate
	UiTheme.draw_box(self, Rect2(52, 492, 80, 40), UiTheme.color("brass"), UiTheme.color("ink"), 4, false)
	UiTheme.draw_text(self, "WEBB", Vector2(60, 504), "h3", UiTheme.color("ink"))
