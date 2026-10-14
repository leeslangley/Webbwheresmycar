// Sprite paint (CC04, docs/art/CARS_ALIGN.md): pure pixel maths that repaints
// a rendered car sprite in any paint colour. The game mask says which of the
// 7 ramp steps each paint pixel is, so repainting is a table lookup into the
// ramp of the new colour. No luminance guessing. Works on RGBA
// Uint8ClampedArray data (w * h * 4 bytes). Pure: no DOM, no Math.random, no
// Date. Every function returns NEW data; inputs are never changed.

export const WEAR_NAMES = ['mint', 'worn', 'tatty', 'wreck'];

// Ramp recipe (the same formula as the Python original, CB11 pixramp.paint_ramp).
const MULT = [0.1, 0.2, 0.38, 0.65, 1.0, 1.5, 2.3];
const SW = [0.35, 0.28, 0.18, 0.08, 0, 0, 0];
const HW = [0, 0, 0, 0, 0, 0.2, 0.55];
const DARK_FALLBACK = '#202028';
const SHADOW_TINT = '#2a1a5c';
const HIGHLIGHT_CREAM = '#fff2cc';

const FADE_TOWARD = '#b8aa96';
const FADE_LEVEL = [0, 0.12, 0.3, 0.5];

// hexToRgb('#rrggbb') -> [r, g, b]. Throws on anything else.
export function hexToRgb(hex) {
	if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
		throw new Error('hexToRgb: want #rrggbb, got ' + String(hex));
	}
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16),
	];
}

// rgbToHex([r, g, b]) -> lower case '#rrggbb'. Channels are integers 0..255.
export function rgbToHex(rgb) {
	let s = '#';
	for (let k = 0; k < 3; k++) {
		const v = rgb[k];
		if (!Number.isInteger(v) || v < 0 || v > 255) {
			throw new Error('rgbToHex: channel out of range: ' + String(v));
		}
		s += (v < 16 ? '0' : '') + v.toString(16);
	}
	return s;
}

// Round half to even (Python's round), so exact .5 cases match the Python values.
function roundEven(x) {
	const f = Math.floor(x);
	const d = x - f;
	if (d > 0.5) {
		return f + 1;
	}
	if (d < 0.5) {
		return f;
	}
	return f % 2 === 0 ? f : f + 1;
}

function clamp01(v) {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}

// sRGB 0..255 -> linear 0..1.
function toLinear(c8) {
	const c = c8 / 255;
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// linear 0..1 -> sRGB 0..255 integer, clamped.
function toSrgb8(l) {
	const c = clamp01(l);
	const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
	return roundEven(clamp01(s) * 255);
}

// Relative luminance of linear [r, g, b].
function lumLinear(c) {
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// paintRamp(hex): the 7 ramp colours of a paint, darkest first, as [r, g, b]
// integers. Step 4 is the base colour. A very dark base uses '#202028'.
export function paintRamp(hex) {
	let rgb = hexToRgb(hex);
	if (Math.max(rgb[0], rgb[1], rgb[2]) < 32) {
		rgb = hexToRgb(DARK_FALLBACK);
	}
	const base = rgb.map(toLinear);
	const tint = hexToRgb(SHADOW_TINT).map(toLinear);
	const tintLuma = lumLinear(tint);
	const top = lumLinear(base) >= 0.5 ? [1, 1, 1] : hexToRgb(HIGHLIGHT_CREAM).map(toLinear);

	const ramp = [];
	for (let i = 0; i < 7; i++) {
		const c = base.map((v) => clamp01(v * MULT[i]));
		const scale = lumLinear(c) / tintLuma;
		for (let k = 0; k < 3; k++) {
			c[k] = c[k] + (tint[k] * scale - c[k]) * SW[i];
		}
		for (let k = 0; k < 3; k++) {
			c[k] = c[k] * (1 - HW[i]) + top[k] * HW[i];
		}
		ramp.push(c.map(toSrgb8));
	}
	return ramp;
}

// fadeHex(hex, level): the paint mixed toward '#b8aa96' by a wear level 0..3.
export function fadeHex(hex, level) {
	if (!Number.isInteger(level) || level < 0 || level > 3) {
		throw new Error('fadeHex: level must be 0..3, got ' + String(level));
	}
	const rgb = hexToRgb(hex);
	const toward = hexToRgb(FADE_TOWARD);
	const t = FADE_LEVEL[level];
	return rgbToHex(rgb.map((c, k) => roundEven(c + (toward[k] - c) * t)));
}

// wearState(cond): 0 mint, 1 worn, 2 tatty, 3 wreck. NaN or undefined is 0.
export function wearState(cond) {
	if (typeof cond !== 'number' || Number.isNaN(cond)) {
		return 0;
	}
	if (cond >= 8) {
		return 0;
	}
	if (cond >= 5) {
		return 1;
	}
	if (cond >= 2.5) {
		return 2;
	}
	return 3;
}

// FNV-1a 32 bit hash of a string, as an unsigned integer.
export function hashString(s) {
	const str = String(s);
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

// splitMask(maskPx, w, h) -> { cls, step }: the game mask's RGBA bytes.
// cls = R, step = G where alpha is 255, else 0. cls: 1 paint, 2 second paint,
// 3 chrome, 4 glass.
export function splitMask(maskPx, w, h) {
	const n = w * h;
	if (maskPx.length !== n * 4) {
		throw new Error('splitMask: want ' + n * 4 + ' bytes, got ' + maskPx.length);
	}
	const cls = new Uint8Array(n);
	const step = new Uint8Array(n);
	for (let i = 0; i < n; i++) {
		if (maskPx[i * 4 + 3] === 255) {
			cls[i] = maskPx[i * 4];
			step[i] = maskPx[i * 4 + 1];
		}
	}
	return { cls: cls, step: step };
}

// recolourPixels(px, cls, step, w, h, hex, hex2) -> NEW RGBA bytes. A cls 1
// pixel becomes paintRamp(hex)[step]. A cls 2 pixel becomes paintRamp(hex2)[step]
// when hex2 is given, else it is copied. Alpha and every other pixel copy through.
export function recolourPixels(px, cls, step, w, h, hex, hex2) {
	const n = w * h;
	const ramp1 = paintRamp(hex);
	const ramp2 = hex2 === undefined || hex2 === null ? null : paintRamp(hex2);
	const out = new Uint8ClampedArray(px);
	for (let i = 0; i < n; i++) {
		let ramp = null;
		if (cls[i] === 1) {
			ramp = ramp1;
		} else if (cls[i] === 2 && ramp2 !== null) {
			ramp = ramp2;
		}
		if (ramp === null) {
			continue;
		}
		const rgb = ramp[step[i]];
		if (rgb === undefined) {
			throw new Error('recolourPixels: paint step must be 0..6, got ' + String(step[i]));
		}
		const o = i * 4;
		out[o] = rgb[0];
		out[o + 1] = rgb[1];
		out[o + 2] = rgb[2];
	}
	return out;
}
