// Animated desk props for the office hub (DESIGN.md section 5): TV static,
// a ringing desk phone, a laptop, a folded newspaper, a kettle and the soft
// glow that hints at tappable hotspots. Every function draws inside the rect
// it is given (ring arcs and steam may rise just above it). Pure: no DOM,
// no Date, no Math.random - all motion derives from t. Everything draws via
// the passed-in ctx, so it runs in tests with tests/fakectx.js.

import { PALETTE, rgba, shade } from '../ui/theme.js';
import { roundedPoly, circle, pulse } from './common.js';

// drawTvStatic(ctx, r, t): fill the rect with dark grey, then 60 horizontal
// 2px noise lines whose grey level, x offset and length all come from
// Math.sin(t * 13 + i * 7.1) (deterministic, no randomness), plus a slowly
// rolling brighter band. Clipped to the rect.
export function drawTvStatic(ctx, r, t) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(r.x, r.y, r.w, r.h);
	ctx.clip();
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(r.x, r.y, r.w, r.h);
	const rows = 60;
	for (let i = 0; i < rows; i++) {
		const v = Math.sin(t * 13 + i * 7.1);
		const a = Math.abs(v);
		ctx.fillStyle = shade(PALETTE.lightgrey, v * 0.4);
		ctx.fillRect(
			r.x + a * r.w * 0.15,
			r.y + (i * r.h) / rows,
			r.w * (0.4 + 0.45 * a),
			2
		);
	}
	// One brighter band rolls down the screen.
	const bandY = r.y + ((t * 60) % r.h);
	ctx.fillStyle = rgba(PALETTE.white, 0.15);
	ctx.fillRect(r.x, bandY, r.w, Math.max(6, r.h * 0.08));
	ctx.restore();
}

// drawPhone(ctx, r, t, ringing): a chunky cream desk phone with a handset on
// top, a coiled cord and a round dial. When ringing the whole phone shakes
// horizontally, two red ring arcs pulse above it and a little red lamp sits
// on the base.
export function drawPhone(ctx, r, t, ringing) {
	ctx.save();
	if (ringing) {
		ctx.translate(Math.sin(t * 40) * 2, 0);
	}
	const cx = r.x + r.w / 2;

	// Base: a chunky cream wedge.
	ctx.fillStyle = PALETTE.cream;
	roundedPoly(ctx, [
		[r.x + r.w * 0.18, r.y + r.h * 0.92], [r.x + r.w * 0.12, r.y + r.h * 0.45],
		[r.x + r.w * 0.88, r.y + r.h * 0.45], [r.x + r.w * 0.82, r.y + r.h * 0.92],
	], 3);
	ctx.fill();
	// Dark strip where the base meets the desk.
	ctx.fillStyle = shade(PALETTE.cream, -0.55);
	ctx.fillRect(r.x + r.w * 0.17, r.y + r.h * 0.86, r.w * 0.66, r.h * 0.06);

	// Handset lying across the top.
	ctx.fillStyle = PALETTE.cream;
	roundedPoly(ctx, [
		[r.x + r.w * 0.08, r.y + r.h * 0.42], [r.x + r.w * 0.08, r.y + r.h * 0.2],
		[r.x + r.w * 0.92, r.y + r.h * 0.2], [r.x + r.w * 0.92, r.y + r.h * 0.42],
	], 4);
	ctx.fill();

	// Round dial in the middle of the base.
	ctx.fillStyle = PALETTE.darkgrey;
	circle(ctx, cx, r.y + r.h * 0.66, r.w * 0.17);
	ctx.fill();
	ctx.fillStyle = PALETTE.lightgrey;
	circle(ctx, cx, r.y + r.h * 0.66, r.w * 0.1);
	ctx.fill();

	// Tiny red lamp on the base.
	ctx.fillStyle = PALETTE.bad;
	circle(ctx, r.x + r.w * 0.74, r.y + r.h * 0.56, r.w * 0.05);
	ctx.fill();

	// Coiled cord: a short zig-zag from the handset down the right side.
	ctx.strokeStyle = shade(PALETTE.cream, -0.4);
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(r.x + r.w * 0.9, r.y + r.h * 0.34);
	for (let i = 0; i < 4; i++) {
		ctx.lineTo(
			r.x + r.w * (i % 2 === 0 ? 1.0 : 0.93),
			r.y + r.h * (0.44 + i * 0.12)
		);
	}
	ctx.stroke();

	if (ringing) {
		const p = pulse(t, 0.5);
		ctx.strokeStyle = rgba(PALETTE.bad, 0.25 + 0.6 * p);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(cx, r.y + r.h * 0.16, r.w * (0.22 + 0.08 * p), Math.PI * 1.15, Math.PI * 1.85);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(cx, r.y + r.h * 0.16, r.w * (0.36 + 0.08 * p), Math.PI * 1.1, Math.PI * 1.9);
		ctx.stroke();
	}
	ctx.restore();
}

