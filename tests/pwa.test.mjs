// Tests for the PWA install/offline files (card W71b), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

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
	const out = new Uint8Array(data.length);
	for (let i = 0; i < data.length; i++) {
		out[i] = data.charCodeAt(i) & 0xff;
	}
	return out;
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

done();
