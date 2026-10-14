// One entry point for drawing a catalogue car (card CC07, docs/art/CARS_ALIGN.md
// and docs/art/CC.md). drawModelCar draws the classic-car sprite for a model
// (side view `s` by default) when the sprites are loaded, and the code-drawn
// drawCar while they are not, at the same on-screen size. configureCarArt sets
// the loaded sprites and the variant cache. Pure: no DOM, no clock, no random
// numbers. Everything draws via the passed-in ctx.

import { modelOf } from '../data/cars.js';
import { paintOf } from '../data/paint.js';
import { pixelK, pixelSize, snapPx, getDeviceScale, idleBob } from './pixelscale.js';
import { wearState } from './sprite_paint.js';
import { drawCar, carBounds } from './cardraw.js';
import { drawContactShadow, drawReflection, drawShine, drawSteam, drawExhaust } from './carfx.js';

// Fallback car lengths in metres, per archetype.
export const LENGTH_M = {
	micro: 3.1, saloon: 4.4, beetle: 4.0, hatch: 3.8, roadster: 3.9, coupe: 4.4,
	longnose: 4.5, wedge: 4.2, gullwing: 4.5, tourer: 5.0, limo: 5.6, boxy: 4.1, trike: 3.3,
};

// Sprite pixels per metre for the hero density (CARS_ALIGN: 48 px/m).
export const PX_PER_M_L = 48;

// The loaded art: {sprites, variants}, or null (code-drawn cars only).
let art = null;

// configureCarArt({sprites, variants}) sets the art; configureCarArt(null) clears it.
export function configureCarArt(v) {
	if (v) {
		art = { sprites: v.sprites || null, variants: v.variants || null };
	} else {
		art = null;
	}
}

// keysOf(modelId, view, sheet): the sprite key to try first and the later
// fall-back keys. The mini key `<id>_m` is the fall-back of every view.
function keysOf(modelId, view, sheet) {
	if (sheet === 'S') {
		return { first: modelId + '_m', later: [] };
	}
	if (view === 'q') {
		return { first: modelId + '_q', later: [modelId + '_m'] };
	}
	if (view === 'f') {
		return { first: modelId + '_f', later: [modelId + '_m'] };
	}
	return { first: modelId, later: [modelId + '_m'] };
}

// candidatesOf(modelId, scale, opts): the {key, k} pairs to try, best first.
// The first key is tried for k from k0 down to ceil(0.75 * k0); the later keys
// for k from k0 down to 1. k0 is the whole device pixels per sprite pixel.
function candidatesOf(modelId, scale, opts) {
	const keys = keysOf(modelId, opts.view, opts.sheet);
	const k0 = pixelK(scale);
	const kMin = Math.max(1, Math.ceil(k0 * 0.75));
	const list = [];
	for (let k = k0; k >= kMin; k--) {
		list.push({ key: keys.first, k: k });
	}
	for (let k = k0; k >= 1; k--) {
		for (let i = 0; i < keys.later.length; i++) {
			list.push({ key: keys.later[i], k: k });
		}
	}
	return list;
}

// pickSprite(sprites, modelId, scale, opts): the sprite to draw as
// {key, k, p, w, h}, or null when no candidate is loaded. With opts.slot the
// first candidate that fits the slot wins; when none fits, the last loaded
// candidate (the mini sprite at the smallest size) is used. Without a slot the
// first loaded candidate is used.
function pickSprite(sprites, modelId, scale, opts) {
	const slot = opts.slot;
	let first = null;
	let last = null;
	const list = candidatesOf(modelId, scale, opts);
	for (let i = 0; i < list.length; i++) {
		const c = list[i];
		const size = sprites.has(c.key) ? sprites.size(c.key) : null;
		if (!size) {
			continue;
		}
		const p = c.k / getDeviceScale();
		const hit = { key: c.key, k: c.k, p: p, w: size.w * p, h: size.h * p };
		if (first === null) {
			first = hit;
		}
		last = hit;
		if (slot && hit.w <= slot.w && hit.h <= slot.h) {
			return hit;
		}
	}
	return slot ? last : first;
}

// chooseSprite(modelId, scale, opts): pickSprite with the configured art, or
// null when the art is not set up.
function chooseSprite(modelId, scale, opts) {
	if (!art || !art.sprites || !art.variants) {
		return null;
	}
	return pickSprite(art.sprites, modelId, scale, opts);
}

// codeSize(archetype, scale, opts): the code-drawn car's size. Its length is
// the fallback length times PX_PER_M_L times the logical sprite pixel size,
// capped at the slot width.
function codeSize(archetype, scale, opts) {
	const p = pixelSize(scale);
	let w = LENGTH_M[archetype] * PX_PER_M_L * p;
	if (opts.slot && w > opts.slot.w) {
		w = opts.slot.w;
	}
	const s = w / carBounds(archetype, 1).w;
	return { w: w, h: carBounds(archetype, s).h, p: p, s: s };
}

