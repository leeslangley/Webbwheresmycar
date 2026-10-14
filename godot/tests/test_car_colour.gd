extends "res://tests/harness.gd"

# Car paint colour (GDA21): the default orange must come out as orange. The numeric floors here are the
# minimum light and ambient levels the look is tuned from; the look itself is checked on the screenshot.


func test_paint_reads_as_itself() -> void:
	var m := CarMats.make("paint", Color("c96f32"), 0.0) as ShaderMaterial
	ok(m != null, "paint is a ShaderMaterial")
	if m != null:
		eq(m.get_shader_parameter("base_color"), Color("c96f32"), "paint base_color is the default orange")
	var cv := (load("res://art/carview.tscn") as PackedScene).instantiate() as CarView
	cv.build()
	var key := cv.get_node_or_null("Box/VP/Rig/Key") as DirectionalLight3D
	ok(key != null, "Key light exists")
	if key != null:
		ok(key.light_energy >= 1.2, "Key light energy is at least 1.2")
	var env := cv.get_node_or_null("Box/VP/Env") as WorldEnvironment
	ok(env != null and env.environment != null, "Env world environment exists")
	if env != null and env.environment != null:
		ok(env.environment.ambient_light_energy >= 0.35, "ambient energy is at least 0.35")
	cv.free()


func test_paint_light_adds_diffuse() -> void:
	# A custom light() replaces the built-in Lambert term, so without this line the key light adds no diffuse
	# and the paint renders as its dark ambient-only brown.
	var txt: String = FileAccess.get_file_as_string("res://art/car_paint.gdshader")
	var body := txt.substr(txt.find("void light()"))
	ok(body.contains("DIFFUSE_LIGHT +="), "light() adds a diffuse term")
	ok(body.contains("max(dot(NORMAL, LIGHT), 0.0)"), "diffuse term is Lambert N dot L")
