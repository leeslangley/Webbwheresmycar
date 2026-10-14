shader_type canvas_item;

// Turns a flat ColorRect into a glossy rounded pill / LED / confetti chip of its own COLOR:
// anti-aliased rounded corners, an ink rim, a lighter top half with a sheen line, and a soft glow
// when glow > 0. size is the rect size in px (set per material).

uniform vec2 size = vec2(28.0, 16.0);
uniform float radius = 5.0;
uniform float rim = 1.5;
uniform vec4 rim_color : source_color = vec4(0.078, 0.063, 0.165, 1.0);
uniform float gloss = 0.35;

float sd_box(vec2 p, vec2 b, float r) {
	vec2 q = abs(p) - b + vec2(r);
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void fragment() {
	vec2 p = (UV - 0.5) * size;
	float d = sd_box(p, size * 0.5, radius);
	float aa = 0.75;
	float inside = clamp(0.5 - d / aa, 0.0, 1.0);
	float body = clamp(0.5 - (d + rim) / aa, 0.0, 1.0);
	vec3 c = COLOR.rgb;
	float top = 1.0 - UV.y;
	c = mix(c * 0.78, c, smoothstep(0.0, 0.7, top));
	c = mix(c, vec3(1.0), gloss * smoothstep(0.45, 0.75, top) * step(abs(p.x), size.x * 0.5 - radius * 0.6));
	vec3 col = mix(rim_color.rgb, c, body);
	COLOR = vec4(col, inside * COLOR.a);
}
