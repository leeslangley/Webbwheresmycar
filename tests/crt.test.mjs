// Tests for src/art/crt.js, run under jsc -m.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, lastSet } from './fakectx.js';
import { drawCrt } from '../src/art/crt.js';

// Arguments of every fillRect call, in order.
function rects(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('drawCrt makes exactly 240 scanline fillRect calls of height 1 on 1280x720', () => {
	const ctx = makeCtx();
	drawCrt(ctx, 1280, 720, 0);
	const scan = rects(ctx).filter(function (a) {
		return a[3] === 1;
	});
	eq(scan.length, 240, 'scanline count');
	for (let i = 0; i < scan.length; i++) {
		eq(scan[i][0], 0, 'scanline x');
		eq(scan[i][1], i * 3, 'scanline y every 3rd row');
		eq(scan[i][2], 1280, 'scanline width');
	}
});

test('drawCrt makes 240 to 245 fillRect calls in total', () => {
	const ctx = makeCtx();
	drawCrt(ctx, 1280, 720, 0);
	const n = count(ctx, 'fillRect');
	ok(n >= 240 && n <= 245, 'fillRect total ' + n);
});

test('drawCrt uses one radial gradient', () => {
	const ctx = makeCtx();
	drawCrt(ctx, 1280, 720, 0);
	eq(count(ctx, 'createRadialGradient'), 1, 'one radial gradient');
});

test('drawCrt save and restore are balanced', () => {
	const ctx = makeCtx();
	drawCrt(ctx, 1280, 720, 0);
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore');
});

test('drawCrt never draws outside the screen', () => {
	const ctx = makeCtx();
	drawCrt(ctx, 1280, 720, 0);
	const all = rects(ctx);
	ok(all.length > 0, 'some fillRect calls');
	for (let i = 0; i < all.length; i++) {
		const a = all[i];
		ok(a[0] >= 0, 'x not negative');
		ok(a[1] >= 0, 'y not negative');
		ok(a[0] + a[2] <= 1280, 'right edge inside width');
		ok(a[1] + a[3] <= 720, 'bottom edge inside height');
	}
});

test('two different t values give different flicker alpha', () => {
	const a = makeCtx();
	drawCrt(a, 1280, 720, 0);
	const b = makeCtx();
	drawCrt(b, 1280, 720, 1);
	const fa = lastSet(a, 'fillStyle');
	const fb = lastSet(b, 'fillStyle');
	ok(typeof fa === 'string' && typeof fb === 'string', 'flicker fillStyle is a colour string');
	ok(fa !== fb, 'flicker alpha differs: ' + fa + ' vs ' + fb);
	ok(JSON.stringify(a.calls) !== JSON.stringify(b.calls), 'logs differ');
});

done();
