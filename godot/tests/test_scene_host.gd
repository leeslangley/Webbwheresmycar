extends "res://tests/harness.gd"


func _probe() -> Control:
	var s := GDScript.new()
	s.source_code = "extends Control\nvar events: Array = []\nfunc enter(p: Dictionary) -> void:\n\tevents.append(\"enter\")\nfunc exit() -> void:\n\tevents.append(\"exit\")\nfunc resume() -> void:\n\tevents.append(\"resume\")\n"
	s.reload()
	var c := Control.new()
	c.set_script(s)
	return c


func test_go() -> void:
	var h := SceneHost.new()
	tree().root.add_child(h)
	var a = _probe()
	ok(h.go(a) == a, "go returns the new scene")
	ok(h.current() == a, "current is a")
	eq(h.depth(), 1, "depth 1 after go")
	eq(a.events, ["enter"], "a entered")
	ok(a.get_parent() == h, "a is a child of the host")

	var b = _probe()
	h.go(b)
	eq(a.events, ["enter", "exit"], "a exited when replaced")
	ok(a.is_queued_for_deletion(), "a is queued for deletion")
	eq(h.depth(), 1, "depth still 1")
	ok(h.current() == b, "current is b")
	h.free()


func test_push_pop() -> void:
	var h := SceneHost.new()
	tree().root.add_child(h)
	var a = _probe()
	h.go(a)
	var b = _probe()
	h.push(b)
	eq(h.depth(), 2, "depth 2 after push")
	eq(a.visible, false, "a hidden under b")
	eq(a.process_mode, Node.PROCESS_MODE_DISABLED, "a paused under b")
	ok(h.current() == b, "current is b after push")

	ok(h.pop() == a, "pop returns a")
	eq(a.visible, true, "a visible again")
	eq(a.process_mode, Node.PROCESS_MODE_INHERIT, "a unpaused")
	eq(a.events, ["enter", "resume"], "a entered then resumed")
	eq(b.events, ["enter", "exit"], "b entered then exited")
	eq(h.depth(), 1, "depth 1 after pop")

	h.pop()
	ok(h.current() == a, "a kept on second pop")
	eq(h.depth(), 1, "depth stays 1")
	h.free()


func test_signal_and_params() -> void:
	var h := SceneHost.new()
	tree().root.add_child(h)
	var seen: Array = []
	h.changed.connect(func(n: Node) -> void: seen.append(n))
	var a = _probe()
	h.go(a)
	var b = _probe()
	h.push(b)
	h.pop()
	eq(seen.size(), 3, "changed emitted for go, push, pop")
	ok(seen[0] == a, "first emission is a")
	ok(seen[1] == b, "second emission is b")
	ok(seen[2] == a, "third emission is a")

	var s := GDScript.new()
	s.source_code = "extends Control\nvar got: Dictionary = {}\nfunc enter(p: Dictionary) -> void:\n\tgot = p\n"
	s.reload()
	var c = Control.new()
	c.set_script(s)
	h.push(c, {"room": "garage"})
	eq(c.got, {"room": "garage"}, "params reach enter")
	h.free()

	var h2 := SceneHost.new()
	tree().root.add_child(h2)
	var ps := PackedScene.new()
	var pc := Control.new()
	ps.pack(pc)
	pc.free()
	var r = h2.push(ps)
	ok(r is Control, "PackedScene push returns a Control")
	h2.free()


func test_bad_scene() -> void:
	var h := SceneHost.new()
	tree().root.add_child(h)
	ok(h.push(42) == null, "int scene returns null")
	eq(h.depth(), 0, "depth unchanged")
	h.free()
