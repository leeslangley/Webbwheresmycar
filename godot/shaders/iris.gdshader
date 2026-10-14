shader_type canvas_item;

// Iris wipe: black outside a circle, transparent inside (the screen shows through the hole).
// Hard pixel edge, same maths as TransMath.iris (radius) in godot/rooms/trans_math.gd.
uniform float radius = 100.0;
uniform vec2 center = vec2(640.0, 360.0);
uniform vec2 rect_size = vec2(1280.0, 720.0);

void fragment() {
	vec2 p = UV * rect_size;
	COLOR = vec4(0.0, 0.0, 0.0, step(radius, distance(p, center)));
}
