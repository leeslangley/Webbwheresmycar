// Pixel scale, snapping and car motion helpers (card CC01). Boot sets the
// device scale (device pixels per logical pixel, layout.scale * dpr); the
// rest of the art asks this module for whole-device-pixel sprite sizes,
// snapped positions and the drive-in / drive-out / idle-bob maths.
// Times are in seconds. Pure: no DOM, no Date, no Math.random.

let ds = 1;

// setDeviceScale(v): store v when it is a finite number > 0, else 1.
export function setDeviceScale(v) {
	ds = typeof v === 'number' && isFinite(v) && v > 0 ? v : 1;
}

// getDeviceScale(): the device pixels per logical pixel in use.
export function getDeviceScale() {
	return ds;
}

// pixelK(want): whole device pixels per sprite pixel (never below 1).
export function pixelK(want) {
	return Math.max(1, Math.round(want * ds));
}

// pixelSize(want): logical size of one sprite pixel, so p * ds is whole.
export function pixelSize(want) {
	return pixelK(want) / ds;
}

// snapPx(v): v rounded to the nearest device pixel, in logical px.
export function snapPx(v) {
	return Math.round(v * ds) / ds;
}

// clamp01(u): u limited to the range 0..1.
function clamp01(u) {
	return Math.min(1, Math.max(0, u));
}

export function easeOutCubic(u) {
	const c = clamp01(u);
	return 1 - Math.pow(1 - c, 3);
}

export function easeInCubic(u) {
	const c = clamp01(u);
	return c * c * c;
}

// driveIn: the car rolls in from -dist and lands exactly on 0.
export function driveIn(elapsed, dur, dist) {
	return snapPx(-dist * (1 - easeOutCubic(elapsed / dur)));
}

// driveOut: the car rolls away from 0 to dist.
export function driveOut(elapsed, dur, dist) {
	return snapPx(dist * easeInCubic(elapsed / dur));
}

// idleBob(t, p): the car sits one sprite pixel (p) up every 0.45 s.
export function idleBob(t, p) {
	return Math.floor(t * 2.2) % 2 === 0 ? 0 : -p;
}

// makeTracker(): remembers the last key and when it first appeared.
// update(key, t) returns seconds since the key changed (0 when it changed).
export function makeTracker() {
	let lastKey;
	let start = 0;
	return {
		update(key, t) {
			if (key !== lastKey) {
				lastKey = key;
				start = t;
				return 0;
			}
			return t - start;
		},
	};
}
