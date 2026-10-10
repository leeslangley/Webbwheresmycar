// Painted car drawer (cards W50 + W50b + W50c): draws a side-on car from
// its profile. W50b adds the paint: body gradient and outline, roof
// repaint, racing stripe, glass and chrome gradients, wheel arches and a
// rim ring in opts.wheel. W50c adds the wear: rust blotches and an exhaust
// smoke puff for poor condition. Pure: no DOM, no Date. Everything draws
// via the passed-in ctx, so it runs in tests with tests/fakectx.js.

import { profileOf } from './profiles.js';
import { roundedPoly, wheel, groundShadow, circle, vgrad, rustBlotch, smokePuff } from './common.js';
import { shade } from '../ui/theme.js';

// yRange(pts): {minY, maxY} of a list of [x, y] points.
function yRange(pts) {
	let minY = Infinity;
	let maxY = -Infinity;
	for (const pt of pts) {
		if (pt[1] < minY) minY = pt[1];
		if (pt[1] > maxY) maxY = pt[1];
	}
	return { minY, maxY };
}

// drawCar(ctx, archetype, x, y, scale, opts): draw the car for archetype
// with its ground point at (x, y), scaled by scale. opts may override
// body/roof/stripe/wheel colours, condition and the wheel angle t.
export function drawCar(ctx, archetype, x, y, scale, opts = {}) {
	const p = profileOf(archetype);              // throws for an unknown archetype
	const o = { body: '#9a2a2a', roof: null, stripe: null, wheel: '#c9ccd2', cond: 10, t: 0 };
	for (const key in opts) o[key] = opts[key];  // plain copy of the options
	const k = p.lengthPx / 100 * scale;          // pixels per car unit
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(k, -k);                            // car units, y points up
	groundShadow(ctx, 0, 0, 52, 3, 0.35);
	// 1) parts in array order: gradients, roof repaint, stripe, highlight
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
		const yr = yRange(part.pts);
		if (part.k === 'body') {
			// light shade at the top of the car: car y points up, so maxY
			// is the gradient start (stop 0) and minY is its end
			ctx.fillStyle = vgrad(ctx, yr.maxY, yr.minY, shade(o.body, 0.25), shade(o.body, -0.25));
			ctx.fill();
			ctx.strokeStyle = 'rgba(0,0,0,0.45)';
			ctx.lineWidth = 0.35;
			ctx.stroke();
			if (o.roof) {
				// repaint the top 35% of the body polygon in the roof colour
				ctx.save();
				roundedPoly(ctx, part.pts, part.r);
				ctx.clip();
				ctx.fillStyle = o.roof;
				ctx.fillRect(-51, yr.minY + (yr.maxY - yr.minY) * 0.65, 102, yr.maxY);
				ctx.restore();
			}
			if (o.stripe) {
				// 2.4 unit stripe along the body at 60% of its height
				ctx.save();
				roundedPoly(ctx, part.pts, part.r);
				ctx.clip();
				ctx.fillStyle = o.stripe;
				const sy = yr.minY + (yr.maxY - yr.minY) * 0.6;
				ctx.fillRect(-51, sy - 1.2, 102, 2.4);
				ctx.restore();
			}
		} else if (part.k === 'glass') {
			ctx.fillStyle = vgrad(ctx, yr.maxY, yr.minY, '#cfe8f2', '#6f9fb4');
			ctx.fill();
			// faint diagonal highlight across the glass bounding box
			let minX = Infinity;
			let maxX = -Infinity;
			for (const pt of part.pts) {
				if (pt[0] < minX) minX = pt[0];
				if (pt[0] > maxX) maxX = pt[0];
			}
			const gw = maxX - minX;
			ctx.beginPath();
			ctx.moveTo(minX + gw * 0.15, yr.minY);
			ctx.lineTo(minX + gw * 0.55, yr.maxY);
			ctx.lineTo(minX + gw * 0.7, yr.maxY);
			ctx.lineTo(minX + gw * 0.3, yr.minY);
			ctx.closePath();
			ctx.fillStyle = 'rgba(255,255,255,0.25)';
			ctx.fill();
		} else if (part.k === 'dark') {
			ctx.fillStyle = '#1a1a22';
			ctx.fill();
		} else if (part.k === 'chrome') {
			ctx.fillStyle = vgrad(ctx, yr.maxY, yr.minY, '#f2f2f2', '#8d8d95');
			ctx.fill();
		}
	}
	// 2) wheel arches: dark circles clipped to the body, over the paint
	const bodyPart = p.parts.find(function (part) { return part.k === 'body'; });
	if (bodyPart) {
		for (const w of p.wheels) {
			ctx.save();
			roundedPoly(ctx, bodyPart.pts, bodyPart.r);
			ctx.clip();
			circle(ctx, w.x, w.r, w.r * 1.18);
			ctx.fillStyle = '#101014';
			ctx.fill();
			ctx.restore();
		}
	}
	// 3) wheels, plus a thin rim ring in opts.wheel (skipped for dim wheels)
	for (const w of p.wheels) {
		wheel(ctx, w.x, w.r, w.r, o.t, w.dim === true);
		if (w.dim !== true) {
			circle(ctx, w.x, w.r, w.r * 0.62);
			ctx.strokeStyle = o.wheel;
			ctx.lineWidth = w.r * 0.06;
			ctx.stroke();
		}
	}
	// 4) bumpers, headlight, tail light
	ctx.fillStyle = '#d8d8de';
	ctx.fillRect(-51, 6, 2, 4);
	ctx.fillRect(49, 6, 2, 4);
	circle(ctx, p.head.x, p.head.y, p.head.r);
	ctx.fillStyle = '#fff6c0';
	ctx.fill();
	ctx.fillStyle = '#c0282d';
	ctx.fillRect(p.tail.x - p.tail.w / 2, p.tail.y - p.tail.h / 2, p.tail.w, p.tail.h);
	// 5) wear: rust blotches along the lower body for poor condition, and
	// an exhaust smoke puff at the tail when it is very poor
	if (o.cond < 4) {
		rustBlotch(ctx, -30, 12, 2.2);
		rustBlotch(ctx, 4, 9, 1.8);
		rustBlotch(ctx, 32, 13, 2.0);
	}
	if (o.cond < 2) {
		smokePuff(ctx, p.tail.x - 2, p.tail.y - 6, o.t, 0.18);
	}
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
