shader_type spatial;
#include "res://art/car_wear.gdshaderinc"

uniform sampler2D env_ramp : source_color, repeat_disable, filter_linear;
uniform float tint_strength = 1.0;
uniform float wear : hint_range(0.0, 3.0) = 0.0;

varying vec3 v_obj;

void vertex() {
	v_obj = VERTEX;
}

void fragment() {
	// Fake environment: look up the studio sky ramp by the reflected direction's height.
	vec3 r = reflect(-VIEW, NORMAL);
	vec3 rw = normalize((INV_VIEW_MATRIX * vec4(r, 0.0)).xyz);
	float v = clamp(rw.y * 0.5 + 0.5, 0.0, 1.0);
	vec3 env = texture(env_ramp, vec2(v, 0.5)).rgb;
	float sun = smoothstep(0.92, 0.98, dot(rw, normalize(vec3(0.4, 0.7, 0.5))));
	env += vec3(sun * 0.9);
	vec3 alb = vec3(0.05);
	vec3 emit = env * tint_strength;
	wr_apply_chrome(alb, emit, v_obj, wear);
	ALBEDO = alb;
	EMISSION = emit;
	METALLIC = 0.0;
	ROUGHNESS = 0.35;
	SPECULAR = 0.5;
}
