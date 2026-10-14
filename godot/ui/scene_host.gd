class_name SceneHost
extends Control

# Owns the room/scene stack. go replaces everything, push stacks a scene on top (the one below is
# hidden and paused), pop returns to the scene below. Scenes may define optional hooks
# enter(params), exit() and resume().

signal changed(scene: Node)

var _stack: Array[Node] = []


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE


func _make(scene: Variant) -> Node:
	if scene is String:
		var path: String = scene
		if ResourceLoader.exists(path):
			var ps := load(path) as PackedScene
			if ps != null:
				return ps.instantiate()
	elif scene is PackedScene:
		return (scene as PackedScene).instantiate()
	elif scene is Node:
		return scene as Node
	push_error("SceneHost: cannot make scene")
	return null


func current() -> Node:
	return _stack.back() if not _stack.is_empty() else null


func depth() -> int:
	return _stack.size()


func push(scene: Variant, params: Dictionary = {}) -> Node:
	var n := _make(scene)
	if n == null:
		return null
	if not _stack.is_empty():
		var top: Node = _stack.back()
		if top is CanvasItem:
			(top as CanvasItem).visible = false
		top.process_mode = Node.PROCESS_MODE_DISABLED
	if n is Control:
		(n as Control).set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(n)
	_stack.append(n)
	if n.has_method("enter"):
		n.call("enter", params)
	changed.emit(n)
	return n


func go(scene: Variant, params: Dictionary = {}) -> Node:
	for i in range(_stack.size() - 1, -1, -1):
		var old: Node = _stack[i]
		if old.has_method("exit"):
			old.call("exit")
		remove_child(old)
		old.queue_free()
	_stack.clear()
	return push(scene, params)


func pop() -> Node:
	if _stack.size() <= 1:
		return current()
	var top: Node = _stack.pop_back()
	if top.has_method("exit"):
		top.call("exit")
	remove_child(top)
	top.queue_free()
	var new_top: Node = _stack.back()
	if new_top is CanvasItem:
		(new_top as CanvasItem).visible = true
	new_top.process_mode = Node.PROCESS_MODE_INHERIT
	if new_top.has_method("resume"):
		new_top.call("resume")
	changed.emit(new_top)
	return new_top