// drawCodeCar(ctx, modelId, archetype, x, y, scale, opts): the code-drawn fallback.
function drawCodeCar(ctx, modelId, archetype, x, y, scale, opts) {
	const size = codeSize(archetype, scale, opts);
	const cond = typeof opts.cond === 'number' ? opts.cond : 10;
	const t = typeof opts.t === 'number' ? opts.t : 0;
	drawCar(ctx, archetype, x, y, size.s, {
		body: opts.paint || paintOf(modelId),
		cond: cond,
		t: t,
	});
	return { kind: 'code', x: x, y: y, w: size.w, h: size.h, p: size.p };
}

// drawSpriteCar(ctx, hit, x, y, opts): draws the picked sprite with its ground
// anchor on (x, y), in the repainted and weathered variant for the condition.
function drawSpriteCar(ctx, hit, x, y, opts) {
	const sprites = art.sprites;
	const variants = art.variants;
	const key = hit.key;
	const p = hit.p;
	const cond = typeof opts.cond === 'number' ? opts.cond : 10;
	const t = typeof opts.t === 'number' ? opts.t : 0;
	const state = wearState(cond);
	const v = variants.get(key, opts.paint, state);
	if (!v) {
		return null;
	}
	const size = sprites.size(key);
	const m = sprites.meta(key) || {};
	const ax = typeof m.ax === 'number' ? m.ax : size.w / 2;
	const ay = typeof m.ay === 'number' ? m.ay : size.h;
	const w = hit.w;
	const h = hit.h;
	const gx = snapPx(x);
	const gy = snapPx(y);
	const left = gx - ax * p;
	const top = gy - ay * p + (opts.bob ? idleBob(t, p) : 0);

	// shadow: the baked sprite shadow, else the code ellipse
	if (opts.shadow !== false) {
		const sh = sprites.shadowImage(key);
		if (sh) {
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(sh, left, top, w, h);
			ctx.restore();
		} else {
			drawContactShadow(ctx, gx, gy, w, p);
		}
	}
	if (opts.reflect) {
		drawReflection(ctx, v.img, left + w / 2, top + h, w, h);
	}

	// the car
	ctx.save();
	ctx.imageSmoothingEnabled = false;
	if (opts.flip) {
		ctx.translate(gx, gy);
		ctx.scale(-1, 1);
		ctx.drawImage(v.img, -ax * p, top - gy, w, h);
	} else {
		ctx.drawImage(v.img, left, top, w, h);
	}
	ctx.restore();

	// shine sweep, bonnet steam for a faulty car, exhaust smoke for a wreck
	if (opts.shine) {
		const layer = variants.light(key);
		if (layer) {
			drawShine(ctx, layer, left + w / 2, top + h, w, h, t);
		}
	}
	if (opts.fault) {
		drawSteam(ctx, opts.flip ? left + w * 0.2 : left + w * 0.8, top + h * 0.3, t, p);
	}
	if (state === 3) {
		drawExhaust(ctx, opts.flip ? left + w * 0.98 : left + w * 0.02, gy - 2 * p, t, p, opts.flip ? 1 : -1);
	}
	return { kind: 'sprite', x: gx, y: gy, left: left, top: top, w: w, h: h, p: p, key: key, wear: state };
}

// drawModelCar(ctx, modelId, x, y, scale, opts): draw the car for a catalogue
// model with its ground point at (x, y). scale is the wanted sprite pixel size
// in logical px. opts: paint (hex), cond (0-10, default 10), t (seconds),
// flip, shadow (default true), reflect, shine, bob, fault, slot {w, h},
// view ('s' default, 'q', 'f'), sheet ('S' for the mini sprite only). Returns
// {kind: 'sprite'|'code', ...}. Throws for an unknown modelId.
export function drawModelCar(ctx, modelId, x, y, scale, opts) {
	const model = modelOf(modelId);
	const o = opts || {};
	const hit = chooseSprite(modelId, scale, o);
	if (hit) {
		const r = drawSpriteCar(ctx, hit, x, y, o);
		if (r) {
			return r;
		}
	}
	return drawCodeCar(ctx, modelId, model.archetype, x, y, scale, o);
}

// measureModelCar(modelId, scale, opts): the size drawModelCar would draw,
// without drawing: {kind, key, w, h, p}. Throws for an unknown modelId.
export function measureModelCar(modelId, scale, opts) {
	const model = modelOf(modelId);
	const o = opts || {};
	const hit = chooseSprite(modelId, scale, o);
	if (hit) {
		return { kind: 'sprite', key: hit.key, w: hit.w, h: hit.h, p: hit.p };
	}
	const size = codeSize(model.archetype, scale, o);
	return { kind: 'code', key: null, w: size.w, h: size.h, p: size.p };
}
