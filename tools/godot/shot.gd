extends SceneTree
# Loads GD_SCENE, runs GD_FRAMES frames, saves the root viewport to GD_OUT, quits. Used by tools/godot/gshot.sh.
var n := 0
var frames := 8
var out := ""
func _init() -> void:
	frames = int(OS.get_environment("GD_FRAMES"))
	out = OS.get_environment("GD_OUT")
	var ps := load(OS.get_environment("GD_SCENE")) as PackedScene
	if ps == null:
		print("SHOT ERROR cannot load scene")
		quit(2)
		return
	root.add_child(ps.instantiate())
func _process(_d: float) -> bool:
	n += 1
	if n >= frames:
		var img := root.get_viewport().get_texture().get_image()
		img.save_png(out)
		print("SHOT ", img.get_size())
		quit(0)
	return false
