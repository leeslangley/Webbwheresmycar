// Tests for src/art/sprite_paint.js, run under `jsc -m`. A synthetic 100x40
// sprite: rows 10..34 opaque, body paint (mask 255) at x 5..94, rows 12..30.

import { test, eq, ok, near, throws, done } from './harness.js';
import {
	hexToRgb,
	lum,
	hashString,
	wearState,
	wearPixels,
	recolourPixels,
	WEAR_NAMES,
} from '../src/art/sprite_paint.js';

const W = 100;
const H = 40;
const BASE = '#C81E1E';
const GREEN = '#1E4D2B';
const BLACK = '#1C1C1C';
const RUST = [
	[107, 45, 20],
	[138, 59, 23],
	[168, 80, 30],
];
const PRIMER = [139, 143, 147];

function setPx(px, x, y, rgb) {
	const o = (y * W + x) * 4;
	px[o] = rgb[0];
	px[o + 1] = rgb[1];
	px[o + 2] = rgb[2];
	px[o + 3] = 255;
}

// makeSprite(): the synthetic car. Ramp [200,30,30] on the body; highlight at
// (20,14),(21,14); shadow at (20,28),(21,28); chrome outside the body; a dark
// unmasked outline pixel at (4,20) beside the body.
function makeSprite() {
	const px = new Uint8ClampedArray(W * H * 4);
	const mask = new Uint8ClampedArray(W * H);
	for (let y = 10; y <= 34; y++) {
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			const body = x >= 5 && x <= 94 && y >= 12 && y <= 30;
			if (body) {
				mask[i] = 255;
				setPx(px, x, y, [200, 30, 30]);
			} else {
				setPx(px, x, y, [230, 230, 230]);
			}
		}
	}
	setPx(px, 20, 14, [255, 235, 235]);
	setPx(px, 21, 14, [255, 235, 235]);
	setPx(px, 20, 28, [60, 5, 5]);
	setPx(px, 21, 28, [60, 5, 5]);
	setPx(px, 4, 20, [20, 5, 5]);
	return { px: px, mask: mask };
}

function rgbAt(px, x, y) {
	const o = (y * W + x) * 4;
	return [px[o], px[o + 1], px[o + 2]];
}

function alphaAt(px, x, y) {
	return px[(y * W + x) * 4 + 3];
}

function sameBytes(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

function isRust(rgb) {
	for (let k = 0; k < RUST.length; k++) {
		if (rgb[0] === RUST[k][0] && rgb[1] === RUST[k][1] && rgb[2] === RUST[k][2]) {
			return true;
		}
	}
	return false;
}

// countPixels(px, pred): visible pixels whose rgb satisfies pred.
function countPixels(px, pred) {
	let n = 0;
	for (let i = 0; i < W * H; i++) {
		if (px[i * 4 + 3] > 0 && pred([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]])) {
			n += 1;
		}
	}
	return n;
}

const SPRITE = makeSprite();
const SEED = 7;

// --- colour helpers ----------------------------------------------------------

test('hexToRgb parses #rrggbb and throws on anything else', () => {
	eq(hexToRgb('#1E4D2B'), [30, 77, 43], 'green');
	eq(hexToRgb('#c81e1e'), [200, 30, 30], 'lower case');
	throws(() => hexToRgb('1E4D2B'), 'no hash');
	throws(() => hexToRgb('#12345'), 'short');
	throws(() => hexToRgb('red'), 'name');
	throws(() => hexToRgb(undefined), 'undefined');
});

test('lum is the 0.299/0.587/0.114 weighted sum', () => {
	near(lum(0, 0, 0), 0, 1e-9, 'black');
	near(lum(255, 255, 255), 255, 1e-9, 'white');
	near(lum(200, 30, 30), 80.83, 1e-9, 'base paint');
});

test('hashString is FNV-1a 32 bit and unsigned', () => {
	eq(hashString('a'), 0xe40c292c, 'FNV-1a of a');
	eq(hashString(''), 2166136261, 'empty string is the offset basis');
	ok(hashString('car-7') >= 0, 'unsigned');
});

test('wearState maps condition to the four states', () => {
	eq(wearState(9), 0, 'mint at 9');
	eq(wearState(8), 0, 'mint at 8');
	eq(wearState(5), 1, 'worn at 5');
	eq(wearState(4.9), 2, 'tatty below 5');
	eq(wearState(2.5), 2, 'tatty at 2.5');
	eq(wearState(2.4), 3, 'wreck below 2.5');
	eq(wearState(0), 3, 'wreck at 0');
	eq(wearState(NaN), 0, 'NaN is mint');
	eq(wearState(undefined), 0, 'undefined is mint');
	eq(WEAR_NAMES, ['mint', 'worn', 'tatty', 'wreck'], 'names');
});

// --- recolour ----------------------------------------------------------------

