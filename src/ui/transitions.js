// Screen transitions A (docs/art/GU.md): cross-fade, slide in four directions
// and the iris close-and-open. A transition is drawn through two callbacks,
// drawFrom (the outgoing screen) and drawTo (the incoming screen), so no
// offscreen canvas is needed. Pure: no DOM, no Date, no Math.random.

import { EASE, MOTION, clamp01 } from './tokens.js';

// Each kind names the MOTION key that gives its default duration.
const MOTION_KEY = {
	fade: 'fade',
	'slide-left': 'slide',
	'slide-right': 'slide',
	'slide-up': 'slide',
	'slide-down': 'slide',
	iris: 'iris',
};

// makeTransition(kind, nowMs, durMs) -> {kind, start, dur}. Throws
// Error('bad transition') for an unknown kind. durMs defaults from MOTION.
export function makeTransition(kind, nowMs, durMs) {
	if (!Object.prototype.hasOwnProperty.call(MOTION_KEY, kind)) {
		throw new Error('bad transition');
	}
	const dur = durMs === undefined ? MOTION[MOTION_KEY[kind]] : durMs;
	return { kind: kind, start: nowMs, dur: dur };
}

// Progress of a transition at nowMs, clamped to 0..1.
export function transProgress(tr, nowMs) {
	return clamp01((nowMs - tr.start) / tr.dur);
}

// True once nowMs has reached the end of the transition.
export function transDone(tr, nowMs) {
	return nowMs >= tr.start + tr.dur;
}

// Offsets [old, new] for a slide at eased progress e.
function slideOffsets(kind, e, w, h) {
	if (kind === 'slide-left') {
		return [[-e * w, 0], [(1 - e) * w, 0]];
	}
	if (kind === 'slide-right') {
		return [[e * w, 0], [-(1 - e) * w, 0]];
	}
	if (kind === 'slide-up') {
		return [[0, -e * h], [0, (1 - e) * h]];
	}
	if (kind === 'slide-down') {
		return [[0, e * h], [0, -(1 - e) * h]];
	}
	throw new Error('bad transition');
}

// Draw one screen clipped to the logical canvas and offset by (dx, dy).
// The clip is set before the translate, so the screen edge stays fixed.
function drawSlidePart(ctx, w, h, dx, dy, draw) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(0, 0, w, h);
	ctx.clip();
	ctx.translate(dx, dy);
	draw();
	ctx.restore();
}

// drawTransition(ctx, tr, nowMs, drawFrom, drawTo, w, h) paints one frame.
// At progress 1 or more it draws only drawTo, with no transform.
export function drawTransition(ctx, tr, nowMs, drawFrom, drawTo, w = 1280, h = 720) {
	const u = transProgress(tr, nowMs);
	if (u >= 1) {
		drawTo();
		return;
	}
	if (tr.kind === 'fade') {
		const e = EASE.inOutQuad(u);
		drawFrom();
		ctx.save();
		ctx.globalAlpha = e;
		drawTo();
		ctx.restore();
		return;
	}
	if (tr.kind === 'iris') {
		const cx = w / 2;
		const cy = h / 2;
		const R = Math.hypot(w / 2, h / 2);
		let r;
		let scene;
		if (u < 0.5) {
			r = R * (1 - 2 * u);
			scene = drawFrom;
		} else {
			r = R * (2 * u - 1);
			scene = drawTo;
		}
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, w, h);
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.clip();
		scene();
		ctx.restore();
		return;
	}
	const e = EASE.outCubic(u);
	const off = slideOffsets(tr.kind, e, w, h);
	drawSlidePart(ctx, w, h, off[0][0], off[0][1], drawFrom);
	drawSlidePart(ctx, w, h, off[1][0], off[1][1], drawTo);
}
