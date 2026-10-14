extends Control

# Demo: the CRT shader on a test pattern. The test card is drawn into a 640x448 SubViewport,
# and the TextureRect "Glass" shows that viewport through crt.gdshader.

const SOURCE_SIZE := Vector2i(640, 448)
const BLUE := Color("#352879")
const BARS: Array[Color] = [
	Color("#FFFFFF"),
	Color("#FFFF00"),
	Color("#00FFFF"),
	Color("#00FF00"),
	Color("#6F3D86"),
	Color("#D9483B"),
	Color("#352879"),
	Color("#000000"),
]


func _ready() -> void:
	size = Vector2(1280, 720)

	var backdrop := ColorRect.new()
	backdrop.color = Color.BLACK
	backdrop.size = size
	add_child(backdrop)

	var viewport := SubViewport.new()
	viewport.size = SOURCE_SIZE
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(viewport)
	_build_test_card(viewport)

	var glass := TextureRect.new()
	glass.name = "Glass"
	glass.position = Vector2(340, 150)
	glass.size = Vector2(600, 420)
	glass.texture = viewport.get_texture()
	glass.stretch_mode = TextureRect.STRETCH_SCALE
	glass.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	var mat := ShaderMaterial.new()
	mat.shader = load("res://tv/crt.gdshader") as Shader
	glass.material = mat
	add_child(glass)


func _build_test_card(viewport: SubViewport) -> void:
	var base := ColorRect.new()
	base.color = BLUE
	base.size = Vector2(SOURCE_SIZE)
	viewport.add_child(base)

	for i in range(BARS.size()):
		var bar := ColorRect.new()
		bar.color = BARS[i]
		bar.position = Vector2(i * 80, 40)
		bar.size = Vector2(80, 200)
		viewport.add_child(bar)

	var title := Label.new()
	title.text = "WEBB TV TEST CARD"
	title.position = Vector2(120, 300)
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color.WHITE)
	viewport.add_child(title)

	var channel := Label.new()
	channel.text = "CH 1"
	channel.position = Vector2(20, 8)
	channel.add_theme_color_override("font_color", Color.WHITE)
	viewport.add_child(channel)
