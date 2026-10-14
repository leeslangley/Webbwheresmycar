// Car variant cache (CC05, docs/art/CC.md): repainted and weathered car sprite
// canvases, made on demand and kept in a small LRU, so a car drawn in a new
// colour or wear state costs one pixel pass, once. Also the white shine layer
// (light) for the shine sweep. Uses the game mask (CC04 splitMask, paintRamp,
// fadeHex, recolourPixels), the wear layers (CC21 wearLayers) and hashString.
// Canvases come from env.makeCanvas, so the module itself has no DOM. No
// Math.random and no Date.

import { splitMask, recolourPixels, paintRamp, fadeHex, hashString } from './sprite_paint.js';
import { wearLayers } from './sprite_wear.js';

const DEFAULT_MAX = 24;

function lower(s) {
	return typeof s === 'string' ? s.toLowerCase() : null;
}

// createVariants(env, sprites, max) -> {get, light, stats}.
// env.makeCanvas(w, h) gives a canvas with getContext('2d'). sprites is the
// object from createSprites (sprites.js): has, size, meta, image, maskImage.
export function createVariants(env, sprites, max) {
	const limit = typeof max === 'number' && max >= 1 ? Math.floor(max) : DEFAULT_MAX;
	const cache = new Map(); // key|paint|wear -> {img, w, h}, oldest first
	const masks = new Map(); // key -> {cls, step} from the game mask
	const lights = new Map(); // key -> white shine canvas
	let built = 0; // pixel passes since creation

	// RGBA bytes of an image drawn at w x h (a copy the caller may change).
	function pixelsOf(img, w, h) {
		const c = env.makeCanvas(w, h);
		const g = c.getContext('2d');
		g.drawImage(img, 0, 0);
		return new Uint8ClampedArray(g.getImageData(0, 0, w, h).data);
	}

	// Game mask of a sprite as {cls, step}, or null when it has no mask.
	function maskOf(key, w, h) {
		if (masks.has(key)) {
			return masks.get(key);
		}
		const mi = sprites.maskImage(key);
		if (!mi) {
			return null;
		}
		const sp = splitMask(pixelsOf(mi, w, h), w, h);
		masks.set(key, sp);
		return sp;
	}

	// Store a finished canvas of w x h pixels holding px (RGBA bytes).
	function canvasOf(px, w, h) {
		const c = env.makeCanvas(w, h);
		const g = c.getContext('2d');
		const id = g.createImageData(w, h);
		id.data.set(px);
		g.putImageData(id, 0, 0);
		return c;
	}

	// get(key, paintHex, wear) -> {img, w, h}, or null when the sprite is not
	// loaded. img is the raw sprite when wear is 0 and the paint is the base paint
	// (or none is given), or when there is no mask. Otherwise the sprite is
	// repainted (paintRamp of fadeHex(paint, wear)) and weathered (wearLayers).
	function get(key, paintHex, wear) {
		if (!sprites.has(key)) {
			return null;
		}
		const size = sprites.size(key);
		const w = size.w;
		const h = size.h;
		const img = sprites.image(key);
		const m = sprites.meta(key) || {};
		const base = typeof m.paint === 'string' ? m.paint : null;
		const lvl = wear || 0;
		const want = paintHex || base;
		const mask = maskOf(key, w, h);
		const raw = { img: img, w: w, h: h };
		// No mask, or nothing to change: the raw sprite. A sprite with no paint
		// colour at all cannot be repainted or weathered, so it is raw too.
		if (!mask || want === null) {
			return raw;
		}
		if (lvl === 0 && (!paintHex || lower(paintHex) === lower(base))) {
			return raw;
		}

		const ck = key + '|' + paintHex + '|' + lvl;
		if (cache.has(ck)) {
			const hit = cache.get(ck);
			cache.delete(ck);
			cache.set(ck, hit);
			return hit;
		}

		const target = fadeHex(want, lvl);
		const src = pixelsOf(img, w, h);
		const px =
			lower(target) === lower(base) ? src : recolourPixels(src, mask.cls, mask.step, w, h, target);
		if (lvl > 0) {
			wearLayers(px, mask.cls, mask.step, w, h, lvl, hashString(key), paintRamp(target));
		}
		built += 1;
		const entry = { img: canvasOf(px, w, h), w: w, h: h };
		cache.set(ck, entry);
		while (cache.size > limit) {
			cache.delete(cache.keys().next().value);
		}
		return entry;
	}

	// light(key): a canvas that is white where the mask says paint with step 5 or
	// 6 (classes 1 and 2), or chrome (class 3) with red 200 or more; transparent
	// elsewhere. The specular layer for the shine sweep. Null without a mask.
	function light(key) {
		if (!sprites.has(key)) {
			return null;
		}
		if (lights.has(key)) {
			return lights.get(key);
		}
		const size = sprites.size(key);
		const w = size.w;
		const h = size.h;
		const mask = maskOf(key, w, h);
		if (!mask) {
			return null;
		}
		const src = pixelsOf(sprites.image(key), w, h);
		const out = new Uint8ClampedArray(w * h * 4);
		for (let i = 0; i < w * h; i++) {
			const cls = mask.cls[i];
			const shiny = (cls === 1 || cls === 2) && mask.step[i] >= 5;
			const chrome = cls === 3 && src[i * 4] >= 200;
			if (shiny || chrome) {
				out[i * 4] = 255;
				out[i * 4 + 1] = 255;
				out[i * 4 + 2] = 255;
				out[i * 4 + 3] = 255;
			}
		}
		built += 1;
		const c = canvasOf(out, w, h);
		lights.set(key, c);
		return c;
	}

	// stats() -> {cached, built}: entries in the repaint LRU, and pixel passes so far.
	function stats() {
		return { cached: cache.size, built: built };
	}

	return { get: get, light: light, stats: stats };
}
