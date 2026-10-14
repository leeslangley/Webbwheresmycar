shader_type canvas_item;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap, repeat_disable;
uniform float vignette : hint_range(0.0, 1.0) = 0.3;
uniform float grain : hint_range(0.0, 0.2) = 0.04;
uniform float glow : hint_range(0.0, 1.0) = 0.25;
uniform float glow_threshold : hint_range(0.0, 0.95) = 0.7;
uniform float scanlines : hint_range(0.0, 1.0) = 0.0;
uniform float time_s = 0.0;

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

void fragment() {
	vec3 c = texture(screen_tex, SCREEN_UV).rgb;

	// Bloom-like glow: blurred mips of the screen, only the part above the threshold.
	vec3 b = (textureLod(screen_tex, SCREEN_UV, 2.0).rgb + textureLod(screen_tex, SCREEN_UV, 3.0).rgb) * 0.5;
	b = max(b - vec3(glow_threshold), vec3(0.0)) / (1.0 - glow_threshold);
	c += b * glow;

	// Soft vignette: darker toward the corners of a 16:9 frame.
	vec2 q = (SCREEN_UV - 0.5) * vec2(1.7778, 1.0);
	c *= 1.0 - vignette * smoothstep(0.45, 1.0, length(q));

	// Film grain, re-rolled 12 times a second.
	float n = hash21(floor(SCREEN_UV * vec2(640.0, 360.0)) + floor(time_s * 12.0) * 17.0);
	c += (n - 0.5) * grain;

	// Optional scanlines.
	c *= 1.0 - scanlines * 0.5 * (0.5 + 0.5 * sin(SCREEN_UV.y * 720.0 * 3.14159));

	COLOR = vec4(clamp(c, 0.0, 1.0), 1.0);
}
