// Tests for src/art/officelayout.js and src/art/office.js, run under jsc -m.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, texts } from './fakectx.js';
import { OFFICE, FLOOR_Y, WALL_TOP } from '../src/art/officelayout.js';
import { drawOfficeStatic } from '../src/art/office.js';

const KEYS = ['hud', 'calendar', 'workshop', 'tv', 'tvScreen', 'poster',
	'window', 'ledger', 'garageDoor', 'desk', 'phone', 'laptop', 'newspaper',
	'kettle', 'mark', 'dave', 'bubble'];

test('OFFICE has exactly the 17 prop rectangles', () => {
	eq(Object.keys(OFFICE).length, 17, '17 keys');
	for (const k of KEYS) {
		ok(OFFICE[k], k + ' present');
	}
});

test('every rectangle lies within 0..1280 x 0..720', () => {
	for (const k of KEYS) {
		const r = OFFICE[k];
		ok(r.x >= 0 && r.y >= 0, k + ' starts inside');
		ok(r.x + r.w <= 1280, k + ' right edge <= 1280');
		ok(r.y + r.h <= 720, k + ' bottom edge <= 720');
	}
});

test('hud is the full 1280x56 strip', () => {
	eq([OFFICE.hud.x, OFFICE.hud.y, OFFICE.hud.w, OFFICE.hud.h],
		[0, 0, 1280, 56], 'hud rectangle');
});

test('tvScreen lies inside tv', () => {
	const t = OFFICE.tv, s = OFFICE.tvScreen;
	ok(s.x >= t.x && s.y >= t.y, 'screen top-left inside tv');
	ok(s.x + s.w <= t.x + t.w && s.y + s.h <= t.y + t.h, 'screen bottom-right inside tv');
});

test('phone, laptop and newspaper sit on the desk', () => {
	const d = OFFICE.desk;
	for (const k of ['phone', 'laptop', 'newspaper']) {
		const r = OFFICE[k];
		ok(r.x >= d.x && r.x + r.w <= d.x + d.w, k + ' within desk horizontally');
		ok(r.y + r.h <= d.y + 8, k + ' bottom rests on the desk top');
	}
});

test('floor and wall constants', () => {
	eq(FLOOR_Y, 520, 'FLOOR_Y is 520');
	eq(WALL_TOP, 56, 'WALL_TOP is 56');
});

test('drawOfficeStatic does not throw and balances save/restore', () => {
	const ctx = makeCtx();
	drawOfficeStatic(ctx, 0);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
});

test('makes at least 40 fillRect/fill calls', () => {
	const ctx = makeCtx();
	drawOfficeStatic(ctx, 0);
	const n = count(ctx, 'fillRect') + count(ctx, 'fill');
	ok(n >= 40, 'painted with ' + n + ' fillRect/fill calls');
});

test('paints the AUCTION, LEDGER, WORKSHOP and GARAGE labels', () => {
	const ctx = makeCtx();
	drawOfficeStatic(ctx, 0);
	const said = texts(ctx);
	for (const word of ['AUCTION', 'LEDGER', 'WORKSHOP', 'GARAGE']) {
		ok(said.indexOf(word) !== -1, word + ' is painted');
	}
});

test('the sun moves with t but the amount of text stays the same', () => {
	const a = makeCtx();
	drawOfficeStatic(a, 0);
	const b = makeCtx();
	drawOfficeStatic(b, 50);
	ok(JSON.stringify(a.calls) !== JSON.stringify(b.calls), 'call logs differ');
	eq(count(a, 'fillText'), count(b, 'fillText'), 'same fillText count');
});

test('t defaults to 0 and does not throw', () => {
	const ctx = makeCtx();
	drawOfficeStatic(ctx);
	eq(count(ctx, 'fillText'), 6, 'default call paints the same 6 text lines');
});

done();
