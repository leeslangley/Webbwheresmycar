// Tests for the PWA install/offline files (card W71b), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

// Every src/ .js file in this worktree (find src -name '*.js' | sort). The
// sw.js ASSETS list must name each of them, reachable from the entry or not.
const SRC_FILES = [
	'src/art/calendar.js',
	'src/art/cardraw.js',
	'src/art/characters.js',
	'src/art/characters_dave.js',
	'src/art/characters_mark.js',
	'src/art/common.js',
	'src/art/hud.js',
	'src/art/office.js',
	'src/art/officelayout.js',
	'src/art/profiles.js',
	'src/art/props.js',
	'src/art/speech.js',
	'src/art/sprites.js',
	'src/boot.js',
	'src/core/clock.js',
	'src/core/format.js',
	'src/core/rng.js',
	'src/core/state.js',
	'src/data/adverts.js',
	'src/data/cars.js',
	'src/data/cars_t1.js',
	'src/data/cars_t2.js',
	'src/data/cars_t3.js',
	'src/data/chatter.js',
	'src/data/faults.js',
	'src/data/headlines.js',
	'src/data/headlines_carworld_a.js',
	'src/data/headlines_carworld_b.js',
	'src/data/headlines_generic_a.js',
	'src/data/headlines_generic_b.js',
	'src/data/headlines_reactive.js',
	'src/data/jobs_a.js',
	'src/data/jobs_b.js',
	'src/data/jobs_c.js',
	'src/data/jobs_d.js',
	'src/data/jobtypes.js',
	'src/data/names.js',
	'src/data/owners.js',
	'src/data/paint.js',
	'src/main.js',
	'src/save/save.js',
	'src/sim/actions.js',
	'src/sim/adsim.js',
	'src/sim/advance.js',
	'src/sim/auction.js',
	'src/sim/carstats.js',
	'src/sim/endgame.js',
	'src/sim/faultsim.js',
	'src/sim/garage.js',
	'src/sim/jobresolve.js',
	'src/sim/jobsim.js',
	'src/sim/month.js',
	'src/sim/newgame.js',
	'src/sim/news.js',
	'src/sim/shop.js',
	'src/ui/canvas.js',
	'src/ui/kit_draw.js',
	'src/ui/kit_hits.js',
	'src/ui/scenes.js',
	'src/ui/scenes/adverts.js',
	'src/ui/scenes/auction.js',
	'src/ui/scenes/endgame.js',
	'src/ui/scenes/garage.js',
	'src/ui/scenes/ledger.js',
	'src/ui/scenes/news.js',
	'src/ui/scenes/office.js',
	'src/ui/scenes/settings.js',
	'src/ui/scenes/title.js',
	'src/ui/scenes/tvshop.js',
	'src/ui/theme.js',
];

// `read(path, 'binary')` hands back a Uint8Array (or an ArrayBuffer/byte
// string, depending on the jsc build).
function readBytes(path) {
	const data = read(path, 'binary');
	if (typeof data === 'string') {
		const out = new Uint8Array(data.length);
		for (let i = 0; i < data.length; i++) {
			out[i] = data.charCodeAt(i) & 0xff;
		}
		return out;
	}
	if (data instanceof ArrayBuffer) {
		return new Uint8Array(data);
	}
	return data;
}

// Walk the static import graph of the game so a src file that exists on disk
// but is missing from sw.js ASSETS is caught (jsc cannot list directories).
// Seeds are src/main.js and src/boot.js, plus every src file already listed in
// ASSETS: the browser entry does not statically import the scene/sim modules
// yet (a later game-flow card wires those), so their imports would otherwise
// be invisible. Returns the reachable set of `src/...` paths.
function collectSrcGraph(seeds) {
	const imports = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
	function resolveSpec(spec, fromDir) {
		const parts = fromDir.split('/');
		const specParts = spec.split('/');
		for (let i = 0; i < specParts.length; i++) {
			if (specParts[i] === '.') {
				continue;
			} else if (specParts[i] === '..') {
				parts.pop();
			} else {
				parts.push(specParts[i]);
			}
		}
		return parts.join('/');
	}
	const found = {};
	const queue = ['src/main.js', 'src/boot.js'];
	for (let i = 0; i < seeds.length; i++) {
		if (seeds[i].slice(0, 6) === './src/') {
			queue.push(seeds[i].slice(2));
		}
	}
	while (queue.length > 0) {
		const path = queue.pop();
		if (found[path]) {
			continue;
		}
		found[path] = true;
		const text = read(path);
		let m;
		imports.lastIndex = 0;
		while ((m = imports.exec(text)) !== null) {
			const spec = m[1];
			const dir = path.split('/').slice(0, -1).join('/');
			const resolved = resolveSpec(spec, dir);
			if (resolved.slice(0, 4) === 'src/' && fileExists(resolved)) {
				queue.push(resolved);
			}
		}
	}
	return Object.keys(found).sort();
}

