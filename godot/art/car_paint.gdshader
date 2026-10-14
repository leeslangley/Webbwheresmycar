shader_type spatial;
#include "res://art/car_wear.gdshaderinc"

uniform vec4 base_color : source_color = vec4(0.79, 0.44, 0.2, 1.0);
uniform vec4 flop_color : source_color = vec4(0.88, 0.55, 0.3, 1.0);
uniform float roughness_base : hint_range(0.0, 1.0) = 0.32;
uniform float metallic_amount : hint_range(0.0, 1.0) = 0.0;
uniform float coat : hint_range(0.0, 1.0) = 1.0;
uniform float wear : hint_range(0.0, 3.0) = 0.0;
uniform float ground_y = 0.0;
uniform float body_height = 3.8;
uniform float diffuse_gain : hint_range(0.0, 1.0) = 0.2;

varying vec3 v_obj;

void vertex() {
	v_obj = VERTEX;
}

void fragment() {
	float ndv = clamp(dot(NORMAL, VIEW), 0.0, 1.0);
	float flop = pow(1.0 - ndv, 2.0);
	vec3 alb = mix(base_color.rgb, flop_color.rgb, flop);
	float r = roughness_base;
	float hf = clamp((v_obj.y - ground_y) / body_height, 0.0, 1.0);
	wr_apply_paint(alb, r, v_obj, hf, wear);
	ALBEDO = alb;
	ROUGHNESS = r;
	METALLIC = metallic_amount;
	SPECULAR = 0.6;
	// Fake clear coat rim (the Compatibility renderer has no clearcoat); fades as the car wears.
	float rim = pow(1.0 - ndv, 4.0);
	EMISSION = mix(base_color.rgb, vec3(1.0), 0.5) * rim * 0.25 * coat * (1.0 - clamp(wear / 3.0, 0.0, 1.0));
}

void light() {
	// A custom light() replaces the built-in Lambert term, so the diffuse lobe is added here (ALBEDO applies later).
	// Lambert diffuse, scaled down: the light energy arrives pre-scaled by pi in Godot, so unscaled Lambert over-exposes the paint.
	DIFFUSE_LIGHT += LIGHT_COLOR * ATTENUATION * max(dot(NORMAL, LIGHT), 0.0) * diffuse_gain;
	// Tight highlight standing in for the coat's specular lobe.
	vec3 h = normalize(VIEW + LIGHT);
	float s = pow(max(dot(NORMAL, h), 0.0), 96.0);
	float coat_k = coat * (1.0 - clamp(wear / 2.0, 0.0, 1.0));
	SPECULAR_LIGHT += LIGHT_COLOR * ATTENUATION * s * 0.7 * coat_k;
}
