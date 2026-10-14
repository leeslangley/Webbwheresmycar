// Tests for src/art/sprite_wear.js (CC21), run under `jsc -m`. A synthetic
// 100x60 sprite: body paint (cls 1, step 4) rows 10..49 and columns 10..89;
// chrome (cls 3) rows 52..54 and columns 10..89; glass (cls 4) rows 2..8 and
// columns 20..60; everything else transparent.
// RAMP is a fixture standing in for paintRamp('#C96F32') (CC04), which is not
// in this worktree. Only its step 4, the dossier colour, matters here.

import { test, eq, ok, done } from './harness.js';
import {
	hash2,
	applyDirt,
	applyRust,
	applyDents,
	applyPitting,
	applyCrack,
	wearLayers,
	DIRT,
	RUST,
	PIT,
	CRACK,
} from '../src/art/sprite_wear.js';

const W = 100;
const H = 60;
const N = W * H;
const PAINT_TOP = 10;
const PAINT_BOTTOM = 49;
const RAMP = ['#3b2440', '#5e3a4e', '#84503c', '#a9603a', '#c96f32', '#dd8a48', '#f1b56a'];
const PAINT_RGB = [0xc9, 0x6f, 0x32];
const CHROME_RGB = [200, 204, 210];
const GLASS_RGB = [60, 90, 110];

function makeSprite() {
	const px = new Uint8ClampedArray(N * 4);
	const cls = new Uint8Array(N);
	const step = new Uint8Array(N);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			let c = 0;
			let rgb = [0, 0, 0];
			if (y >= 10 && y <= 49 && x >= 10 && x <= 89) {
				c = 1;
				step[i] = 4;
				rgb = PAINT_RGB;
			} else if (y >= 52 && y <= 54 && x >= 10 && x <= 89) {
				c = 3;
				rgb = CHROME_RGB;
			} else if (y >= 2 && y <= 8 && x >= 20 && x <= 60) {
				c = 4;
				rgb = GLASS_RGB;
			}
			cls[i] = c;
			if (c !== 0) {
				px[i * 4] = rgb[0];
				px[i * 4 + 1] = rgb[1];
				px[i * 4 + 2] = rgb[2];
				px[i * 4 + 3] = 255;
			}
		}
	}
	return { px: px, cls: cls, step: step };
}

