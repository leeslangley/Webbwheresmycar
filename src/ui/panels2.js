// Textured panels for the GU look (docs/art/GU.md): pixel-stepped corners,
// 3px ink edge, hard drop shadow, top-left highlight and bottom-right shade,
// then a material on top (paper grain, wood planks, enamel sign). Pure
// fillRect/arc recipes with exact coordinates. Pure: no DOM, no Date, no
// Math.random.

import { COLOR } from './tokens.js';

function pick(v, d) {
	return v === undefined ? d : v;
}

// One step of the grain LCG (same constants as grain()).
function lcg(s) {
	return (Math.imul(s, 1664525) + 1013904223) >>> 0;
}

// A pixel-stepped rectangle: three fillRects, the middle one cut at the
// corners by `cut` px.
export function chunkyRect(ctx, x, y, w, h, fill, cut = 3) {
	ctx.fillStyle = fill;
	ctx.fillRect(x + cut, y, w - 2 * cut, h);
	ctx.fillRect(x, y + cut, w, h - 2 * cut);
	ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}

// A framed panel: hard shadow, ink edge, fill, and a top-left highlight and
// bottom-right shade. Returns the content rect inside the frame.
export function chunkyPanel(ctx, x, y, w, h, opts) {
	const o = opts || {};
	const fill = pick(o.fill, COLOR.paper);
	const edge = pick(o.edge, COLOR.ink);
	const bw = pick(o.bw, 3);
	const cut = pick(o.cut, 3);
	const shadow = pick(o.shadow, 4);
	const hi = pick(o.hi, true);

	if (shadow > 0) {
		chunkyRect(ctx, x + shadow, y + shadow, w, h, 'rgba(0,0,0,0.35)', cut);
	}
	chunkyRect(ctx, x, y, w, h, edge, cut);
	chunkyRect(ctx, x + bw, y + bw, w - 2 * bw, h - 2 * bw, fill, Math.max(1, cut - 1));
	if (hi) {
		ctx.fillStyle = 'rgba(255,255,255,0.35)';
		ctx.fillRect(x + bw + cut, y + bw, w - 2 * bw - 2 * cut, 2);
		ctx.fillRect(x + bw, y + bw + cut, 2, h - 2 * bw - 2 * cut);
		ctx.fillStyle = 'rgba(0,0,0,0.22)';
		ctx.fillRect(x + bw + cut, y + h - bw - 2, w - 2 * bw - 2 * cut, 2);
		ctx.fillRect(x + w - bw - 2, y + bw + cut, 2, h - 2 * bw - 2 * cut);
	}
	return { x: x + bw + 4, y: y + bw + 4, w: w - 2 * (bw + 4), h: h - 2 * (bw + 4) };
}

// Scatter 2px specks over a rect. The count is floor(w*h*density); positions
// come from a seeded LCG so the same call always draws the same specks.
export function grain(ctx, x, y, w, h, color, density, seed) {
	const n = Math.floor(w * h * density);
	let s = seed >>> 0;
	ctx.fillStyle = color;
	for (let i = 0; i < n; i++) {
		s = lcg(s);
		const px = x + (s % (w - 2));
		s = lcg(s);
		const py = y + (s % (h - 2));
		ctx.fillRect(px, py, 2, 2);
	}
}

// A chunky panel with paper fill and paper grain over the content rect.
export function paperPanel(ctx, x, y, w, h, opts) {
	const src = opts || {};
	const o = {
		fill: pick(src.fill, COLOR.paper),
		edge: src.edge,
		shadow: src.shadow,
	};
	const c = chunkyPanel(ctx, x, y, w, h, o);
	grain(ctx, c.x, c.y, c.w, c.h, 'rgba(20,16,42,0.06)', 1 / 500, (x * 31 + y * 17) & 0xffff);
	return c;
}

// A chunky panel with wood fill, dark plank seams every 28px and short grain
// streaks. Streaks are skipped when the content is 40px wide or less.
export function woodPanel(ctx, x, y, w, h, opts) {
	const src = opts || {};
	const o = {
		fill: pick(src.fill, COLOR.wood),
		edge: src.edge,
		shadow: src.shadow,
	};
	const c = chunkyPanel(ctx, x, y, w, h, o);
	if (c.w <= 40) {
		return c;
	}
	const planks = Math.ceil(c.h / 28);
	ctx.fillStyle = COLOR.woodDark;
	for (let k = 1; k <= Math.floor((c.h - 1) / 28); k++) {
		ctx.fillRect(c.x, c.y + 28 * k, c.w, 2);
	}
	ctx.fillStyle = COLOR.woodGrain;
	for (let p = 0; p < planks; p++) {
		for (let j = 0; j < 3; j++) {
			const sx = lcg(p * 7 + j + 1);
			ctx.fillRect(c.x + (sx % (c.w - 40)), c.y + 28 * p + 6 + j * 8, 24 + (sx % 32), 1);
		}
	}
	return c;
}

// An enamel sign: a coloured chunky panel with a cream keyline, four rivets,
// a gloss wedge and an optional centred label.
export function enamelSign(ctx, x, y, w, h, opts) {
	const o = opts || {};
	const color = pick(o.color, COLOR.enamelRed);
	const bw = 3;
	const c = chunkyPanel(ctx, x, y, w, h, { fill: color });

	ctx.fillStyle = '#F4E9C8';
	ctx.fillRect(x + 10, y + 10, w - 20, 2);
	ctx.fillRect(x + 10, y + h - 12, w - 20, 2);
	ctx.fillRect(x + 10, y + 10, 2, h - 20);
	ctx.fillRect(x + w - 12, y + 10, 2, h - 20);

	ctx.fillStyle = COLOR.rivet;
	const rivets = [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]];
	for (let i = 0; i < rivets.length; i++) {
		ctx.beginPath();
		ctx.arc(rivets[i][0], rivets[i][1], 2.5, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.fillStyle = 'rgba(255,255,255,0.12)';
	ctx.beginPath();
	ctx.moveTo(x + bw, y + bw);
	ctx.lineTo(x + w * 0.55, y + bw);
	ctx.lineTo(x + w * 0.25, y + h - bw);
	ctx.lineTo(x + bw, y + h - bw);
	ctx.closePath();
	ctx.fill();

	if (o.text) {
		ctx.font = '16px "Press Start 2P", monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = pick(o.textColor, '#FFFFFF');
		ctx.fillText(o.text, x + w / 2, y + h / 2);
	}
	return c;
}
