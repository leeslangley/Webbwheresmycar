// Tests for src/ui/textfit.js, run under `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, count } from './fakectx.js';
import { ellipsize, fitOne, fitBlock, drawFitted, fitInRect } from '../src/ui/textfit.js';

// Every fillText call as [text, x, y], in order.
function drawn(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillText') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('fitOne keeps the largest size that fits', function () {
	const ctx = makeCtx();
	const r = fitOne(ctx, 'Hello', 100, { kind: 'body', maxPx: 28 });
	eq(r.px, 28, 'px');
	eq(r.w, 84, 'w');
	eq(r.text, 'Hello', 'text');
	eq(r.truncated, false, 'truncated');
});

test('fitOne shrinks then truncates at minPx', function () {
	const ctx = makeCtx();
	const r = fitOne(ctx, 'A'.repeat(20), 100, { kind: 'body', maxPx: 28 });
	eq(r.px, 22, 'px');
	eq(r.truncated, true, 'truncated');
	eq(r.text, 'AAAA...', 'text');
	ok(r.w <= 100, 'w within maxW');
});

test('fitOne title kind uses the title floor range', function () {
	const ctx = makeCtx();
	const r = fitOne(ctx, 'A'.repeat(5), 100, { kind: 'title', maxPx: 24 });
	eq(r.px, 24, 'px');
	eq(r.w, 72, 'w');
	eq(r.truncated, false, 'truncated');
});

test('ellipsize trims to a prefix plus three dots', function () {
	const ctx = makeCtx();
	eq(ellipsize(ctx, 'abcdefghij', 60, '20px X'), 'ab...', 'long text');
	eq(ellipsize(ctx, 'abc', 60, '20px X'), 'abc', 'short text unchanged');
	eq(ellipsize(ctx, 'abcdefghij', 20, '20px X'), '', 'even dots do not fit');
});

test('fitBlock accepts a size whose wrapped lines fit the box', function () {
	const ctx = makeCtx();
	const r = fitBlock(ctx, 'aaa bbb ccc ddd eee fff', 130, 200, { kind: 'body', maxPx: 28 });
	eq(r.truncated, false, 'truncated');
	ok(r.lines.length >= 1, 'has lines');
	for (let i = 0; i < r.lines.length; i++) {
		const width = r.lines[i].length * 0.6 * r.px;
		ok(width <= 130, 'line width within w: ' + r.lines[i]);
	}
	ok(r.lines.length * r.lineH <= 200, 'height fits');
	eq(r.h, r.lines.length * r.lineH, 'h is line block height');
});

test('fitBlock truncates with an ellipsis when height is too small', function () {
	const ctx = makeCtx();
	const r = fitBlock(ctx, 'the quick brown fox jumps over the lazy dog again and again', 130, 24,
		{ kind: 'body', maxPx: 22, minPx: 22 });
	eq(r.truncated, true, 'truncated');
	eq(r.lines.length, 1, 'one line kept');
	ok(r.lines[0].slice(-3) === '...', 'last line ends with ...');
	ok(r.h <= 24, 'height within box');
});

test('drawFitted draws one fillText per line inside the rect', function () {
	const ctx = makeCtx();
	const rect = { x: 10, y: 20, w: 100, h: 60 };
	const r = drawFitted(ctx, 'aaa bbb ccc ddd eee fff ggg hhh', rect, { kind: 'body', maxPx: 28 });
	const calls = drawn(ctx);
	eq(calls.length, r.lines.length, 'fillText count');
	eq(count(ctx, 'fillText'), r.lines.length, 'fillText count via helper');
	for (let i = 0; i < calls.length; i++) {
		ok(calls[i][2] >= rect.y && calls[i][2] <= rect.y + rect.h, 'y inside rect');
	}
});

test('drawFitted centre align uses rect centre x', function () {
	const ctx = makeCtx();
	const rect = { x: 10, y: 0, w: 100, h: 60 };
	drawFitted(ctx, 'Hi', rect, { kind: 'body', maxPx: 28, align: 'center' });
	const calls = drawn(ctx);
	eq(calls.length, 1, 'one line');
	eq(calls[0][1], 60, 'centre x');
});

test('fitInRect scales by the tighter axis and places the ground point', function () {
	const r = fitInRect(480, 170, { x: 0, y: 0, w: 600, h: 170 }, { pad: 10, maxScale: 1.15 });
	near(r.scale, 150 / 170, 1e-9, 'scale');
	eq(r.x, 300, 'x centre');
	eq(r.y, 160, 'bottom y');
});

done();
