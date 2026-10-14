shader_type canvas_item;
uniform float curvature : hint_range(0.0, 0.5) = 0.12;
uniform float scanline_strength : hint_range(0.0, 1.0) = 0.25;
uniform float scanline_count = 224.0;
uniform float bloom : hint_range(0.0, 1.0) = 0.35;
uniform float vignette : hint_range(0.0, 1.0) = 0.35;
uniform float noise_amount : hint_range(0.0, 0.2) = 0.04;
uniform float flicker : hint_range(0.0, 0.1) = 0.02;
uniform float static_amount : hint_range(0.0, 1.0) = 0.0;

vec2 warp(vec2 uv) {
	vec2 cc = uv - vec2(0.5);
	float dist = dot(cc, cc) * curvature;
	return uv + cc * (1.0 + dist) * dist;
}

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	vec2 uv = warp(UV);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		COLOR = vec4(0.0, 0.0, 0.0, 1.0);
	} else {
		vec3 col = texture(TEXTURE, uv).rgb;
		vec2 px = TEXTURE_PIXEL_SIZE * 1.5;
		vec3 glow = texture(TEXTURE, uv + vec2(px.x, 0.0)).rgb + texture(TEXTURE, uv - vec2(px.x, 0.0)).rgb + texture(TEXTURE, uv + vec2(0.0, px.y)).rgb + texture(TEXTURE, uv - vec2(0.0, px.y)).rgb;
		col += glow * 0.25 * bloom;
		float s = 0.5 + 0.5 * sin(uv.y * scanline_count * 6.28318);
		col *= 1.0 - scanline_strength * (1.0 - s);
		float n = hash(uv * 640.0 + vec2(floor(TIME * 24.0)));
		col += (n - 0.5) * noise_amount;
		col = mix(col, vec3(n), static_amount);
		float v = length((UV - 0.5) * vec2(1.0, 1.1));
		col *= 1.0 - vignette * smoothstep(0.35, 0.8, v);
		col *= 1.0 + flicker * sin(TIME * 60.0);
		COLOR = vec4(col, 1.0);
	}
}
