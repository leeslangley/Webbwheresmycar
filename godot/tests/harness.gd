extends RefCounted

# Base class for Godot tests (the Godot twin of tests/harness.js). runner.gd runs every test_* method.

var failures: Array[String] = []
var checks: int = 0
var current_test: String = ""


func before_each() -> void:
	pass


func ok(cond: bool, msg: String = "") -> void:
	checks += 1
	if not cond:
		failures.append(current_test + ": " + msg)


func eq(a: Variant, b: Variant, msg: String = "") -> void:
	checks += 1
	var same: bool
	if (a is Array and b is Array) or (a is Dictionary and b is Dictionary):
		same = JSON.stringify(a, "", true) == JSON.stringify(b, "", true)
	else:
		same = a == b
	if not same:
		failures.append(current_test + ": " + msg + ": expected " + str(b) + " got " + str(a))


func near(a: float, b: float, eps: float = 1e-9, msg: String = "") -> void:
	checks += 1
	if absf(a - b) > eps:
		failures.append(current_test + ": " + msg + ": expected " + str(b) + " +/- " + str(eps) + " got " + str(a))


func fail(msg: String) -> void:
	checks += 1
	failures.append(current_test + ": " + msg)


func autoload(autoload_name: String) -> Node:
	var root: Window = tree().root
	var existing: Node = root.get_node_or_null(autoload_name)
	if existing != null:
		return existing
	var script := load("res://autoload/" + autoload_name.to_lower() + ".gd") as GDScript
	return script.new() as Node


func tree() -> SceneTree:
	return Engine.get_main_loop() as SceneTree
