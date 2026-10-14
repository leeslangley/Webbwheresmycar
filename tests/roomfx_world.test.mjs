// Tests for src/art/roomfx_world.js, run under `jsc -m`.

import { test, ok, eq, done } from './harness.js';
import { makeCtx, count } from './fakectx.js';
import { skyColors, drawSky, drawDust, steamPuffs } from '../src/art/roomfx_world.js';

const RECT = { x: 20, y: 10, w: 160, h: 90 };

// Every fillRect call's argument list, in order.
function fillRects(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

// Every value assigned to fillStyle, in order.
function fillStyles(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:fillStyle') {
			out.push(ctx.calls[i][1][0]);
		}
	}
	return out;
}

test('skyColors picks the colours for each hour band', () => {
	eq(skyColors(12).top, '#6fb4ee', 'midday top');
	eq(skyColors(7).bottom, '#f2a65a', 'dawn bottom');
	eq(skyColors(18).top, '#4a3a7a', 'dusk top');
	eq(skyColors(2).top, '#0b0d24', 'night top');
	eq(skyColors(2).bottom, '#1d2450', 'night bottom');
});

test('drawSky clips once and keeps save and restore balanced', () => {
	const ctx = makeCtx();
	drawSky(ctx, RECT, 12, 0.5, undefined);
	eq(count(ctx, 'clip'), 1, 'one clip');
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'balanced save/restore');
	eq(count(ctx, 'save'), 1, 'one save');
});

test('drawSky gradient has two stops with the hour colours', () => {
	const ctx = makeCtx();
	drawSky(ctx, RECT, 18, 0, undefined);
	let grad = null;
	const styles = fillStyles(ctx);
	for (let i = 0; i < styles.length; i++) {
		if (typeof styles[i] === 'object' && styles[i] !== null && styles[i].stops) {
			grad = styles[i];
		}
	}
	ok(grad !== null, 'a gradient was set as fillStyle');
	eq(grad.stops.length, 2, 'two stops');
	eq(grad.stops[0][1], '#4a3a7a', 'top stop colour');
	eq(grad.stops[1][1], '#f08a5d', 'bottom stop colour');
});

test('drawSky draws a sun by day and a moon by night as arcs', () => {
	const day = makeCtx();
	drawSky(day, RECT, 12, 0, undefined);
	ok(count(day, 'arc') >= 1, 'daytime sun is an arc');
	const night = makeCtx();
	drawSky(night, RECT, 2, 0, undefined);
	ok(count(night, 'arc') >= 1, 'night moon is an arc');
});

test('drawSky moves the first cloud 4px left per unit of look.x', () => {
	const still = makeCtx();
	drawSky(still, RECT, 12, 0.5, { x: 0, y: 0 });
	const moved = makeCtx();
	drawSky(moved, RECT, 12, 0.5, { x: 1, y: 0 });
	const cloudStill = fillRects(still).filter(function (r) { return r[2] === 60; });
	const cloudMoved = fillRects(moved).filter(function (r) { return r[2] === 60; });
	eq(cloudStill.length, 1, 'one 60-wide cloud at look 0');
	eq(cloudMoved.length, 1, 'one 60-wide cloud at look 1');
	eq(cloudStill[0][0] - cloudMoved[0][0], 4, 'cloud x shift');
});

test('drawSky works with look undefined', () => {
	const ctx = makeCtx();
	drawSky(ctx, RECT, 12, 0.5, undefined);
	eq(count(ctx, 'fillRect'), 3, 'sky background plus two clouds');
});

test('drawDust makes n motes, all inside the rect', () => {
	const ctx = makeCtx();
	drawDust(ctx, RECT, 5, 30);
	const rects = fillRects(ctx);
	eq(rects.length, 30, 'thirty fillRect calls');
	for (let i = 0; i < rects.length; i++) {
		const x = rects[i][0];
		const y = rects[i][1];
		ok(x >= RECT.x && x < RECT.x + RECT.w, 'mote ' + i + ' x ' + x + ' inside rect');
		ok(y >= RECT.y && y < RECT.y + RECT.h, 'mote ' + i + ' y ' + y + ' inside rect');
	}
});

test('drawDust alpha stays between 0.05 and 0.45', () => {
	const ctx = makeCtx();
	drawDust(ctx, RECT, 5, 30);
	const styles = fillStyles(ctx);
	eq(styles.length, 30, 'one fillStyle per mote');
	for (let i = 0; i < styles.length; i++) {
		const m = styles[i].match(/,([0-9.eE+-]+)\)$/);
		ok(m !== null, 'rgba fillStyle ' + styles[i]);
		const a = parseFloat(m[1]);
		ok(a >= 0.05 && a <= 0.45, 'mote alpha ' + a + ' in range');
	}
});

test('steamPuffs makes n arcs with alpha between 0 and 0.35', () => {
	const ctx = makeCtx();
	steamPuffs(ctx, 100, 100, 2, 4);
	eq(count(ctx, 'arc'), 4, 'four arcs');
	const styles = fillStyles(ctx);
	eq(styles.length, 4, 'one fillStyle per puff');
	for (let i = 0; i < styles.length; i++) {
		const m = styles[i].match(/,([0-9.eE+-]+)\)$/);
		ok(m !== null, 'rgba fillStyle ' + styles[i]);
		const a = parseFloat(m[1]);
		ok(a > 0 && a <= 0.35, 'puff alpha ' + a + ' in (0, 0.35]');
	}
});

done();
