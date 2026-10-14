// Tests for src/art/carvariants.js, run under `jsc -m`. Fake canvases copy
// image bytes in and record putImageData output; fake sprites give the raw
// sprite 'a' (8 x 4, base paint #C81E1E, with a game mask), the raw sprite 'b'
// (no mask) and nothing else.

import { test, eq, ok, done } from './harness.js';
import { createVariants } from '../src/art/carvariants.js';
import { paintRamp, fadeHex, recolourPixels, splitMask } from '../src/art/sprite_paint.js';

const W = 8;
const H = 4;
const PAINT = '#C81E1E';
const GREEN = '#1E4D2B';
const RAMP = paintRamp(PAINT);
// Paint steps of rows 1 and 2: 0..6 then 4, so every step appears.
const STEPS = [0, 1, 2, 3, 4, 5, 6, 4];
const OUTLINE = [20, 5, 5, 255];
const CHROME = [230, 230, 230, 255];

function idx(x, y) {
	return y * W + x;
}

function setPx(arr, i, rgba) {
	arr[i * 4] = rgba[0];
	arr[i * 4 + 1] = rgba[1];
	arr[i * 4 + 2] = rgba[2];
	arr[i * 4 + 3] = rgba[3];
}

// Sprite 'a': row 0 empty, rows 1 and 2 paint, row 3 one chrome pixel then outline.
function makeSpriteA() {
	const px = new Uint8ClampedArray(W * H * 4);
	const mask = new Uint8ClampedArray(W * H * 4);
	for (let y = 1; y <= 2; y++) {
		for (let x = 0; x < W; x++) {
			const s = STEPS[x];
			setPx(px, idx(x, y), [RAMP[s][0], RAMP[s][1], RAMP[s][2], 255]);
			setPx(mask, idx(x, y), [1, s, 0, 255]);
		}
	}
	setPx(px, idx(0, 3), CHROME);
	setPx(mask, idx(0, 3), [3, 0, 0, 255]);
	for (let x = 1; x < W; x++) {
		setPx(px, idx(x, 3), OUTLINE);
	}
	return { px: px, mask: mask };
}

// Sprite 'b': a plain outline sprite with no mask.
function makeSpriteB() {
	const px = new Uint8ClampedArray(W * H * 4);
	for (let i = 0; i < W * H; i++) {
		setPx(px, i, OUTLINE);
	}
	return px;
}

// Canvas fake: drawImage copies img.px into the buffer, getImageData reads it,
// putImageData stores its bytes in canvas.out.
function makeCanvas(w, h) {
	const buf = new Uint8ClampedArray(w * h * 4);
	const canvas = { width: w, height: h, out: null };
	canvas.getContext = function () {
		return {
			drawImage: function (img) {
				buf.set(img.px);
			},
			getImageData: function () {
				return { data: buf };
			},
			createImageData: function (cw, ch) {
				return { data: new Uint8ClampedArray(cw * ch * 4), width: cw, height: ch };
			},
			putImageData: function (imgData) {
				canvas.out = new Uint8ClampedArray(imgData.data);
			},
		};
	};
	return canvas;
}

const ENV = {
	makeCanvas: function (w, h) {
		return makeCanvas(w, h);
	},
};

const SPR_A = { px: makeSpriteA().px, width: W, height: H };
const MASK_A = { px: makeSpriteA().mask, width: W, height: H };
const SPR_B = { px: makeSpriteB(), width: W, height: H };

// Fake sprites: 'a' with mask and paint, 'b' without a mask. Anything else is not loaded.
function makeSprites() {
	const table = {
		a: { img: SPR_A, mask: MASK_A, meta: { paint: PAINT, mask: 'a_mask.png' } },
		b: { img: SPR_B, mask: null, meta: { paint: PAINT } },
	};
	return {
		has: function (k) {
			return Object.prototype.hasOwnProperty.call(table, k);
		},
		size: function (k) {
			return table[k] ? { w: W, h: H } : null;
		},
		meta: function (k) {
			return table[k] ? Object.assign({}, table[k].meta) : null;
		},
		image: function (k) {
			return table[k] ? table[k].img : null;
		},
		maskImage: function (k) {
			return table[k] && table[k].mask ? table[k].mask : null;
		},
	};
}

function pixelAt(canvas, i) {
	return [canvas.out[i * 4], canvas.out[i * 4 + 1], canvas.out[i * 4 + 2], canvas.out[i * 4 + 3]];
}

// --- get ---------------------------------------------------------------------

test('get with the base paint and wear 0 returns the raw sprite and builds nothing', () => {
	const v = createVariants(ENV, makeSprites());
	const r = v.get('a', PAINT, 0);
	ok(r !== null, 'loaded sprite');
	ok(r.img === SPR_A, 'raw image');
	eq(r.w, W, 'width');
	eq(r.h, H, 'height');
	eq(v.stats().built, 0, 'no pixel pass');
});

test('get is case-insensitive about the base paint', () => {
	const v = createVariants(ENV, makeSprites());
	ok(v.get('a', '#c81e1e', 0).img === SPR_A, 'lower case base is raw');
	eq(v.stats().built, 0, 'still no pass');
});

