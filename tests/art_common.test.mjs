// Tests for src/art/common.js, run under `jsc -m`.

import { test, eq, ok, throws, near, done } from './harness.js';
import { makeCtx, count, lastSet, anySet } from './fakectx.js';
import {
	roundedPoly, vgrad, circle, wheel, groundShadow,
	rustBlotch, smokePuff, blink, pulse,
} from '../src/art/common.js';

test('roundedPoly with 4 points: 4 arcTo, 1 moveTo, 1 closePath', () => {
	const ctx = makeCtx();
	roundedPoly(ctx, [[0, 0], [10, 0], [10, 10], [0, 10]], 2);
	eq(count(ctx, 'arcTo'), 4, '4 arcTo calls');
	eq(count(ctx, 'moveTo'), 1, '1 moveTo call');
	eq(count(ctx, 'closePath'), 1, '1 closePath call');
});

test('roundedPoly with 2 points throws', () => {
	const ctx = makeCtx();
	throws(() => roundedPoly(ctx, [[0, 0], [10, 0]], 2), '2 points');
	throws(() => roundedPoly(ctx, [], 2), 'empty points');
});

test('roundedPoly moveTo is the midpoint of last and first point', () => {
	const ctx = makeCtx();
	roundedPoly(ctx, [[0, 0], [10, 0], [10, 10], [0, 10]], 2);
	const mv = ctx.calls.filter(function (c) { return c[0] === 'moveTo'; })[0];
	eq(mv[1], [0, 5], 'midpoint of [0,10] and [0,0] is [0,5]');
});

test('vgrad returns a gradient with top and bottom stops', () => {
	const ctx = makeCtx();
	const g = vgrad(ctx, 0, 100, '#ff0000', '#0000ff');
	eq(g.stops, [[0, '#ff0000'], [1, '#0000ff']], 'two colour stops');
});

test('circle records one arc', () => {
	const ctx = makeCtx();
	circle(ctx, 5, 7, 3);
	eq(count(ctx, 'arc'), 1, 'one arc call');
	eq(count(ctx, 'beginPath'), 1, 'one beginPath call');
});

test('wheel with dim false draws 5 spoke lineTo calls', () => {
	const ctx = makeCtx();
	wheel(ctx, 0, 0, 10, 1.5, false);
	eq(count(ctx, 'lineTo'), 5, '5 spoke lineTo calls');
	eq(count(ctx, 'moveTo'), 5, '5 spoke moveTo calls');
});

test('wheel with dim true draws no spokes', () => {
	const ctx = makeCtx();
	wheel(ctx, 0, 0, 10, 1.5, true);
	eq(count(ctx, 'lineTo'), 0, 'no lineTo calls when dim');
});

test('wheel always draws at least 3 arcs (tyre, rim, hub)', () => {
	const ctxA = makeCtx();
	wheel(ctxA, 0, 0, 10, 0, false);
	ok(count(ctxA, 'arc') >= 3, '3+ arcs when lit');
	const ctxB = makeCtx();
	wheel(ctxB, 0, 0, 10, 0, true);
	ok(count(ctxB, 'arc') >= 3, '3+ arcs when dim');
});

test('groundShadow calls ellipse', () => {
	const ctx = makeCtx();
	groundShadow(ctx, 0, 0, 50, 4);
	eq(count(ctx, 'ellipse'), 1, 'one ellipse call');
	eq(lastSet(ctx, 'fillStyle'), 'rgba(0,0,0,0.35)', 'default shadow colour');
});

test('rustBlotch sets globalAlpha 0.55 and uses the rust colour', () => {
	const ctx = makeCtx();
	rustBlotch(ctx, 10, 20, 5);
	eq(lastSet(ctx, 'globalAlpha'), 0.55, 'globalAlpha 0.55');
	ok(anySet(ctx, 'fillStyle', '#8a4b1f'), 'rust fill colour');
	eq(count(ctx, 'arc'), 2, 'two overlapping circles');
});

test('smokePuff draws 3 arcs', () => {
	const ctx = makeCtx();
	smokePuff(ctx, 0, 0, 1);
	eq(count(ctx, 'arc'), 3, 'three puff circles');
});

test('blink timing', () => {
	ok(blink(3.9, 4, 0.15) === true, '3.9 is inside the last 0.15s');
	ok(blink(3.8, 4, 0.15) === false, '3.8 is outside the last 0.15s');
	ok(blink(7.95) === true, 'wraps into the second period');
	ok(blink(0, 4, 0.15) === false, 'start of the period is off');
});

test('pulse timing', () => {
	near(pulse(0, 2), 0.5, 1e-9, 'starts at the middle');
	near(pulse(0.5, 2), 1, 1e-9, 'quarter period is the peak');
	near(pulse(1, 2), 0.5, 1e-9, 'half period is the middle again');
	near(pulse(1.5, 2), 0, 1e-9, 'three quarters is the trough');
});

done();
