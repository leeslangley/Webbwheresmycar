// Tests for ui/tokens.js (docs/art/GU.md): palette, spacing, zones, type
// scale, motion and easing. Runs under macOS `jsc -m`.

import { test, eq, ok, near, throws, done } from './harness.js';
import {
	COLOR, SPACE, sp, ZONES, FLOOR, TYPE, fontFor, MOTION, clamp01, lerp, EASE, ease,
} from '../src/ui/tokens.js';

test('COLOR has exactly 29 keys', () => {
	eq(Object.keys(COLOR).length, 29, 'key count');
});

test('every COLOR value is a #rrggbb hex', () => {
	const keys = Object.keys(COLOR);
	for (let i = 0; i < keys.length; i++) {
		ok(/^#[0-9A-Fa-f]{6}$/.test(COLOR[keys[i]]), keys[i] + ' = ' + COLOR[keys[i]]);
	}
});

test('COLOR spot values', () => {
	eq(COLOR.ink, '#14102A', 'ink');
	eq(COLOR.brass, '#C9A24A', 'brass');
	eq(COLOR.bannerTop, '#F6CFA0', 'bannerTop');
	eq(COLOR.cashGreen, '#3FAE49', 'cashGreen');
});

test('sp(n) reads the 4px grid', () => {
	eq(sp(3), 12, 'sp(3)');
	eq(sp(1), 4, 'sp(1)');
	eq(sp(7), 48, 'sp(7)');
	eq(SPACE[6], 32, 'SPACE[6]');
});

test('sp rejects values off the grid', () => {
	throws(() => sp(9), 'sp(9)');
	throws(() => sp(0), 'sp(0)');
	throws(() => sp('2'), 'sp("2")');
});

test('ZONES heights add up to 720', () => {
	eq(ZONES.banner.h + ZONES.tableau.h + ZONES.hud.h, 720, 'total height');
});

test('ZONES are stacked: each starts where the previous ends', () => {
	eq(ZONES.banner.y + ZONES.banner.h, ZONES.tableau.y, 'banner to tableau');
	eq(ZONES.tableau.y + ZONES.tableau.h, ZONES.hud.y, 'tableau to hud');
	eq(ZONES.hud.y + ZONES.hud.h, 720, 'hud to bottom');
});

test('ZONES span the full 1280 width from x 0', () => {
	eq(ZONES.banner.x, 0, 'banner x');
	eq(ZONES.tableau.x, 0, 'tableau x');
	eq(ZONES.hud.x, 0, 'hud x');
	eq(ZONES.banner.w, 1280, 'banner w');
	eq(ZONES.tableau.w, 1280, 'tableau w');
	eq(ZONES.hud.w, 1280, 'hud w');
});

test('FLOOR values', () => {
	eq(FLOOR.title, 16, 'title floor');
	eq(FLOOR.body, 22, 'body floor');
});

test('fontFor(button) is Press Start 2P 16px', () => {
	eq(fontFor('button'), '16px "Press Start 2P", monospace', 'button font');
});

test('fontFor(body) is VT323 28px', () => {
	eq(fontFor('body'), '28px VT323, monospace', 'body font');
});

test('fontFor rejects unknown roles', () => {
	throws(() => fontFor('nope'), 'unknown role');
});

test('TYPE roles never go below the floors', () => {
	const roles = Object.keys(TYPE);
	for (let i = 0; i < roles.length; i++) {
		const r = TYPE[roles[i]];
		ok(r.px >= FLOOR[r.kind], roles[i] + ' below floor');
	}
});

test('MOTION has the expected timings', () => {
	eq(MOTION.tap, 90, 'tap');
	eq(MOTION.toastHold, 2500, 'toastHold');
	eq(MOTION.dayChange, 2400, 'dayChange');
});

test('clamp01 clamps to 0..1', () => {
	eq(clamp01(-1), 0, 'low');
	eq(clamp01(2), 1, 'high');
	eq(clamp01(0.3), 0.3, 'middle');
});

test('lerp interpolates', () => {
	eq(lerp(10, 20, 0.5), 15, 'midpoint');
	eq(lerp(10, 20, 0), 10, 'start');
	eq(lerp(10, 20, 1), 20, 'end');
});

test('every EASE curve maps 0 to 0 and 1 to 1', () => {
	const names = Object.keys(EASE);
	for (let i = 0; i < names.length; i++) {
		const f = EASE[names[i]];
		near(f(0), 0, 1e-9, names[i] + '(0)');
		near(f(1), 1, 1e-9, names[i] + '(1)');
	}
});

test('outQuad(0.5) = 0.75', () => {
	near(EASE.outQuad(0.5), 0.75, 1e-9, 'outQuad');
});

test('outCubic(0.5) = 0.875', () => {
	near(EASE.outCubic(0.5), 0.875, 1e-9, 'outCubic');
});

test('inOutQuad(0.25) = 0.125', () => {
	near(EASE.inOutQuad(0.25), 0.125, 1e-9, 'inOutQuad');
});

test('outBack(0.5) = 1.0876975', () => {
	near(EASE.outBack(0.5), 1.0876975, 1e-6, 'outBack');
});

test('ease clamps its input', () => {
	eq(ease('outCubic', 2), 1, 'above 1');
	eq(ease('outCubic', -1), 0, 'below 0');
});

test('ease rejects unknown names', () => {
	throws(() => ease('nope', 0), 'unknown ease');
});

done();