test('get in a new paint builds once, with step 4 in the new ramp and opaque alpha', () => {
	const v = createVariants(ENV, makeSprites());
	const r = v.get('a', GREEN, 0);
	eq(v.stats().built, 1, 'one pass');
	ok(r.img !== SPR_A, 'a new canvas');
	const want = paintRamp(GREEN)[4];
	const p = pixelAt(r.img, idx(4, 1));
	eq([p[0], p[1], p[2]], want, 'step 4 pixel in the new ramp');
	eq(p[3], 255, 'alpha 255');
});

test('asking for the same variant again does not build again', () => {
	const v = createVariants(ENV, makeSprites());
	const first = v.get('a', GREEN, 0);
	const second = v.get('a', GREEN, 0);
	eq(v.stats().built, 1, 'still one pass');
	ok(first === second, 'same cached entry');
	eq(v.stats().cached, 1, 'one cached entry');
});

test('wear 1 is dirt only: the bottom paint row takes the dirt colours, the top row none', () => {
	const v = createVariants(ENV, makeSprites());
	const r = v.get('a', PAINT, 1);
	eq(v.stats().built, 1, 'worn build counted');
	// CC21 DIRT: '#3f3022' on steps 0 to 2, '#5b4632' on steps 3 and up.
	const dark = [0x3f, 0x30, 0x22];
	const light = [0x5b, 0x46, 0x32];
	for (let x = 0; x < W; x++) {
		const p = pixelAt(r.img, idx(x, 2));
		const want = STEPS[x] >= 3 ? light : dark;
		eq([p[0], p[1], p[2]], want, 'bottom row dirt at x ' + x);
		const top = pixelAt(r.img, idx(x, 1));
		ok(!(top[0] === light[0] && top[1] === light[1] && top[2] === light[2]), 'no dirt on top row at x ' + x);
	}
});

test('a worn variant differs from the fade-only repaint (the wear layers ran)', () => {
	const v = createVariants(ENV, makeSprites());
	const r = v.get('a', PAINT, 3);
	const sp = splitMask(MASK_A.px, W, H);
	const fadeOnly = recolourPixels(SPR_A.px, sp.cls, sp.step, W, H, fadeHex(PAINT, 3));
	let differs = 0;
	for (let i = 0; i < W * H; i++) {
		const p = pixelAt(r.img, i);
		if (p[0] !== fadeOnly[i * 4] || p[1] !== fadeOnly[i * 4 + 1] || p[2] !== fadeOnly[i * 4 + 2]) {
			differs += 1;
		}
	}
	ok(differs > 0, 'some pixel differs from the fade-only repaint');
});

test('a sprite with no mask returns the raw image for any paint and wear', () => {
	const v = createVariants(ENV, makeSprites());
	ok(v.get('b', GREEN, 0).img === SPR_B, 'new paint is raw');
	ok(v.get('b', GREEN, 3).img === SPR_B, 'worn is raw');
	eq(v.stats().built, 0, 'no pass for no mask');
});

test('get of a sprite that is not loaded returns null', () => {
	const v = createVariants(ENV, makeSprites());
	eq(v.get('zzz', GREEN, 0), null, 'unknown key');
});

test('LRU with max 2: the first of three paints is evicted and rebuilt, the latest is kept', () => {
	const v = createVariants(ENV, makeSprites(), 2);
	const P1 = '#1E4D2B';
	const P2 = '#2B4D1E';
	const P3 = '#4D1E2B';
	v.get('a', P1, 0);
	v.get('a', P2, 0);
	v.get('a', P3, 0);
	eq(v.stats().built, 3, 'three passes');
	eq(v.stats().cached, 2, 'only two kept');
	v.get('a', P3, 0);
	eq(v.stats().built, 3, 'the most recent one is kept');
	v.get('a', P1, 0);
	eq(v.stats().built, 4, 'the first one was evicted and rebuilt');
	v.get('a', P1, 0);
	eq(v.stats().built, 4, 'and now it is kept');
});

test('a hit moves a variant to the newest end, so the other one is evicted', () => {
	const v = createVariants(ENV, makeSprites(), 2);
	const P1 = '#1E4D2B';
	const P2 = '#2B4D1E';
	const P3 = '#4D1E2B';
	v.get('a', P1, 0);
	v.get('a', P2, 0);
	v.get('a', P1, 0); // hit: P1 is now the newest
	eq(v.stats().built, 2, 'hit does not build');
	v.get('a', P3, 0); // evicts P2, the oldest
	eq(v.stats().built, 3, 'third build');
	v.get('a', P1, 0);
	eq(v.stats().built, 3, 'P1 was kept');
	v.get('a', P2, 0);
	eq(v.stats().built, 4, 'P2 was evicted');
});

// --- light -------------------------------------------------------------------

test('light is white exactly where paint has step 5 or 6 and at the chrome pixel', () => {
	const v = createVariants(ENV, makeSprites());
	const lc = v.light('a');
	ok(lc !== null, 'light canvas');
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const i = idx(x, y);
			const p = pixelAt(lc, i);
			const shiny = (y === 1 || y === 2) && (x === 5 || x === 6);
			const chrome = y === 3 && x === 0;
			if (shiny || chrome) {
				eq(p, [255, 255, 255, 255], 'white at ' + x + ',' + y);
			} else {
				eq(p[3], 0, 'transparent at ' + x + ',' + y);
			}
		}
	}
});

test('light is null for a sprite with no mask, and not loaded sprites give null', () => {
	const v = createVariants(ENV, makeSprites());
	eq(v.light('b'), null, 'no mask');
	eq(v.light('zzz'), null, 'not loaded');
});

done();
