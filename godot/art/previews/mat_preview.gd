extends Node3D

# Material preview board for the car shaders (GDA04): 3 rows x 4 spheres, wear 0..3 left to right.
# Row 1 car paint, row 2 chrome, row 3 glass. build() is idempotent; _ready() calls it.

const PAINT_SHADER := preload("res://art/car_paint.gdshader")
const CHROME_SHADER := preload("res://art/chrome.gdshader")
const GLASS_SHADER := preload("res://art/glass.gdshader")
const SPHERE_X := [-4.5, -1.5, 1.5, 4.5]
const SPHERE_Y := [0.8, 2.4, 4.0]
const WEARS := [0.0, 1.0, 2.0, 3.0]

var _built: bool = false


func _ready() -> void:
	build()


func build() -> void:
	if _built:
		return
	_built = true
	_add_environment()
	_add_light()
	_add_camera()
	for row in 3:
		for col in 4:
			_add_sphere(row, col)


func _add_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("2b2550")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("6e6a8c")
	env.ambient_light_energy = 0.9
	var world := WorldEnvironment.new()
	world.environment = env
	add_child(world)


func _add_light() -> void:
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-45, -35, 0)
	add_child(sun)


func _add_camera() -> void:
	var cam := Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 8.0
	cam.near = 0.05
	cam.far = 100.0
	cam.transform = Transform3D(Basis(), Vector3(0, 2.4, 12)).looking_at(Vector3(0, 2.4, 0), Vector3.UP)
	cam.current = true
	add_child(cam)


func _add_sphere(row: int, col: int) -> void:
	var mat := ShaderMaterial.new()
	match row:
		0:
			mat.shader = PAINT_SHADER
			mat.set_shader_parameter("base_color", Color("c96f32"))
			mat.set_shader_parameter("flop_color", Color("e08c4c"))
			mat.set_shader_parameter("body_height", 1.6)
			mat.set_shader_parameter("ground_y", -0.8)
		1:
			mat.shader = CHROME_SHADER
			mat.set_shader_parameter("env_ramp", _env_ramp())
		_:
			mat.shader = GLASS_SHADER
	mat.set_shader_parameter("wear", WEARS[col])

	var sphere := SphereMesh.new()
	sphere.radius = 0.8
	sphere.height = 1.6
	var mi := MeshInstance3D.new()
	mi.name = "Sphere_%d_%d" % [row, col]
	mi.mesh = sphere
	mi.material_override = mat
	mi.position = Vector3(SPHERE_X[col], SPHERE_Y[row], 0.0)
	add_child(mi)


# Chrome reflection ramp: dark floor, bright horizon, blue sky (mirrors the studio sky in tools/art/cbrig.py).
func _env_ramp() -> GradientTexture1D:
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 0.45, 0.5, 0.6, 1.0])
	g.colors = PackedColorArray([Color("2a2432"), Color("2a2432"), Color("e9dcc4"), Color("b4c8e6"), Color("2b4a86")])
	var tex := GradientTexture1D.new()
	tex.gradient = g
	tex.width = 64
	return tex
