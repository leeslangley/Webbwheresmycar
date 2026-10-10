// Tests for src/art/calendar.js, run under jsc -m.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, texts } from './fakectx.js';
import { drawWallCalendar } from '../src/art/calendar.js';

const R = { x: 36, y: 84, w: 190, h: 240 };

test('day 1: nothing crossed, January with 31 cells, header and DAY line', () => {
	const ctx = makeCtx();
	const res = drawWallCalendar(ctx, R, 1, 0);
	eq(res, { crossed: 0, cells: 31, monthName: 'January' }, 'day 1 result');
	const said = texts(ctx);
	ok(said.indexOf('JANUARY') !== -1, 'JANUARY painted');
	ok(said.indexOf('DAY 1 of 365') !== -1, 'DAY 1 of 365 painted');
	ok(said.indexOf('1') !== -1, 'day number 1 painted');
});

test('day 24: 23 days crossed', () => {
	const ctx = makeCtx();
	eq(drawWallCalendar(ctx, R, 24, 0).crossed, 23, '23 crossed');
});

test('day 32 is 1 February: nothing crossed, 28 cells', () => {
	const ctx = makeCtx();
	eq(drawWallCalendar(ctx, R, 32, 0), { crossed: 0, cells: 28, monthName: 'February' }, 'Feb 1 result');
});

test('day 59 is 28 February: 27 crossed', () => {
	const ctx = makeCtx();
	eq(drawWallCalendar(ctx, R, 59, 0).crossed, 27, '27 crossed');
});

test('day 365 is 31 December: 30 crossed and DAY 365 of 365', () => {
	const ctx = makeCtx();
	const res = drawWallCalendar(ctx, R, 365, 0);
	eq(res, { crossed: 30, cells: 31, monthName: 'December' }, 'day 365 result');
	ok(texts(ctx).indexOf('DAY 365 of 365') !== -1, 'DAY 365 of 365 painted');
});

test('day 366 is treated as day 365', () => {
	const a = makeCtx();
	const b = makeCtx();
	const ra = drawWallCalendar(a, R, 366, 2);
	const rb = drawWallCalendar(b, R, 365, 2);
	eq(ra, rb, 'same result object');
	eq(JSON.stringify(a.calls), JSON.stringify(b.calls), 'same drawing');
});

test('crossAnim 0 draws fewer lineTo/stroke calls than crossAnim 1 (day 10)', () => {
	const a = makeCtx();
	const b = makeCtx();
	drawWallCalendar(a, R, 10, 0, 0);
	drawWallCalendar(b, R, 10, 0, 1);
	ok(count(a, 'lineTo') < count(b, 'lineTo'),
		'lineTo ' + count(a, 'lineTo') + ' < ' + count(b, 'lineTo'));
	ok(count(a, 'stroke') < count(b, 'stroke'),
		'stroke ' + count(a, 'stroke') + ' < ' + count(b, 'stroke'));
});

test('day 10 paints every day-of-month number 1..31', () => {
	const ctx = makeCtx();
	drawWallCalendar(ctx, R, 10, 0);
	const said = texts(ctx);
	for (let i = 1; i <= 31; i++) {
		ok(said.indexOf(String(i)) !== -1, 'number ' + i + ' painted');
	}
});

test('same args produce the same drawing (deterministic)', () => {
	const a = makeCtx();
	const b = makeCtx();
	drawWallCalendar(a, R, 100, 1.25, 0.5);
	drawWallCalendar(b, R, 100, 1.25, 0.5);
	eq(JSON.stringify(a.calls), JSON.stringify(b.calls), 'identical call logs');
});

test('save/restore balanced', () => {
	const ctx = makeCtx();
	drawWallCalendar(ctx, R, 200, 3);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
});

test('bad and missing inputs do not throw', () => {
	const ctx = makeCtx();
	eq(drawWallCalendar(ctx, R, 0, 0).crossed, 0, 'day 0 clamps to day 1');
	eq(drawWallCalendar(ctx, R, -5, 0).crossed, 0, 'negative day clamps to day 1');
	eq(drawWallCalendar(ctx, R, 9999, 0).crossed, 30, 'huge day clamps to 365');
	eq(drawWallCalendar(ctx, R, undefined).monthName, 'January', 'missing day -> January');
	drawWallCalendar(ctx, R, 10, undefined, undefined);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'still balanced without t/anim');
	eq(drawWallCalendar(ctx, R, 10, 0, 7).crossed, 9, 'anim above 1 is clamped');
	eq(drawWallCalendar(ctx, R, 10, 0, -3).crossed, 9, 'anim below 0 is clamped');
});

test('first-of-month edge: today circled, no cross, grid offset honoured', () => {
	// Day 60 is 1 March; 1 March's weekday is (60-1)%7 = 3 (Thursday).
	const ctx = makeCtx();
	const res = drawWallCalendar(ctx, R, 60, 0);
	eq(res, { crossed: 0, cells: 31, monthName: 'March' }, '1 March result');
	const said = texts(ctx);
	ok(said.indexOf('MARCH') !== -1, 'MARCH painted');
	ok(said.indexOf('DAY 60 of 365') !== -1, 'DAY 60 of 365 painted');
});

done();
