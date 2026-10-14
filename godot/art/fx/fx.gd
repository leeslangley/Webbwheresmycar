class_name Fx
extends GPUParticles2D

# Particle effect library (card GDA14). Numbers come from src/ui/particles.js KINDS and
# src/art/roomfx_world.js. Each kind has a scene (res://art/fx/<kind>.tscn) that runs this script.
# The static funcs fill a node from TABLE and fire one-shot effects.

const KINDS := ["steam", "dust", "cash", "confetti", "smoke"]

const TABLE := {
	"steam": {
		"amount": 12,
		"lifetime": 1.4,
		"one_shot": false,
		"explosiveness": 0.0,
		"dir": Vector2(0, -1),
		"spread": 20.0,
		"vmin": 18.0,
		"vmax": 30.0,
		"gravity": Vector2(0, -8),
		"smin": 1.5,
		"smax": 3.0,
		"color": Color(1, 1, 1, 0.45),
		"colors": [],
		"box": Vector2.ZERO,
	},
	"dust": {
		"amount": 20,
		"lifetime": 6.0,
		"one_shot": false,
		"explosiveness": 0.0,
		"dir": Vector2(0, -1),
		"spread": 180.0,
		"vmin": 2.0,
		"vmax": 6.0,
		"gravity": Vector2(0, 0),
		"smin": 0.5,
		"smax": 1.0,
		"color": Color(1.0, 0.914, 0.753, 0.35),
		"colors": [],
		"box": Vector2(200, 120),
	},
	"cash": {
		"amount": 24,
		"lifetime": 1.3,
		"one_shot": true,
		"explosiveness": 0.95,
		"dir": Vector2(0, -1),
		"spread": 50.0,
		"vmin": 220.0,
		"vmax": 380.0,
		"gravity": Vector2(0, 700),
		"smin": 2.0,
		"smax": 3.0,
		"color": Color(0.91, 0.725, 0.137, 1.0),
		"colors": [],
		"box": Vector2.ZERO,
	},
	"confetti": {
		"amount": 60,
		"lifetime": 2.2,
		"one_shot": true,
		"explosiveness": 0.9,
		"dir": Vector2(0, -1),
		"spread": 80.0,
		"vmin": 250.0,
		"vmax": 450.0,
		"gravity": Vector2(0, 420),
		"smin": 1.5,
		"smax": 3.0,
		"color": Color(1, 1, 1, 1),
		"colors": [Color("#e8b923"), Color("#d9483b"), Color("#3fae49"), Color("#70a4b2"), Color("#6f3d86"), Color("#ffffff")],
		"box": Vector2.ZERO,
	},
	"smoke": {
		"amount": 16,
		"lifetime": 1.6,
		"one_shot": false,
		"explosiveness": 0.0,
		"dir": Vector2(0, -1),
		"spread": 25.0,
		"vmin": 20.0,
		"vmax": 40.0,
		"gravity": Vector2(0, -6),
		"smin": 2.0,
		"smax": 5.0,
		"color": Color(0.784, 0.784, 0.824, 0.5),
		"colors": [],
		"box": Vector2.ZERO,
	},
}

static var _tex: Texture2D = null


func _ready() -> void:
	Fx.setup(self, str(get_meta("kind", "steam")))


# Fill p from TABLE[kind]. False for an unknown kind. One-shot kinds wait for burst().
static func setup(p: GPUParticles2D, kind: String) -> bool:
	if not TABLE.has(kind):
		return false
	var t: Dictionary = TABLE[kind]
	var one_shot: bool = t["one_shot"]
	var dir: Vector2 = t["dir"]
	var g: Vector2 = t["gravity"]
	var box: Vector2 = t["box"]
	var colors: Array = t["colors"]

	p.amount = t["amount"]
	p.lifetime = t["lifetime"]
	p.one_shot = one_shot
	p.explosiveness = t["explosiveness"]
	p.emitting = not one_shot
	p.texture = tex()
	p.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

	var m := ParticleProcessMaterial.new()
	m.direction = Vector3(dir.x, dir.y, 0.0)
	m.spread = t["spread"]
	m.initial_velocity_min = t["vmin"]
	m.initial_velocity_max = t["vmax"]
	m.gravity = Vector3(g.x, g.y, 0.0)
	m.scale_min = t["smin"]
	m.scale_max = t["smax"]
	m.color_ramp = _alpha_ramp(kind)
	if colors.is_empty():
		m.color = t["color"]
	else:
		m.color_initial_ramp = _colour_ramp(colors)
	if box != Vector2.ZERO:
		m.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
		m.emission_box_extents = Vector3(box.x, box.y, 1.0)
	p.process_material = m

	p.set_meta("kind", kind)
	return true


# Create a kind's scene at pos under parent. One-shot kinds start now and free themselves when done.
static func burst(parent: Node, kind: String, pos: Vector2) -> GPUParticles2D:
	if not TABLE.has(kind):
		return null
	var scene := load("res://art/fx/%s.tscn" % kind) as PackedScene
	var n := scene.instantiate() as GPUParticles2D
	n.position = pos
	parent.add_child(n)
	if bool(TABLE[kind]["one_shot"]):
		n.emitting = true
		n.restart()
		n.finished.connect(n.queue_free)
	return n


# One white 4x4 pixel, cached. Particles tint it with their colour.
static func tex() -> Texture2D:
	if _tex == null:
		var img := Image.create(4, 4, false, Image.FORMAT_RGBA8)
		img.fill(Color(1, 1, 1, 1))
		_tex = ImageTexture.create_from_image(img)
	return _tex


static func _alpha_ramp(kind: String) -> GradientTexture1D:
	var g := Gradient.new()
	g.colors = PackedColorArray([Color(1, 1, 1, 1), Color(1, 1, 1, 0)])
	if kind == "steam" or kind == "smoke":
		g.offsets = PackedFloat32Array([0.0, 1.0])
	else:
		g.offsets = PackedFloat32Array([0.6, 1.0])
	return _gradient_texture(g)


# Colours spread evenly across the particle's life (offsets i / 5.0 for six colours).
static func _colour_ramp(colors: Array) -> GradientTexture1D:
	var cols := PackedColorArray()
	var offs := PackedFloat32Array()
	var last: int = colors.size() - 1
	for i in range(colors.size()):
		cols.append(colors[i])
		offs.append(float(i) / float(last))
	var g := Gradient.new()
	g.colors = cols
	g.offsets = offs
	return _gradient_texture(g)


static func _gradient_texture(g: Gradient) -> GradientTexture1D:
	var gt := GradientTexture1D.new()
	gt.gradient = g
	return gt
