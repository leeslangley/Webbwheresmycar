// Tests for src/art/sprite_paint.js, run under `jsc -m`. A synthetic 6x2
// sprite: four paint pixels (steps 0, 2, 4, 6), one second-paint pixel
// (step 3), one chrome pixel, one transparent pixel and five unmasked outline
// pixels.

import { test, eq, ok, near, throws, done } from './harness.js';
import {
	hexToRgb,
	rgbToHex,
	paintRamp,
	fadeHex,
	wearState,
	WEAR_NAMES,
	hashString,
	splitMask,
	recolourPixels,
} from '../src/art/sprite_paint.js';

const W = 6;
const H = 2;
const ORANGE = '#C96F32';
const GREEN = '#1E4D2B';
const BLACK = '#000000';
const ORANGE_RAMP = ['#3e203d', '#59304e', '#7c4458', '#a25a53', '#c96f32', '#f4a36f', '#ffd3a3'];
const GREEN_RAMP = ['#0a121d', '#111d27', '#172c2f', '#1b3d31', '#1e4d2b', '#808d6c', '#c6c6a1'];
const OUTLINE = [20, 5, 5];
const CHROME = [230, 230, 230];

// Sprite pixel index i = y * W + x. Row 0: paint 0, paint 2, paint 4, paint 6,
// second paint 3, chrome. Row 1: transparent, then five outline pixels.
const PAINT_STEPS = [0, 2, 4, 6];

function setPx(arr, i, rgba) {
	arr[i * 4] = rgba[0];
	arr[i * 4 + 1] = rgba[1];
	arr[i * 4 + 2] = rgba[2];
	arr[i * 4 + 3] = rgba[3];
}

function makeSprite() {
	const px = new Uint8ClampedArray(W * H * 4);
	const mask = new Uint8ClampedArray(W * H * 4);
	const ramp = paintRamp(ORANGE);
	for (let k = 0; k < 4; k++) {
		const s = PAINT_STEPS[k];
		setPx(px, k, [ramp[s][0], ramp[s][1], ramp[s][2], 255]);
		setPx(mask, k, [1, s, 0, 255]);
	}
	setPx(px, 4, [ramp[3][0], ramp[3][1], ramp[3][2], 255]);
	setPx(mask, 4, [2, 3, 0, 255]);
	setPx(px, 5, [CHROME[0], CHROME[1], CHROME[2], 255]);
	setPx(mask, 5, [3, 0, 0, 255]);
	setPx(px, 6, [0, 0, 0, 0]);
	setPx(mask, 6, [0, 0, 0, 0]);
	for (let i = 7; i < 12; i++) {
		setPx(px, i, [OUTLINE[0], OUTLINE[1], OUTLINE[2], 255]);
		setPx(mask, i, [0, 0, 0, 0]);
	}
	return { px: px, mask: mask };
}

const SPRITE = makeSprite();
const SPLIT = splitMask(SPRITE.mask, W, H);

function rgbAt(px, i) {
	return [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]];
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

function withinOne(actual, expected, msg) {
	for (let k = 0; k < 3; k++) {
		ok(Math.abs(actual[k] - expected[k]) <= 1, msg + ' channel ' + k + ' got ' + actual[k] + ' want ' + expected[k]);
	}
}

function luma(rgb) {
	return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
}

// --- colour helpers ----------------------------------------------------------

test('hexToRgb parses #rrggbb and throws on anything else', () => {
	eq(hexToRgb('#1E4D2B'), [30, 77, 43], 'green');
	eq(hexToRgb('#c81e1e'), [200, 30, 30], 'lower case');
	throws(() => hexToRgb('1E4D2B'), 'no hash');
	throws(() => hexToRgb('#12345'), 'short');
	throws(() => hexToRgb('red'), 'name');
	throws(() => hexToRgb(undefined), 'undefined');
});

test('rgbToHex gives lower case #rrggbb and throws on bad channels', () => {
	eq(rgbToHex([201, 111, 50]), '#c96f32', 'orange');
	eq(rgbToHex([0, 0, 0]), '#000000', 'black');
	eq(rgbToHex([255, 255, 255]), '#ffffff', 'white');
	throws(() => rgbToHex([256, 0, 0]), 'channel above 255');
	throws(() => rgbToHex([1.5, 0, 0]), 'fractional channel');
});

test('paintRamp C96F32 matches the CB11 values (every channel within 1)', () => {
	const ramp = paintRamp(ORANGE);
	eq(ramp.length, 7, 'seven steps');
	for (let s = 0; s < 7; s++) {
		withinOne(ramp[s], hexToRgb(ORANGE_RAMP[s]), 'orange step ' + s);
	}
	eq(rgbToHex(ramp[4]), '#c96f32', 'step 4 is the base');
});

test('paintRamp 1E4D2B matches the CB11 values (every channel within 1)', () => {
	const ramp = paintRamp(GREEN);
	for (let s = 0; s < 7; s++) {
		withinOne(ramp[s], hexToRgb(GREEN_RAMP[s]), 'green step ' + s);
	}
});

