// Screen transitions B (docs/art/GU.md): the TV-static wipe (Webb TV shop)
// and the newspaper page-turn. They use the same draw signature as GU15
// (ctx, tr, nowMs, drawFrom, drawTo), so no offscreen canvas is needed.
// Pure: no DOM, no Date, no Math.random.

import { transProgress } from './transitions.js';
import { EASE } from './tokens.js';

// Static grey levels, darkest to lightest.
export const STATIC_COLORS = ['#101010', '#505050', '#A0A0A0', '#F0F0F0'];

const CELL = 32;
const ROWS = 23;

// staticCells(cols, rows, coverage, frame) -> [{i, j, level}] for the cells
// that show static this frame. A cell is kept when its hash lands below
// coverage; level picks one of STATIC_COLORS. Same inputs give the same list.
export function staticCells(cols, rows, coverage, frame) {
	const out = [];
	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < cols; i++) {
			const h = (Math.imul(i + 1, 73856093) ^ Math.imul(j + 1, 19349663) ^ Math.imul(frame + 1, 83492791)) >>> 0;
			if ((h % 1000) / 1000 < coverage) {
				out.push({ i: i, j: j, level: (h >>> 10) % 4 });
			}
		}
	}
	return out;
}

// drawStaticWipe(ctx, tr, nowMs, drawFrom, drawTo, w, h): the outgoing screen
// swaps to the incoming one at the midpoint, with static over it that peaks
// at the midpoint. At progress 1 or more it draws only drawTo.
export function drawStaticWipe(ctx, tr, nowMs, drawFrom, drawTo, w = 1280, h = 720) {
	const u = transProgress(tr, nowMs);
	if (u >= 1) {
		drawTo();
		return;
	}
	if (u < 0.5) {
		drawFrom();
	} else {
		drawTo();
	}
	const coverage = 1 - Math.abs(2 * u - 1);
	const frame = Math.floor(nowMs / 50);
	const cells = staticCells(Math.ceil(w / CELL), ROWS, coverage, frame);
	for (let k = 0; k < cells.length; k++) {
		const c = cells[k];
		ctx.fillStyle = STATIC_COLORS[c.level];
		ctx.fillRect(c.i * CELL, c.j * CELL, CELL, CELL);
	}
}

// drawPageTurn(ctx, tr, nowMs, drawFrom, drawTo, w, h): the old page squashes
// toward the left spine while the new page shows underneath. A shadow and a
// light edge sit on the turning page's edge. At progress 1 or more it draws
// only drawTo.
export function drawPageTurn(ctx, tr, nowMs, drawFrom, drawTo, w = 1280, h = 720) {
	const u = transProgress(tr, nowMs);
	if (u >= 1) {
		drawTo();
		return;
	}
	drawTo();
	const e = EASE.inOutQuad(u);
	const sx = 1 - e;
	ctx.save();
	ctx.beginPath();
	ctx.rect(0, 0, w, h);
	ctx.clip();
	ctx.scale(sx, 1);
	drawFrom();
	ctx.restore();
	const edgeX = sx * w;
	ctx.fillStyle = `rgba(0,0,0,${(0.3 * (1 - u)).toFixed(3)})`;
	ctx.fillRect(edgeX, 0, 24, h);
	ctx.fillStyle = 'rgba(255,247,220,0.8)';
	ctx.fillRect(edgeX - 3, 0, 3, h);
}