function copyBytes(px) {
	return new Uint8ClampedArray(px);
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

function hexAt(px, i) {
	const hex = (v) => (v < 16 ? '0' : '') + v.toString(16);
	return '#' + hex(px[i * 4]) + hex(px[i * 4 + 1]) + hex(px[i * 4 + 2]);
}

function countHex(px, indexes, hexes) {
	let n = 0;
	for (let k = 0; k < indexes.length; k++) {
		if (hexes.indexOf(hexAt(px, indexes[k])) >= 0) {
			n++;
		}
	}
	return n;
}

function indexesOf(cls, value) {
	const out = [];
	for (let i = 0; i < N; i++) {
		if (cls[i] === value) {
			out.push(i);
		}
	}
	return out;
}

function paintIndexes(cls) {
	const out = [];
	for (let i = 0; i < N; i++) {
		if (cls[i] === 1 || cls[i] === 2) {
			out.push(i);
		}
	}
	return out;
}

function changedIndexes(a, b) {
	const out = [];
	for (let i = 0; i < N; i++) {
		if (a[i * 4] !== b[i * 4] || a[i * 4 + 1] !== b[i * 4 + 1] || a[i * 4 + 2] !== b[i * 4 + 2]) {
			out.push(i);
		}
	}
	return out;
}

// hf as the module defines it, for this fixture's paint rows.
function hfOf(i) {
	const y = Math.floor(i / W);
	return (PAINT_BOTTOM - y) / (PAINT_BOTTOM - PAINT_TOP);
}

test('state 0 leaves every layer and the layered result equal', () => {
	const base = makeSprite();
	const a = copyBytes(base.px);
	const b = copyBytes(base.px);
	applyDirt(a, base.cls, base.step, W, H, 0, 7);
	applyRust(a, base.cls, base.step, W, H, 0, 7);
	applyDents(a, base.cls, base.step, W, H, 0, 7, RAMP);
	applyPitting(a, base.cls, base.step, W, H, 0, 7);
	applyCrack(a, base.cls, base.step, W, H, 0, 7);
	ok(sameBytes(a, base.px), 'individual layers at state 0');
	wearLayers(b, base.cls, base.step, W, H, 0, 7, RAMP);
	ok(sameBytes(b, base.px), 'wearLayers at state 0');
});

test('hash2 is in [0, 1), repeatable, and seeds 3 and 4 differ in at least 90 of 100', () => {
	let differ = 0;
	for (let x = 0; x < 10; x++) {
		for (let y = 0; y < 10; y++) {
			const v = hash2(x, y, 3);
			ok(v >= 0 && v < 1, 'hash2 in range at ' + x + ',' + y);
			eq(hash2(x, y, 3), v, 'hash2 repeatable at ' + x + ',' + y);
			if (hash2(x, y, 4) !== v) {
				differ++;
			}
		}
	}
	ok(differ >= 90, 'seeds 3 and 4 differ in ' + differ + ' of 100');
});

test('applyDirt: fraction rises with state, dirt only low on the body', () => {
	const frac = [];
	for (let s = 1; s <= 3; s++) {
		const sp = makeSprite();
		const paint = paintIndexes(sp.cls);
		applyDirt(sp.px, sp.cls, sp.step, W, H, s, 7);
		const dirt = paint.filter((i) => hexAt(sp.px, i) === DIRT[0] || hexAt(sp.px, i) === DIRT[1]);
		frac[s] = dirt.length / paint.length;
		for (let k = 0; k < dirt.length; k++) {
			ok(hfOf(dirt[k]) < 0.46, 'state ' + s + ' dirt pixel high on body at ' + dirt[k]);
		}
		if (s === 3) {
			// Fixture step is 4 (>= 3), so every dirt pixel takes DIRT[0].
			eq(countHex(sp.px, paint, [DIRT[1]]), 0, 'step 4 dirt uses DIRT[0] only');
		}
	}
	ok(frac[1] > 0, 'state 1 has dirt');
	ok(frac[1] < frac[2], 'state 2 has more dirt than 1');
	ok(frac[2] < frac[3], 'state 3 has more dirt than 2');
	ok(frac[3] >= 0.25 && frac[3] <= 0.55, 'state 3 dirt fraction ' + frac[3]);
});

test('applyRust: state 1 none, state 2 has RUST[0], all low, state 3 more', () => {
	const count = (s) => {
		const sp = makeSprite();
		const paint = paintIndexes(sp.cls);
		applyRust(sp.px, sp.cls, sp.step, W, H, s, 7);
		const rust = paint.filter((i) => RUST.indexOf(hexAt(sp.px, i)) >= 0);
		return { sp: sp, paint: paint, rust: rust };
	};
	eq(count(1).rust.length, 0, 'state 1 has no rust');
	const two = count(2);
	ok(countHex(two.sp.px, two.paint, [RUST[0]]) >= 1, 'state 2 has a RUST[0] pixel');
	for (let k = 0; k < two.rust.length; k++) {
		ok(hfOf(two.rust[k]) < 0.65, 'state 2 rust pixel high on body');
	}
	const three = count(3);
	for (let k = 0; k < three.rust.length; k++) {
		ok(hfOf(three.rust[k]) < 0.65, 'state 3 rust pixel high on body');
	}
	ok(three.rust.length > two.rust.length, 'state 3 rust ' + three.rust.length + ' > state 2 ' + two.rust.length);
});

test('applyDents: state 3 changes 4 to 24 pixels, state 2 changes none', () => {
	const sp = makeSprite();
	const before = copyBytes(sp.px);
	applyDents(sp.px, sp.cls, sp.step, W, H, 3, 7, RAMP);
	const changed = changedIndexes(before, sp.px);
	ok(changed.length >= 4 && changed.length <= 24, 'state 3 dents changed ' + changed.length);
	const two = makeSprite();
	const twoBefore = copyBytes(two.px);
	applyDents(two.px, two.cls, two.step, W, H, 2, 7, RAMP);
	ok(sameBytes(twoBefore, two.px), 'state 2 has no dents');
});

test('applyPitting: state 3 pits 8 to 30 percent of chrome, state 1 none', () => {
	const sp = makeSprite();
	const chrome = indexesOf(sp.cls, 3);
	applyPitting(sp.px, sp.cls, sp.step, W, H, 3, 7);
	const pitted = countHex(sp.px, chrome, [PIT]);
	const ratio = pitted / chrome.length;
	ok(ratio >= 0.08 && ratio <= 0.3, 'state 3 pitting ratio ' + ratio);
	const one = makeSprite();
	applyPitting(one.px, one.cls, one.step, W, H, 1, 7);
	eq(countHex(one.px, chrome, [PIT]), 0, 'state 1 has no pitting');
});

test('applyCrack: state 3 draws 7 to 13 crack pixels on glass, state 2 none', () => {
	const sp = makeSprite();
	applyCrack(sp.px, sp.cls, sp.step, W, H, 3, 7);
	const all = [];
	for (let i = 0; i < N; i++) {
		all.push(i);
	}
	const cracks = all.filter((i) => hexAt(sp.px, i) === CRACK);
	ok(cracks.length >= 7 && cracks.length <= 13, 'state 3 crack pixels ' + cracks.length);
	for (let k = 0; k < cracks.length; k++) {
		eq(sp.cls[cracks[k]], 4, 'crack pixel is glass');
	}
	const two = makeSprite();
	applyCrack(two.px, two.cls, two.step, W, H, 2, 7);
	eq(all.filter((i) => hexAt(two.px, i) === CRACK).length, 0, 'state 2 has no crack');
});

test('applyCrack: a narrow glass strip is never cracked outside itself', () => {
	// 20x10 sprite, glass only at columns 8..11 rows 2..7: the crack line
	// (centre column 9 or 10, 13 wide) reaches past the strip on both sides.
	const w = 20;
	const h = 10;
	const px = new Uint8ClampedArray(w * h * 4);
	const cls = new Uint8Array(w * h);
	const step = new Uint8Array(w * h);
	for (let y = 2; y <= 7; y++) {
		for (let x = 8; x <= 11; x++) {
			const i = y * w + x;
			cls[i] = 4;
			px[i * 4] = GLASS_RGB[0];
			px[i * 4 + 1] = GLASS_RGB[1];
			px[i * 4 + 2] = GLASS_RGB[2];
			px[i * 4 + 3] = 255;
		}
	}
	applyCrack(px, cls, step, w, h, 3, 7);
	let cracked = 0;
	for (let i = 0; i < w * h; i++) {
		if (hexAt(px, i) === CRACK) {
			cracked++;
			eq(cls[i], 4, 'crack only on glass at ' + i);
		}
	}
	ok(cracked >= 1, 'strip got a crack');
});

test('wearLayers: same seed gives same bytes, seeds 1 and 2 differ', () => {
	const a = makeSprite();
	const b = makeSprite();
	const c = makeSprite();
	wearLayers(a.px, a.cls, a.step, W, H, 3, 1, RAMP);
	wearLayers(b.px, b.cls, b.step, W, H, 3, 1, RAMP);
	ok(sameBytes(a.px, b.px), 'seed 1 twice identical');
	wearLayers(c.px, c.cls, c.step, W, H, 3, 2, RAMP);
	ok(!sameBytes(a.px, c.px), 'seeds 1 and 2 differ');
});

test('wearLayers: returns px; alpha and other classes unchanged at every state', () => {
	for (let s = 0; s <= 3; s++) {
		const sp = makeSprite();
		const copy = copyBytes(sp.px);
		const out = wearLayers(sp.px, sp.cls, sp.step, W, H, s, 5, RAMP);
		ok(out === sp.px, 'state ' + s + ' returns px');
		for (let i = 0; i < N; i++) {
			ok(sp.px[i * 4 + 3] === copy[i * 4 + 3], 'state ' + s + ' alpha at ' + i);
			if (sp.cls[i] === 0) {
				ok(sp.px[i * 4] === copy[i * 4] && sp.px[i * 4 + 1] === copy[i * 4 + 1] &&
					sp.px[i * 4 + 2] === copy[i * 4 + 2], 'state ' + s + ' other class unchanged at ' + i);
			}
		}
	}
});

done();
