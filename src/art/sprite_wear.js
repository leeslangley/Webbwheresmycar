// Sprite wear (CC21, docs/art/CARS_ALIGN.md): weathering drawn onto a car
// sprite at run time from its game mask, for the wear states 0 mint, 1 worn,
// 2 tatty, 3 wreck (wearState in CC04). The paint fade is not here: the caller
// repaints with paintRamp(fadeHex(hex, state)). Pure: no DOM, no Math.random,
// no Date. Every function changes px (RGBA bytes, w * h * 4) in place and
// returns it. Each does nothing for state 0, and never changes alpha or any
// pixel of another class.
//
// Game mask, one entry per pixel (w * h):
//   cls   0 none, 1 body paint, 2 second paint, 3 chrome, 4 glass
//   step  ramp step 0..6 (the mask G channel)
// ramp is the 7 colours of the paint ramp in use: '#rrggbb' strings or [r, g, b].

export const DIRT = ['#5b4632', '#3f3022'];
export const RUST = ['#5c2a12', '#9a4a1e', '#c97a32'];
export const PIT = '#6b5a48';
export const CRACK = '#bfe0ee';

const DIRT_AMOUNT = [0, 0.1, 0.24, 0.4];
const RUST_BLOBS = [0, 0, 5, 14];
const PIT_AMOUNT = [0, 0, 0.08, 0.18];

function clampState(state) {
	return Math.max(0, Math.min(3, state | 0));
}

function rgbOf(c) {
	if (Array.isArray(c)) {
		return c;
	}
	return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

function setRgb(px, i, rgb) {
	px[i * 4] = rgb[0];
	px[i * 4 + 1] = rgb[1];
	px[i * 4 + 2] = rgb[2];
}

function isPaint(cls, i) {
	return cls[i] === 1 || cls[i] === 2;
}

// First and last row holding a paint pixel, or null when there is none.
function paintRows(cls, w, h) {
	let top = -1;
	let bottom = -1;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (isPaint(cls, y * w + x)) {
				if (top < 0) {
					top = y;
				}
				bottom = y;
				break;
			}
		}
	}
	return top < 0 ? null : { top: top, bottom: bottom };
}

// hf(y): 1 at the first paint row, 0 at the last.
function heightFrac(y, rows) {
	return (rows.bottom - y) / Math.max(1, rows.bottom - rows.top);
}

// Seeded LCG: returns rnd(n) in [0, n).
function rngFrom(seed) {
	let s = seed >>> 0;
	return function (n) {
		s = (s * 1664525 + 1013904223) >>> 0;
		return (s >>> 8) % n;
	};
}

// Hash of (x, y, seed) in [0, 1).
export function hash2(x, y, seed) {
	let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(seed, 83492791);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h & 0xffff) / 65536;
}

// Dirt creeps up from the sill: paint pixels below the limit become dirt.
export function applyDirt(px, cls, step, w, h, state, seed) {
	const s = clampState(state);
	if (s === 0) {
		return px;
	}
	const rows = paintRows(cls, w, h);
	if (!rows) {
		return px;
	}
	const limit = DIRT_AMOUNT[s];
	for (let y = 0; y < h; y++) {
		const hf = heightFrac(y, rows);
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (!isPaint(cls, i)) {
				continue;
			}
			if (hf < limit + (hash2(x, y, seed) - 0.5) * 0.1) {
				setRgb(px, i, rgbOf(step[i] >= 3 ? DIRT[0] : DIRT[1]));
			}
		}
	}
	return px;
}

