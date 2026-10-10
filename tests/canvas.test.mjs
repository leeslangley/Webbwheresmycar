// Tests for ui/canvas.js (DESIGN.md 9.7): layout fitting, pointer mapping,
// portrait detection and canvas sizing. Runs under macOS `jsc -m`.

import { test, eq, near, throws, done } from './harness.js';
import { makeCtx } from './fakectx.js';
import {
	LOGICAL_W, LOGICAL_H, fitLayout, toLogical, isPortrait, applyLayout,
} from '../src/ui/canvas.js';

test('logical size is 1280x720', () => {
	eq(LOGICAL_W, 1280, 'LOGICAL_W');
	eq(LOGICAL_H, 720, 'LOGICAL_H');
});

test('fitLayout exact fit 1280x720 -> scale 1, no offset', () => {
	const l = fitLayout(1280, 720);
	eq(l.scale, 1, 'scale');
	eq(l.viewW, 1280, 'viewW');
	eq(l.viewH, 720, 'viewH');
	eq(l.offX, 0, 'offX');
	eq(l.offY, 0, 'offY');
});

test('fitLayout 2560x1440 -> scale 2, no offset', () => {
	const l = fitLayout(2560, 1440);
	eq(l.scale, 2, 'scale');
	eq(l.viewW, 2560, 'viewW');
	eq(l.viewH, 1440, 'viewH');
	eq(l.offX, 0, 'offX');
	eq(l.offY, 0, 'offY');
});

test('fitLayout 1000x1000 -> width-limited letterbox top and bottom', () => {
	const l = fitLayout(1000, 1000);
	near(l.scale, 0.78125, 1e-9, 'scale');
	near(l.viewW, 1000, 1e-9, 'viewW');
	near(l.viewH, 562.5, 1e-9, 'viewH');
	near(l.offX, 0, 1e-9, 'offX');
	near(l.offY, 218.75, 1e-9, 'offY');
});

test('fitLayout 844x390 iPhone landscape -> height-limited side bars', () => {
	const l = fitLayout(844, 390);
	near(l.scale, 390 / 720, 1e-4, 'scale');
	near(l.viewW, 1280 * (390 / 720), 1e-4, 'viewW');
	near(l.viewH, 390, 1e-4, 'viewH');
	near(l.offX, (844 - 1280 * (390 / 720)) / 2, 1e-4, 'offX');
	near(l.offY, 0, 1e-4, 'offY');
});

test('fitLayout rejects zero and negative sizes', () => {
	throws(() => fitLayout(0, 100), 'winW 0');
	throws(() => fitLayout(100, 0), 'winH 0');
	throws(() => fitLayout(-5, 720), 'winW negative');
	throws(() => fitLayout(1280, -1), 'winH negative');
});

test('toLogical maps the centre of a letterboxed view to 640,360', () => {
	const l = fitLayout(1000, 1000);
	const p = toLogical(l, l.offX + l.viewW / 2, l.offY + l.viewH / 2);
	near(p.x, 640, 1e-9, 'x');
	near(p.y, 360, 1e-9, 'y');
});

test('toLogical maps corners of the game rectangle', () => {
	const l = fitLayout(1000, 1000);
	near(toLogical(l, 0, l.offY).x, 0, 1e-9, 'left edge');
	near(toLogical(l, l.viewW, l.offY + l.viewH).x, 1280, 1e-9, 'right edge');
	near(toLogical(l, l.offX, l.offY + l.viewH).y, 720, 1e-9, 'bottom edge');
});

test('toLogical gives null for points in the letterbox bars', () => {
	const l = fitLayout(1000, 1000);
	eq(toLogical(l, 500, 100), null, 'top bar');
	eq(toLogical(l, 500, 900), null, 'bottom bar');
	const side = fitLayout(844, 390);
	eq(toLogical(side, -5, 200), null, 'left bar');
	eq(toLogical(side, 840, 200), null, 'right bar');
});

