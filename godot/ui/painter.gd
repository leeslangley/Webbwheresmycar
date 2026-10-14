class_name UiPainter
extends Node2D

# A Node2D whose _draw is delegated to a Callable(painter: CanvasItem). Lets a scene add a custom-drawn
# layer (rays, rain, glints) without a script file per layer. Call queue_redraw() after changing state.

var painter: Callable


static func make(node_name: String, fn: Callable) -> UiPainter:
	var p := UiPainter.new()
	p.name = node_name
	p.painter = fn
	p.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	return p


func _draw() -> void:
	if painter.is_valid():
		painter.call(self)
