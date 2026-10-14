// Room plate loader and compositor (card GE13). Loads the room plates listed in
// assets/art/rooms/manifest.json and draws them crisp: whole-number pixel scale
// (ART.scale, x2 from stage.js) with imageSmoothingEnabled = false. A room may
// also have a front layer that shifts a few pixels against the pointer, so the
// room has depth. Same structure as sprites.js. Pure: no DOM, no fetch, no Date
// -- the browser passes loadJson/loadImage in through env, so tests run under
// `jsc -m` with fakes.

import { ART } from './stage.js';

const MANIFEST_URL = 'assets/art/rooms/manifest.json';
const PLATE_DIR = 'assets/art/rooms/';

// Pixels the front layer moves at full look (look.x or look.y = +-1).
export const PARALLAX = { front: { x: 6, y: 3 } };

// sizeOf(img, entry): the plate's pixel size. The loaded image wins; the manifest
// width/height is the fallback. Returns null when no usable size is known.
function sizeOf(img, entry) {
	const w = img && (img.width || img.naturalWidth);
	const h = img && (img.height || img.naturalHeight);
	if (typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0) {
		return { w: w, h: h };
	}
	if (entry && typeof entry.w === 'number' && entry.w > 0 && typeof entry.h === 'number' && entry.h > 0) {
		return { w: entry.w, h: entry.h };
	}
	return null;
}

// nameOf(x): x when it is a non-empty file name, else null.
function nameOf(x) {
	return typeof x === 'string' && x !== '' ? x : null;
}

// clampUnit(v): v clamped to -1..1; 0 for anything that is not a number.
function clampUnit(v) {
	if (typeof v !== 'number' || isNaN(v)) {
		return 0;
	}
	return v < -1 ? -1 : v > 1 ? 1 : v;
}

// lookOf(opts): {x, y} from opts.look, each clamped to -1..1, default 0.
function lookOf(opts) {
	const l = opts && opts.look ? opts.look : {};
	return { x: clampUnit(l.x), y: clampUnit(l.y) };
}

// createRooms(env) -> {ready, load, has, info, draw, drawFront}; env = {loadJson, loadImage}.
export function createRooms(env) {
	// Plain tables with no prototype, so an id such as 'constructor' is not "loaded".
	const plates = Object.create(null); // id -> {img, w, h}
	const fronts = Object.create(null); // id -> front layer image
	const api = {
		ready: false,

		// load(): fetch the manifest, then every listed plate and front layer. A failing
		// image is skipped; a failing manifest leaves nothing. load() never rejects.
		load: function () {
			return Promise.resolve()
				.then(function () {
					return env.loadJson(MANIFEST_URL);
				})
				.then(function (man) {
					if (man === null || typeof man !== 'object') {
						return;
					}
					const jobs = [];
					for (const id in man) {
						if (id.charAt(0) === '_') {
							continue; // _meta and other non-room keys
						}
						const entry = man[id];
						const isObj = entry !== null && typeof entry === 'object';
						const file = nameOf(isObj ? entry.file : entry);
						if (file === null) {
							continue;
						}
						jobs.push({ kind: 'plate', id: id, name: file, entry: isObj ? entry : null });
						if (isObj && nameOf(entry.front) !== null) {
							jobs.push({ kind: 'front', id: id, name: entry.front });
						}
					}
					return Promise.all(
						jobs.map(function (job) {
							return Promise.resolve()
								.then(function () {
									return env.loadImage(PLATE_DIR + job.name);
								})
								.then(function (img) {
									store(job, img);
								}, function () {
									// skipped: image missing or corrupt
								});
						})
					);
				})
				.then(finish, finish);

			function store(job, img) {
				if (!img) {
					return;
				}
				if (job.kind === 'front') {
					fronts[job.id] = img;
					return;
				}
				const sz = sizeOf(img, job.entry);
				if (sz) {
					plates[job.id] = { img: img, w: sz.w, h: sz.h };
				}
			}

			function finish() {
				api.ready = true;
			}
		},

		// has(id): true when that room plate loaded.
		has: function (id) {
			return plates[id] !== undefined;
		},

		// info(id): {w, h, scale, hasFront} of a loaded room, or null.
		info: function (id) {
			const p = plates[id];
			if (!p) {
				return null;
			}
			return { w: p.w, h: p.h, scale: ART.scale, hasFront: fronts[id] !== undefined };
		},

		// draw(ctx, id, opts): draw the plate at x2 with no smoothing. The plate never
		// moves; opts is accepted for symmetry with drawFront and ignored. Returns false
		// (and draws nothing) for an id whose plate did not load.
		draw: function (ctx, id, opts) {
			const p = plates[id];
			if (!p) {
				return false;
			}
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(p.img, 0, 0, p.w * ART.scale, p.h * ART.scale);
			ctx.restore();
			return true;
		},

		// drawFront(ctx, id, opts): draw the front layer shifted against the look
		// direction: x = -look.x * PARALLAX.front.x, y = -look.y * PARALLAX.front.y.
		// Returns false (and draws nothing) when the plate or its front layer did not load.
		drawFront: function (ctx, id, opts) {
			const p = plates[id];
			const f = fronts[id];
			if (!p || f === undefined) {
				return false;
			}
			const look = lookOf(opts);
			const x = Math.round(-look.x * PARALLAX.front.x);
			const y = Math.round(-look.y * PARALLAX.front.y);
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(f, x, y, p.w * ART.scale, p.h * ART.scale);
			ctx.restore();
			return true;
		},
	};
	return api;
}