test('paintRamp of a very dark base uses #202028 (step 4)', () => {
	eq(rgbToHex(paintRamp('#101010')[4]), '#202028', 'dark fallback');
});

test('paintRamp of white has non-decreasing luma', () => {
	const ramp = paintRamp('#ffffff');
	for (let s = 1; s < 7; s++) {
		ok(luma(ramp[s]) >= luma(ramp[s - 1]), 'luma step ' + s + ' not below step ' + (s - 1));
	}
});

test('paintRamp rejects bad hex', () => {
	throws(() => paintRamp('red'), 'name');
	throws(() => paintRamp('#12345'), 'short');
});

test('fadeHex mixes toward the faded tone by wear level', () => {
	eq(fadeHex('#C96F32', 0), '#c96f32', 'level 0 is the same colour');
	eq(fadeHex('#C96F32', 3), '#c08c64', 'level 3 is faded');
	throws(() => fadeHex('#C96F32', 4), 'level 4 throws');
	throws(() => fadeHex('#C96F32', -1), 'level -1 throws');
	throws(() => fadeHex('#C96F32', 1.5), 'fractional level throws');
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

test('hashString is FNV-1a 32 bit and unsigned', () => {
	eq(hashString('a'), 0xe40c292c, 'FNV-1a of a');
	eq(hashString(''), 2166136261, 'empty string is the offset basis');
	ok(hashString('car-7') >= 0, 'unsigned');
});

// --- mask split --------------------------------------------------------------

test('splitMask: cls is R and step is G where alpha is 255, else 0', () => {
	const m = new Uint8ClampedArray([1, 4, 0, 255, 1, 5, 0, 128, 3, 0, 0, 255]);
	const s = splitMask(m, 3, 1);
	eq(Array.from(s.cls), [1, 0, 3], 'cls');
	eq(Array.from(s.step), [4, 0, 0], 'step');
	throws(() => splitMask(m, 2, 1), 'wrong size throws');
});

// --- recolour ----------------------------------------------------------------

test('recolour: the four paint pixels equal rows 0, 2, 4, 6 of the target ramp', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, GREEN);
	const ramp = paintRamp(GREEN);
	for (let k = 0; k < 4; k++) {
		eq(rgbAt(out, k), ramp[PAINT_STEPS[k]], 'paint pixel ' + k);
		eq(rgbToHex(rgbAt(out, k)), GREEN_RAMP[PAINT_STEPS[k]], 'paint pixel ' + k + ' as hex');
	}
});

test('recolour: the second paint pixel is unchanged without hex2', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, GREEN);
	eq(rgbAt(out, 4), rgbAt(SPRITE.px, 4), 'cls 2 pixel');
});

test('recolour: the second paint pixel equals paintRamp(hex2)[3] with hex2', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, GREEN, '#2F3E8C');
	eq(rgbAt(out, 4), paintRamp('#2F3E8C')[3], 'cls 2 pixel from hex2');
});

test('recolour: chrome, transparent and outline pixels are unchanged', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, GREEN, '#2F3E8C');
	eq(rgbAt(out, 5), CHROME, 'chrome pixel');
	for (let i = 6; i < 12; i++) {
		eq(rgbAt(out, i), rgbAt(SPRITE.px, i), 'unmasked pixel ' + i);
	}
});

test('recolour: every alpha is unchanged', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, GREEN);
	for (let i = 0; i < W * H; i++) {
		eq(out[i * 4 + 3], SPRITE.px[i * 4 + 3], 'alpha at pixel ' + i);
	}
});

test('recolour: the input array is not mutated', () => {
	const fresh = makeSprite();
	const freshSplit = splitMask(fresh.mask, W, H);
	const copy = new Uint8ClampedArray(fresh.px);
	recolourPixels(fresh.px, freshSplit.cls, freshSplit.step, W, H, GREEN, '#2F3E8C');
	ok(sameBytes(copy, fresh.px), 'input bytes unchanged');
});

test('recolour to the same colour returns identical bytes', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, ORANGE);
	ok(sameBytes(out, SPRITE.px), 'orange to orange is identical');
});

test('recolour to black gives bytes within 0..255 and no NaN', () => {
	const out = recolourPixels(SPRITE.px, SPLIT.cls, SPLIT.step, W, H, BLACK);
	for (let i = 0; i < out.length; i++) {
		ok(!Number.isNaN(out[i]), 'byte ' + i + ' not NaN');
		ok(out[i] >= 0 && out[i] <= 255, 'byte ' + i + ' in range');
	}
});

test('recolour: a paint step outside 0..6 throws', () => {
	const badStep = new Uint8Array(SPLIT.step);
	badStep[0] = 7;
	throws(() => recolourPixels(SPRITE.px, SPLIT.cls, badStep, W, H, GREEN), 'step 7 throws');
});

done();
