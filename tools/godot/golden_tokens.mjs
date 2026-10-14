// Golden vectors for godot/ui/tokens.gd (GDF13): palette, colour, spacing, zones, type, motion,
// easing samples, lerp and clamp values, all computed by the JS reference (src/ui/tokens.js, src/ui/theme.js).
import { emit } from './golden_common.mjs';
import { PALETTE } from '../../src/ui/theme.js';
import { COLOR, SPACE, ZONES, FLOOR, TYPE, MOTION, EASE, ease, lerp, clamp01 } from '../../src/ui/tokens.js';

const SAMPLES = [-0.5, 0, 0.1, 0.25, 0.5, 0.75, 0.9, 1, 1.5];
const LERP_CASES = [[0, 10, 0.5], [2, 4, 0.25], [10, 0, 1.5]];
const CLAMP_CASES = [-1, 0.3, 2];

const eases = {};
for (const name of Object.keys(EASE)) {
	eases[name] = SAMPLES.map((u) => [u, ease(name, u)]);
}

emit({
	PALETTE,
	COLOR,
	SPACE,
	ZONES,
	FLOOR,
	TYPE,
	MOTION,
	eases,
	lerp: LERP_CASES.map(([a, b, u]) => [a, b, u, lerp(a, b, u)]),
	clamp01: CLAMP_CASES.map((u) => [u, clamp01(u)]),
});
