shader_type canvas_item;

uniform float intensity : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	float n = fract(sin(dot(floor(UV * vec2(160.0, 112.0)) + vec2(floor(TIME * 30.0)), vec2(12.9898, 78.233))) * 43758.5453);
	float roll = smoothstep(0.0, 0.08, abs(fract(UV.y - TIME * 0.7) - 0.5) - 0.42);
	vec3 snow = vec3(n * 0.85 + 0.1);
	snow = mix(snow, vec3(0.0), roll * 0.5);
	COLOR = vec4(snow, intensity);
}
