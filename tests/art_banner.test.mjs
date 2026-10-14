// Tests for src/art/banner.js (speech banner and portrait frame), run under
// macOS `jsc -m` with the recording fake context.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count, anySet } from './fakectx.js';
import { drawBanner, drawPortraitFrame } from '../src/art/banner.js';

const RECT = { x: 100, y: 40, w: 600, h: 96 };

// [x, y, w, h] of every fillRect call, in order.
function rects(ctx) {
	return ctx.calls
		.filter(function (c) { return c[0] === 'fillRect'; })
		.map(function (c) { return c[1]; });
}

test('banner draws inside save/restore and collects the upper-cased text', () => {
	const ctx = makeCtx();
	drawBanner(ctx, RECT, 'Boss, the kettle has a plan.', 0, { tailX: 160 });
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore');
	ok(texts(ctx).join('').indexOf('BOSS, THE KETTLE HAS A PLAN.') >= 0, 'upper-cased text drawn');
	ok(anySet(ctx, 'fillStyle', '#14102a'), 'ink used');
	ok(anySet(ctx, 'fillStyle', '#f8dcb8'), 'lightest peach used');
});

test('banner fillRects stay in its box and on the 4 px grid', () => {
	const ctx = makeCtx();
	drawBanner(ctx, RECT, 'Boss, the kettle has a plan.', 0, { tailX: 160 });
	const all = rects(ctx);
	ok(all.length > 0, 'some fillRect calls');
	for (const r of all) {
		ok(r[0] >= 100, 'x >= 100 for ' + r);
		ok(r[1] >= 40, 'y >= 40 for ' + r);
		ok(r[0] + r[2] <= 704, 'right edge inside for ' + r);
		ok(r[1] + r[3] <= 160, 'bottom inside for ' + r);
		ok(r[0] % 4 === 0 && r[1] % 4 === 0 && r[2] % 4 === 0 && r[3] % 4 === 0, 'grid multiple for ' + r);
	}
});

test('reveal 0.25 types exactly 10 characters, reveal 0 draws no text', () => {
	const ctx = makeCtx();
	drawBanner(ctx, RECT, 'Boss, the kettle has a plan.', 0, { tailX: 160, reveal: 0.25 });
	eq(texts(ctx).join(''), 'BOSS, THE ', 'first 10 characters, space kept');
	const none = makeCtx();
	drawBanner(none, RECT, 'Boss, the kettle has a plan.', 0, { tailX: 160, reveal: 0 });
	eq(texts(none).join(''), '', 'no text at reveal 0');
});

test('cursor blinks only while characters are still hidden', () => {
	const shown = makeCtx();
	drawBanner(shown, RECT, 'Boss, the kettle has a plan.', 0, { tailX: 160, reveal: 0.25 });
	const sizeCount = shown.calls.filter(function (c) {
		return c[0] === 'fillRect' && c[1][2] === 8 && c[1][3] === 8;
	}).length;
	eq(sizeCount, 1, 'cursor drawn at t=0 while hidden');
	const off = makeCtx();
	drawBanner(off, RECT, 'Boss, the kettle has a plan.', 0.25, { tailX: 160, reveal: 0.25 });
	const offCount = off.calls.filter(function (c) {
		return c[0] === 'fillRect' && c[1][2] === 8 && c[1][3] === 8;
	}).length;
	eq(offCount, 0, 'no cursor when floor(t*4) is odd');
	const full = makeCtx();
	drawBanner(full, RECT, 'Boss.', 0, { tailX: 160, reveal: 1 });
	const fullCount = full.calls.filter(function (c) {
		return c[0] === 'fillRect' && c[1][2] === 8 && c[1][3] === 8;
	}).length;
	eq(fullCount, 0, 'no cursor once everything is shown');
});

test('long text wraps to at most 3 lines and ends with ...', () => {
	const ctx = makeCtx();
	const long = 'Boss the kettle has a plan and the plan involves a very long list of things that will never fit on three lines at all really';
	drawBanner(ctx, RECT, long, 0, { tailX: 160 });
	const lines = texts(ctx);
	eq(lines.length, 3, 'three lines drawn');
	ok(lines[2].slice(-3) === '...', 'last line ends with ...');
});

test('the lowest fillRect (not the shadow) bottom is 40 + 96 + 20 = 156', () => {
	const ctx = makeCtx();
	drawBanner(ctx, RECT, 'Boss, the kettle has a plan.', 0, { tailX: 160 });
	const all = rects(ctx);
	let lowest = 0;
	for (let i = 1; i < all.length; i++) {
		lowest = Math.max(lowest, all[i][1] + all[i][3]);
	}
	eq(lowest, 156, 'tail bottom');
});

test('tail is stepped: INK ends at bx and bx + 16 on every row', () => {
	const ctx = makeCtx();
	// tailX 160 -> bx = 160 - 16 = 144; rows start at y = 136 + 4 * i
	drawBanner(ctx, RECT, 'Hi.', 0, { tailX: 160 });
	const all = rects(ctx);
	for (let i = 0; i <= 4; i++) {
		const y = 136 + 4 * i;
		ok(all.some(function (r) { return r[0] === 144 + 4 * i && r[1] === y && r[2] === 4 && r[3] === 4; }), 'left end on row ' + i);
		ok(all.some(function (r) { return r[0] === 160 && r[1] === y && r[2] === 4 && r[3] === 4; }), 'right end on row ' + i);
	}
});

test('portrait frame returns the inner rect and draws the name', () => {
	const ctx = makeCtx();
	const inner = drawPortraitFrame(ctx, { x: 60, y: 60, w: 160, h: 160 }, 'Dave');
	eq(inner, { x: 68, y: 68, w: 144, h: 144 }, 'inner rect');
	ok(texts(ctx).join('').indexOf('DAVE') >= 0, 'name drawn upper-cased');
	eq(count(ctx, 'save'), 1, 'one save');
	eq(count(ctx, 'restore'), 1, 'one restore');
	for (const r of rects(ctx)) {
		ok(r[0] % 4 === 0 && r[1] % 4 === 0 && r[2] % 4 === 0 && r[3] % 4 === 0, 'grid multiple for ' + r);
	}
});

done();
