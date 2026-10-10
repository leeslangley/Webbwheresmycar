// Flat-colour car drawer (card W50): draws a side-on car from its profile
// with flat colours only. Gradients, clip, roof, stripe, arches, rust and
// smoke come later (cards W50b and W51). Pure: no DOM, no Date. Everything
// draws via the passed-in ctx, so it runs in tests with tests/fakectx.js.

import { profileOf } from './profiles.js';
import { roundedPoly, wheel, groundShadow, circle } from './common.js';

// drawCar(ctx, archetype, x, y, scale, opts): draw the car for archetype
// with its ground point at (x, y), scaled by scale. opts may override
// body/roof/stripe/wheel colours, condition and the wheel angle t (W50b
// uses roof, stripe, wheel and cond; here only body and t matter).
export function drawCar(ctx, archetype, x, y, scale, opts = {}) {
	const p = profileOf(archetype);              // throws for an unknown archetype
	const o = { body: '#9a2a2a', roof: null, stripe: null, wheel: '#c9ccd2', cond: 10, t: 0 };
	for (const key in opts) o[key] = opts[key];  // plain copy of the options
	const k = p.lengthPx / 100 * scale;          // pixels per car unit
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(k, -k);                            // car units, y points up
	groundShadow(ctx, 0, 0, 52, 3, 0.35);
	// 1) parts in array order, flat colours
	for (const part of p.parts) {
		if (part.k === 'line') {
			ctx.beginPath();
			ctx.moveTo(part.pts[0][0], part.pts[0][1]);
			ctx.lineTo(part.pts[1][0], part.pts[1][1]);
			ctx.strokeStyle = 'rgba(0,0,0,0.35)';
			ctx.lineWidth = 0.4;
			ctx.stroke();
			continue;
		}
		roundedPoly(ctx, part.pts, part.r);
		if (part.k === 'body') {
			ctx.fillStyle = o.body;
		} else if (part.k === 'glass') {
			ctx.fillStyle = '#9fc5d6';
		} else if (part.k === 'dark') {
			ctx.fillStyle = '#1a1a22';
		} else if (part.k === 'chrome') {
			ctx.fillStyle = '#d8d8de';
		}
		ctx.fill();
	}
	// 2) wheels
	for (const w of p.wheels) wheel(ctx, w.x, w.r, w.r, o.t, w.dim === true);
	// 3) bumpers, headlight, tail light
	ctx.fillStyle = '#d8d8de';
	ctx.fillRect(-51, 6, 2, 4);
	ctx.fillRect(49, 6, 2, 4);
	circle(ctx, p.head.x, p.head.y, p.head.r);
	ctx.fillStyle = '#fff6c0';
	ctx.fill();
	ctx.fillStyle = '#c0282d';
	ctx.fillRect(p.tail.x - p.tail.w / 2, p.tail.y - p.tail.h / 2, p.tail.w, p.tail.h);
	ctx.restore();
}

// carBounds(archetype, scale): the drawn car's size in pixels, from the
// widest part of the profile (lengthPx) and the tallest point of any part.
export function carBounds(archetype, scale) {
	const p = profileOf(archetype);
	let maxY = 0;
	for (const part of p.parts) {
		for (const pt of part.pts) {
			if (pt[1] > maxY) maxY = pt[1];
		}
	}
	return { w: p.lengthPx * scale, h: (maxY + 2) * (p.lengthPx / 100) * scale };
}
