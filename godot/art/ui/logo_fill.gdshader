shader_type canvas_item;

// Fill of the big logo lettering (UiLogoText): a vertical two-colour gradient in the node's local space,
// a lighter "gloss" upper half, and a diagonal shine band at x = shine that sweeps across the letters.
// Glyph coverage comes from the font texture alpha.

uniform vec4 top_color : source_color = vec4(1.0, 0.95, 0.6, 1.0);
uniform vec4 bottom_color : source_color = vec4(1.0, 0.55, 0.1, 1.0);
uniform float y_top = 0.0;
uniform float y_bottom = 100.0;
uniform float gloss_y = 50.0;
uniform float gloss = 0.3;
uniform float shine = -1000.0;

varying vec2 lp;

void vertex() {
	lp = VERTEX;
}

void fragment() {
	float a = texture(TEXTURE, UV).a * COLOR.a;
	float t = clamp((lp.y - y_top) / max(y_bottom - y_top, 1.0), 0.0, 1.0);
	vec3 c = mix(top_color.rgb, bottom_color.rgb, t);
	c = mix(c, vec3(1.0), (1.0 - step(gloss_y, lp.y)) * gloss);
	float s = lp.x + (lp.y - y_top) * 0.45 - shine;
	c = mix(c, vec3(1.0), smoothstep(16.0, 2.0, abs(s)) * 0.85);
	COLOR = vec4(c, a);
}
