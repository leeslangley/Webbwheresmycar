// UI kit drawing helpers (DESIGN.md section 9.7): panels, labels, word wrap,
// paragraphs, buttons, bars. Every function takes ctx as a parameter (never
// document/window) so it runs in jsc tests with tests/fakectx.js.

import { PALETTE, font, shade, rgba } from './theme.js';
import { money } from '../core/format.js';

function clamp(x, lo, hi) {
	return x < lo ? lo : x > hi ? hi : x;
}

// Trace a rounded-rectangle path (no fill/stroke): the caller decides what
// to do with it. Radius is clamped so very small shapes stay valid.
function roundRectPath(ctx, x, y, w, h, r) {
	const r2 = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + r2, y);
	ctx.lineTo(x + w - r2, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
	ctx.lineTo(x + w, y + h - r2);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
	ctx.lineTo(x + r2, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r2);
	ctx.lineTo(x, y + r2);
	ctx.quadraticCurveTo(x, y, x + r2, y);
	ctx.closePath();
}

// panel(ctx,x,y,w,h,opts): rounded cream panel with an ink border and an
// optional drop shadow behind it. opts: fill, border, radius (10), shadow
// (true), bw (border width, 4).
export function panel(ctx, x, y, w, h, opts = {}) {
	const fill = opts.fill !== undefined ? opts.fill : PALETTE.cream;
	const border = opts.border !== undefined ? opts.border : PALETTE.ink;
	const radius = opts.radius !== undefined ? opts.radius : 10;
	const shadow = opts.shadow !== undefined ? opts.shadow : true;
	const bw = opts.bw !== undefined ? opts.bw : 4;
	if (shadow) {
		roundRectPath(ctx, x + 6, y + 6, w, h, radius);
		ctx.fillStyle = rgba('#000000', 0.35);
		ctx.fill();
	}
	roundRectPath(ctx, x, y, w, h, radius);
	ctx.fillStyle = fill;
	ctx.fill();
	if (bw > 0) {
		ctx.lineWidth = bw;
		ctx.strokeStyle = border;
		ctx.stroke();
	}
}

// label(ctx,text,x,y,opts): one line of text with textBaseline 'top'.
// opts: size (16), color (PALETTE.ink), align ('left'), font ('body'|'title'),
// shadow (false), maxW (none: shrink the font 1px at a time, floor 8, until
// the text fits). Returns the measured width at the final size.
export function label(ctx, text, x, y, opts = {}) {
	let size = opts.size !== undefined ? opts.size : 16;
	const color = opts.color !== undefined ? opts.color : PALETTE.ink;
	const align = opts.align !== undefined ? opts.align : 'left';
	const kind = opts.font !== undefined ? opts.font : 'body';
	const shadow = opts.shadow === true;
	const maxW = opts.maxW;
	ctx.font = font(kind, size);
	ctx.textAlign = align;
	ctx.textBaseline = 'top';
	if (maxW !== undefined && maxW !== null) {
		while (size > 8 && ctx.measureText(text).width > maxW) {
			size -= 1;
			ctx.font = font(kind, size);
		}
	}
	if (shadow) {
		ctx.fillStyle = rgba('#000000', 0.5);
		ctx.fillText(text, x + 2, y + 2);
	}
	ctx.fillStyle = color;
	ctx.fillText(text, x, y);
	return ctx.measureText(text).width;
}

// wrapLines(ctx,text,maxW,fontStr)->string[]: greedy word wrap. Splits on
// newlines into paragraphs, then on spaces into words; a word wider than
// maxW gets a line of its own. No empty trailing line.
export function wrapLines(ctx, text, maxW, fontStr) {
	ctx.font = fontStr;
	const lines = [];
	const paras = String(text).split('\n');
	for (let p = 0; p < paras.length; p++) {
		const para = paras[p];
		if (para === '') {
			lines.push('');
			continue;
		}
		const words = para.split(' ');
		let line = '';
		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			if (word === '') {
				continue;
			}
			const cand = line === '' ? word : line + ' ' + word;
			if (ctx.measureText(cand).width <= maxW) {
				line = cand;
			} else if (line === '') {
				lines.push(word); // a word wider than maxW gets its own line
			} else {
				lines.push(line);
				if (ctx.measureText(word).width > maxW) {
					lines.push(word);
					line = '';
				} else {
					line = word;
				}
			}
		}
		if (line !== '') {
			lines.push(line);
		}
	}
	while (lines.length > 0 && lines[lines.length - 1] === '') {
		lines.pop();
	}
	return lines;
}

// paragraph(ctx,text,x,y,maxW,opts)->bottomY: wrapped body text. Draws each
// line with label and returns the y just below the last line.
export function paragraph(ctx, text, x, y, maxW, opts = {}) {
	const size = opts.size !== undefined ? opts.size : 24;
	const color = opts.color !== undefined ? opts.color : PALETTE.ink;
	const kind = opts.font !== undefined ? opts.font : 'body';
	const lineH = opts.lineH !== undefined ? opts.lineH : Math.round(size * 1.1);
	const lines = wrapLines(ctx, text, maxW, font(kind, size));
	for (let i = 0; i < lines.length; i++) {
		label(ctx, lines[i], x, y + i * lineH, { size: size, color: color, font: kind });
	}
	return y + lines.length * lineH;
}

// button(ctx,b): b = {x,y,w,h,label,enabled=true,hot=false,kind='normal'}.
// kind 'normal'|'primary'|'danger' picks the fill; a disabled button is grey
// with a dark label. A light strip along the top gives a chunky bevel; a hot
// button gets a 3px lamp outline.
export function button(ctx, b) {
	const enabled = b.enabled !== false;
	let fill;
	if (!enabled) {
		fill = PALETTE.midgrey;
	} else if (b.kind === 'primary') {
		fill = PALETTE.good;
	} else if (b.kind === 'danger') {
		fill = PALETTE.bad;
	} else {
		fill = PALETTE.lightblue;
	}
	panel(ctx, b.x, b.y, b.w, b.h, { fill: fill });
	ctx.fillStyle = shade(fill, 0.3);
	ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, Math.round((b.h - 8) * 0.25));
	const size = Math.max(10, Math.min(20, Math.round(b.h * 0.32)));
	label(ctx, b.label, b.x + b.w / 2, b.y + Math.round((b.h - size) / 2), {
		size: size,
		align: 'center',
		font: 'title',
		color: enabled ? PALETTE.white : PALETTE.darkgrey,
		shadow: true,
		maxW: b.w - 16,
	});
	if (b.hot) {
		ctx.lineWidth = 3;
		ctx.strokeStyle = PALETTE.lamp;
		ctx.strokeRect(b.x, b.y, b.w, b.h);
	}
}

// bar(ctx,x,y,w,h,value,max,color): a 2px ink frame with a dark well and a
// colour fill proportional to value/max (clamped 0..1; max 0 means empty).
export function bar(ctx, x, y, w, h, value, max, color) {
	const frac = max > 0 ? clamp(value / max, 0, 1) : 0;
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(x, y, w, h);
	ctx.fillStyle = color;
	ctx.fillRect(x + 2, y + 2, (w - 4) * frac, h - 4);
	ctx.lineWidth = 2;
	ctx.strokeStyle = PALETTE.ink;
	ctx.strokeRect(x, y, w, h);
}

// moneyText(n) -> money(n) string, e.g. GBP 1,234.
export function moneyText(n) {
	return money(n);
}
