// Light effects for the room plates (DESIGN.md 9.7, docs/art/WD.md): additive
// lamp and TV glow with deterministic flicker, a window light shaft, a
// vignette, film grain and a glass glare for the telly and laptop screens.
// Pure: no DOM, no Date, no Math.random; all motion derives from t. Everything
// draws via the passed-in ctx, so it runs in tests with tests/fakectx.js.

import { rgba } from '../ui/theme.js';

// flicker(t, seed, depth) -> a multiplier in [1 - depth, 1]. Two sines at
// different speeds give a lamp-like wobble that is fixed for a given t.
export function flicker(t, seed, depth) {
	const s = 0.6 * Math.sin(t * 7.3 + seed) + 0.4 * Math.sin(t * 17.9 + seed * 2.1);
	return 1 - depth * (0.5 + 0.5 * s);
}

// glow(ctx, x, y, r, color, alpha): an additive radial gradient disc of
// radius r, fading from rgba(color, alpha) at the centre to transparent.
export function glow(ctx, x, y, r, color, alpha) {
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const g = ctx.createRadialGradient(x, y, 0, x, y, r);
	g.addColorStop(0, rgba(color, alpha));
	g.addColorStop(1, rgba(color, 0));
	ctx.fillStyle = g;
	ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
	ctx.restore();
}

// lampGlow(ctx, x, y, t): a warm lamp pool at (x, y), flickering with t.
export function lampGlow(ctx, x, y, t) {
	glow(ctx, x, y, 170, '#ffab55', 0.38 * flicker(t, 1.3, 0.12));
}

// tvGlow(ctx, rect, t): a cool blue spill around the centre of a screen rect
// ({x, y, w, h}), flickering with t.
export function tvGlow(ctx, rect, t) {
	glow(ctx, rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.9,
		'#78b4ff', 0.22 * flicker(t, 4.1, 0.25));
}

// sunShaft(ctx, quad, t): a soft window light shaft. quad is four [x, y]
// points; its alpha breathes slowly with t.
export function sunShaft(ctx, quad, t) {
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.fillStyle = rgba('#ffe2b8', 0.10 + 0.03 * Math.sin(t * 0.6));
	ctx.beginPath();
	ctx.moveTo(quad[0][0], quad[0][1]);
	ctx.lineTo(quad[1][0], quad[1][1]);
	ctx.lineTo(quad[2][0], quad[2][1]);
	ctx.lineTo(quad[3][0], quad[3][1]);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

// vignette(ctx, w, h, strength): darkens the corners of a w x h plate. The
// fill runs 144 px past each side so it also covers the strips of a wide
// phone screen (docs/art/WD.md).
export function vignette(ctx, w, h, strength) {
	ctx.save();
	const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, w * 0.62);
	g.addColorStop(0, rgba('#000000', 0));
	g.addColorStop(1, rgba('#000000', strength));
	ctx.fillStyle = g;
	ctx.fillRect(-144, 0, w + 288, h);
	ctx.restore();
}

// grain(ctx, w, h, t, n): n tiny 2x2 specks scattered over a w x h plate.
// The pattern is an integer hash of the speck index and k = floor(t * 12),
// so it changes twelve times a second and is the same for the same t.
export function grain(ctx, w, h, t, n) {
	const k = Math.floor(t * 12);
	ctx.save();
	for (let i = 0; i < n; i++) {
		const x = (i * 7919 + k * 104729) % w;
		const y = (i * 6007 + k * 15485863) % h;
		ctx.fillStyle = i % 2 === 0 ? rgba('#ffffff', 0.05) : rgba('#000000', 0.06);
		ctx.fillRect(x, y, 2, 2);
	}
	ctx.restore();
}

// glassGlare(ctx, rect, t): a faint diagonal sheen across a screen rect and
// thin dark scanlines every 6 px, clipped to the rect. t is accepted to keep
// the signature the same as the other effects; the glare does not move.
export function glassGlare(ctx, rect, t) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.w, rect.h);
	ctx.clip();
	ctx.fillStyle = rgba('#ffffff', 0.05);
	ctx.beginPath();
	ctx.moveTo(rect.x + rect.w * 0.1, rect.y);
	ctx.lineTo(rect.x + rect.w * 0.3, rect.y);
	ctx.lineTo(rect.x + rect.w * 0.15, rect.y + rect.h);
	ctx.lineTo(rect.x - rect.w * 0.05, rect.y + rect.h);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = rgba('#000000', 0.06);
	for (let y = rect.y; y < rect.y + rect.h; y += 6) {
		ctx.fillRect(rect.x, y, rect.w, 1);
	}
	ctx.restore();
}