function assetsFromSw(sw) {
	const listMatch = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
	ok(listMatch, 'ASSETS list found in sw.js');
	const assets = [];
	const re = /'([^']+)'/g;
	let m;
	while ((m = re.exec(listMatch[1])) !== null) {
		assets.push(m[1]);
	}
	return assets;
}

function fileExists(path) {
	try {
		read(path);
		return true;
	} catch (e) {
		return false;
	}
}

test('manifest has the required fields', function () {
	const manifest = JSON.parse(read('manifest.webmanifest'));
	eq(manifest.name, "Webb, where's my car?", 'name');
	eq(manifest.short_name, 'Webb Wheels', 'short_name');
	eq(manifest.start_url, './index.html', 'start_url');
	eq(manifest.scope, './', 'scope');
	eq(manifest.display, 'fullscreen', 'display');
	eq(manifest.orientation, 'landscape', 'orientation');
	eq(manifest.background_color, '#14102a', 'background_color');
	eq(manifest.theme_color, '#14102a', 'theme_color');
});

test('manifest lists 192 and 512 PNG icons', function () {
	const manifest = JSON.parse(read('manifest.webmanifest'));
	const icons = manifest.icons || [];
	const sizes = {};
	for (let i = 0; i < icons.length; i++) {
		ok(icons[i].type === 'image/png', 'icon type is image/png');
		sizes[icons[i].sizes] = icons[i].src;
	}
	ok(typeof sizes['192x192'] === 'string', '192x192 icon listed');
	ok(typeof sizes['512x512'] === 'string', '512x512 icon listed');
});

test('every file listed in sw.js exists', function () {
	const sw = read('sw.js');
	const listMatch = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
	ok(listMatch, 'ASSETS list found in sw.js');
	const assets = [];
	const re = /'([^']+)'/g;
	let m;
	while ((m = re.exec(listMatch[1])) !== null) {
		assets.push(m[1]);
	}
	ok(assets.length > 0, 'ASSETS list is not empty');
	for (let i = 0; i < assets.length; i++) {
		const path = assets[i].replace(/^\.\//, '');
		const check = path === '' ? 'index.html' : path;
		ok(fileExists(check), 'asset exists: ' + assets[i]);
	}
});

test('the three icon PNGs have the PNG signature', function () {
	const icons = [
		'assets/icons/apple-touch-icon.png',
		'assets/icons/icon-192.png',
		'assets/icons/icon-512.png'
	];
	for (let i = 0; i < icons.length; i++) {
		const bytes = readBytes(icons[i]);
		for (let j = 0; j < PNG_SIGNATURE.length; j++) {
			eq(bytes[j], PNG_SIGNATURE[j], icons[i] + ' byte ' + j);
		}
	}
});

test('sw.js caches at least 20 src entries', function () {
	const sw = read('sw.js');
	let count = 0;
	const re = /'\.\/src\/[^']+'/g;
	while (re.exec(sw) !== null) {
		count++;
	}
	ok(count >= 20, 'at least 20 ./src/ entries, got ' + count);
});

test('index.html links the manifest and registers the worker', function () {
	const html = read('index.html');
	ok(html.indexOf('rel="manifest"') !== -1, 'manifest link present');
	ok(html.indexOf('serviceWorker.register') !== -1, 'serviceWorker.register present');
});

test('sw.js ASSETS covers the reachable src import graph', function () {
	const assets = assetsFromSw(read('sw.js'));
	const listed = {};
	for (let i = 0; i < assets.length; i++) {
		ok(!listed[assets[i]], 'no duplicate ASSETS entry: ' + assets[i]);
		listed[assets[i]] = true;
	}
	const graph = collectSrcGraph(assets);
	ok(graph.length >= 20, 'import graph reaches at least 20 src files, got ' + graph.length);
	for (let i = 0; i < graph.length; i++) {
		ok(listed['./' + graph[i]], 'ASSETS lists reachable file: ' + graph[i]);
	}
	ok(SRC_FILES.length >= 20, 'SRC_FILES lists at least 20 src files, got ' + SRC_FILES.length);
	for (let i = 0; i < SRC_FILES.length; i++) {
		ok(listed['./' + SRC_FILES[i]], 'ASSETS lists src file: ' + SRC_FILES[i]);
	}
});

done();
