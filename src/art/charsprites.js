// Character sprite loader and drawer (card GC24). Loads the pixel-art character
// PNGs listed in assets/art/characters/manifest.json (docs/art/GC.md):
// `{version, scale, characters: {<id>: {frame, head, head_back, clips, heads,
// bust, busts}}, customers: {<jobId>: {variants, w, h, ids}}}`. An actor is a
// body frame with a head layer placed on its neck anchor; both are drawn crisp at
// a whole-number pixel scale with imageSmoothingEnabled = false. Customer portraits
// are picked from a name and a job id by a fixed hash, never by the game's rng.
// Pure: no DOM, no fetch, no clock, no random numbers. The browser passes
// loadJson/loadImage in through env, so tests run under `jsc -m` with fakes.

const MANIFEST_URL = 'assets/art/characters/manifest.json';
const SPRITE_DIR = 'assets/art/characters/';

// own(obj, key): obj[key] when key is an own property of obj, else undefined.
function own(obj, key) {
	return obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

// dimsOf(block): {w, h} from a manifest block when both are positive numbers, else null.
function dimsOf(block) {
	if (block && typeof block.w === 'number' && block.w > 0 && typeof block.h === 'number' && block.h > 0) {
		return { w: block.w, h: block.h };
	}
	return null;
}

// imageSize(img, dims): the loaded image size; the manifest dims when the image
// exposes no usable width or height.
function imageSize(img, dims) {
	const w = img && (img.width || img.naturalWidth);
	const h = img && (img.height || img.naturalHeight);
	if (typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0) {
		return { w: w, h: h };
	}
	return dims;
}

// usable(entry): the manifest customer entry when it has at least one id, else null.
function usable(entry) {
	return entry && typeof entry === 'object' && Array.isArray(entry.ids) && entry.ids.length > 0 ? entry : null;
}

// collect(man): every sprite id named by the manifest -> its manifest size
// (or null), in a plain table without prototype, in first-seen order.
function collect(man) {
	const ids = Object.create(null);
	const add = function (id, dims) {
		if (typeof id === 'string' && id !== '' && ids[id] === undefined) {
			ids[id] = dims;
		}
	};
	const chars = man && typeof man.characters === 'object' && man.characters !== null ? man.characters : {};
	for (const cid in chars) {
		const c = chars[cid];
		if (!c || typeof c !== 'object') {
			continue;
		}
		const frameDims = dimsOf(c.frame);
		const headDims = dimsOf(c.head);
		const clips = c.clips && typeof c.clips === 'object' ? c.clips : {};
		for (const name in clips) {
			const frames = clips[name] && Array.isArray(clips[name].frames) ? clips[name].frames : [];
			for (let i = 0; i < frames.length; i++) {
				add(frames[i] && frames[i].id, frameDims);
			}
		}
		const heads = c.heads && typeof c.heads === 'object' ? c.heads : {};
		for (const face in heads) {
			const angles = heads[face];
			if (angles && typeof angles === 'object') {
				for (const angle in angles) {
					add(angles[angle], headDims);
				}
			}
		}
		add(c.head_back, headDims);
		const busts = c.busts && typeof c.busts === 'object' ? c.busts : {};
		for (const face in busts) {
			add(busts[face], dimsOf(c.bust));
		}
	}
	const customers = man && typeof man.customers === 'object' && man.customers !== null ? man.customers : {};
	for (const jobId in customers) {
		const e = customers[jobId];
		if (e && typeof e === 'object' && Array.isArray(e.ids)) {
			for (let i = 0; i < e.ids.length; i++) {
				add(e.ids[i], dimsOf(e));
			}
		}
	}
	return ids;
}

// pixelScale(scale): whole-number pixels per sprite pixel, never below 1.
function pixelScale(scale) {
	const sc = typeof scale === 'number' && isFinite(scale) ? scale : 1;
	return Math.max(1, Math.round(sc));
}

// blitBottom(ctx, s, x, y, p): draw sprite s with its bottom centre at (x, y).
function blitBottom(ctx, s, x, y, p) {
	ctx.save();
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(s.img, x - (s.w * p) / 2, y - s.h * p, s.w * p, s.h * p);
	ctx.restore();
	return true;
}

// createCharSprites(env) -> {ready, manifest, load, has, size, character,
// drawActor, drawBust, drawCustomer}; env = {loadJson, loadImage}.
export function createCharSprites(env) {
	const sprites = Object.create(null); // id -> {img, w, h}
	const api = {
		ready: false,
		manifest: null,

		// load(): fetch the manifest, then every character and customer image it
		// names, once each. A failing image is skipped, not fatal. load() never
		// rejects: a failing manifest leaves nothing loaded but still sets ready.
		load: function () {
			return Promise.resolve()
				.then(function () {
					return env.loadJson(MANIFEST_URL);
				})
				.then(function (man) {
					if (!man || typeof man !== 'object') {
						return;
					}
					api.manifest = man;
					const ids = collect(man);
					return Promise.all(
						Object.keys(ids).map(function (id) {
							return Promise.resolve()
								.then(function () {
									return env.loadImage(SPRITE_DIR + id + '.png');
								})
								.then(
									function (img) {
										const sz = imageSize(img, ids[id]);
										if (img && sz) {
											sprites[id] = { img: img, w: sz.w, h: sz.h };
										}
									},
									function () {
										// skipped: image missing or corrupt
									}
								);
						})
					);
				})
				.then(
					function () {
						api.ready = true;
					},
					function () {
						api.ready = true;
					}
				);
		},

		// has(id): true when that sprite loaded and is drawable.
		has: function (id) {
			return sprites[id] !== undefined;
		},

		// size(id): {w, h} in pixels, or null when the id did not load.
		size: function (id) {
			const s = sprites[id];
			return s ? { w: s.w, h: s.h } : null;
		},

		// character(id): the manifest block of that character, or null.
		character: function (id) {
			const c = own(api.manifest && api.manifest.characters, id);
			return c && typeof c === 'object' ? c : null;
		},

		// drawActor(ctx, charId, frame, x, y, scale): frame is the object from
		// actor.at(t), {bodyId, neck, headId}. The body is drawn with its bottom
		// centre at (x, y); the head is placed so the character's head pivot sits
		// on the frame's neck anchor. Returns true when the body was drawn; a
		// missing body draws nothing and returns false; a missing head is skipped.
		drawActor: function (ctx, charId, frame, x, y, scale) {
			const body = frame ? sprites[frame.bodyId] : undefined;
			if (!body) {
				return false;
			}
			const p = pixelScale(scale);
			const bx = x - (body.w * p) / 2;
			const by = y - body.h * p;
			const c = api.character(charId);
			const pivot = c && c.head && Array.isArray(c.head.pivot) ? c.head.pivot : [0, 0];
			const head = frame.headId !== undefined ? sprites[frame.headId] : undefined;
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(body.img, bx, by, body.w * p, body.h * p);
			if (head && Array.isArray(frame.neck)) {
				const hx = bx + (frame.neck[0] - pivot[0]) * p;
				const hy = by + (frame.neck[1] - pivot[1]) * p;
				ctx.drawImage(head.img, hx, hy, head.w * p, head.h * p);
			}
			ctx.restore();
			return true;
		},

		// drawBust(ctx, charId, face, x, y, scale): the bust for that face (falling
		// back to neutral), bottom centre at (x, y). False when nothing can be drawn.
		drawBust: function (ctx, charId, face, x, y, scale) {
			const c = api.character(charId);
			const busts = c && c.busts && typeof c.busts === 'object' ? c.busts : null;
			if (!busts) {
				return false;
			}
			const s = sprites[own(busts, face)] || sprites[own(busts, 'neutral')];
			if (!s) {
				return false;
			}
			return blitBottom(ctx, s, x, y, pixelScale(scale));
		},

		// drawCustomer(ctx, jobId, variant, x, y, scale): the customer sprite
		// ids[variant % ids.length] of that job, bottom centre at (x, y). False when
		// the job or the sprite is unknown.
		drawCustomer: function (ctx, jobId, variant, x, y, scale) {
			const entry = api.manifest && api.manifest.customers ? usable(own(api.manifest.customers, jobId)) : null;
			if (!entry) {
				return false;
			}
			const n = entry.ids.length;
			const s = sprites[entry.ids[((variant % n) + n) % n]];
			if (!s) {
				return false;
			}
			return blitBottom(ctx, s, x, y, pixelScale(scale));
		},
	};
	return api;
}

// customerPortrait(customers, name, jobId): the sprite id for a customer, from a
// fixed hash of the name (djb2). A name of the form 'The ... Family' uses the
// x_family entry; otherwise the entry for jobId, falling back to the first entry
// with ids. Returns null when there is no usable entry. Never uses the game's rng.
export function customerPortrait(customers, name, jobId) {
	if (!customers || typeof customers !== 'object') {
		return null;
	}
	const text = name === undefined || name === null ? '' : String(name);
	let hash = 5381;
	for (let i = 0; i < text.length; i++) {
		hash = ((hash * 33) + text.charCodeAt(i)) >>> 0;
	}
	let entry = null;
	if (text.startsWith('The ') && text.endsWith(' Family')) {
		entry = usable(own(customers, 'x_family'));
	}
	if (!entry) {
		entry = usable(own(customers, jobId));
	}
	if (!entry) {
		for (const k in customers) {
			entry = usable(customers[k]);
			if (entry) {
				break;
			}
		}
	}
	if (!entry) {
		return null;
	}
	return entry.ids[hash % entry.ids.length];
}
