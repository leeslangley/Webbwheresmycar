// Tests for ui/transitions2.js (card GU16): TV-static wipe and page-turn.
// Runs under macOS `jsc -m`.

import { test, eq, near, ok, done } from './harness.js';
import { makeCtx, count, texts } from './fakectx.js';
import {
	staticCells, STATIC_COLORS, drawStaticWipe, drawPageTurn,
} from '../src/ui/transitions2.js';

// Drawing callbacks that record a marker into the fake ctx.
function scenes(ctx) {
	const c = { from: 0, to: 0 };
	c.drawFrom = function () {
		c.from += 1;
		ctx.fillText('from', 0, 0);
	};
	c.drawTo = function () {
		c.to += 1;
		ctx.fillText('to', 0, 0);
	};
	return c;
}

function argsOf(ctx, name) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

// Every 32x32 fillRect, with the fillStyle that was set just before it.
function staticFills(ctx) {
	const out = [];
	let style;
	for (let i = 0; i < ctx.calls.length; i++) {
		const name = ctx.calls[i][0];
		const args = ctx.calls[i][1];
		if (name === 'set:fillStyle') {
			style = args[0];
		} else if (name === 'fillRect' && args[2] === 32 && args[3] === 32) {
			out.push({ x: args[0], y: args[1], style: style });
		}
	}
	return out;
}

function fillStyles(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:fillStyle') {
			out.push(ctx.calls[i][1][0]);
		}
	}
	return out;
}

const STATIC_TR = { kind: 'static', start: 0, dur: 400 };
const PAGE_TR = { kind: 'page', start: 0, dur: 320 };

test('staticCells with coverage 0 is empty', () => {
	eq(staticCells(40, 23, 0, 5).length, 0, 'no cells');
});

test('staticCells with coverage 1 has every cell with a valid level', () => {
	const cells = staticCells(40, 23, 1, 5);
	eq(cells.length, 920, 'all cells');
	let allValid = true;
	for (let k = 0; k < cells.length; k++) {
		const lv = cells[k].level;
		if (!(lv === 0 || lv === 1 || lv === 2 || lv === 3)) {
			allValid = false;
		}
	}
	ok(allValid, 'every level is 0..3');
});

test('staticCells is deterministic for the same arguments', () => {
	eq(staticCells(40, 23, 0.5, 7), staticCells(40, 23, 0.5, 7), 'same list');
});

test('staticCells at coverage 0.5 keeps about half the cells', () => {
	const n = staticCells(40, 23, 0.5, 5).length;
	ok(n >= 400 && n <= 520, 'between 400 and 520, got ' + n);
});

test('staticCells changes with the frame', () => {
	const a = JSON.stringify(staticCells(40, 23, 0.5, 5));
	const b = JSON.stringify(staticCells(40, 23, 0.5, 6));
	ok(a !== b, 'different frame gives a different list');
});

test('STATIC_COLORS has four greys', () => {
	eq(STATIC_COLORS, ['#101010', '#505050', '#A0A0A0', '#F0F0F0'], 'colours');
});

test('drawStaticWipe at u 0.5 draws drawTo and full static', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawStaticWipe(ctx, STATIC_TR, 200, c.drawFrom, c.drawTo);
	eq(c.from, 0, 'drawFrom not called at exactly 0.5');
	eq(c.to, 1, 'drawTo once');
	const fills = staticFills(ctx);
	eq(fills.length, 920, 'all 920 cells at peak');
	let inPalette = true;
	for (let k = 0; k < fills.length; k++) {
		if (STATIC_COLORS.indexOf(fills[k].style) < 0) {
			inPalette = false;
		}
	}
	ok(inPalette, 'every static colour is in STATIC_COLORS');
});

test('drawStaticWipe at u 0.25 draws drawFrom and about half static', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawStaticWipe(ctx, STATIC_TR, 100, c.drawFrom, c.drawTo);
	eq(c.from, 1, 'drawFrom once');
	eq(c.to, 0, 'drawTo not called');
	const n = staticFills(ctx).length;
	ok(n >= 380 && n <= 540, 'about half static, got ' + n);
});

test('drawStaticWipe at u 0 draws no static', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawStaticWipe(ctx, STATIC_TR, 0, c.drawFrom, c.drawTo);
	eq(c.from, 1, 'drawFrom once');
	eq(staticFills(ctx).length, 0, 'no static at the start');
});

test('drawStaticWipe past the end draws only drawTo', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawStaticWipe(ctx, STATIC_TR, 1000, c.drawFrom, c.drawTo);
	eq(c.from, 0, 'no drawFrom');
	eq(c.to, 1, 'drawTo once');
	eq(count(ctx, 'fillRect'), 0, 'no static');
	eq(texts(ctx), ['to'], 'only the incoming screen');
});

test('drawStaticWipe with w 1560 uses 49 columns', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawStaticWipe(ctx, STATIC_TR, 200, c.drawFrom, c.drawTo, 1560, 720);
	eq(staticFills(ctx).length, 49 * 23, '49 x 23 cells at peak');
});

test('drawPageTurn at u 0.5 squashes the old page and draws the edge', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawPageTurn(ctx, PAGE_TR, 160, c.drawFrom, c.drawTo);
	eq(c.from, 1, 'drawFrom once');
	eq(c.to, 1, 'drawTo once');
	eq(texts(ctx), ['to', 'from'], 'new page underneath, old page on top');
	eq(argsOf(ctx, 'scale'), [[0.5, 1]], 'one scale call');
	eq(argsOf(ctx, 'fillRect'), [[640, 0, 24, 720], [637, 0, 3, 720]], 'shadow and edge');
	eq(fillStyles(ctx), ['rgba(0,0,0,0.150)', 'rgba(255,247,220,0.8)'], 'shadow and edge colours');
});

test('drawPageTurn at u 0.1 scales by 0.98', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawPageTurn(ctx, PAGE_TR, 32, c.drawFrom, c.drawTo);
	const s = argsOf(ctx, 'scale');
	eq(s.length, 1, 'one scale call');
	near(s[0][0], 0.98, 1e-9, 'scale x at u 0.1');
	eq(s[0][1], 1, 'scale y');
});

test('drawPageTurn past the end draws only drawTo with no transform', () => {
	const ctx = makeCtx();
	const c = scenes(ctx);
	drawPageTurn(ctx, PAGE_TR, 1000, c.drawFrom, c.drawTo);
	eq(c.from, 0, 'no drawFrom');
	eq(c.to, 1, 'drawTo once');
	eq(count(ctx, 'scale'), 0, 'no scale call');
	eq(texts(ctx), ['to'], 'only the incoming screen');
});

done();
