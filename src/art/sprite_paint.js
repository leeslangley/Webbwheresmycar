// Sprite paint (CC04, docs/art/CC.md): pure pixel maths that turns one rendered
// car sprite into any paint colour and any of four wear states, using the
// body-paint mask. Works on RGBA Uint8ClampedArray data (w * h * 4 bytes) with
// a mask Uint8ClampedArray (w * h bytes, 255 = body paint). Pure: no DOM, no
// Math.random, no Date. Every function returns a NEW array; inputs are never
// changed, and alpha is never changed.

export const WEAR_NAMES = ['mint', 'worn', 'tatty', 'wreck'];

const FADE = [0, 0.1, 0.24, 0.38];
const DARKEN = [0, 0.04, 0.1, 0.16];
const RUST_BLOTCHES = [0, 0, 6, 14];
const RUST = [
	[107, 45, 20],
	[138, 59, 23],
	[168, 80, 30],
];
const PRIMER = [139, 143, 147];

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

// Luminance, 0 to 255.
export function lum(r, g, b) {
	return 0.299 * r + 0.587 * g + 0.114 * b;
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

// Wear state from condition: 0 mint, 1 worn, 2 tatty, 3 wreck. NaN or
// undefined counts as 0 (mint).
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

// Alpha at or above 128 counts as opaque (the same cut as tools/art/pixelate.py).
function isOpaque(px, i) {
	return px[i * 4 + 3] >= 128;
}

// True when pixel i has a 4-neighbour that is body paint.
function touchesPaint(mask, w, h, i) {
	const x = i % w;
	const y = Math.floor(i / w);
	if (x > 0 && mask[i - 1] === 255) {
		return true;
	}
	if (x < w - 1 && mask[i + 1] === 255) {
		return true;
	}
	if (y > 0 && mask[i - w] === 255) {
		return true;
	}
	if (y < h - 1 && mask[i + w] === 255) {
		return true;
	}
	return false;
}

// recolourPixels: body paint takes targetHex. Paint darker than the base
// paint scales the new colour; paint brighter than the base blends towards
// white. Opaque unmasked outline pixels next to the paint with luminance
// below 0.45 of the base are treated as paint, so the dark outline takes the
// new dark tone.
export function recolourPixels(px, mask, w, h, baseHex, targetHex) {
	const base = hexToRgb(baseHex);
	const target = hexToRgb(targetHex);
	const lb = Math.max(1, lum(base[0], base[1], base[2]));
	const out = new Uint8ClampedArray(px);
	const n = w * h;
	for (let i = 0; i < n; i++) {
		const o = i * 4;
		if (px[o + 3] <= 0) {
			continue;
		}
		const l = lum(px[o], px[o + 1], px[o + 2]);
		let paint = mask[i] === 255;
		if (!paint && isOpaque(px, i) && l < 0.45 * lb && touchesPaint(mask, w, h, i)) {
			paint = true;
		}
		if (!paint) {
			continue;
		}
		for (let c = 0; c < 3; c++) {
			let v;
			if (l <= lb) {
				v = target[c] * (l / lb);
			} else {
				const t = (l - lb) / (255 - lb);
				v = target[c] + (255 - target[c]) * t;
			}
			out[o + c] = Math.round(v);
		}
	}
	return out;
}

// Linear congruential generator: returns a function giving the next state.
function lcg(seed) {
	let s = seed >>> 0;
	return function () {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s;
	};
}

// wearPixels: state 0 is an exact copy. Otherwise, on body paint only:
// (a) fade towards grey and darken; (b) dirt on the lower 28% (states 1-3);
// (c) seeded rust blotches on the lower body (states 2: 6, 3: 14);
// (d) a primer patch on a wreck (state 3).
export function wearPixels(px, mask, w, h, state, seed) {
	const out = new Uint8ClampedArray(px);
	const s = Math.max(0, Math.min(3, state | 0));
	if (s === 0) {
		return out;
	}
	const n = w * h;

	// Opaque bounding box rows.
	let top = -1;
	let bottom = -1;
	for (let i = 0; i < n; i++) {
		if (isOpaque(px, i)) {
			const y = Math.floor(i / w);
			if (top < 0) {
				top = y;
			}
			bottom = y;
		}
	}
	if (top < 0) {
		return out;
	}
	const bh = bottom - top + 1;
	const next = lcg(seed);

	// (a) fade and darken the paint.
	const f = FADE[s];
	const d = DARKEN[s];
	for (let i = 0; i < n; i++) {
		const o = i * 4;
		if (mask[i] !== 255 || px[o + 3] <= 0) {
			continue;
		}
		const l = lum(px[o], px[o + 1], px[o + 2]);
		for (let c = 0; c < 3; c++) {
			const v = px[o + c];
			out[o + c] = Math.round((v + (l - v) * f) * (1 - d));
		}
	}

	// (b) dirt on the lower body.
	if (s >= 1) {
		const dirtY = top + 0.72 * bh;
		const k = 1 - 0.06 * s;
		for (let i = 0; i < n; i++) {
			const o = i * 4;
			if (mask[i] !== 255 || px[o + 3] <= 0 || Math.floor(i / w) < dirtY) {
				continue;
			}
			for (let c = 0; c < 3; c++) {
				out[o + c] = Math.round(out[o + c] * k);
			}
		}
	}

	// (c) rust blotches on the lower body.
	const rustY = top + 0.55 * bh;
	const rustCand = [];
	for (let i = 0; i < n; i++) {
		if (mask[i] === 255 && px[i * 4 + 3] > 0 && Math.floor(i / w) >= rustY) {
			rustCand.push(i);
		}
	}
	const blotches = RUST_BLOTCHES[s];
	if (rustCand.length > 0) {
		for (let b = 0; b < blotches; b++) {
			const centre = rustCand[(next() >>> 8) % rustCand.length];
			const col = RUST[(next() >>> 8) % 3];
			const cx = centre % w;
			const cy = Math.floor(centre / w);
			const cells = [[cx, cy]];
			for (let k = 0; k < 3; k++) {
				const dx = ((next() >>> 8) % 5) - 2;
				const dy = ((next() >>> 8) % 5) - 2;
				cells.push([cx + dx, cy + dy]);
			}
			for (let k = 0; k < cells.length; k++) {
				const x = cells[k][0];
				const y = cells[k][1];
				if (x < 0 || y < 0 || x >= w || y >= h) {
					continue;
				}
				const i = y * w + x;
				if (mask[i] !== 255 || px[i * 4 + 3] <= 0) {
					continue;
				}
				out[i * 4] = col[0];
				out[i * 4 + 1] = col[1];
				out[i * 4 + 2] = col[2];
			}
		}
	}

	// (d) primer patch on a wreck.
	if (s === 3) {
		const primerY = top + 0.5 * bh;
		const primerCand = [];
		for (let i = 0; i < n; i++) {
			if (mask[i] === 255 && px[i * 4 + 3] > 0 && Math.floor(i / w) < primerY) {
				primerCand.push(i);
			}
		}
		if (primerCand.length > 0) {
			const start = primerCand[(next() >>> 8) % primerCand.length];
			const sx = start % w;
			const sy = Math.floor(start / w);
			for (let dy = 0; dy < 4; dy++) {
				for (let dx = 0; dx < 6; dx++) {
					const x = sx + dx;
					const y = sy + dy;
					if (x >= w || y >= h) {
						continue;
					}
					const i = y * w + x;
					if (mask[i] !== 255 || px[i * 4 + 3] <= 0) {
						continue;
					}
					out[i * 4] = PRIMER[0];
					out[i * 4 + 1] = PRIMER[1];
					out[i * 4 + 2] = PRIMER[2];
				}
			}
		}
	}

	return out;
}
