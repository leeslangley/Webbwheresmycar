// Tests for src/art/carfx.js (CC06), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import {
	drawContactShadow, drawReflection, drawShine, drawSteam, drawExhaust,
} from '../src/art/carfx.js';

// Index of the first recorded call with the given name, or -1.
function indexOf(ctx, name) {
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			return i;
		}
	}
	return -1;
}

// Index of the first recorded property assignment set:prop with value v, or -1.
function indexOfSet(ctx, prop, v) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'set:' + prop && c[1][0] === v) {
			return i;
		}
	}
	return -1;
}

// Args of every fillRect call, in order.
function fillRects(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('contact shadow draws two ellipses and two fills', () => {
	const ctx = makeCtx();
	drawContactShadow(ctx, 100, 200, 80, 2);
	eq(count(ctx, 'ellipse'), 2, 'two ellipse calls');
	eq(count(ctx, 'fill'), 2, 'two fill calls');
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'balanced save and restore');
});

test('contact shadow outer ellipse uses w*0.52 and p*5', () => {
	const ctx = makeCtx();
	drawContactShadow(ctx, 100, 200, 80, 2);
	const el = ctx.calls.filter(function (c) { return c[0] === 'ellipse'; });
	eq(el[0][1], [100, 200, 80 * 0.52, 2 * 5, 0, 0, Math.PI * 2], 'outer ellipse');
	eq(el[1][1], [100, 200, 80 * 0.42, 2 * 3, 0, 0, Math.PI * 2], 'inner ellipse');
});

test('reflection draws the car once, flipped, with the expected args', () => {
	const ctx = makeCtx();
	drawReflection(ctx, 'img', 100, 200, 80, 40);
	eq(count(ctx, 'drawImage'), 1, 'one drawImage call');
	eq(ctx.calls[indexOf(ctx, 'drawImage')][1], ['img', -40, -40, 80, 40], 'drawImage args');
	eq(count(ctx, 'clip'), 1, 'one clip call');
	eq(count(ctx, 'scale'), 1, 'one scale call');
	eq(ctx.calls[indexOf(ctx, 'scale')][1], [1, -1], 'vertical flip');
});

test('reflection sets smoothing off and alpha 0.16 before drawing', () => {
	const ctx = makeCtx();
	drawReflection(ctx, 'img', 100, 200, 80, 40);
	const draw = indexOf(ctx, 'drawImage');
	const smooth = indexOfSet(ctx, 'imageSmoothingEnabled', false);
	ok(smooth >= 0, 'imageSmoothingEnabled set false');
	ok(smooth < draw, 'smoothing set before drawImage');
	ok(anySet(ctx, 'globalAlpha', 0.16), 'globalAlpha 0.16 set');
	ok(indexOfSet(ctx, 'globalAlpha', 0.16) < draw, 'alpha set before drawImage');
});

test('shine returns false and draws nothing at t=0.8', () => {
	const ctx = makeCtx();
	const drawn = drawShine(ctx, 'layer', 100, 200, 80, 40, 0.8);
	eq(drawn, false, 'returns false');
	eq(count(ctx, 'clip'), 0, 'no clip');
	eq(count(ctx, 'drawImage'), 0, 'no drawImage');
});

test('shine returns true at t=0.2 with one clip and one drawImage of the layer', () => {
	const ctx = makeCtx();
	const drawn = drawShine(ctx, 'layer', 100, 200, 80, 40, 0.2);
	eq(drawn, true, 'returns true');
	eq(count(ctx, 'clip'), 1, 'one clip');
	eq(count(ctx, 'drawImage'), 1, 'one drawImage');
	eq(ctx.calls[indexOf(ctx, 'drawImage')][1], ['layer', 60, 160, 80, 40], 'layer drawn over the car');
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'balanced save and restore');
});

test('shine band moves right over the sweep', () => {
	const ctxEarly = makeCtx();
	drawShine(ctxEarly, 'layer', 100, 200, 80, 40, 0.2);
	const ctxLate = makeCtx();
	drawShine(ctxLate, 'layer', 100, 200, 80, 40, 0.6);
	const xEarly = ctxEarly.calls[indexOf(ctxEarly, 'moveTo')][1][0];
	const xLate = ctxLate.calls[indexOf(ctxLate, 'moveTo')][1][0];
	ok(xEarly < xLate, 'band x at t=0.2 is less than at t=0.6');
});

test('steam draws exactly 5 fillRect', () => {
	const ctx = makeCtx();
	drawSteam(ctx, 100, 200, 0.5, 2);
	eq(count(ctx, 'fillRect'), 5, 'five puffs');
});

test('exhaust draws exactly 4 fillRect', () => {
	const ctx = makeCtx();
	drawExhaust(ctx, 100, 200, 0.5, 2, -1);
	eq(count(ctx, 'fillRect'), 4, 'four puffs');
});

test('exhaust trails in the direction given by dir', () => {
	const left = makeCtx();
	drawExhaust(left, 100, 200, 0.5, 2, -1);
	const right = makeCtx();
	drawExhaust(right, 100, 200, 0.5, 2, 1);
	const sumLeft = fillRects(left).reduce(function (a, r) { return a + r[0]; }, 0);
	const sumRight = fillRects(right).reduce(function (a, r) { return a + r[0]; }, 0);
	ok(sumRight > sumLeft, 'dir +1 puffs sit further right than dir -1');
});

test('steam and exhaust fillRect positions and sizes are finite for several t', () => {
	const times = [0, 1.7, 99];
	for (let k = 0; k < times.length; k++) {
		const steam = makeCtx();
		drawSteam(steam, 100, 200, times[k], 2);
		const exhaust = makeCtx();
		drawExhaust(exhaust, 100, 200, times[k], 2, -1);
		const all = fillRects(steam).concat(fillRects(exhaust));
		for (let i = 0; i < all.length; i++) {
			for (let j = 0; j < 4; j++) {
				ok(Number.isFinite(all[i][j]), 'finite at t=' + times[k] + ' value ' + j);
			}
		}
	}
});

done();
