shader_type canvas_item;

// Pixel-art outline pass for CarView (GDA22). Reads the car's SubViewport texture and:
// 1. draws a 1-texel dark edge (outline_color) on transparent pixels that touch an opaque pixel;
// 2. darkens opaque pixels (35% toward outline_color) where an opaque neighbour's luminance differs by more than edge_threshold,
//    which gives the dark line where body meets glass and wheels.

uniform vec4 outline_color : source_color = vec4(0.05, 0.03, 0.08, 1.0);
uniform float edge_threshold : hint_range(0.0, 1.0) = 0.35;

float luminance(vec3 c) {
	return dot(c, vec3(0.299, 0.587, 0.114));
}

void fragment() {
	vec2 px = 1.0 / vec2(textureSize(TEXTURE, 0));
	vec4 c = texture(TEXTURE, UV);
	vec4 n0 = texture(TEXTURE, UV + vec2(px.x, 0.0));
	vec4 n1 = texture(TEXTURE, UV - vec2(px.x, 0.0));
	vec4 n2 = texture(TEXTURE, UV + vec2(0.0, px.y));
	vec4 n3 = texture(TEXTURE, UV - vec2(0.0, px.y));
	vec4 nb[4];
	nb[0] = n0;
	nb[1] = n1;
	nb[2] = n2;
	nb[3] = n3;

	vec4 out_col = c;
	if (c.a < 0.5) {
		float any_opaque = 0.0;
		for (int i = 0; i < 4; i++) {
			any_opaque = max(any_opaque, step(0.5, nb[i].a));
		}
		if (any_opaque > 0.5) {
			out_col = outline_color;
		}
	} else {
		float lc = luminance(c.rgb);
		float edge = 0.0;
		for (int i = 0; i < 4; i++) {
			if (nb[i].a >= 0.5 && abs(luminance(nb[i].rgb) - lc) > edge_threshold) {
				edge = 1.0;
			}
		}
		if (edge > 0.5) {
			out_col = vec4(mix(c.rgb, outline_color.rgb, 0.35), c.a);
		}
	}
	COLOR = out_col;
}
