// Car weathering for the car shaders (include file, compiled into a material by GDA04).
// Wear is a float 0..3 (0 mint, 1 worn, 2 tatty, 3 wreck). Numbers match godot/art/wear.gd.

const vec4 WR_DIRT = vec4(0.0, 0.1, 0.24, 0.4);
const vec4 WR_RUST = vec4(0.0, 0.0, 0.10, 0.28);
const vec4 WR_PIT = vec4(0.0, 0.0, 0.08, 0.18);
const vec4 WR_FADE = vec4(0.0, 0.12, 0.30, 0.50);

const vec3 WR_FADE_TO = vec3(0.4793, 0.4020, 0.3050);
const vec3 WR_DIRT_A = vec3(0.1046, 0.0612, 0.0319);
const vec3 WR_DIRT_B = vec3(0.0497, 0.0296, 0.0160);
const vec3 WR_RUST_A = vec3(0.1070, 0.0232, 0.0060);
const vec3 WR_RUST_B = vec3(0.3231, 0.0685, 0.0130);
const vec3 WR_RUST_C = vec3(0.5841, 0.1946, 0.0319);
const vec3 WR_PIT_C = vec3(0.1470, 0.1022, 0.0648);
const vec3 WR_CRACK_C = vec3(0.5210, 0.7454, 0.8550);

// Linear lookup in a 4-entry table at wear w (clamped to 0..3).
float wr_tab(vec4 t, float w) {
	w = clamp(w, 0.0, 3.0);
	int i = int(min(floor(w), 2.0));
	return mix(t[i], t[i + 1], w - float(i));
}

// Hash of a point to 0..1.
float wr_hash(vec3 p) {
	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// Trilinear value noise, 0..1.
float wr_noise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float n000 = wr_hash(i + vec3(0.0, 0.0, 0.0));
	float n100 = wr_hash(i + vec3(1.0, 0.0, 0.0));
	float n010 = wr_hash(i + vec3(0.0, 1.0, 0.0));
	float n110 = wr_hash(i + vec3(1.0, 1.0, 0.0));
	float n001 = wr_hash(i + vec3(0.0, 0.0, 1.0));
	float n101 = wr_hash(i + vec3(1.0, 0.0, 1.0));
	float n011 = wr_hash(i + vec3(0.0, 1.0, 1.0));
	float n111 = wr_hash(i + vec3(1.0, 1.0, 1.0));
	return mix(
		mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
		mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
		f.z);
}

// 1.0 where chrome is pitted at this wear.
float wr_pit(vec3 p, float wear) {
	return step(wr_hash(floor(p * 40.0)), wr_tab(WR_PIT, wear));
}

// One dent: darken the top half, lighten the bottom half of a 0.4 m sphere.
void wr_dent_at(inout vec3 albedo, vec3 p, vec3 c, float strength) {
	float s = 1.0 - smoothstep(0.0, 0.4, distance(p, c));
	albedo *= 1.0 + strength * s * clamp((p.y - c.y) / 0.4, -1.0, 1.0) * -0.35;
}

// Paint weathering: fade, dirt from the sill, rust on the lower body, dents when wrecked.
// p is the object-space position, hf the height fraction (0 sill .. 1 roof).
void wr_apply_paint(inout vec3 albedo, inout float rough, vec3 p, float hf, float wear) {
	albedo = mix(albedo, WR_FADE_TO, wr_tab(WR_FADE, wear));

	float lim = wr_tab(WR_DIRT, wear);
	float dn = wr_noise(p * 6.0);
	float dirt = step(hf, lim + (dn - 0.5) * 0.1) * step(0.001, lim);
	vec3 dirtcol = mix(WR_DIRT_B, WR_DIRT_A, wr_noise(p * 11.0));
	albedo = mix(albedo, dirtcol, dirt);
	rough = mix(rough, 0.95, dirt);

	float cover = wr_tab(WR_RUST, wear);
	float rn = wr_noise(p * 3.0 + 7.0);
	float rust = step(1.0 - cover, rn) * step(0.001, cover) * (1.0 - smoothstep(0.35, 0.55, hf));
	vec3 rustcol = mix(mix(WR_RUST_A, WR_RUST_B, wr_noise(p * 9.0)), WR_RUST_C, step(0.8, wr_noise(p * 17.0)));
	albedo = mix(albedo, rustcol, rust);
	rough = mix(rough, 0.9, rust);

	if (wear > 2.0) {
		float strength = clamp(wear - 2.0, 0.0, 1.0);
		wr_dent_at(albedo, p, vec3(1.0, 1.4, 1.6), strength);
		wr_dent_at(albedo, p, vec3(-2.2, 1.2, -1.7), strength);
		wr_dent_at(albedo, p, vec3(3.0, 1.5, 1.5), strength);
	}
}

// Chrome: pitting darkens the metal and kills its glow.
void wr_apply_chrome(inout vec3 albedo, inout vec3 emit, vec3 p, float wear) {
	float pit = wr_pit(p, wear);
	albedo = mix(albedo, WR_PIT_C, pit);
	emit *= 1.0 - pit;
}

// Glass: a crack line on the windscreen, only when wrecked.
void wr_apply_glass(inout vec3 albedo, vec3 p, float wear) {
	if (wear > 2.5) {
		float d = abs(p.y - 2.6 - 0.5 * (p.x - 0.5));
		float line = (1.0 - smoothstep(0.012, 0.03, d)) * step(abs(p.x - 0.5), 0.7) * clamp((wear - 2.5) * 2.0, 0.0, 1.0);
		albedo = mix(albedo, WR_CRACK_C, line);
	}
}
