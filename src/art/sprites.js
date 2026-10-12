// Car sprite loader and drawer (card S01). Loads the pixel-art car PNGs listed
// in assets/art/cars/manifest.json (written by tools/art/render_all.sh, card V07:
// `{ "<id>": {"file": "<id>.png", "w": <width>, "h": <height>} }`) and draws
// them crisp: whole-number pixel scale with imageSmoothingEnabled = false, so the
// chunky pixels stay chunky. Pure: no DOM, no fetch, no Date -- the browser
// passes loadJson/loadImage in through env, so tests run under `jsc -m` with fakes.

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

// createSprites(env) -> {ready, load, has, size, draw}; env = {loadJson, loadImage}.
export function createSprites(env) {
	const sprites = {}; // id -> {img, w, h}
	const api = {
		ready: false,

		// load(): fetch the manifest, then every listed image. A failing image is
		// skipped, not fatal, so one broken PNG cannot stop the game booting; a
		// failing manifest leaves the sprite table empty. Either way load() resolves
		// (it never rejects) and ready becomes true once loading is finished.
		load: function () {
			function finish() {
				api.ready = true;
			}
			return Promise.resolve()
				.then(function () {
					return env.loadJson(MANIFEST_URL);
				})
				.then(function (man) {
					const list = [];
					for (const id in man) {
						const entry = man[id];
						const file = entry && typeof entry === 'object' ? entry.file : entry;
						if (typeof file === 'string' && file !== '') {
							list.push({ id: id, file: file, entry: entry });
						}
					}
					return Promise.all(
						list.map(function (it) {
							return Promise.resolve()
								.then(function () {
									return env.loadImage(SPRITE_DIR + it.file);
								})
								.then(function (img) {
									const sz = spriteSize(img, it.entry);
									if (sz) {
										sprites[it.id] = { img: img, w: sz.w, h: sz.h };
									}
								}, function () {}); // skipped: image missing or corrupt
						})
					);
				})
				.then(finish, finish);
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
