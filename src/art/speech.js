// Dave's speech bubble (card W53d): the rounded comment-of-the-day bubble
// with a tail, bobbing gently over time. Pure: no DOM, no Date. Everything
// draws via the passed-in ctx, so it runs in tests with tests/fakectx.js.

import { PALETTE, font } from '../ui/theme.js';

// Radius of the bubble's rounded corners.
const RADIUS = 12;
// Line height and inner padding for the wrapped comment text.
const LINE_H = 28;
const PAD_X = 12;
const PAD_Y = 10;
const MAX_LINES = 3;

// roundedRectPath(ctx, x, y, w, h, r): trace a rounded rectangle using
// quadratic curves at the corners.
function roundedRectPath(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

// wrapLines(ctx, text, maxW, maxLines): greedy word wrap measured with
// ctx.measureText. A word that does not fit on a line of its own is still
// placed there (hard break), so the loop always terminates. When more than
// maxLines lines are needed the last kept line is cut back until it plus
// '...' fits, and ends with '...'.
function wrapLines(ctx, text, maxW, maxLines) {
	const words = String(text).split(/\s+/).filter(function (w) {
		return w.length > 0;
	});
	const lines = [];
	let line = '';
	for (const word of words) {
		const cand = line ? line + ' ' + word : word;
		if (!line || ctx.measureText(cand).width <= maxW) {
			line = cand;
		} else {
			lines.push(line);
			line = word;
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		lines.length = maxLines;
		let last = lines[maxLines - 1];
		while (last.length > 0 && ctx.measureText(last + '...').width > maxW) {
			last = last.slice(0, -1);
		}
		lines[maxLines - 1] = last + '...';
	}
	return lines;
}

// speechBubble(ctx, rect, text, t): draw the speech bubble filling rect
// (rect = {x, y, w, h}) with the comment text wrapped inside it. The whole
// bubble bobs by Math.sin(t * 2) * 2 pixels.
export function speechBubble(ctx, rect, text, t) {
	const bob = Math.sin(t * 2) * 2;
	const x = rect.x;
	const y = rect.y + bob;
	ctx.save();
	// bubble body
	roundedRectPath(ctx, x, y, rect.w, rect.h, RADIUS);
	ctx.fillStyle = PALETTE.white;
	ctx.fill();
	ctx.strokeStyle = PALETTE.ink;
	ctx.lineWidth = 3;
	ctx.stroke();
	// tail below the left part: filled triangle, only the two slanted
	// edges stroked (the top edge is the bubble's own outline)
	const ty = rect.y + rect.h + bob;
	ctx.beginPath();
	ctx.moveTo(x + 30, ty);
	ctx.lineTo(x + 52, ty);
	ctx.lineTo(x + 22, ty + 22);
	ctx.closePath();
	ctx.fillStyle = PALETTE.white;
	ctx.fill();
	ctx.beginPath();
	ctx.moveTo(x + 52, ty);
	ctx.lineTo(x + 22, ty + 22);
	ctx.lineTo(x + 30, ty);
	ctx.stroke();
	// comment text, wrapped to the inner width
	ctx.font = font('body', 26);
	ctx.fillStyle = PALETTE.ink;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	const lines = wrapLines(ctx, text, rect.w - 24, MAX_LINES);
	for (let i = 0; i < lines.length; i++) {
		ctx.fillText(lines[i], x + PAD_X, y + PAD_Y + i * LINE_H);
	}
	ctx.restore();
}
