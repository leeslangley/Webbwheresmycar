// Tests for tests/uiaudit.js (the UI audit helper, GU03). Runs under macOS `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx } from './fakectx.js';
import { replayTexts, auditCtx, rectsOverlap, describe } from './uiaudit.js';

const TITLE16 = '16px "Press Start 2P", monospace';
const BODY14 = '14px VT323, monospace';
const BODY22 = '22px VT323, monospace';

test('replay: top-left title text gets the fakectx box', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.fillText('ABCD', 10, 20);
	const e = replayTexts(ctx);
	eq(e.length, 1, 'one entry');
	eq(e[0].text, 'ABCD', 'text');
	eq(e[0].px, 16, 'px');
	eq(e[0].kind, 'title', 'kind');
	near(e[0].x1 - e[0].x0, 38.4, 1e-9, 'width is 4*0.6*16');
	eq(e[0].x0, 10, 'x0');
	eq(e[0].y0, 20, 'y0');
	near(e[0].x1, 48.4, 1e-9, 'x1');
	eq(e[0].y1, 36, 'y1');
});

test('replay: center align moves x0 by half the width', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textAlign = 'center';
	ctx.fillText('ABCD', 100, 20);
	const e = replayTexts(ctx);
	near(e[0].x0, 100 - 38.4 / 2, 1e-9, 'center x0');
});

test('replay: middle baseline moves y0 by half the px', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'middle';
	ctx.fillText('ABCD', 10, 50);
	const e = replayTexts(ctx);
	eq(e[0].y0, 50 - 8, 'middle y0');
});

test('belowFloor: body text under the floor is reported, at the floor is not', () => {
	const small = makeCtx();
	small.font = BODY14;
	small.fillText('hi', 10, 10);
	const a = auditCtx(small);
	eq(a.belowFloor.length, 1, 'one below-floor entry');
	eq(a.belowFloor[0].kind, 'body', 'kind body');

	const ok22 = makeCtx();
	ok22.font = BODY22;
	ok22.fillText('hi', 10, 10);
	eq(auditCtx(ok22).belowFloor.length, 0, 'no below-floor entry at 22px');
});

test('offCanvas: text running past the right edge is reported', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.fillText('ABCD', 1270, 20);
	ctx.fillText('ABCD', 10, 20);
	const a = auditCtx(ctx);
	eq(a.offCanvas.length, 1, 'one off-canvas entry');
	eq(a.offCanvas[0].x0, 1270, 'the one at x 1270');
});

test('overlaps: two different strings 8px apart vertically overlap', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.fillText('ABCD', 10, 20);
	ctx.fillText('EFGH', 10, 28);
	eq(auditCtx(ctx).overlaps.length, 1, 'one overlap');
});

test('overlaps: same string with a (+2,+2) offset is a shadow, not an overlap', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.fillText('ABCD', 10, 20);
	ctx.fillText('ABCD', 12, 22);
	eq(auditCtx(ctx).overlaps.length, 0, 'no overlap for a shadow');
});

test('overlaps: same string at x-2 and x+2 (outline spread) is not an overlap', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.fillText('ABCD', 8, 20);
	ctx.fillText('ABCD', 12, 20);
	eq(auditCtx(ctx).overlaps.length, 0, 'no overlap for an outline');
});

test('replay: translate offsets x0', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.translate(100, 0);
	ctx.fillText('ABCD', 10, 20);
	eq(replayTexts(ctx)[0].x0, 110, 'translated x0');
});

test('audit: text drawn between scale and restore is excluded', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.save();
	ctx.scale(2, 2);
	ctx.fillText('ABCD', 10, 20);
	ctx.restore();
	ctx.fillText('EFGH', 10, 20);
	const a = auditCtx(ctx);
	eq(a.entries.length, 1, 'one entry kept');
	eq(a.entries[0].text, 'EFGH', 'only the untransformed text kept');
});

test('rectsOverlap: edge-touching rectangles do not overlap, 1px overlap does', () => {
	ok(!rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 }), 'touching edge');
	ok(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 5, h: 5 }), 'overlapping by 1px');
});

test('describe: gives text, position and px', () => {
	const ctx = makeCtx();
	ctx.font = TITLE16;
	ctx.textBaseline = 'top';
	ctx.fillText('ABCD', 10, 20);
	eq(describe(replayTexts(ctx)[0]), 'ABCD@10,20 16px', 'label');
});

done();
