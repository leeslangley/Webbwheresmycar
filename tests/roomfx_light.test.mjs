// Tests for src/art/roomfx_light.js, run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, lastSet, anySet } from './fakectx.js';
import {
	flicker, glow, lampGlow, tvGlow, sunShaft, vignette, grain, glassGlare,
} from '../src/art/roomfx_light.js';

const RECT = { x: 100, y: 50, w: 120, h: 90 };

// JSON of the whole call log, for comparing two renders.
function logOf(ctx) {
	return JSON.stringify(ctx.calls);
}

// Argument lists of every fillRect call in the log, in order.
function fillRects(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

// True when every save call has a matching restore call.
function balanced(ctx) {
	return count(ctx, 'save') === count(ctx, 'restore');
}

test('flicker stays within [1 - depth, 1] over t = 0..20', () => {
	for (let i = 0; i <= 200; i++) {
		const f = flicker(i / 10, 4.1, 0.12);
		ok(f >= 0.88 - 1e-9 && f <= 1 + 1e-9, 'flicker ' + f + ' at t ' + i / 10);
	}
});

test('flicker is deterministic and actually varies', () => {
	eq(flicker(3.3, 1.3, 0.12), flicker(3.3, 1.3, 0.12), 'same call, same number');
	let lo = 2;
	let hi = -1;
	for (let i = 0; i <= 200; i++) {
		const f = flicker(i / 10, 1.3, 0.12);
		lo = Math.min(lo, f);
		hi = Math.max(hi, f);
	}
	ok(hi - lo > 0.05, 'flicker range too small: ' + (hi - lo));
});

test('glow makes one radial gradient and one fillRect of 2r x 2r', () => {
	const ctx = makeCtx();
	glow(ctx, 10, 20, 30, '#ffab55', 0.5);
	eq(count(ctx, 'createRadialGradient'), 1, 'one radial gradient');
	const rects = fillRects(ctx);
	eq(rects.length, 1, 'one fillRect');
	eq(rects[0], [-20, -10, 60, 60], 'fillRect (x-r, y-r, 2r, 2r)');
});

test('glow uses lighter compositing inside a balanced save/restore', () => {
	const ctx = makeCtx();
	glow(ctx, 10, 20, 30, '#ffab55', 0.5);
	ok(anySet(ctx, 'globalCompositeOperation', 'lighter'), 'composite set to lighter');
	ok(balanced(ctx), 'save and restore balance');
});

test('glow gradient stops are the colour at alpha, then at alpha 0', () => {
	const ctx = makeCtx();
	glow(ctx, 10, 20, 30, '#ffab55', 0.5);
	const g = lastSet(ctx, 'fillStyle');
	eq(g.stops.length, 2, 'two stops');
	eq(g.stops[0][0], 0, 'first stop at 0');
	eq(g.stops[0][1], 'rgba(255,171,85,0.5)', 'centre colour');
	eq(g.stops[1][0], 1, 'second stop at 1');
	eq(g.stops[1][1], 'rgba(255,171,85,0)', 'edge colour fully transparent');
});

test('lampGlow and tvGlow each draw one glow', () => {
	const a = makeCtx();
	lampGlow(a, 300, 200, 0.5);
	eq(count(a, 'createRadialGradient'), 1, 'lamp: one gradient');
	eq(fillRects(a).length, 1, 'lamp: one fillRect');
	const b = makeCtx();
	tvGlow(b, RECT, 0.5);
	eq(count(b, 'createRadialGradient'), 1, 'tv: one gradient');
	// Centre (160, 95), radius 0.9 * 120 = 108.
	eq(fillRects(b)[0], [52, -13, 216, 216], 'tv glow is centred on the rect');
});

test('vignette fills exactly (-144, 0, w + 288, h)', () => {
	const ctx = makeCtx();
	vignette(ctx, 1280, 720, 0.5);
	const rects = fillRects(ctx);
	eq(rects.length, 1, 'one fillRect');
	eq(rects[0], [-144, 0, 1568, 720], 'overdraw 144 px each side');
	ok(balanced(ctx), 'save and restore balance');
});

test('grain makes exactly n 2x2 fillRects with origins on the canvas', () => {
	const ctx = makeCtx();
	grain(ctx, 1280, 720, 1.0, 60);
	const rects = fillRects(ctx);
	eq(rects.length, 60, 'sixty specks');
	for (let i = 0; i < rects.length; i++) {
		const r = rects[i];
		eq(r[2], 2, 'speck ' + i + ' width');
		eq(r[3], 2, 'speck ' + i + ' height');
		ok(r[0] === Math.floor(r[0]) && r[1] === Math.floor(r[1]), 'speck ' + i + ' integer origin');
		ok(r[0] >= 0 && r[0] < 1280, 'speck ' + i + ' x ' + r[0] + ' off canvas');
		ok(r[1] >= 0 && r[1] < 720, 'speck ' + i + ' y ' + r[1] + ' off canvas');
	}
});

test('grain is identical for the same t and changes with t', () => {
	const a = makeCtx();
	const b = makeCtx();
	grain(a, 1280, 720, 1.0, 60);
	grain(b, 1280, 720, 1.0, 60);
	eq(logOf(a), logOf(b), 'same t, same call log');
	const c = makeCtx();
	grain(c, 1280, 720, 1.1, 60);
	ok(logOf(a) !== logOf(c), 'a new step of k moves the specks');
});

test('grain alternates white and black specks', () => {
	const ctx = makeCtx();
	grain(ctx, 1280, 720, 0.5, 4);
	ok(anySet(ctx, 'fillStyle', 'rgba(255,255,255,0.05)'), 'white speck colour');
	ok(anySet(ctx, 'fillStyle', 'rgba(0,0,0,0.06)'), 'black speck colour');
});

test('glassGlare clips once, fills the band and draws the scanlines', () => {
	const ctx = makeCtx();
	glassGlare(ctx, RECT, 0.5);
	eq(count(ctx, 'clip'), 1, 'one clip');
	ok(count(ctx, 'fill') === 1, 'one fill for the glare band');
	const lines = fillRects(ctx);
	const n = Math.floor(RECT.h / 6);
	ok(lines.length === n || lines.length === n + 1,
		'scanline count ' + lines.length + ' is ' + n + ' or ' + (n + 1));
	for (let i = 0; i < lines.length; i++) {
		eq(lines[i][0], RECT.x, 'scanline ' + i + ' x');
		eq(lines[i][2], RECT.w, 'scanline ' + i + ' width');
		eq(lines[i][3], 1, 'scanline ' + i + ' height');
		ok(lines[i][1] >= RECT.y && lines[i][1] < RECT.y + RECT.h, 'scanline ' + i + ' in rect');
	}
	ok(balanced(ctx), 'save and restore balance');
});

test('sunShaft fills its polygon once at the base alpha', () => {
	const ctx = makeCtx();
	sunShaft(ctx, [[0, 0], [100, 0], [120, 200], [20, 200]], 0);
	eq(count(ctx, 'fill'), 1, 'one fill');
	eq(lastSet(ctx, 'fillStyle'), 'rgba(255,226,184,0.1)', 'alpha 0.10 at t = 0');
	ok(anySet(ctx, 'globalCompositeOperation', 'lighter'), 'composite set to lighter');
	ok(balanced(ctx), 'save and restore balance');
});

done();
