// Car sprite loader and drawer (card S01, extended by CC02). Loads the pixel-art
// car PNGs listed in assets/art/cars/manifest.json (written by tools/art/render_all.sh;
// manifest v2 in docs/art/CARS_ALIGN.md: `{ "_meta": {...}, "<key>": {file, w, h,
// ax, ay, mask, shadow, ...} }`; the old `{ "<id>": {"file", "w", "h"} }` still
// works) and draws them crisp: whole-number pixel scale with
// imageSmoothingEnabled = false, so the chunky pixels stay chunky. Keys starting
// with `_` are not sprites. Pure: no DOM, no fetch, no Date -- the browser passes
// loadJson/loadImage (and setTimeout) in through env, so tests run under `jsc -m`
// with fakes.

const MANIFEST_URL = 'assets/art/cars/manifest.json';
const SPRITE_DIR = 'assets/art/cars/';

// spriteSize(img, entry): the sprite's pixel size. The loaded image wins; the
// manifest width/height is the fallback for loaders that expose neither width nor
// naturalWidth. Returns null when no usable size is known.
function spriteSize(img, entry) {
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

// copyOf(entry): a shallow copy of a manifest entry ({} for anything else).
function copyOf(entry) {
	const c = {};
	if (entry && typeof entry === 'object') {
		for (const k in entry) {
			c[k] = entry[k];
		}
	}
	return c;
}

// createSprites(env) -> {ready, timedOut, load, progress, has, size, meta, image,
// maskImage, shadowImage, keys, draw}; env = {loadJson, loadImage, setTimeout?}.
export function createSprites(env) {
	// Plain tables with no prototype, so an id such as 'constructor' is not "loaded".
	const sprites = Object.create(null); // id -> {img, w, h, entry}
	const masks = Object.create(null); // id -> game mask image (RGBA, see CARS_ALIGN)
	const shadows = Object.create(null); // id -> baked shadow image
	let prog = { done: 0, total: 0 }; // progress of the latest load()
	let order = []; // sprite ids of the latest manifest, in manifest order
	const api = {
		ready: false,
		timedOut: false,

		// load(opts): opts = {onProgress, timeoutMs}, both optional. Fetch the
		// manifest, then every listed sprite, game mask and shadow image. Each
		// finished download (loaded or failed) calls onProgress(done, total). A
		// failing image is skipped, not fatal, so one broken PNG cannot stop the game
		// booting; a failing manifest leaves the sprite table empty. load() never
		// rejects. With timeoutMs > 0 and env.setTimeout, the promise also resolves
		// when that time is up: if loading is still going, timedOut and ready become
		// true, and images that arrive later still land in the tables.
		load: function (opts) {
			const o = opts || {};
			const onProgress = typeof o.onProgress === 'function' ? o.onProgress : null;
			const p = { done: 0, total: 0 };
			let loaded = false;
			prog = p;

			function tick() {
				p.done += 1;
				if (onProgress) {
					try {
						onProgress(p.done, p.total);
					} catch (e) {
						// a throwing progress callback must not stop loading
					}
				}
			}

			function store(job, img) {
				if (!img) {
					return;
				}
				if (job.kind === 'mask') {
					masks[job.id] = img;
				} else if (job.kind === 'shadow') {
					shadows[job.id] = img;
				} else {
					const sz = spriteSize(img, job.entry);
					if (sz) {
						sprites[job.id] = { img: img, w: sz.w, h: sz.h, entry: job.entry };
					}
				}
			}

			function finish() {
				loaded = true;
				api.ready = true;
			}

			const loading = Promise.resolve()
				.then(function () {
					return env.loadJson(MANIFEST_URL);
				})
				.then(function (man) {
					const jobs = [];
					order = [];
					for (const id in man) {
						if (id.charAt(0) === '_') {
							continue; // _meta and other non-sprite keys
						}
						const entry = man[id];
						const isObj = entry !== null && typeof entry === 'object';
						const file = nameOf(isObj ? entry.file : entry);
						if (file === null) {
							continue;
						}
						order.push(id);
						jobs.push({ kind: 'sprite', id: id, name: file, entry: entry });
						if (isObj && nameOf(entry.mask) !== null) {
							jobs.push({ kind: 'mask', id: id, name: entry.mask });
						}
						if (isObj && nameOf(entry.shadow) !== null) {
							jobs.push({ kind: 'shadow', id: id, name: entry.shadow });
						}
					}
					p.total = jobs.length;
					return Promise.all(
						jobs.map(function (job) {
							return Promise.resolve()
								.then(function () {
									return env.loadImage(SPRITE_DIR + job.name);
								})
								.then(function (img) {
									store(job, img);
									tick();
								}, function () {
									tick(); // skipped: image missing or corrupt
								});
						})
					);
				})
				.then(finish, finish);

			if (typeof o.timeoutMs === 'number' && o.timeoutMs > 0 && typeof env.setTimeout === 'function') {
				return new Promise(function (resolve) {
					try {
						env.setTimeout(function () {
							if (!loaded) {
								api.timedOut = true;
								api.ready = true;
							}
							resolve();
						}, o.timeoutMs);
					} catch (e) {
						// no timer available: just wait for the loading to finish
					}
					loading.then(resolve);
				});
			}
			return loading;
		},

		// progress(): {done, total} of the latest load(); zeros before any load.
		progress: function () {
			return { done: prog.done, total: prog.total };
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

		// meta(id): a shallow copy of the manifest entry of a loaded sprite, else null.
		meta: function (id) {
			const s = sprites[id];
			return s ? copyOf(s.entry) : null;
		},

		// image(id), maskImage(id), shadowImage(id): the loaded image, or null.
		image: function (id) {
			const s = sprites[id];
			return s ? s.img : null;
		},
		maskImage: function (id) {
			return masks[id] !== undefined ? masks[id] : null;
		},
		shadowImage: function (id) {
			return shadows[id] !== undefined ? shadows[id] : null;
		},

		// keys(): the ids of the sprites that loaded, in manifest order.
		keys: function () {
			return order.filter(function (id) {
				return sprites[id] !== undefined;
			});
		},

		// draw(ctx, id, x, y, scale, opts): draw the sprite with its bottom
		// centre at (x, y). Pixel size p = round(scale) clamped to 1, so the art
		// is never scaled below one screen pixel per sprite pixel. opts.flip
		// mirrors the sprite horizontally about its own centre. An unknown id draws
		// nothing and returns false; otherwise true.
		draw: function (ctx, id, x, y, scale, opts) {
			const s = sprites[id];
			if (!s) {
				return false;
			}
			const o = opts || {};
			const sc = typeof scale === 'number' && isFinite(scale) ? scale : 1;
			const p = Math.max(1, Math.round(sc));
			const w = s.w * p; // drawn width in pixels
			const h = s.h * p; // drawn height in pixels
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			if (o.flip) {
				ctx.translate(x, y);
				ctx.scale(-1, 1);
				ctx.drawImage(s.img, -w / 2, -h, w, h);
			} else {
				ctx.drawImage(s.img, x - w / 2, y - h, w, h);
			}
			ctx.restore();
			return true;
		},
	};
	return api;
}