// Rust blobs on the lower body: a centre on paint below mid height, a disc of
// RUST[1] with a RUST[0] core and RUST[2] flecks.
export function applyRust(px, cls, step, w, h, state, seed) {
	const s = clampState(state);
	const blobs = RUST_BLOBS[s];
	if (blobs === 0) {
		return px;
	}
	const rows = paintRows(cls, w, h);
	if (!rows) {
		return px;
	}
	const cand = [];
	for (let y = 0; y < h; y++) {
		if (heightFrac(y, rows) >= 0.5) {
			continue;
		}
		for (let x = 0; x < w; x++) {
			if (isPaint(cls, y * w + x)) {
				cand.push(y * w + x);
			}
		}
	}
	if (cand.length === 0) {
		return px;
	}
	const rnd = rngFrom(seed);
	const rgb = RUST.map(rgbOf);
	for (let b = 0; b < blobs; b++) {
		const c = cand[rnd(cand.length)];
		const cx = c % w;
		const cy = Math.floor(c / w);
		const r = rnd(3) + (s === 3 ? 3 : 2);
		const reach = r * r;
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				const x = cx + dx;
				const y = cy + dy;
				if (x < 0 || y < 0 || x >= w || y >= h) {
					continue;
				}
				const i = y * w + x;
				if (!isPaint(cls, i)) {
					continue;
				}
				const d2 = dx * dx + dy * dy;
				const hv = hash2(x, y, seed);
				if (d2 > reach + Math.floor(hv * 3)) {
					continue;
				}
				if (d2 <= (r - 1) * (r - 1)) {
					setRgb(px, i, rgb[0]);
				} else if (hv > 0.8) {
					setRgb(px, i, rgb[2]);
				} else {
					setRgb(px, i, rgb[1]);
				}
			}
		}
	}
	return px;
}

// Dents (state 3 only): three spots where the ramp shifts. The top pixel goes
// two steps darker, the pixel below two steps lighter, only on paint.
export function applyDents(px, cls, step, w, h, state, seed, ramp) {
	if (clampState(state) !== 3) {
		return px;
	}
	const paint = [];
	for (let i = 0; i < w * h; i++) {
		if (isPaint(cls, i)) {
			paint.push(i);
		}
	}
	if (paint.length === 0) {
		return px;
	}
	const rnd = rngFrom(seed);
	const rgb = ramp.map(rgbOf);
	for (let d = 0; d < 3; d++) {
		const p = paint[rnd(paint.length)];
		const x0 = p % w;
		const y0 = Math.floor(p / w);
		for (let k = 0; k <= 3; k++) {
			const x = x0 + k;
			const y = y0 + (k >> 1);
			if (x >= w || y + 1 >= h) {
				continue;
			}
			const i = y * w + x;
			const j = i + w;
			if (!isPaint(cls, i) || !isPaint(cls, j)) {
				continue;
			}
			setRgb(px, i, rgb[Math.max(step[i] - 2, 0)]);
			setRgb(px, j, rgb[Math.min(step[i] + 2, 6)]);
		}
	}
	return px;
}

// Chrome pitting: some chrome pixels become PIT.
export function applyPitting(px, cls, step, w, h, state, seed) {
	const s = clampState(state);
	const amount = PIT_AMOUNT[s];
	if (amount === 0) {
		return px;
	}
	const pit = rgbOf(PIT);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (cls[i] === 3 && hash2(x, y, seed) < amount) {
				setRgb(px, i, pit);
			}
		}
	}
	return px;
}

// Cracked screen (state 3 only): a short line through the median glass pixel.
export function applyCrack(px, cls, step, w, h, state, seed) {
	if (clampState(state) !== 3) {
		return px;
	}
	const xs = [];
	const ys = [];
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (cls[y * w + x] === 4) {
				xs.push(x);
				ys.push(y);
			}
		}
	}
	if (xs.length === 0) {
		return px;
	}
	xs.sort((a, b) => a - b);
	ys.sort((a, b) => a - b);
	const cx = xs[Math.floor(xs.length / 2)];
	const cy = ys[Math.floor(ys.length / 2)];
	const crack = rgbOf(CRACK);
	for (let k = -6; k <= 6; k++) {
		const x = cx + k;
		const y = cy + Math.floor(k / 2);
		if (x < 0 || y < 0 || x >= w || y >= h) {
			continue;
		}
		const i = y * w + x;
		if (cls[i] === 4) {
			setRgb(px, i, crack);
		}
	}
	return px;
}

// All five layers in order: dirt, rust, dents, pitting, crack.
export function wearLayers(px, cls, step, w, h, state, seed, ramp) {
	applyDirt(px, cls, step, w, h, state, seed);
	applyRust(px, cls, step, w, h, state, seed);
	applyDents(px, cls, step, w, h, state, seed, ramp);
	applyPitting(px, cls, step, w, h, state, seed);
	applyCrack(px, cls, step, w, h, state, seed);
	return px;
}
