// Shared drawing helpers for all the code-drawn art (DESIGN.md 9.1, 9.7):
// rounded polygons, gradients, wheels, ground shadows, rust and smoke, plus
// two animation timing helpers. Pure: no DOM, no Date. Everything draws via
// the passed-in ctx, so it runs in tests with tests/fakectx.js.

import { shade, rgba } from '../ui/theme.js';

// Midpoint of two [x, y] points.
function mid(a, b) {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

// roundedPoly(ctx, pts, r): begin a rounded polygon path through pts
// (array of [x, y], at least 3). Builds the path only; the caller
// fills or strokes it. Throws when fewer than 3 points are given.
export function roundedPoly(ctx, pts, r) {
	if (!Array.isArray(pts) || pts.length < 3) {
		throw new Error('roundedPoly: need 3 points');
	}
	const n = pts.length;
	ctx.beginPath();
	const m0 = mid(pts[n - 1], pts[0]);
	ctx.moveTo(m0[0], m0[1]);
	for (let i = 0; i < n; i++) {
		const p = pts[i];
		const m = mid(p, pts[(i + 1) % n]);
		ctx.arcTo(p[0], p[1], m[0], m[1], r);
	}
	ctx.closePath();
}

// vgrad(ctx, y0, y1, top, bottom): a vertical linear gradient with the
// given colour stops, ready for fillStyle/strokeStyle.
export function vgrad(ctx, y0, y1, top, bottom) {
	const g = ctx.createLinearGradient(0, y0, 0, y1);
	g.addColorStop(0, top);
	g.addColorStop(1, bottom);
	return g;
}

// circle(ctx, x, y, r): begin a full-circle path (the caller fills it).
export function circle(ctx, x, y, r) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
}

// wheel(ctx, cx, cy, r, t, dim): a tyre, rim and hub, with five spokes
// spinning at t * 6 radians. When dim is true the colours are darkened by
// 40% and the spokes are skipped.
export function wheel(ctx, cx, cy, r, t, dim) {
	const dark = dim ? -0.4 : 0;
	ctx.fillStyle = shade('#15151a', dark);
	circle(ctx, cx, cy, r);
	ctx.fill();
	ctx.fillStyle = shade('#c9ccd2', dark);
	circle(ctx, cx, cy, r * 0.62);
	ctx.fill();
	ctx.fillStyle = shade('#6a6e78', dark);
	circle(ctx, cx, cy, r * 0.2);
	ctx.fill();
	if (dim) {
		return;
	}
	ctx.strokeStyle = '#8b8f99';
	ctx.lineWidth = r * 0.08;
	for (let k = 0; k < 5; k++) {
		const a = t * 6 + k * 2 * Math.PI / 5;
		ctx.beginPath();
		ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
		ctx.lineTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62);
		ctx.stroke();
	}
}

// groundShadow(ctx, cx, cy, rx, ry, alpha): a soft dark ellipse on the
// ground under a car or character.
export function groundShadow(ctx, cx, cy, rx, ry, alpha = 0.35) {
	ctx.save();
	ctx.fillStyle = rgba('#000000', alpha);
	ctx.beginPath();
	ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

// rustBlotch(ctx, x, y, r): two overlapping rust-coloured circles at 55%
// opacity, for worn bodywork.
export function rustBlotch(ctx, x, y, r) {
	ctx.save();
	ctx.globalAlpha = 0.55;
	ctx.fillStyle = '#8a4b1f';
	circle(ctx, x, y, r);
	ctx.fill();
	circle(ctx, x + r * 0.4, y + r * 0.4, r * 0.6);
	ctx.fill();
	ctx.restore();
}

// smokePuff(ctx, x, y, t, k): three drifting grey circles for a tired
// engine, wobbling with sin(t * 2). k scales the whole puff.
export function smokePuff(ctx, x, y, t, k = 1) {
	const radii = [6, 9, 12];
	for (let i = 0; i < 3; i++) {
		const px = x - 8 * k - i * 10 * k;
		const py = y - i * 7 * k + Math.sin(t * 2 + i) * 2 * k;
		ctx.fillStyle = 'rgba(160,160,160,0.5)';
		circle(ctx, px, py, radii[i] * k);
		ctx.fill();
	}
}

// blink(t, period, dur): true during the last dur seconds of each period
// (a blinking light or cursor).
export function blink(t, period = 4, dur = 0.15) {
	return (t % period) >= period - dur;
}

// pulse(t, period): 0..1 sine wave, handy for bobbing and glowing.
export function pulse(t, period) {
	return 0.5 + 0.5 * Math.sin(2 * Math.PI * t / period);
}