// drawLaptop(ctx, r, t): an open grey laptop seen from the front - screen
// with a blue desktop and a tiny line chart whose last point oscillates,
// keyboard base below.
export function drawLaptop(ctx, r, t) {
	ctx.save();

	// Screen bezel and blue desktop.
	const bezX = r.x + r.w * 0.14;
	const bezY = r.y;
	const bezW = r.w * 0.72;
	const bezH = r.h * 0.58;
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(bezX, bezY, bezW, bezH);
	ctx.fillStyle = PALETTE.blue;
	ctx.fillRect(bezX + bezW * 0.08, bezY + bezH * 0.1, bezW * 0.84, bezH * 0.84);

	// Tiny line chart: six points rising left to right, the last one
	// wobbling with t.
	const cLeft = bezX + bezW * 0.16;
	const cRight = bezX + bezW * 0.86;
	const cBase = bezY + bezH * 0.8;
	const cTop = bezY + bezH * 0.25;
	ctx.strokeStyle = PALETTE.lightgreen;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(cLeft, cBase);
	for (let i = 1; i < 5; i++) {
		ctx.lineTo(
			cLeft + ((cRight - cLeft) * i) / 5,
			cBase - ((cBase - cTop) * i) / 5
		);
	}
	// The last point oscillates around the rising trend.
	ctx.lineTo(cRight, cBase - (cBase - cTop) * (1 + Math.sin(t * 2.5)) * 0.6);
	ctx.stroke();

	// Keyboard base below the screen.
	ctx.fillStyle = PALETTE.midgrey;
	ctx.fillRect(r.x + r.w * 0.02, r.y + r.h * 0.6, r.w * 0.96, r.h * 0.26);
	ctx.fillStyle = PALETTE.lightgrey;
	for (let row = 0; row < 3; row++) {
		ctx.fillRect(
			r.x + r.w * 0.1,
			r.y + r.h * (0.64 + row * 0.06),
			r.w * 0.8,
			r.h * 0.035
		);
	}
	ctx.restore();
}

// drawNewspaper(ctx, r, t): a folded newspaper lying flat - paper, black
// masthead bar, grey text lines and one photo box. t is accepted for API
// uniformity but the paper never moves.
export function drawNewspaper(ctx, r, t) {
	ctx.save();
	ctx.fillStyle = PALETTE.paper;
	ctx.fillRect(r.x, r.y, r.w, r.h);

	// Masthead.
	ctx.fillStyle = PALETTE.black;
	ctx.fillRect(r.x + r.w * 0.06, r.y + r.h * 0.08, r.w * 0.88, r.h * 0.14);

	// Photo box on the left.
	ctx.fillStyle = PALETTE.midgrey;
	ctx.fillRect(r.x + r.w * 0.06, r.y + r.h * 0.3, r.w * 0.38, r.h * 0.34);

	// Grey text lines: beside the photo, then below it.
	ctx.fillStyle = PALETTE.midgrey;
	for (let i = 0; i < 4; i++) {
		ctx.fillRect(
			r.x + r.w * 0.5,
			r.y + r.h * (0.3 + i * 0.09),
			r.w * 0.44,
			r.h * 0.035
		);
	}
	for (let i = 0; i < 3; i++) {
		ctx.fillRect(
			r.x + r.w * 0.06,
			r.y + r.h * (0.72 + i * 0.08),
			r.w * 0.88,
			r.h * 0.035
		);
	}
	ctx.restore();
}

// drawKettle(ctx, r, t): a chrome kettle with handle, spout and base, with
// two steam curls wobbling above it.
export function drawKettle(ctx, r, t) {
	ctx.save();
	const cx = r.x + r.w * 0.5;

	// Base plate.
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(r.x + r.w * 0.16, r.y + r.h * 0.86, r.w * 0.68, r.h * 0.1);

	// Chrome body: a soft-sided trapezoid.
	ctx.fillStyle = PALETTE.lightgrey;
	roundedPoly(ctx, [
		[r.x + r.w * 0.22, r.y + r.h * 0.86], [r.x + r.w * 0.3, r.y + r.h * 0.32],
		[r.x + r.w * 0.7, r.y + r.h * 0.32], [r.x + r.w * 0.78, r.y + r.h * 0.86],
	], 4);
	ctx.fill();

	// Lid.
	ctx.fillStyle = PALETTE.darkgrey;
	ctx.fillRect(r.x + r.w * 0.34, r.y + r.h * 0.26, r.w * 0.32, r.h * 0.07);

	// Spout on the left.
	ctx.fillStyle = PALETTE.lightgrey;
	roundedPoly(ctx, [
		[r.x + r.w * 0.3, r.y + r.h * 0.38], [r.x + r.w * 0.12, r.y + r.h * 0.3],
		[r.x + r.w * 0.14, r.y + r.h * 0.44], [r.x + r.w * 0.3, r.y + r.h * 0.56],
	], 2);
	ctx.fill();

	// Handle on the right.
	ctx.strokeStyle = PALETTE.ink;
	ctx.lineWidth = Math.max(2, r.w * 0.07);
	roundedPoly(ctx, [
		[r.x + r.w * 0.72, r.y + r.h * 0.4], [r.x + r.w * 0.94, r.y + r.h * 0.36],
		[r.x + r.w * 0.94, r.y + r.h * 0.66], [r.x + r.w * 0.74, r.y + r.h * 0.66],
	], 3);
	ctx.stroke();

	// Two steam curls, swaying with t.
	for (let i = 0; i < 2; i++) {
		const sway = Math.sin(t * 3 + i * 1.7) * r.w * 0.07;
		const sx = cx + (i === 0 ? -1 : 1) * r.w * 0.1;
		ctx.strokeStyle = rgba(PALETTE.white, 0.5);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(sx, r.y + r.h * 0.22);
		ctx.quadraticCurveTo(sx + sway, r.y + r.h * 0.12, sx + sway * 1.6, r.y + r.h * 0.04);
		ctx.stroke();
	}
	ctx.restore();
}

// drawHotspotGlow(ctx, r, t): a soft pulsing lamp-coloured outline around a
// rect, used to hint at tappable things.
export function drawHotspotGlow(ctx, r, t) {
	ctx.save();
	ctx.strokeStyle = rgba(PALETTE.lamp, 0.35 + 0.35 * pulse(t, 1.2));
	ctx.lineWidth = 4;
	roundedPoly(ctx, [
		[r.x, r.y], [r.x + r.w, r.y],
		[r.x + r.w, r.y + r.h], [r.x, r.y + r.h],
	], 6);
	ctx.stroke();
	ctx.restore();
}
