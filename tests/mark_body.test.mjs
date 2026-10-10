// Tests for src/art/characters_mark.js (drawMarkBody, drawMark), run under
// macOS `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { drawMarkBody, drawMark } from '../src/art/characters_mark.js';

const OUTFITS = ['denim', 'hoodie'];
const TIMES = [0, 1.3, 3.95];

// Draw a body and return the recording context.
function body(t, outfit) {
	const ctx = makeCtx();
	drawMarkBody(ctx, t, outfit);
	return ctx;
}

// First recorded call with the given method name, or null.
function firstCall(ctx, name) {
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			return ctx.calls[i];
		}
	}
	return null;
}

test('drawMarkBody runs for both outfits at several times, save/restore balanced', () => {
	for (let o = 0; o < OUTFITS.length; o++) {
		for (let i = 0; i < TIMES.length; i++) {
			const ctx = makeCtx();
			let threw = null;
			try {
				drawMarkBody(ctx, TIMES[i], OUTFITS[o]);
			} catch (e) {
				threw = e;
			}
			eq(threw, null, OUTFITS[o] + ' at t=' + TIMES[i] + ' does not throw');
			eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
		}
	}
});

test('denim assigns jacket and tee colours, never the hoodie jacket', () => {
	const ctx = body(0, 'denim');
	ok(anySet(ctx, 'fillStyle', '#232f4a'), 'jacket #232f4a on fillStyle');
	ok(anySet(ctx, 'fillStyle', '#f4e9c8'), 'tee #f4e9c8 on fillStyle');
	ok(!anySet(ctx, 'fillStyle', '#6a1f2b'), 'no hoodie jacket colour');
});

test('hoodie assigns jacket and tee colours, never the denim jacket', () => {
	const ctx = body(0, 'hoodie');
	ok(anySet(ctx, 'fillStyle', '#6a1f2b'), 'jacket #6a1f2b on fillStyle');
	ok(anySet(ctx, 'fillStyle', '#e8d44a'), 'tee #e8d44a on fillStyle');
	ok(!anySet(ctx, 'fillStyle', '#232f4a'), 'no denim jacket colour');
});

test('the two outfits give different call logs', () => {
	const a = JSON.stringify(body(0, 'denim').calls);
	const b = JSON.stringify(body(0, 'hoodie').calls);
	ok(a !== b, 'denim vs hoodie logs differ');
});

test('body animates: t=0 and t=0.4 logs differ', () => {
	const a = JSON.stringify(body(0, 'denim').calls);
	const b = JSON.stringify(body(0.4, 'denim').calls);
	ok(a !== b, 'breathing/tap changes the log');
});

test('drawMark translates, scales, then draws body and head', () => {
	const ctx = makeCtx();
	drawMark(ctx, 640, 440, 1, 0);
	eq(firstCall(ctx, 'translate'), ['translate', [640, 440]], 'first translate [640, 440]');
	eq(firstCall(ctx, 'scale'), ['scale', [1, 1]], 'first scale [1, 1]');
	ok(anySet(ctx, 'fillStyle', '#f1c9a5'), 'head skin colour present');
	ok(anySet(ctx, 'fillStyle', '#232f4a'), 'jacket colour present');
});

test('drawMark scale follows the s argument', () => {
	const ctx = makeCtx();
	drawMark(ctx, 0, 0, 2, 0);
	eq(firstCall(ctx, 'scale'), ['scale', [2, 2]], 'first scale [2, 2]');
});

test('moods change the output of drawMark', () => {
	const a = makeCtx();
	const b = makeCtx();
	drawMark(a, 0, 0, 1, 0, 'normal');
	drawMark(b, 0, 0, 1, 0, 'worried');
	ok(JSON.stringify(a.calls) !== JSON.stringify(b.calls), 'normal vs worried differ');
});

test('unknown outfit names fall back to denim', () => {
	const a = JSON.stringify(body(0, 'denim').calls);
	const b = JSON.stringify(body(0, 'tuxedo').calls);
	eq(a, b, 'unknown outfit matches the denim log');
	const c = makeCtx();
	drawMark(c, 0, 0, 1, 0, 'normal', 'tuxedo');
	const d = makeCtx();
	drawMark(d, 0, 0, 1, 0, 'normal', 'denim');
	eq(JSON.stringify(c.calls), JSON.stringify(d.calls), 'drawMark fallback matches denim');
});

done();
