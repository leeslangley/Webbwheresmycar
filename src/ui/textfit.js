// Text-fit helpers (card GU02): choose a font size and wrap lines so text fits
// a box, using measured numbers rather than eyeballing. Also fits a picture
// into a rectangle. Pure: no DOM, no Date, no Math.random. Used by the kit
// (GU21) and the scene cards.

import { font } from './theme.js';
import { FLOOR } from './tokens.js';

// Return opts[key] when given, else the default d (0 and '' stay as given).
function pick(v, d) {
	return v === undefined ? d : v;
}

// Greedy word wrap at maxW using fontStr. Newlines start a new paragraph; a
// word wider than maxW gets a line of its own. No empty trailing line.
function wrap(ctx, text, maxW, fontStr) {
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
				continue;
			}
			if (line !== '') {
				lines.push(line);
				line = '';
			}
			if (ctx.measureText(word).width > maxW) {
				lines.push(word); // too wide for the box: its own line
			} else {
				line = word;
			}
		}
		if (line !== '') {
			lines.push(line);
		}
	}
	return lines;
}

// True when every line measures no wider than w in fontStr.
function linesFit(ctx, lines, w, fontStr) {
	ctx.font = fontStr;
	for (let i = 0; i < lines.length; i++) {
		if (ctx.measureText(lines[i]).width > w) {
			return false;
		}
	}
	return true;
}

// ellipsize(ctx, text, maxW, fontStr): text unchanged when it fits maxW.
// Otherwise the longest prefix p such that p + '...' fits. '' when even
// '...' does not fit.
export function ellipsize(ctx, text, maxW, fontStr) {
	ctx.font = fontStr;
	const s = String(text);
	if (ctx.measureText(s).width <= maxW) {
		return s;
	}
	for (let n = s.length - 1; n >= 0; n--) {
		const cand = s.slice(0, n) + '...';
		if (ctx.measureText(cand).width <= maxW) {
			return cand;
		}
	}
	return '';
}

// fitOne(ctx, text, maxW, opts): one line. opts {kind:'body', maxPx:28,
// minPx: FLOOR[kind]}. Tries the largest px first, down to minPx. The first
// size whose width fits gives {px, text, w, truncated:false}. If none fits,
// the text is ellipsized at minPx: {px:minPx, text, w, truncated:true}.
export function fitOne(ctx, text, maxW, opts) {
	const o = opts || {};
	const kind = pick(o.kind, 'body');
	const maxPx = pick(o.maxPx, 28);
	const minPx = pick(o.minPx, FLOOR[kind]);
	for (let px = maxPx; px >= minPx; px--) {
		const fontStr = font(kind, px);
		ctx.font = fontStr;
		const w = ctx.measureText(String(text)).width;
		if (w <= maxW) {
			return { px: px, text: String(text), w: w, truncated: false };
		}
	}
	const fontMin = font(kind, minPx);
	const t = ellipsize(ctx, text, maxW, fontMin);
	ctx.font = fontMin;
	return { px: minPx, text: t, w: ctx.measureText(t).width, truncated: true };
}

// fitBlock(ctx, text, w, h, opts): wrapped block. opts {kind:'body',
// maxPx:28, minPx: FLOOR[kind], lineRatio:1.1, maxLines:Infinity}. The first
// size (largest first) whose wrapped lines fit w x h and maxLines is accepted:
// {px, lines, lineH, h, truncated:false}. If none fits, at minPx keep the
// lines that fit (at least one) and ellipsize the last kept line to w:
// {px:minPx, lines, lineH, h, truncated:true}.
export function fitBlock(ctx, text, w, h, opts) {
	const o = opts || {};
	const kind = pick(o.kind, 'body');
	const maxPx = pick(o.maxPx, 28);
	const minPx = pick(o.minPx, FLOOR[kind]);
	const lineRatio = pick(o.lineRatio, 1.1);
	const maxLines = pick(o.maxLines, Infinity);
	for (let px = maxPx; px >= minPx; px--) {
		const fontStr = font(kind, px);
		const lines = wrap(ctx, text, w, fontStr);
		const lineH = Math.round(px * lineRatio);
		if (lines.length <= maxLines && lines.length * lineH <= h && linesFit(ctx, lines, w, fontStr)) {
			return { px: px, lines: lines, lineH: lineH, h: lines.length * lineH, truncated: false };
		}
	}
	const fontMin = font(kind, minPx);
	const lineHMin = Math.round(minPx * lineRatio);
	const all = wrap(ctx, text, w, fontMin);
	const keep = Math.max(1, Math.min(maxLines, Math.floor(h / lineHMin)));
	const lines = all.slice(0, keep);
	if (lines.length === 0) {
		lines.push('');
	}
	// Mark the cut with '...' on the last kept line, always fitting w.
	const last = lines.length - 1;
	lines[last] = ellipsize(ctx, lines[last] + '...', w, fontMin);
	return { px: minPx, lines: lines, lineH: lineHMin, h: lines.length * lineHMin, truncated: true };
}

// drawFitted(ctx, text, rect, opts): fitBlock(rect.w, rect.h, opts) then draws
// each line. opts also takes align ('left'|'center'|'right', default left),
// valign ('middle' centres the block vertically) and color (default
// '#14102A'). x is rect.x, rect.x + rect.w/2 or rect.x + rect.w. Returns the
// fitBlock result.
export function drawFitted(ctx, text, rect, opts) {
	const o = opts || {};
	const r = fitBlock(ctx, text, rect.w, rect.h, o);
	const align = pick(o.align, 'left');
	let x = rect.x;
	if (align === 'center') {
		x = rect.x + rect.w / 2;
	} else if (align === 'right') {
		x = rect.x + rect.w;
	}
	const top = o.valign === 'middle' ? rect.y + (rect.h - r.h) / 2 : rect.y;
	ctx.font = font(pick(o.kind, 'body'), r.px);
	ctx.textAlign = align;
	ctx.textBaseline = 'top';
	ctx.fillStyle = pick(o.color, '#14102A');
	for (let i = 0; i < r.lines.length; i++) {
		ctx.fillText(r.lines[i], x, top + i * r.lineH);
	}
	return r;
}

// fitInRect(srcW, srcH, rect, opts): opts {maxScale: Infinity, pad: 8}. Scales
// a srcW x srcH picture to fit rect less pad on each side, never above
// maxScale. Returns the scale, the centre x, the bottom y (rect.y + rect.h -
// pad, where a car's ground point goes) and the scaled w and h.
export function fitInRect(srcW, srcH, rect, opts) {
	const o = opts || {};
	const maxScale = pick(o.maxScale, Infinity);
	const pad = pick(o.pad, 8);
	const scale = Math.min(maxScale, (rect.w - 2 * pad) / srcW, (rect.h - 2 * pad) / srcH);
	return {
		scale: scale,
		x: rect.x + rect.w / 2,
		y: rect.y + rect.h - pad,
		w: srcW * scale,
		h: srcH * scale,
	};
}
