// Tests for ui/canvas.js (DESIGN.md 9.7): layout fitting, pointer mapping,
// portrait detection and canvas sizing. Runs under macOS `jsc -m`.

import { test, eq, near, ok, throws, done } from './harness.js';
import { makeCtx } from './fakectx.js';
import {
	LOGICAL_W, LOGICAL_H, STAGE_W, FULL_W_MAX, BLEED_MAX, fullWidthFor, fitLayout,
	toFull, toLogical, isPortrait, applyLayout,
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

test('fitLayout 844x390 iPhone landscape: 1560 canvas, stage at 140', () => {
	const l = fitLayout(844, 390);
	eq(l.fullW, 1560, 'fullW');
	eq(l.stageX, 140, 'stageX');
	eq(l.stageW, 1280, 'stageW');
	eq(l.fullH, 720, 'fullH');
	near(l.scale, 390 / 720, 1e-9, 'scale');
	near(l.viewW, 845, 1e-6, 'viewW');
	near(l.viewH, 390, 1e-6, 'viewH');
	near(l.offX, -0.5, 1e-6, 'offX');
	near(l.offY, 0, 1e-6, 'offY');
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
	const wide = fitLayout(2560, 1080);
	eq(toLogical(wide, 50, 500), null, 'left bar');
	eq(toLogical(wide, 2457, 500), null, 'right bar');
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

test('applyLayout 844x390 dpr 3 -> 1560-wide canvas overhanging by half a pixel', () => {
	const ctx = makeCtx();
	const canvas = { style: {}, width: 0, height: 0, getContext: function () { return ctx; } };
	const r = applyLayout(canvas, { innerWidth: 844, innerHeight: 390, devicePixelRatio: 3 });
	eq(canvas.width, 2535, 'canvas.width');
	eq(canvas.height, 1170, 'canvas.height');
	near(parseFloat(canvas.style.left), -0.5, 1e-6, 'style.left');
	eq(canvas.style.top, '0px', 'style.top');
	near(parseFloat(canvas.style.width), 845, 1e-6, 'style.width');
	eq(canvas.style.height, '390px', 'style.height');
	const calls = ctx.calls.filter(function (c) { return c[0] === 'setTransform'; });
	eq(calls.length, 1, 'one setTransform');
	const t = calls[0][1];
	near(t[0], 1.625, 1e-9, 'a');
	near(t[1], 0, 1e-9, 'b');
	near(t[2], 0, 1e-9, 'c');
	near(t[3], 1.625, 1e-9, 'd');
	near(t[4], 0, 1e-9, 'e');
	near(t[5], 0, 1e-9, 'f');
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
	const screenX = l.offX + (p.x + l.stageX) * l.scale;
	const screenY = l.offY + p.y * l.scale;
	near(screenX, 630, 1e-6, 'client x of stage point');
	near(screenY, 162.5, 1e-6, 'client y of stage point');
	const back = toLogical(l, screenX, screenY);
	near(back.x, 1024, 1e-9, 'x round trip');
	near(back.y, 300, 1e-9, 'y round trip');
});

test('toLogical round-trips points in the left and right strips', () => {
	const l = fitLayout(844, 390);
	const pts = [{ x: -100, y: 300 }, { x: 1380, y: 300 }];
	for (let i = 0; i < pts.length; i++) {
		const screenX = l.offX + (pts[i].x + l.stageX) * l.scale;
		const screenY = l.offY + pts[i].y * l.scale;
		const back = toLogical(l, screenX, screenY);
		ok(back !== null, 'strip point ' + i + ' is inside the canvas');
		near(back.x, pts[i].x, 1e-9, 'strip x round trip ' + i);
		near(back.y, pts[i].y, 1e-9, 'strip y round trip ' + i);
	}
});

test('fullWidthFor: 16:9 and narrower windows keep 1280', () => {
	const sizes = [[1280, 720], [667, 375], [1366, 768], [1024, 768], [1000, 1000]];
	for (let i = 0; i < sizes.length; i++) {
		eq(fullWidthFor(sizes[i][0], sizes[i][1]), 1280, sizes[i][0] + 'x' + sizes[i][1]);
	}
});

test('fullWidthFor: 1316 for 1316x720', () => {
	eq(fullWidthFor(1316, 720), 1316, '1316x720');
});

test('fullWidthFor: 1560 for 844x390 and 1564 for 852x393', () => {
	eq(fullWidthFor(844, 390), 1560, '844x390');
	eq(fullWidthFor(852, 393), 1564, '852x393');
});

test('fullWidthFor: 1568 for phones above the cap and for very wide windows', () => {
	const sizes = [[874, 402], [956, 440], [2560, 1080], [1600, 720]];
	for (let i = 0; i < sizes.length; i++) {
		eq(fullWidthFor(sizes[i][0], sizes[i][1]), 1568, sizes[i][0] + 'x' + sizes[i][1]);
	}
});

test('fullWidthFor rejects a zero width', () => {
	throws(() => fullWidthFor(0, 100), 'winW 0');
});

test('fitLayout 852x393 iPhone 15 Pro: 1564 canvas, stage at 142', () => {
	const l = fitLayout(852, 393);
	eq(l.fullW, 1564, 'fullW');
	eq(l.stageX, 142, 'stageX');
	near(l.scale, 393 / 720, 1e-9, 'scale');
	near(l.viewW, 853.6833, 1e-3, 'viewW');
	near(l.offX, -0.84167, 1e-3, 'offX');
	near(l.offY, 0, 1e-6, 'offY');
});

test('fitLayout 2560x1080 ultrawide: 1568 canvas, scale 1.5, stage at 144', () => {
	const l = fitLayout(2560, 1080);
	eq(l.fullW, 1568, 'fullW');
	near(l.scale, 1.5, 1e-9, 'scale');
	near(l.viewW, 2352, 1e-6, 'viewW');
	near(l.offX, 104, 1e-6, 'offX');
	near(l.offY, 0, 1e-6, 'offY');
	eq(l.stageX, 144, 'stageX');
});

test('fitLayout 1316x720: stage at 18, no offset', () => {
	const l = fitLayout(1316, 720);
	eq(l.stageX, 18, 'stageX');
	near(l.offX, 0, 1e-9, 'offX');
});

test('fitLayout 1024x768 4:3: 1280 canvas, letterbox top and bottom', () => {
	const l = fitLayout(1024, 768);
	eq(l.fullW, 1280, 'fullW');
	eq(l.stageX, 0, 'stageX');
	near(l.scale, 0.8, 1e-9, 'scale');
	near(l.offY, 96, 1e-9, 'offY');
});

test('fitLayout property: canvas width in range, covers the window below the cap', () => {
	const heights = [393, 402, 440, 720, 1080];
	for (let hi = 0; hi < heights.length; hi++) {
		const winH = heights[hi];
		for (let winW = 1300; winW <= 2400; winW += 7) {
			const l = fitLayout(winW, winH);
			const tag = winW + 'x' + winH;
			ok(l.fullW >= 1280 && l.fullW <= 1568, 'fullW in range ' + tag);
			ok((l.fullW - 1280) % 4 === 0, 'fullW multiple of 4 ' + tag);
			ok(l.offY >= -1e-6, 'offY not negative ' + tag);
			if (l.fullW > 1280 && l.fullW < 1568) {
				ok(l.viewW >= winW - 1e-6, 'canvas covers the window width ' + tag);
				ok(l.offX <= 1e-6, 'offX not positive ' + tag);
			}
		}
	}
});

test('toLogical and toFull on a 1560x720 window: strips and edges', () => {
	const l = fitLayout(1560, 720);
	eq(toLogical(l, 140, 360), { x: 0, y: 360 }, 'stage left edge');
	near(toLogical(l, 0, 360).x, -140, 1e-9, 'left strip');
	eq(toLogical(l, 1560, 720), { x: 1420, y: 720 }, 'bottom right corner');
	eq(toLogical(l, 1561, 10), null, 'right of canvas');
	eq(toFull(l, 140, 360), { x: 140, y: 360 }, 'toFull');
});

test('constants: BLEED_MAX and FULL_W_MAX agree with STAGE_W', () => {
	eq(BLEED_MAX, 144, 'BLEED_MAX');
	eq(FULL_W_MAX, 1568, 'FULL_W_MAX');
	eq(STAGE_W, 1280, 'STAGE_W');
	eq((FULL_W_MAX - STAGE_W) / 2, BLEED_MAX, 'strip width');
});

done();
