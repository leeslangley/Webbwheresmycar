class_name CrtMath
extends RefCounted

# GDScript twin of the warp() function in crt.gdshader, so touch positions can be
# mapped through the curved glass exactly.

const DEFAULT_CURVATURE := 0.12


static func warp(uv: Vector2, curvature: float = DEFAULT_CURVATURE) -> Vector2:
	var cc := uv - Vector2(0.5, 0.5)
	var dist := cc.dot(cc) * curvature
	return uv + cc * (1.0 + dist) * dist


static func inside(uv: Vector2) -> bool:
	return uv.x >= 0.0 and uv.x <= 1.0 and uv.y >= 0.0 and uv.y <= 1.0


# Where on the source screen (e.g. 640x448) a touch at glass position p lands.
static func glass_to_source(p: Vector2, glass: Vector2, source: Vector2, curvature: float = DEFAULT_CURVATURE) -> Vector2:
	var w := warp(Vector2(p.x / glass.x, p.y / glass.y), curvature)
	return Vector2(w.x * source.x, w.y * source.y)
