// Tests for src/art/props.js, run under `jsc -m`.

import { test, ok, eq, done } from './harness.js';
import { makeCtx, count, lastSet } from './fakectx.js';
import {
	drawTvStatic, drawPhone, drawLaptop, drawNewspaper, drawKettle, drawHotspotGlow,
} from '../src/art/props.js';

const RECT = { x: 100, y: 50, w: 120, h: 90 };
const TIMES = [0, 0.37, 5];

// JSON of the whole call log, for comparing two renders.
function logOf(ctx) {
	return JSON.stringify(ctx.calls);
}

// Every fillRect/strokeRect argument list in the log.
function rectCalls(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'fillRect' || c[0] === 'strokeRect') {
			out.push(c[1]);
		}
	}
	return out;
}

// Every simple rect call of fn(ctx, RECT, t) must sit inside the rect
// (40px tolerance on each edge).
function assertWithinRect(ctx, label) {
	const rects = rectCalls(ctx);
	for (let i = 0; i < rects.length; i++) {
		const x = rects[i][0];
		const y = rects[i][1];
		const w = rects[i][2];
		const h = rects[i][3];
		ok(x >= RECT.x - 40 && x + w <= RECT.x + RECT.w + 40,
			label + ' call ' + i + ': x ' + x + ' w ' + w + ' leaves the rect');
		ok(y >= RECT.y - 40 && y + h <= RECT.y + RECT.h + 40,
			label + ' call ' + i + ': y ' + y + ' h ' + h + ' leaves the rect');
	}
	return rects.length;
}

test('every prop draws without throwing at t = 0, 0.37, 5', () => {
	const props = [drawTvStatic, drawLaptop, drawNewspaper, drawKettle, drawHotspotGlow];
	for (let p = 0; p < props.length; p++) {
		for (let i = 0; i < TIMES.length; i++) {
			props[p](makeCtx(), RECT, TIMES[i]);
		}
	}
	for (let i = 0; i < TIMES.length; i++) {
		drawPhone(makeCtx(), RECT, TIMES[i], true);
		drawPhone(makeCtx(), RECT, TIMES[i], false);
	}
});

test('every prop balances save and restore', () => {
	const props = [drawTvStatic, drawLaptop, drawNewspaper, drawKettle, drawHotspotGlow];
	for (let p = 0; p < props.length; p++) {
		const ctx = makeCtx();
		props[p](ctx, RECT, 1.23);
		eq(count(ctx, 'restore'), count(ctx, 'save'), props[p].name + ' save/restore');
	}
	const ctx = makeCtx();
	drawPhone(ctx, RECT, 1.23, true);
	eq(count(ctx, 'restore'), count(ctx, 'save'), 'drawPhone save/restore');
});

test('drawTvStatic clips to the rect', () => {
	const ctx = makeCtx();
	drawTvStatic(ctx, RECT, 1);
	ok(count(ctx, 'clip') >= 1, 'clip is called');
	eq(count(ctx, 'restore'), count(ctx, 'save'), 'clip is balanced');
});

test('drawTvStatic: t = 0 and t = 0.1 give different logs', () => {
	const a = makeCtx();
	drawTvStatic(a, RECT, 0);
	const b = makeCtx();
	drawTvStatic(b, RECT, 0.1);
	ok(logOf(a) !== logOf(b), 'static animates');
});

test('drawTvStatic is deterministic (no Math.random)', () => {
	const a = makeCtx();
	drawTvStatic(a, RECT, 2.5);
	const b = makeCtx();
	drawTvStatic(b, RECT, 2.5);
	ok(logOf(a) === logOf(b), 'same t gives the same static');
	ok(count(a, 'fillRect') >= 60, '60 noise lines plus background and band');
});

test('drawPhone: ringing draws more calls than silent', () => {
	const quiet = makeCtx();
	drawPhone(quiet, RECT, 0.3, false);
	const loud = makeCtx();
	drawPhone(loud, RECT, 0.3, true);
	ok(loud.calls.length > quiet.calls.length, 'ring arcs add draw calls');
});

test('drawPhone: shake moves the phone between t = 0.01 and t = 0.02', () => {
	const a = makeCtx();
	drawPhone(a, RECT, 0.01, true);
	const b = makeCtx();
	drawPhone(b, RECT, 0.02, true);
	ok(logOf(a) !== logOf(b), 'the shake shows in the log');
	const ta = a.calls.filter(function (c) { return c[0] === 'translate'; })[0];
	const tb = b.calls.filter(function (c) { return c[0] === 'translate'; })[0];
	ok(ta && tb, 'ringing shakes with a translate');
	ok(ta[1][0] !== tb[1][0], 'translate x differs: ' + ta[1][0] + ' vs ' + tb[1][0]);
});

test('drawPhone: no shake when not ringing', () => {
	const a = makeCtx();
	drawPhone(a, RECT, 0.01, false);
	const b = makeCtx();
	drawPhone(b, RECT, 0.02, false);
	ok(logOf(a) === logOf(b), 'a silent phone does not move');
});

test('drawLaptop: logs differ between t = 0 and t = 1', () => {
	const a = makeCtx();
	drawLaptop(a, RECT, 0);
	const b = makeCtx();
	drawLaptop(b, RECT, 1);
	ok(logOf(a) !== logOf(b), 'the chart line wobbles');
});

test('drawNewspaper is deterministic for the same input', () => {
	const a = makeCtx();
	drawNewspaper(a, RECT, 3);
	const b = makeCtx();
	drawNewspaper(b, RECT, 3);
	ok(logOf(a) === logOf(b), 'same input, same newspaper');
	ok(logOf(a) !== logOf(makeCtx()), 'it actually draws something');
});

test('drawKettle differs across t', () => {
	const logs = [];
	for (let i = 0; i < 3; i++) {
		const ctx = makeCtx();
		drawKettle(ctx, RECT, i * 0.5);
		logs.push(logOf(ctx));
	}
	ok(logs[0] !== logs[1], 'steam sways between t = 0 and t = 0.5');
	ok(logs[0] !== logs[2], 'steam sways between t = 0 and t = 1');
});

test('drawHotspotGlow sets a lamp-coloured strokeStyle and pulses', () => {
	const ctx = makeCtx();
	drawHotspotGlow(ctx, RECT, 0.4);
	const style = lastSet(ctx, 'strokeStyle');
	ok(typeof style === 'string' && style.indexOf('255,210,122') !== -1,
		'strokeStyle uses the lamp colour, got ' + style);
	const a = makeCtx();
	drawHotspotGlow(a, RECT, 0);
	const b = makeCtx();
	drawHotspotGlow(b, RECT, 0.3);
	ok(logOf(a) !== logOf(b), 'the glow pulses');
});

test('no prop draws a simple rect further than 40px outside its rect', () => {
	const props = [
		['drawTvStatic', drawTvStatic],
		['drawPhone', drawPhone],
		['drawLaptop', drawLaptop],
		['drawNewspaper', drawNewspaper],
		['drawKettle', drawKettle],
		['drawHotspotGlow', drawHotspotGlow],
	];
	for (let p = 0; p < props.length; p++) {
		const ctx = makeCtx();
		props[p][1](ctx, RECT, 0.7);
		assertWithinRect(ctx, props[p][0]);
	}
});

test('the props that should paint rects really do', () => {
	const props = [drawTvStatic, drawPhone, drawLaptop, drawNewspaper, drawKettle];
	for (let p = 0; p < props.length; p++) {
		const ctx = makeCtx();
		props[p](ctx, RECT, 0.7);
		ok(rectCalls(ctx).length > 0, props[p].name + ' paints at least one rect');
	}
});

done();