test('recolour to the same hex keeps the ramp pixels (within 1)', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, BASE);
	const a = rgbAt(out, 30, 20);
	const b = rgbAt(SPRITE.px, 30, 20);
	for (let c = 0; c < 3; c++) {
		ok(Math.abs(a[c] - b[c]) <= 1, 'channel ' + c + ' within 1');
	}
});

test('recolour to green: ramp pixel becomes [30,77,43] (+-1)', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, GREEN);
	const rgb = rgbAt(out, 30, 20);
	near(rgb[0], 30, 1, 'red');
	near(rgb[1], 77, 1, 'green');
	near(rgb[2], 43, 1, 'blue');
});

test('recolour: highlight stays above the target and at most 255', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, GREEN);
	const rgb = rgbAt(out, 20, 14);
	const t = hexToRgb(GREEN);
	for (let c = 0; c < 3; c++) {
		ok(rgb[c] > t[c], 'channel ' + c + ' above target');
		ok(rgb[c] <= 255, 'channel ' + c + ' at most 255');
	}
});

test('recolour: shadow luminance is below the target luminance', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, GREEN);
	const rgb = rgbAt(out, 20, 28);
	const t = hexToRgb(GREEN);
	ok(lum(rgb[0], rgb[1], rgb[2]) < lum(t[0], t[1], t[2]), 'shadow darker than target');
});

test('recolour: unmasked chrome and every alpha are unchanged', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, GREEN);
	eq(rgbAt(out, 50, 11), [230, 230, 230], 'chrome pixel');
	for (let i = 0; i < W * H; i++) {
		eq(out[i * 4 + 3], SPRITE.px[i * 4 + 3], 'alpha at pixel ' + i);
	}
});

test('recolour: the dark outline beside the paint takes the new dark tone', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, GREEN);
	eq(rgbAt(out, 4, 20), [4, 9, 5], 'outline pixel recoloured');
});

test('recolour: input is not mutated', () => {
	const copy = new Uint8ClampedArray(SPRITE.px);
	recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, GREEN);
	ok(sameBytes(copy, SPRITE.px), 'input bytes unchanged');
});

test('recolour to black: no channel above 255 and none NaN', () => {
	const out = recolourPixels(SPRITE.px, SPRITE.mask, W, H, BASE, BLACK);
	for (let i = 0; i < out.length; i++) {
		ok(!Number.isNaN(out[i]), 'byte ' + i + ' not NaN');
		ok(out[i] <= 255 && out[i] >= 0, 'byte ' + i + ' in range');
	}
});

// --- wear --------------------------------------------------------------------

test('wear state 0 is an exact copy of the input', () => {
	const out = wearPixels(SPRITE.px, SPRITE.mask, W, H, 0, SEED);
	ok(sameBytes(out, SPRITE.px), 'state 0 equals input');
});

const WRECK = wearPixels(SPRITE.px, SPRITE.mask, W, H, 3, SEED);

test('wear state 3: at least 20 rust pixels', () => {
	const n = countPixels(WRECK, isRust);
	ok(n >= 20, 'rust pixel count ' + n);
});

test('wear state 3: at least 12 primer pixels', () => {
	const n = countPixels(WRECK, (rgb) => rgb[0] === PRIMER[0] && rgb[1] === PRIMER[1] && rgb[2] === PRIMER[2]);
	ok(n >= 12, 'primer pixel count ' + n);
});

test('wear: unmasked pixels and every alpha are unchanged', () => {
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			eq(alphaAt(WRECK, x, y), SPRITE.px[i * 4 + 3], 'alpha at ' + x + ',' + y);
			if (SPRITE.mask[i] !== 255) {
				eq(rgbAt(WRECK, x, y), rgbAt(SPRITE.px, x, y), 'unmasked rgb at ' + x + ',' + y);
			}
		}
	}
});

test('wear: same seed gives identical bytes, seed 1 and 2 differ', () => {
	const again = wearPixels(SPRITE.px, SPRITE.mask, W, H, 3, SEED);
	ok(sameBytes(again, WRECK), 'same seed identical');
	const a = wearPixels(SPRITE.px, SPRITE.mask, W, H, 3, 1);
	const b = wearPixels(SPRITE.px, SPRITE.mask, W, H, 3, 2);
	ok(!sameBytes(a, b), 'seed 1 and seed 2 differ');
});

test('wear: state 2 has fewer rust pixels than state 3', () => {
	const tatty = wearPixels(SPRITE.px, SPRITE.mask, W, H, 2, SEED);
	const r2 = countPixels(tatty, isRust);
	const r3 = countPixels(WRECK, isRust);
	ok(r2 < r3, 'tatty rust ' + r2 + ' < wreck rust ' + r3);
});

test('wear: input is not mutated', () => {
	const copy = new Uint8ClampedArray(SPRITE.px);
	wearPixels(SPRITE.px, SPRITE.mask, W, H, 3, SEED);
	ok(sameBytes(copy, SPRITE.px), 'input bytes unchanged');
});

done();