test('isPortrait only when taller than wide', () => {
	eq(isPortrait(390, 844), true, '390x844 is portrait');
	eq(isPortrait(844, 390), false, '844x390 is landscape');
	eq(isPortrait(500, 500), false, 'square is not portrait');
});

test('applyLayout 1280x720 dpr 2 -> 2560x1440 backing, scale*dpr transform', () => {
	const ctx = makeCtx();
	const canvas = { style: {}, width: 0, height: 0, getContext: function () { return ctx; } };
	const r = applyLayout(canvas, { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 2 });
	eq(canvas.width, 2560, 'canvas.width');
	eq(canvas.height, 1440, 'canvas.height');
	eq(canvas.style.position, 'absolute', 'style.position');
	eq(canvas.style.left, '0px', 'style.left');
	eq(canvas.style.top, '0px', 'style.top');
	eq(canvas.style.width, '1280px', 'style.width');
	eq(canvas.style.height, '720px', 'style.height');
	eq(r.dpr, 2, 'dpr');
	eq(r.layout.scale, 1, 'layout scale');
	eq(r.ctx, ctx, 'ctx returned');
	const calls = ctx.calls.filter(function (c) { return c[0] === 'setTransform'; });
	eq(calls.length, 1, 'exactly one setTransform');
	eq(calls[0][1], [2, 0, 0, 2, 0, 0], 'setTransform args');
});

test('applyLayout 844x390 dpr 3 -> letterboxed CSS size, scaled transform', () => {
	const ctx = makeCtx();
	const canvas = { style: {}, width: 0, height: 0, getContext: function () { return ctx; } };
	const r = applyLayout(canvas, { innerWidth: 844, innerHeight: 390, devicePixelRatio: 3 });
	const scale = 390 / 720;
	eq(canvas.width, Math.round(1280 * scale * 3), 'canvas.width');
	eq(canvas.height, Math.round(720 * scale * 3), 'canvas.height');
	const offX = (844 - 1280 * scale) / 2;
	eq(canvas.style.left, offX + 'px', 'style.left');
	eq(canvas.style.top, '0px', 'style.top');
	const calls = ctx.calls.filter(function (c) { return c[0] === 'setTransform'; });
	eq(calls[0][1], [scale * 3, 0, 0, scale * 3, 0, 0], 'setTransform args');
	eq(r.dpr, 3, 'dpr');
});

test('applyLayout caps devicePixelRatio at 3', () => {
	const ctx = makeCtx();
	const canvas = { style: {}, width: 0, height: 0, getContext: function () { return ctx; } };
	const r = applyLayout(canvas, { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 5 });
	eq(r.dpr, 3, 'dpr capped at 3');
	eq(canvas.width, 3840, 'canvas.width');
	eq(canvas.height, 2160, 'canvas.height');
	const calls = ctx.calls.filter(function (c) { return c[0] === 'setTransform'; });
	eq(calls[0][1], [3, 0, 0, 3, 0, 0], 'setTransform args');
});

test('applyLayout defaults devicePixelRatio to 1 when missing', () => {
	const ctx = makeCtx();
	const canvas = { style: {}, width: 0, height: 0, getContext: function () { return ctx; } };
	const r = applyLayout(canvas, { innerWidth: 1280, innerHeight: 720 });
	eq(r.dpr, 1, 'dpr default');
	eq(canvas.width, 1280, 'canvas.width');
	eq(canvas.height, 720, 'canvas.height');
});

test('applyLayout rejects an invalid window', () => {
	throws(function () {
		applyLayout({ style: {}, getContext: function () { return makeCtx(); } },
			{ innerWidth: 0, innerHeight: 720, devicePixelRatio: 2 });
	}, 'innerWidth 0 throws');
});

test('toLogical round-trips any in-view point', () => {
	const l = fitLayout(844, 390);
	const p = { x: 1024, y: 300 };
	const screenX = l.offX + p.x * l.scale;
	const screenY = l.offY + p.y * l.scale;
	const back = toLogical(l, screenX, screenY);
	near(back.x, 1024, 1e-9, 'x round trip');
	near(back.y, 300, 1e-9, 'y round trip');
});

done();
