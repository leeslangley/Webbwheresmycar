// Animated room effects that sit behind or in front of the still plate: the
// sky seen through the office window (colours follow the hour, sun or moon,
// drifting clouds that shift a little against the pointer), floating dust
// motes in lamp light, and kettle steam puffs. Pure: no DOM, no Date, no
// Math.random - all motion derives from t. Everything draws via the passed-in
// ctx, so it runs in tests with tests/fakectx.js.

import { rgba } from '../ui/theme.js';

// skyColors(hour) -> {top, bottom}: hex gradient stops for the hour.
export function skyColors(hour) {
	if (hour >= 6 && hour < 9) {
		return { top: '#3b4a8a', bottom: '#f2a65a' };
	}
	if (hour >= 9 && hour < 17) {
		return { top: '#6fb4ee', bottom: '#d8efff' };
	}
	if (hour >= 17 && hour < 20) {
		return { top: '#4a3a7a', bottom: '#f08a5d' };
	}
	return { top: '#0b0d24', bottom: '#1d2450' };
}

// drawSky(ctx, rect, hour, t, look): gradient sky clipped to rect, a sun
// (daytime) or moon (night), and two drifting clouds. look.x (pointer
// parallax, optional) nudges the clouds by 4px per unit.
export function drawSky(ctx, rect, hour, t, look) {
	const lk = look || { x: 0, y: 0 };
	const colours = skyColors(hour);
	ctx.save();
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.w, rect.h);
	ctx.clip();

	const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
	grad.addColorStop(0, colours.top);
	grad.addColorStop(1, colours.bottom);
	ctx.fillStyle = grad;
	ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

	// Sun by day, moon by night, sliding left to right across the window.
	const frac = (hour % 12) / 12;
	const bodyX = rect.x + rect.w * (0.25 + 0.5 * frac);
	const bodyY = rect.y + rect.h * 0.3;
	ctx.beginPath();
	if (hour >= 6 && hour < 20) {
		ctx.fillStyle = '#fff2b0';
		ctx.arc(bodyX, bodyY, 14, 0, Math.PI * 2);
	} else {
		ctx.fillStyle = '#e8ecff';
		ctx.arc(bodyX, bodyY, 10, 0, Math.PI * 2);
	}
	ctx.fill();

	// Two clouds, each a single plain rect, drifting at different speeds.
	ctx.fillStyle = rgba('#ffffff', 0.8);
	for (let k = 0; k < 2; k++) {
		const w = k === 0 ? 60 : 44;
		const h = k === 0 ? 16 : 12;
		const x = rect.x + ((t * 4 + k * 90) % (rect.w + 80)) - 40 - lk.x * 4;
		const y = rect.y + 30 + 28 * k;
		ctx.fillRect(x, y, w, h);
	}
	ctx.restore();
}

// drawDust(ctx, rect, t, n): n drifting 2x2 motes inside rect, each pulsing
// its own alpha (never below 0.05).
export function drawDust(ctx, rect, t, n) {
	for (let i = 0; i < n; i++) {
		const x = rect.x + ((((i * 7919 + 13) % 97) / 97 * rect.w + t * 3 * (1 + i % 3)) % rect.w);
		const y = rect.y + (((((i * 6007 + 7) % 89) / 89 * rect.h - t * 2 * (1 + i % 2)) % rect.h) + rect.h) % rect.h;
		const alpha = Math.max(0.05, 0.25 + 0.2 * Math.sin(t * 1.3 + i));
		ctx.fillStyle = rgba('#ffe9c0', alpha);
		ctx.fillRect(x, y, 2, 2);
	}
}

// steamPuffs(ctx, x, y, t, n): n translucent puffs rising from (x, y). Each
// puff grows and fades as it climbs, then loops.
export function steamPuffs(ctx, x, y, t, n) {
	for (let k = 0; k < n; k++) {
		const phase = (t * 0.8 + k / n) % 1;
		const cx = x + Math.sin(phase * 6.283 + k) * 6;
		const cy = y - phase * 60;
		ctx.beginPath();
		ctx.arc(cx, cy, 4 + phase * 10, 0, Math.PI * 2);
		ctx.fillStyle = rgba('#ffffff', 0.35 * (1 - phase));
		ctx.fill();
	}
}
