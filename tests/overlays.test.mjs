// Tests for ui/overlays.js (card GU18): toast v2 pose and draw, and the
// tooltip model, rect and draw. Runs under macOS `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, texts, count, lastSet } from './fakectx.js';
import {
	toastPose, toastIcon, drawToast2, makeTooltip, ttHover, ttVisible,
	tooltipRect, drawTooltip,
} from '../src/ui/overlays.js';
import { EASE } from '../src/ui/tokens.js';

// Recorded fillRect calls whose rectangle lies inside [x0,x1] x [y0,y1].
function rectsInside(ctx, x0, x1, y0, y1) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] !== 'fillRect') {
			continue;
		}
		const a = c[1];
		if (a[0] >= x0 && a[0] + a[2] <= x1 && a[1] >= y0 && a[1] + a[3] <= y1) {
			n += 1;
		}
	}
	return n;
}

// Recorded fillText x positions, in order.
function textXs(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillText') {
			out.push(ctx.calls[i][1][1]);
		}
	}
	return out;
}

test('toastPose starts 40 px low and transparent', function () {
	const p = toastPose({ born: 0, until: 2500 }, 0);
	near(p.dy, 40, 1e-9, 'dy at birth');
	eq(p.alpha, 0, 'alpha at birth');
});

test('toastPose alpha is age/130 while fading in', function () {
	const p = toastPose({ born: 0, until: 2500 }, 130);
	near(p.alpha, 1, 1e-9, 'alpha at 130');
	near(toastPose({ born: 0, until: 2500 }, 65).alpha, 0.5, 1e-9, 'alpha at 65');
});

test('toastPose dy overshoots above the rest line then settles', function () {
	const mid = toastPose({ born: 0, until: 2500 }, 130);
	near(mid.dy, 40 * (1 - EASE.outBack(0.5)), 1e-9, 'dy at 130');
	near(mid.dy, -3.5079, 1e-4, 'dy at 130 numeric');
	eq(toastPose({ born: 0, until: 2500 }, 260).dy, 0, 'dy at 260');
	eq(toastPose({ born: 0, until: 2500 }, 1000).dy, 0, 'dy when settled');
});

test('toastPose fades out over the last toastOut ms', function () {
	near(toastPose({ born: 0, until: 2500 }, 2400).alpha, 0.5, 1e-9, 'alpha at until-100');
	eq(toastPose({ born: 0, until: 2500 }, 2500).alpha, 0, 'alpha at until');
	eq(toastPose({ born: 0, until: 2500 }, 1000).alpha, 1, 'alpha when settled');
});

test('toastIcon maps kinds to icon names', function () {
	eq(toastIcon('good'), 'tick', 'good');
	eq(toastIcon('bad'), 'cross', 'bad');
	eq(toastIcon('warn'), 'warning', 'warn');
	eq(toastIcon('info'), 'paper', 'info');
	eq(toastIcon(undefined), null, 'undefined');
	eq(toastIcon('other'), null, 'unknown kind');
});

test('drawToast2 calls the panel once at the bottom slot', function () {
	const ctx = makeCtx();
	const seen = [];
	function fakePanel(c, x, y, w, h) {
		seen.push([c === ctx, x, y, w, h, arguments.length]);
	}
	drawToast2(ctx, { born: 0, until: 5000, text: 'HI' }, 1000, 0, fakePanel);
	eq(seen, [[true, 360, 640, 560, 36, 5]], 'panel args');
});

test('drawToast2 slot 2 sits 88 px higher', function () {
	const ctx = makeCtx();
	const seen = [];
	function fakePanel(c, x, y) {
		seen.push(y);
	}
	drawToast2(ctx, { born: 0, until: 5000, text: 'HI' }, 1000, 2, fakePanel);
	eq(seen, [552], 'y for slot 2');
});

test('drawToast2 with a good toast draws the tick and shifts text', function () {
	const ctx = makeCtx();
	function fakePanel() {}
	const toast = { born: 0, until: 5000, kind: 'good', text: 'PAID' };
	drawToast2(ctx, toast, 1000, 0, fakePanel);
	ok(rectsInside(ctx, 372, 396, 646, 670) > 0, 'tick fillRects inside icon box');
	eq(textXs(ctx), [656], 'text x with icon');
	eq(texts(ctx), ['PAID'], 'text drawn once');
});

test('drawToast2 with no kind has no icon and centred text', function () {
	const ctx = makeCtx();
	function fakePanel() {}
	const toast = { born: 0, until: 5000, text: 'PLAIN' };
	drawToast2(ctx, toast, 1000, 0, fakePanel);
	eq(count(ctx, 'fillRect'), 0, 'no icon fillRects');
	eq(textXs(ctx), [640], 'text x without icon');
	eq(texts(ctx), ['PLAIN'], 'text drawn once');
});

test('drawToast2 settles at alpha 1 inside save and restore', function () {
	const ctx = makeCtx();
	function fakePanel() {}
	drawToast2(ctx, { born: 0, until: 5000, text: 'X' }, 1000, 0, fakePanel);
	eq(lastSet(ctx, 'globalAlpha'), 1, 'globalAlpha at settle');
	eq(ctx.calls[0][0], 'save', 'first call is save');
	eq(ctx.calls[ctx.calls.length - 1][0], 'restore', 'last call is restore');
});

test('tooltip shows only after a 400 ms hover', function () {
	const tt = makeTooltip();
	ttHover(tt, 'a', 100);
	eq(ttVisible(tt, 499), false, 'at 399 ms');
	eq(ttVisible(tt, 500), true, 'at 400 ms');
});

test('tooltip hover on a new target restarts the delay', function () {
	const tt = makeTooltip();
	ttHover(tt, 'a', 100);
	ttHover(tt, 'b', 600);
	eq(ttVisible(tt, 700), false, 'new target not yet due');
	eq(ttVisible(tt, 1000), true, 'new target due after 400 ms');
});

test('tooltip hover on the same target does not restart the delay', function () {
	const tt = makeTooltip();
	ttHover(tt, 'b', 600);
	ttHover(tt, 'b', 900);
	eq(ttVisible(tt, 1000), true, 'still due from first hover');
});

test('tooltip with no target is never visible', function () {
	const tt = makeTooltip();
	eq(ttVisible(tt, 99999), false, 'empty model');
});

test('tooltipRect centred above the target', function () {
	eq(tooltipRect(100, 640, 300), { x: 580, y: 248, w: 120, h: 40, below: false }, 'above');
});

test('tooltipRect clamps to the left bound', function () {
	eq(tooltipRect(100, 10, 300).x, 8, 'left clamp');
});

test('tooltipRect flips below when there is no room above', function () {
	eq(tooltipRect(100, 640, 30), { x: 580, y: 42, w: 120, h: 40, below: true }, 'below');
});

test('tooltipRect clamps to the right bound', function () {
	eq(tooltipRect(100, 1275, 300).x, 8 + 1264 - 120, 'right clamp');
});

test('drawTooltip draws its text once inside the bounds', function () {
	const ctx = makeCtx();
	const bounds = { x: 8, y: 8, w: 1264, h: 704 };
	drawTooltip(ctx, 'HELLO', 640, 300, bounds);
	eq(texts(ctx), ['HELLO'], 'text drawn once');
	eq(count(ctx, 'fill'), 1, 'one arrow fill');
	ok(count(ctx, 'fillRect') === 2, 'box and inner fillRects');
	eq(rectsInside(ctx, 8, 8 + 1264, 8, 8 + 704), 2, 'both rects inside bounds');
});

done();
