shader_type canvas_item;

// TV-static wipe: 32 px grey cells, the same hash as TransMath.static_cells and the JS staticCells().
// A cell is drawn when its hash value r lands below coverage (coverage peaks at the midpoint).
uniform float coverage : hint_range(0.0, 1.0) = 0.5;
uniform int frame = 0;
uniform vec2 rect_size = vec2(1280.0, 720.0);
uniform float cell = 32.0;

void fragment() {
	vec2 p = UV * rect_size;
	uint i = uint(floor(p.x / cell)) + 1u;
	uint j = uint(floor(p.y / cell)) + 1u;
	uint h = (i * 73856093u) ^ (j * 19349663u) ^ (uint(frame + 1) * 83492791u);
	float r = float(h % 1000u) / 1000.0;
	int level = int((h >> 10u) % 4u);
	vec3 col = vec3(16.0 / 255.0);
	if (level == 1) {
		col = vec3(80.0 / 255.0);
	} else if (level == 2) {
		col = vec3(160.0 / 255.0);
	} else if (level == 3) {
		col = vec3(240.0 / 255.0);
	}
	COLOR = vec4(col, r < coverage ? 1.0 : 0.0);
}
