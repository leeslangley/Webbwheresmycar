// Screen effects (docs/art/GU.md): deterministic screen shake, colour flashes
// and a short hit-stop. Time always comes in as nowMs; no DOM, no Date, no
// Math.random. Shake offsets come from fixed sine/cosine phases, so a given
// (fx, nowMs) always gives the same offset.

import { MOTION } from './tokens.js';
import { rgba } from './theme.js';

// Flash rectangle overdraw (px each side) so a wide phone screen is covered.
const OVER = 144;
const FLASH_X = -OVER;
const FLASH_W = 1280 + 2 * OVER;
const FLASH_H = 720;

// Fresh effect state: no shake, no flash, not frozen.
export function makeScreenFx() {
	return { shake: null, flash: null, freezeUntil: 0 };
}

function running(e, nowMs) {
	return e !== null && nowMs - e.start < e.ms;
}

// Current shake amplitude of a running shake (0 when none or expired).
function shakeLeft(fx, nowMs) {
	if (!running(fx.shake, nowMs)) {
		return 0;
	}
	return fx.shake.mag * (1 - (nowMs - fx.shake.start) / fx.shake.ms);
}

// Start a shake. A running shake with a bigger remaining amplitude is kept.
export function fxShake(fx, mag, ms, nowMs) {
	if (shakeLeft(fx, nowMs) > mag) {
		return;
	}
	fx.shake = { mag: mag, ms: ms, start: nowMs };
}

// Start a colour flash. peak is the alpha at the start of the flash.
export function fxFlash(fx, color, ms, nowMs, peak = 0.8) {
	fx.flash = { color: color, ms: ms, start: nowMs, peak: peak };
}

// Hit-stop: freeze the simulation for ms from nowMs.
export function fxFreeze(fx, ms, nowMs) {
	fx.freezeUntil = nowMs + ms;
}

export function fxFrozen(fx, nowMs) {
	return nowMs < fx.freezeUntil;
}

// True while a shake or a flash is still running.
export function fxActive(fx, nowMs) {
	return running(fx.shake, nowMs) || running(fx.flash, nowMs);
}

// Breakdown: hard shake, red flash and a short freeze.
export function fxDisaster(fx, nowMs) {
	fxShake(fx, 14, 500, nowMs);
	fxFlash(fx, '#D9483B', 260, nowMs, 0.6);
	fxFreeze(fx, 80, nowMs);
}

// Sale or plate: gold flash, no shake.
export function fxGood(fx, nowMs) {
	fxFlash(fx, '#FFD27A', 200, nowMs, 0.35);
}

// Small knock: light shake.
export function fxBump(fx, nowMs) {
	fxShake(fx, 4, 150, nowMs);
}

// Screen offset for the shake at nowMs. Amplitude falls off linearly.
export function shakeOffset(fx, nowMs) {
	if (!running(fx.shake, nowMs)) {
		return { dx: 0, dy: 0 };
	}
	const age = nowMs - fx.shake.start;
	const amp = fx.shake.mag * (1 - age / fx.shake.ms);
	return {
		dx: Math.round(amp * Math.sin(age * 0.09)),
		dy: Math.round(amp * Math.cos(age * 0.13)),
	};
}

// Flash alpha at nowMs: peak at the start, eased to 0 at the end.
export function flashAlpha(fx, nowMs) {
	if (!running(fx.flash, nowMs)) {
		return 0;
	}
	const u = (nowMs - fx.flash.start) / fx.flash.ms;
	return fx.flash.peak * (1 - u) * (1 - u);
}

// Call before drawing a frame: saves the context and applies the shake.
export function fxBegin(ctx, fx, nowMs) {
	ctx.save();
	const o = shakeOffset(fx, nowMs);
	if (o.dx !== 0 || o.dy !== 0) {
		ctx.translate(o.dx, o.dy);
	}
}

// Call after drawing a frame: restores the context, paints the flash over
// the whole screen, and clears shakes and flashes that have run out.
export function fxEnd(ctx, fx, nowMs) {
	ctx.restore();
	const a = flashAlpha(fx, nowMs);
	if (a > 0.001) {
		ctx.fillStyle = rgba(fx.flash.color, a);
		ctx.fillRect(FLASH_X, 0, FLASH_W, FLASH_H);
	}
	if (fx.shake !== null && !running(fx.shake, nowMs)) {
		fx.shake = null;
	}
	if (fx.flash !== null && !running(fx.flash, nowMs)) {
		fx.flash = null;
	}
}
