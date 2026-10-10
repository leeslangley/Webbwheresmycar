// Seeded random number module (DESIGN.md 9.3). All game randomness comes
// from the uint32 in state.rng so a saved game and a replay behave
// identically. Pure: no DOM, no host RNG, no Date.

// Core mulberry32-style step, mutated into state.rng, returning the output.
function step(state) {
	let t = (state.rng = (state.rng + 0x6D2B79F5) >>> 0);
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0);
}

// Seed 0 is allowed; any number becomes a uint32.
export function seedRng(state, seed) {
	state.rng = (seed >>> 0);
}

// Uniform in [0, 1).
export function rand(state) {
	return step(state) / 4294967296;
}

// Integer in [lo, hi], inclusive at both ends.
export function randInt(state, lo, hi) {
	return lo + Math.floor(rand(state) * (hi - lo + 1));
}

// True with probability p.
export function chance(state, p) {
	return rand(state) < p;
}

// Uniform pick from a non-empty array.
export function pick(state, arr) {
	if (arr.length === 0) {
		throw new Error('pick: empty array');
	}
	return arr[randInt(state, 0, arr.length - 1)];
}

// Weighted pick from [{w, ...}] with numeric w >= 0. Draws ONE rand.
export function weighted(state, items) {
	let total = 0;
	for (let i = 0; i < items.length; i++) {
		total += items[i].w;
	}
	if (total <= 0) {
		throw new Error('weighted: no weight');
	}
	let r = rand(state);
	for (let i = 0; i < items.length; i++) {
		r -= items[i].w / total;
		if (r < 0) {
			return items[i];
		}
	}
	// Rounding could leave draw exactly at total; fall back to the last
	// item that actually carries weight.
	for (let i = items.length - 1; i >= 0; i--) {
		if (items[i].w > 0) {
			return items[i];
		}
	}
	throw new Error('weighted: no weight');
}

export function roundTo(x, step) {
	return Number((Math.round(x / step) * step).toFixed(6));
}

export function clamp(x, lo, hi) {
	return Math.min(hi, Math.max(lo, x));
}
