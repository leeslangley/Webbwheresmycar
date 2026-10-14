extends "res://tests/harness.gd"

# RoomParallax: the pointer and tilt look vector, the whole-pixel layer shifts, and the attach/step
# behaviour on a RoomBase root. Nodes are not added to the scene tree, so _ready and _input do not run;
# step() and apply() are called by hand.


func test_look_from_pointer() -> void:
	var size := Vector2(1280, 720)
	eq(RoomParallax.look_from_pointer(Vector2(640, 360), size), Vector2.ZERO, "centre is zero look")
	eq(RoomParallax.look_from_pointer(Vector2(1280, 720), size), Vector2(1, 1), "bottom right corner is (1, 1)")
	eq(RoomParallax.look_from_pointer(Vector2(0, 0), size), Vector2(-1, -1), "top left corner is (-1, -1)")
	eq(RoomParallax.look_from_pointer(Vector2(-200, 360), size), Vector2(-1, 0), "far left is clamped to -1")
	eq(RoomParallax.look_from_pointer(Vector2(960, 360), size), Vector2(0.5, 0), "three quarters across is 0.5")


func test_look_from_gravity() -> void:
	eq(RoomParallax.look_from_gravity(Vector3(0, 0, -9.8)), Vector2.ZERO, "phone flat is zero look")
	eq(RoomParallax.look_from_gravity(Vector3(4.9, 0, 0)), Vector2(1, 0), "tilt right is full x look")
	eq(RoomParallax.look_from_gravity(Vector3(0, 2.45, 0)), Vector2(0, -0.5), "half tilt on y is -0.5")
	eq(RoomParallax.look_from_gravity(Vector3(-20, -20, 0)), Vector2(-1, 1), "large tilts are clamped")


func test_shift_for() -> void:
	eq(RoomParallax.shift_for("Front", Vector2(1, 1)), Vector2(-6, -3), "front at full look")
	eq(RoomParallax.shift_for("Front", Vector2(0.5, 0)), Vector2(-3, 0), "front at half look x")
	eq(RoomParallax.shift_for("Background", Vector2(1, 0)), Vector2(-2, 0), "background x")
	eq(RoomParallax.shift_for("Props", Vector2(1, 0)), Vector2(-3, 0), "props x")
	eq(RoomParallax.shift_for("Lights", Vector2(-1, 0)), Vector2(3, 0), "lights moves with the look reversed")
	eq(RoomParallax.shift_for("Hotspots", Vector2(1, 1)), Vector2.ZERO, "hotspots never move")
	eq(RoomParallax.shift_for("Ui", Vector2(1, 1)), Vector2.ZERO, "ui never moves")


func test_attach_and_step() -> void:
	var r := RoomBase.new()
	r.build_layers()
	var p := r.parallax
	ok(p is RoomParallax, "build_layers makes a RoomParallax")
	eq(r.get_child(r.get_child_count() - 1), p, "parallax is the last child of the room")
	r.layer("Front").position = Vector2(5, 5)
	p.attach(r)
	p.target = Vector2(1, 1)
	p.step(10.0)
	near(p.look.x, 1.0, 0.001, "look x reaches the target")
	near(p.look.y, 1.0, 0.001, "look y reaches the target")
	eq(r.layer("Front").position, Vector2(5, 5) + Vector2(-6, -3), "front shifted by the full look")
	eq(r.layer("Background").position, Vector2(-2, -1), "background shifted by its own amount")
	eq(r.get_node("Hotspots").position, Vector2.ZERO, "hotspots did not move")
	eq(r.ui().position, Vector2.ZERO, "ui did not move")
	p.target = Vector2.ZERO
	p.step(10.0)
	eq(r.layer("Front").position, Vector2(5, 5), "front returns to its base position")
	p.enabled = false
	p.target = Vector2(1, 1)
	p.step(10.0)
	eq(r.layer("Front").position, Vector2(5, 5), "a disabled parallax leaves positions unchanged")
	r.free()
