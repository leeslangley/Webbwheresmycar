shader_type spatial;
#include "res://art/car_wear.gdshaderinc"

uniform vec4 glass_color : source_color = vec4(0.106, 0.157, 0.188, 1.0);
uniform float wear : hint_range(0.0, 3.0) = 0.0;

varying vec3 v_obj;

void vertex() {
	// The include's windscreen crack sits at car-body height (y 2.6). Preview spheres are only 1.6 m
	// tall, so shift the object space up to put the crack on the sphere.
	v_obj = VERTEX + vec3(0.0, 2.6, 0.0);
}

void fragment() {
	// Opaque on purpose: the old sprite glass was opaque too.
	vec3 alb = glass_color.rgb;
	wr_apply_glass(alb, v_obj, wear);
	ALBEDO = alb;
	ROUGHNESS = 0.05;
	METALLIC = 0.0;
	SPECULAR = 0.9;
	float ndv = clamp(dot(NORMAL, VIEW), 0.0, 1.0);
	EMISSION = vec3(0.35, 0.45, 0.55) * pow(1.0 - ndv, 3.0) * 0.4;
}
