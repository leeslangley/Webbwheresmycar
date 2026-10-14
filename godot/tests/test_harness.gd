extends "res://tests/harness.gd"


func test_ok_and_eq() -> void:
	ok(true, "true")
	eq(1, 1, "int")
	eq([1, 2], [1, 2], "array")
	eq({"a": 1}, {"a": 1}, "dict")
	eq("x", "x", "string")


func test_near() -> void:
	near(0.1 + 0.2, 0.3, 1e-9, "sum")


func test_failure_is_recorded() -> void:
	# The verdict uses fail() (never ok/eq/near), so a broken ok() cannot hide its own failure.
	var before: int = failures.size()
	ok(false, "x")
	_took_one_failure(before, "a failing ok() adds one failure")

	before = failures.size()
	eq(1, 2, "y")
	_took_one_failure(before, "a failing eq() adds one failure")

	before = failures.size()
	near(1.0, 2.0, 1e-9, "z")
	_took_one_failure(before, "a failing near() adds one failure")


func _took_one_failure(before: int, msg: String) -> void:
	if failures.size() == before + 1:
		failures.pop_back()
	else:
		fail(msg)


func test_autoload_helper() -> void:
	ok(autoload("Game") != null, "Game stub reachable")
	ok(tree() != null, "tree")
