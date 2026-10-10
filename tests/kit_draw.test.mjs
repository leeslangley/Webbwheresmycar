// Tests for src/ui/kit_draw.js, run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count, lastSet, anySet } from './fakectx.js';
import { PALETTE, font } from '../src/ui/theme.js';
import {
	panel, label, wrapLines, paragraph, button, bar, moneyText,
} from '../src/ui/kit_draw.js';

// True if the ctx recorded a call named `name` with exactly these args.
function hasCall(ctx, name, args) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] !== name || c[1].length !== args.length) {
			continue;
		}
		let same = true;
		for (let j = 0; j < args.length; j++) {
			if (c[1][j] !== args[j]) {
				same = false;
				break;
			}
		}
		if (same) {
			return true;
		}
	}
	return false;
}

function fontSizeOf(fontStr) {
	const m = String(fontStr).match(/(\d+(?:\.\d+)?)px/);
	return m ? parseFloat(m[1]) : -1;
}

test('panel default opts fills and strokes with ink border', () => {
	const ctx = makeCtx();
	panel(ctx, 0, 0, 100, 50);
	ok(count(ctx, 'fill') >= 1, 'at least one fill');
	ok(count(ctx, 'stroke') >= 1, 'at least one stroke');
	eq(lastSet(ctx, 'strokeStyle'), PALETTE.ink, 'strokeStyle is ink');
});

test('panel shadow:false makes exactly one fill call fewer', () => {
	const withShadow = makeCtx();
	panel(withShadow, 0, 0, 100, 50);
	const noShadow = makeCtx();
	panel(noShadow, 0, 0, 100, 50, { shadow: false });
	eq(count(noShadow, 'fill'), count(withShadow, 'fill') - 1, 'one fill fewer');
});

test('label returns a positive width and records the text', () => {
	const ctx = makeCtx();
	const w = label(ctx, 'Hello', 10, 10);
	ok(w > 0, 'width is positive');
	ok(texts(ctx).indexOf('Hello') !== -1, 'text appears in texts(ctx)');
});

test('label with maxW shrinks the font below the starting size', () => {
	const ctx = makeCtx();
	const long = 'A'.repeat(40);
	label(ctx, long, 0, 0, { size: 24, maxW: 50 });
	ok(fontSizeOf(lastSet(ctx, 'font')) < 24, 'final font size below 24');
	ok(fontSizeOf(lastSet(ctx, 'font')) >= 8, 'shrink floor of 8 respected');
});

test('label with maxW fits a short string exactly', () => {
	const ctx = makeCtx();
	const w = label(ctx, 'Hello wrap!', 0, 0, { size: 24, maxW: 100 });
	ok(w <= 100, 'width fits maxW, got ' + w);
});

test('wrapLines greedy fill', () => {
	const ctx = makeCtx();
	eq(wrapLines(ctx, 'aaa bbb ccc', 90, '20px X'), ['aaa bbb', 'ccc'], 'greedy wrap');
});

test('wrapLines gives an over-wide word its own line', () => {
	const ctx = makeCtx();
	const lines = wrapLines(ctx, 'a'.repeat(20) + ' b', 90, '20px X');
	eq(lines.length, 2, 'two lines');
});

test('wrapLines splits on newlines', () => {
	const ctx = makeCtx();
	eq(wrapLines(ctx, 'a\nb', 90, '20px X'), ['a', 'b'], 'newline split');
});

test('paragraph returns start y plus lines*lineH', () => {
	const ctx = makeCtx();
	const text = 'aaa bbb ccc ddd eee fff';
	const lines = wrapLines(ctx, text, 90, font('body', 20));
	const y0 = 100;
	const ret = paragraph(ctx, text, 10, y0, 90, { size: 20 });
	eq(ret, y0 + lines.length * 22, 'returned y is below the last line');
});

test('button draws its label text', () => {
	const ctx = makeCtx();
	button(ctx, { x: 10, y: 10, w: 120, h: 40, label: 'START' });
	ok(texts(ctx).indexOf('START') !== -1, 'label appears in texts(ctx)');
});

test('disabled button uses midgrey fill and dark label', () => {
	const ctx = makeCtx();
	button(ctx, { x: 10, y: 10, w: 120, h: 40, label: 'START', enabled: false });
	ok(anySet(ctx, 'fillStyle', PALETTE.midgrey), 'fillStyle midgrey');
	ok(anySet(ctx, 'fillStyle', PALETTE.darkgrey), 'label colour darkgrey');
});

test('hot button strokes a lamp outline', () => {
	const ctx = makeCtx();
	button(ctx, { x: 10, y: 10, w: 120, h: 40, label: 'START', hot: true });
	ok(anySet(ctx, 'strokeStyle', PALETTE.lamp), 'strokeStyle lamp');
});

test('bar fills proportionally to value/max', () => {
	const ctx = makeCtx();
	bar(ctx, 10, 10, 100, 20, 5, 10, '#f00');
	ok(hasCall(ctx, 'fillRect', [12, 12, 48, 16]), 'inner fill [12,12,48,16]');
});

test('bar with max 0 draws an empty fill', () => {
	const ctx = makeCtx();
	bar(ctx, 10, 10, 100, 20, 5, 0, '#f00');
	ok(hasCall(ctx, 'fillRect', [12, 12, 0, 16]), 'inner fill width 0');
});

test('moneyText formats pounds with commas', () => {
	eq(moneyText(1234), '£1,234', 'money format');
});

done();
