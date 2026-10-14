// Tests for src/art/showroom.js, run under `jsc -m`.

import { test, ok, eq, throws, done } from './harness.js';
import { makeCtx, count, anySet, texts } from './fakectx.js';
import { drawStage } from '../src/art/showroom.js';

const KINDS = ['showroom', 'garage', 'auction'];
const RECTS = [
	{ x: 632, y: 168, w: 596, h: 232 },
	{ x: 496, y: 154, w: 728, h: 230 },
	{ x: 120, y: 100, w: 1040, h: 260 },
];

// Index of the first recorded call with the given method name, or -1.
function indexOfCall(ctx, name) {
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			return i;
		}
	}
	return -1;
}

// Every value assigned to fillStyle, in order.
function fillStyles(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:fillStyle') {
			out.push(ctx.calls[i][1][0]);
		}
	}
	return out;
}

// The fillStyle in force at the first fillRect call.
function firstFill(ctx) {
	const iFill = indexOfCall(ctx, 'fillRect');
	let colour;
	for (let k = 0; k < iFill; k++) {
		if (ctx.calls[k][0] === 'set:fillStyle') {
			colour = ctx.calls[k][1][0];
		}
	}
	return colour;
}

// Draws one stage on a fresh fake ctx and returns the ctx.
function drawStageCtx(kind, r, t) {
	const ctx = makeCtx();
	drawStage(ctx, r, kind, t);
	return ctx;
}

test('every kind opens with save, rect and clip before the first fillRect', () => {
	for (let k = 0; k < KINDS.length; k++) {
		for (let j = 0; j < RECTS.length; j++) {
			const ctx = makeCtx();
			drawStage(ctx, RECTS[j], KINDS[k], 0);
			const msg = KINDS[k] + ' rect ' + j;
			eq(ctx.calls[0][0], 'save', msg + ' first call');
			const iRect = indexOfCall(ctx, 'rect');
			const iClip = indexOfCall(ctx, 'clip');
			const iFill = indexOfCall(ctx, 'fillRect');
			ok(iRect >= 0 && iRect < iClip && iClip < iFill, msg + ' rect, clip, fillRect order');
		}
	}
});

test('every kind draws at least 8 rects', () => {
	for (let k = 0; k < KINDS.length; k++) {
		for (let j = 0; j < RECTS.length; j++) {
			const ctx = makeCtx();
			drawStage(ctx, RECTS[j], KINDS[k], 0);
			ok(count(ctx, 'fillRect') >= 8, KINDS[k] + ' rect ' + j + ' fillRect count');
		}
	}
});

test('returns the stand points from the rect for each kind', () => {
	for (let k = 0; k < KINDS.length; k++) {
		for (let j = 0; j < RECTS.length; j++) {
			const r = RECTS[j];
			const res = drawStage(makeCtx(), r, KINDS[k], 0);
			const msg = KINDS[k] + ' rect ' + j;
			eq(res.centerX, r.x + r.w / 2, msg + ' centerX');
			eq(res.floorY, r.y + Math.round(r.h * 0.78), msg + ' floorY');
			eq(res.groundY, r.y + Math.round(r.h * 0.86), msg + ' groundY');
			ok(res.groundY > res.floorY, msg + ' groundY below floorY');
			ok(res.groundY >= r.y && res.groundY < r.y + r.h, msg + ' groundY inside r');
		}
	}
});

test('the first colour differs between the three kinds', () => {
	const r = RECTS[1];
	const first = KINDS.map(function (kind) {
		return firstFill(drawStageCtx(kind, r, 0));
	});
	ok(first[0] !== first[1], 'showroom and garage first colour');
	ok(first[0] !== first[2], 'showroom and auction first colour');
	ok(first[1] !== first[2], 'garage and auction first colour');
});

test('garage strip light dims on flicker frames', () => {
	const r = RECTS[1];
	// t = 0 gives sin(0) = 0, no flicker. t = 0.0505 gives sin(1.5655), above 0.92.
	const steady = drawStageCtx('garage', r, 0);
	const flick = drawStageCtx('garage', r, 0.0505);
	ok(!anySet(steady, 'globalAlpha', 0.55), 'steady frame does not dim');
	ok(anySet(flick, 'globalAlpha', 0.55), 'flicker frame dims to 0.55');
});

test('an unknown kind throws', () => {
	throws(function () {
		drawStage(makeCtx(), RECTS[0], 'lobby', 0);
	}, 'unknown kind should throw');
	throws(function () {
		drawStage(makeCtx(), RECTS[0], 'toString', 0);
	}, 'inherited property name should throw');
});

test('save and restore calls balance for every kind', () => {
	for (let k = 0; k < KINDS.length; k++) {
		const ctx = drawStageCtx(KINDS[k], RECTS[2], 0);
		eq(count(ctx, 'save'), count(ctx, 'restore'), KINDS[k] + ' save/restore balance');
	}
});

test('the ink frame is drawn after the clip is restored', () => {
	for (let k = 0; k < KINDS.length; k++) {
		const ctx = drawStageCtx(KINDS[k], RECTS[0], 0);
		const iRestore = indexOfCall(ctx, 'restore');
		const iStroke = indexOfCall(ctx, 'strokeRect');
		ok(iStroke > iRestore, KINDS[k] + ' strokeRect after restore');
		ok(anySet(ctx, 'strokeStyle', '#14102A'), KINDS[k] + ' ink frame colour');
		ok(anySet(ctx, 'lineWidth', 4), KINDS[k] + ' 4 px frame');
	}
});

test('only the showroom has the sign, and all text is ASCII', () => {
	const shop = texts(drawStageCtx('showroom', RECTS[0], 0));
	eq(shop.length, 1, 'showroom text count');
	eq(shop[0], 'WEBB WHEELS', 'showroom sign text');
	eq(texts(drawStageCtx('garage', RECTS[0], 0)).length, 0, 'garage has no text');
	eq(texts(drawStageCtx('auction', RECTS[0], 0)).length, 0, 'auction has no text');
	for (let i = 0; i < shop.length; i++) {
		ok(/^[\x20-\x7e]*$/.test(shop[i]), 'text is ASCII');
	}
});

done();
