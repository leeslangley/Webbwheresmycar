extends "res://tests/harness.gd"


func test_scene_loads() -> void:
	var packed: PackedScene = load("res://scenes/hello.tscn")
	var s = packed.instantiate()
	ok(s is Control, "root is a Control")
	ok(s.get_node("Title") is Label, "Title is a Label")
	ok(s.get_node("Background") is ColorRect, "Background is a ColorRect")
	eq(s.get_title(), "Webb, where's my car?", "title text")
	s.free()


func test_ascii_title() -> void:
	var packed: PackedScene = load("res://scenes/hello.tscn")
	var s = packed.instantiate()
	var title: String = s.get_title()
	ok(title.length() > 0, "title is not empty")
	for i in title.length():
		ok(title.unicode_at(i) <= 127, "character %d is ASCII" % i)
	s.free()
