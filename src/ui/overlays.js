// Toast and tooltip overlays (card GU18, docs/art/GU.md). The toast is a
// pose (slide-in with a small overshoot, fade-out) plus a draw that sits
// where the old toast did. The tooltip appears after a hover delay, is
// clamped to the screen and has an arrow towards its target.
// Pure: no DOM, no Date, no Math.random. kit_draw.js is not imported; the
// caller passes the panel drawer in as panelFn.

import { EASE, MOTION, clamp01 } from './tokens.js';
import { drawIcon } from './icons.js';
import { PALETTE } from './theme.js';

// Clamp v into the range lo..hi.
function clampTo(v, lo, hi) {
	return v < lo ? lo : v > hi ? hi : v;
}

// Pose of a toast at nowMs: {dy, alpha}. toast = {born, until} in ms.
// dy starts 40 px below the rest line and overshoots slightly above it while
// sliding in; alpha fades in over 130 ms and fades out over MOTION.toastOut.
export function toastPose(toast, nowMs) {
	const age = nowMs - toast.born;
	const remaining = toast.until - nowMs;
	const dy = age < MOTION.toast ? 40 * (1 - EASE.outBack(clamp01(age / MOTION.toast))) : 0;
	let alpha = Math.min(1, age / 130);
	if (remaining < MOTION.toastOut) {
		alpha = Math.min(alpha, clamp01(remaining / MOTION.toastOut));
	}
	return { dy: dy, alpha: alpha };
}

// Icon name for a toast kind, or null when the kind has no icon.
export function toastIcon(kind) {
	if (kind === 'good') {
		return 'tick';
	}
	if (kind === 'bad') {
		return 'cross';
	}
	if (kind === 'warn') {
		return 'warning';
	}
	if (kind === 'info') {
		return 'paper';
	}
	return null;
}

// Draw a toast in stack slot `slot` (0 is the bottom slot, 44 px per slot).
// panelFn(ctx, x, y, w, h) draws the panel background (kit_draw's panel).
export function drawToast2(ctx, toast, nowMs, slot, panelFn) {
	const pose = toastPose(toast, nowMs);
	const y = 640 - slot * 44 + pose.dy;
	ctx.save();
	ctx.globalAlpha = pose.alpha;
	panelFn(ctx, 360, y, 560, 36);
	const icon = toastIcon(toast.kind);
	if (icon) {
		drawIcon(ctx, icon, 372, y + 6, 24);
	}
	ctx.font = '28px VT323, monospace';
	ctx.textBaseline = 'top';
	ctx.textAlign = 'center';
	ctx.fillStyle = PALETTE.ink;
	ctx.fillText(toast.text, 640 + (icon ? 16 : 0), y + 4);
	ctx.restore();
}

// Tooltip hover model: {id, since}. id is the hovered target (null for none),
// since is when that target was first hovered.
export function makeTooltip() {
	return { id: null, since: 0 };
}

// Record hover on target id at nowMs. A new id restarts the delay.
export function ttHover(tt, id, nowMs) {
	if (id !== tt.id) {
		tt.id = id;
		tt.since = nowMs;
	}
}

// True once the same target has been hovered for at least delay ms.
export function ttVisible(tt, nowMs, delay = 400) {
	return tt.id !== null && nowMs - tt.since >= delay;
}

// Box for a tooltip whose text is textW wide, pointing at (ax, ay).
// The box sits above the target unless that would leave the bounds, then
// below it. x is clamped so the box stays inside bounds.
export function tooltipRect(textW, ax, ay, bounds = { x: 8, y: 8, w: 1264, h: 704 }) {
	const w = textW + 20;
	const h = 40;
	const x = clampTo(ax - w / 2, bounds.x, bounds.x + bounds.w - w);
	let y = ay - h - 12;
	const below = y < bounds.y;
	if (below) {
		y = ay + 12;
	}
	return { x: x, y: y, w: w, h: h, below: below };
}

// Draw a tooltip with text pointing at (ax, ay).
export function drawTooltip(ctx, text, ax, ay, bounds) {
	ctx.save();
	ctx.font = '24px VT323, monospace';
	const r = tooltipRect(ctx.measureText(text).width, ax, ay, bounds);

	ctx.fillStyle = '#14102A';
	ctx.fillRect(r.x, r.y, r.w, r.h);
	ctx.fillStyle = '#FFF7DC';
	ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);

	// Arrow: 12 px wide base on the edge facing the target, tip at (ax, ay).
	const baseY = r.below ? r.y : r.y + r.h;
	const baseX = clampTo(ax - 6, r.x, r.x + r.w - 12);
	ctx.fillStyle = '#14102A';
	ctx.beginPath();
	ctx.moveTo(baseX, baseY);
	ctx.lineTo(baseX + 12, baseY);
	ctx.lineTo(ax, ay);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle = '#14102A';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2);
	ctx.restore();
}
