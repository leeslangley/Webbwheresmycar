// The wall calendar on the office's left wall (DESIGN.md sections 4.1, 5):
// a paper page hanging by a nail, red header band with the month name, a
// thin spiral binding, the DAY n of 365 line and a 7-column month grid.
// Every day before today is crossed out in red (yesterday's X animates in
// with a scribble), today is circled in green. Pure: no DOM, no Date,
// everything through the passed-in ctx, so it runs in jsc tests with
// tests/fakectx.js.

import { PALETTE, font, rgba } from '../ui/theme.js';
import { pulse } from './common.js';
import { dateOf, dayOfYearStart, MONTH_LENGTHS, DAYS_IN_YEAR } from '../core/clock.js';

// Centred text helper (same convention as office.js): sets font and colour,
// draws one line, then puts textAlign back to 'left'.
function centreText(ctx, str, cx, y, kind, px, colour) {
	ctx.font = font(kind, px);
	ctx.textAlign = 'center';
	ctx.fillStyle = colour;
	ctx.fillText(str, cx, y);
	ctx.textAlign = 'left';
}

// One X over a cell: two diagonal strokes from corner to corner, each drawn
// to a fraction (f1, f2) of its length, so yesterday's X can animate in.
function drawCross(ctx, x, y, w, h, inset, f1, f2) {
	ctx.strokeStyle = PALETTE.bad;
	ctx.lineWidth = 3;
	if (f1 > 0) {
		ctx.beginPath();
		ctx.moveTo(x + inset, y + inset);
		ctx.lineTo(x + inset + (w - inset * 2) * f1, y + inset + (h - inset * 2) * f1);
		ctx.stroke();
	}
	if (f2 > 0) {
		ctx.beginPath();
		ctx.moveTo(x + w - inset, y + inset);
		ctx.lineTo(x + w - inset - (w - inset * 2) * f2, y + inset + (h - inset * 2) * f2);
		ctx.stroke();
	}
}

// drawWallCalendar(ctx, r, day, t, crossAnim = 1): paints the calendar page
// for day-of-year `day` (1..365, clamped) into the rect r = {x,y,w,h}.
// t drives the pulse of today's circle; crossAnim (0..1) is the progress of
// the scribble crossing out the previous day. Returns
// {crossed, cells, monthName}: crossed is the number of crossed cells in
// this month (dayOfMonth - 1), cells the days in the month.
export function drawWallCalendar(ctx, r, day, t, crossAnim = 1) {
	if (typeof day !== 'number' || !isFinite(day)) {
		day = 1;
	}
	day = Math.max(1, Math.min(DAYS_IN_YEAR, Math.floor(day)));
	let anim = crossAnim;
	if (typeof anim !== 'number' || !isFinite(anim)) {
		anim = 1;
	}
	anim = Math.max(0, Math.min(1, anim));
	if (typeof t !== 'number' || !isFinite(t)) {
		t = 0;
	}

	const info = dateOf(day);
	const cells = MONTH_LENGTHS[info.month - 1];
	const crossed = info.dayOfMonth - 1;
	// Day-of-year 1 is a Monday, so weekday of a day-of-year d is (d-1)%7.
	const offset = (dayOfYearStart(info.month) - 1) % 7;

	ctx.save();

	const inset = Math.max(4, Math.round(r.w * 0.05));
	const headerH = Math.max(14, Math.round(r.h * 0.1));
	const cx = r.x + r.w / 2;
	const cellW = (r.w - inset * 2) / 7;

	// Nail and the two strings the page hangs from.
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.beginPath();
	ctx.arc(cx, r.y - 9, 3, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = PALETTE.brown;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(cx, r.y - 9);
	ctx.lineTo(r.x + r.w * 0.25, r.y);
	ctx.moveTo(cx, r.y - 9);
	ctx.lineTo(r.x + r.w * 0.75, r.y);
	ctx.stroke();

	// Paper with a drop shadow.
	ctx.fillStyle = rgba(PALETTE.black, 0.25);
	ctx.fillRect(r.x + 4, r.y + 4, r.w, r.h);
	ctx.fillStyle = PALETTE.paper;
	ctx.fillRect(r.x, r.y, r.w, r.h);

	// Thin spiral binding along the top, one ring per column.
	ctx.strokeStyle = PALETTE.darkgrey;
	ctx.lineWidth = 2;
	for (let i = 0; i < 7; i++) {
		ctx.beginPath();
		ctx.arc(r.x + inset + cellW * (i + 0.5), r.y + 5, 4, 0, Math.PI * 2);
		ctx.stroke();
	}

	// Red header band with the month name in upper case.
	const bandY = r.y + 12;
	ctx.fillStyle = PALETTE.bad;
	ctx.fillRect(r.x, bandY, r.w, headerH);
	const monthPx = Math.max(7, Math.min(
		Math.round(headerH * 0.55),
		Math.floor((r.w - inset * 2) / info.monthName.length)));
	centreText(ctx, info.monthName.toUpperCase(), cx, bandY + headerH - 7,
		'title', monthPx, PALETTE.white);

	// DAY n of 365 in big title letters, then the week header letters.
	const dayY = bandY + headerH + 15;
	centreText(ctx, 'DAY ' + day + ' of ' + DAYS_IN_YEAR, cx, dayY,
		'title', Math.max(7, Math.round(cellW * 0.34)), PALETTE.ink);
	const headY = dayY + 14;
	const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
	for (let i = 0; i < 7; i++) {
		centreText(ctx, letters[i], r.x + inset + cellW * (i + 0.5), headY,
			'title', Math.max(6, Math.round(cellW * 0.3)), PALETTE.midgrey);
	}

	// The month grid: first cell pushed along by the weekday of the 1st.
	const gridTop = headY + 6;
	const cellH = Math.min(cellW, (r.y + r.h - inset - gridTop) / 6);
	function cellRect(dayOfMonth) {
		const idx = offset + dayOfMonth - 1;
		const col = idx % 7;
		return {
			x: r.x + inset + col * cellW,
			y: gridTop + Math.floor(idx / 7) * cellH,
		};
	}

	ctx.strokeStyle = PALETTE.lightgrey;
	ctx.lineWidth = 1;
	ctx.fillStyle = PALETTE.ink;
	ctx.font = font('body', Math.max(9, Math.round(cellH * 0.45)));
	for (let k = 1; k <= cells; k++) {
		const c = cellRect(k);
		ctx.strokeRect(c.x, c.y, cellW, cellH);
		ctx.fillText(String(k), c.x + 4, c.y + cellH - 4);
	}

	// Red X over every day before today; yesterday's X follows crossAnim.
	const m = Math.max(3, Math.round(cellW * 0.2));
	for (let k = 1; k <= crossed; k++) {
		const c = cellRect(k);
		let f1 = 1;
		let f2 = 1;
		if (k === crossed) {
			f1 = Math.min(1, anim * 2);
			f2 = Math.max(0, anim * 2 - 1);
		}
		drawCross(ctx, c.x, c.y, cellW, cellH, m, f1, f2);
	}

	// Today: a green ellipse that pulses by one pixel either side.
	const c = cellRect(info.dayOfMonth);
	const p = pulse(t, 1.5) * 2 - 1;
	ctx.strokeStyle = PALETTE.good;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.ellipse(c.x + cellW / 2, c.y + cellH / 2,
		Math.max(3, cellW * 0.45) + p, Math.max(3, cellH * 0.45) + p,
		0, 0, Math.PI * 2);
	ctx.stroke();

	ctx.restore();

	return { crossed: crossed, cells: cells, monthName: info.monthName };
}
