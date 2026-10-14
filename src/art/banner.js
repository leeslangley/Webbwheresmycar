// Big speech banner and portrait frame in the Rock Star Ate My Hamster style
// (card GC25, docs/art/RSAMH_STYLE.md). Everything is drawn with fillRect on
// a 4 px grid so it reads as chunky pixel art. Pure: no DOM, no randomness,
// no clock. Everything draws via the passed-in ctx, so it runs in tests with
// tests/fakectx.js.

import { PALETTE, font, shade, rgba } from '../ui/theme.js';

// Pixel grid step.
export const G = 4;
// Outline and text ink.
export const INK = '#14102a';
// Peach gradient bands, lightest at the top.
export const PEACH = ['#f8dcb8', '#f2c9a0', '#e8b085', '#d99a6c'];

// Body text: font size and line pitch.
const TEXT_PX = 28;
const LINE_H = 30;
const MAX_LINES = 3;
// Typewriter speed: characters revealed per unit of opts.reveal.
const CHARS_PER_REVEAL = 40;

// wrapText(ctx, text, maxW, maxLines): greedy word wrap measured with
// ctx.measureText. Words keep their trailing spaces, so a prefix that ends
// in a space draws that space. A word wider than maxW gets a line of its own.
// When more than maxLines lines are needed the last kept line is cut back
// until it plus '...' fits, and ends with '...'.
function wrapText(ctx, text, maxW, maxLines) {
	const tokens = text.match(/\S+\s*|\s+/g) || [];
	const lines = [];
	let line = '';
	for (const tok of tokens) {
		const cand = line + tok;
		if (!line.trim() || ctx.measureText(cand.replace(/\s+$/, '')).width <= maxW) {
			line = cand;
		} else {
			lines.push(line);
			line = tok;
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		lines.length = maxLines;
		let last = lines[maxLines - 1].replace(/\s+$/, '');
		while (last.length > 0 && ctx.measureText(last + '...').width > maxW) {
			last = last.slice(0, -1).replace(/\s+$/, '');
		}
		lines[maxLines - 1] = last + '...';
	}
	return lines;
}

// drawBanner(ctx, rect, text, t, opts): draw the speech banner filling rect
// (rect = {x, y, w, h}, multiples of 4; h should be a multiple of 16 so the
// bands and dither rows land on the grid). opts = {tailX, reveal}: tailX is
// the x the tail points at; reveal (a number) types the text out, showing
// the first floor(reveal * 40) characters of the upper-cased text, with a
// blinking cursor while characters are still hidden. t drives the blink.
export function drawBanner(ctx, rect, text, t, opts) {
	opts = opts || {};
	const body = text == null ? '' : String(text);
	const bandH = rect.h / 4;
	const right = rect.x + rect.w;
	const bottom = rect.y + rect.h;
	ctx.save();

	// (1) shadow
	ctx.fillStyle = rgba('#000000', 0.35);
	ctx.fillRect(rect.x + G, rect.y + G, rect.w, rect.h);

	// (2) body: four peach bands, then a dithered row on each boundary
	for (let i = 0; i < 4; i++) {
		ctx.fillStyle = PEACH[i];
		ctx.fillRect(rect.x, rect.y + i * bandH, rect.w, bandH);
	}
	for (let i = 0; i < 3; i++) {
		const y = rect.y + (i + 1) * bandH;
		for (let j = 0; rect.x + j * 2 * G < right; j++) {
			ctx.fillStyle = (j + i) % 2 === 0 ? PEACH[i] : PEACH[i + 1];
			ctx.fillRect(rect.x + j * 2 * G, y, G, G);
		}
	}

	// (3) outline, G px thick, cut at the corners
	ctx.fillStyle = INK;
	ctx.fillRect(rect.x + G, rect.y, rect.w - 2 * G, G);
	ctx.fillRect(rect.x + G, bottom - G, rect.w - 2 * G, G);
	ctx.fillRect(rect.x, rect.y + G, G, rect.h - 2 * G);
	ctx.fillRect(right - G, rect.y + G, G, rect.h - 2 * G);
	const cx0 = rect.x + G;
	const cx1 = right - 2 * G;
	const cy0 = rect.y + G;
	const cy1 = bottom - 2 * G;
	ctx.fillRect(cx0, cy0, G, G);
	ctx.fillRect(cx1, cy0, G, G);
	ctx.fillRect(cx0, cy1, G, G);
	ctx.fillRect(cx1, cy1, G, G);

	// (4) tail, leaning right, 5 * G tall
	const tailX = typeof opts.tailX === 'number' ? opts.tailX : rect.x + rect.w / 2;
	let bx = Math.round(tailX / G) * G - 16;
	bx = Math.min(Math.max(bx, rect.x + 4 * G), rect.x + rect.w - 7 * G);
	for (let i = 0; i <= 4; i++) {
		const y = bottom + i * G;
		ctx.fillStyle = PEACH[3];
		ctx.fillRect(bx + i * G, y, (5 - i) * G, G);
		ctx.fillStyle = INK;
		ctx.fillRect(bx + i * G, y, G, G);
		ctx.fillRect(bx + 4 * G, y, G, G);
	}

	// Text: typed out when opts.reveal is a number, else all of it.
	const upper = body.toUpperCase();
	const typing = typeof opts.reveal === 'number';
	const shown = typing ? upper.slice(0, Math.floor(opts.reveal * CHARS_PER_REVEAL)) : upper;
	const hidden = typing && shown.length < upper.length;
	ctx.font = font('body', TEXT_PX);
	ctx.fillStyle = INK;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	const textX = rect.x + 3 * G;
	const lines = wrapText(ctx, shown, rect.w - 6 * G, MAX_LINES);
	for (let i = 0; i < lines.length; i++) {
		ctx.fillText(lines[i], textX, rect.y + 3 * G + i * LINE_H);
	}
	if (hidden && Math.floor(t * 4) % 2 === 0) {
		let cx = textX;
		let cy = rect.y + 3 * G;
		if (lines.length > 0) {
			const li = lines.length - 1;
			cx += ctx.measureText(lines[li]).width;
			cy = rect.y + 3 * G + li * LINE_H;
		}
		ctx.fillStyle = INK;
		ctx.fillRect(cx, cy, 2 * G, 2 * G);
	}
	ctx.restore();
}

// drawPortraitFrame(ctx, rect, name): the framed portrait box with a name
// plaque under it. The caller draws the bust sprite on top of the returned
// inner rect. Returns {x, y, w, h}: rect inset by 2 * G on every side.
export function drawPortraitFrame(ctx, rect, name) {
	const right = rect.x + rect.w;
	const bottom = rect.y + rect.h;
	const bandH = rect.h / 4;
	const inner = {
		x: rect.x + 2 * G,
		y: rect.y + 2 * G,
		w: rect.w - 4 * G,
		h: rect.h - 4 * G,
	};
	const plaqueY = bottom + G;
	const plaqueH = 7 * G;
	ctx.save();

	// shadow like the banner
	ctx.fillStyle = rgba('#000000', 0.35);
	ctx.fillRect(rect.x + G, rect.y + G, rect.w, rect.h);

	// INK outline, 2 * G thick
	ctx.fillStyle = INK;
	ctx.fillRect(rect.x, rect.y, rect.w, 2 * G);
	ctx.fillRect(rect.x, bottom - 2 * G, rect.w, 2 * G);
	ctx.fillRect(rect.x, rect.y, 2 * G, rect.h);
	ctx.fillRect(right - 2 * G, rect.y, 2 * G, rect.h);

	// inside fill, with a dithered row every rect.h / 4
	ctx.fillStyle = PALETTE.lightblue;
	ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
	const light = shade(PALETTE.lightblue, 0.18);
	for (let k = 1; k < 4; k++) {
		const y = rect.y + k * bandH;
		for (let j = 0; inner.x + j * 2 * G < inner.x + inner.w; j++) {
			ctx.fillStyle = (j + k) % 2 === 0 ? light : PALETTE.lightblue;
			ctx.fillRect(inner.x + j * 2 * G, y, G, G);
		}
	}

	// name plaque under the frame
	ctx.fillStyle = PALETTE.cream;
	ctx.fillRect(rect.x, plaqueY, rect.w, plaqueH);
	ctx.fillStyle = INK;
	ctx.fillRect(rect.x, plaqueY, rect.w, G);
	ctx.fillRect(rect.x, plaqueY + plaqueH - G, rect.w, G);
	ctx.fillRect(rect.x, plaqueY, G, plaqueH);
	ctx.fillRect(right - G, plaqueY, G, plaqueH);
	ctx.font = font('title', 12);
	ctx.fillStyle = INK;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(String(name == null ? '' : name).toUpperCase(), rect.x + rect.w / 2, plaqueY + plaqueH / 2);

	ctx.restore();
	return inner;
}
