class_name UiFx
extends RefCounted

# Tween-based juice (port of the idea in src/ui/screenfx.js): shake a Control or Node2D, flash the
# screen, pop-scale a node. Static only, no randomness: the same call always makes the same motion.
# Tests step time with Tween.custom_step(), so nothing here waits for frames.


# Tweens come from the SceneTree, not from the node: node-bound tweens do not advance under
# Tween.custom_step() in tests, while the SceneTree's tweens do. A tween whose target is freed is
# stopped by the engine, so nothing is lost.
static func _tween() -> Tween:
	return (Engine.get_main_loop() as SceneTree).create_tween()


# Offsets for one shake: amplitude falls linearly from strength to 0 over the steps.
static func shake_offsets(strength: float, steps: int) -> Array[Vector2]:
	var out: Array[Vector2] = []
	for i in range(steps):
		var amp: float = strength * (1.0 - float(i) / float(steps))
		out.append(Vector2(sin(i * 2.1) * amp, cos(i * 3.3) * amp * 0.6))
	return out


# Shake a Control or Node2D around its home position, then settle exactly back home.
static func shake(node: CanvasItem, strength: float = 8.0, duration: float = 0.3) -> Tween:
	var home: Vector2 = node.get("position")
	var tw: Tween = _tween()
	if strength <= 0.0:
		tw.tween_property(node, "position", home, 0.0)
		return tw
	for off in shake_offsets(strength, 8):
		tw.tween_property(node, "position", home + off, duration / 9.0)
	tw.tween_property(node, "position", home, duration / 9.0)
	return tw


# Colour flash over the whole host: a full-rect ColorRect that fades in and out, then frees itself.
static func flash(host: Control, color: Color = Color(1, 1, 1, 1), duration: float = 0.18, peak: float = 0.6) -> Tween:
	var r := ColorRect.new()
	r.name = "FxFlash"
	r.color = Color(color.r, color.g, color.b, 0.0)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	r.set_anchors_preset(Control.PRESET_FULL_RECT)
	host.add_child(r)
	var tw: Tween = _tween()
	tw.tween_property(r, "color:a", peak, duration * 0.25)
	tw.tween_property(r, "color:a", 0.0, duration * 0.75)
	tw.tween_callback(r.queue_free)
	return tw


# Pop-scale: grow to amount, then return to ONE. Controls pivot around their centre.
static func pop(node: CanvasItem, amount: float = 1.15, duration: float = 0.18) -> Tween:
	var ctl := node as Control
	if ctl != null:
		ctl.pivot_offset = ctl.size / 2.0
	var tw: Tween = _tween()
	tw.tween_property(node, "scale", Vector2(amount, amount), duration * 0.4).set_trans(Tween.TRANS_LINEAR)
	tw.tween_property(node, "scale", Vector2.ONE, duration * 0.6)
	return tw
