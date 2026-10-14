// The real `env` for the sprite loader (card CC03). makeAssetEnv(win, doc) builds
// loadJson, loadImage, makeCanvas and setTimeout from the page's window and
// document, so the same code runs on http://localhost and in the iPhone app's
// webb:// scheme (served by AssetSchemeHandler). There fetch can answer with
// status 0, so loadJson falls back to XMLHttpRequest. Nothing here touches a
// global: every DOM object comes in through win and doc, so tests pass fakes.

// jsonViaFetch(win, url): fetch the url and parse it; rejects on a non-ok status.
function jsonViaFetch(win, url) {
	return win.fetch(url).then(function (r) {
		if (!r.ok) {
			throw new Error('http ' + r.status);
		}
		return r.json();
	});
}

// jsonViaXhr(win, url): a plain async GET. Status 0 counts as success when a body
// came back, because the custom scheme in WKWebView reports status 0 for good files.
function jsonViaXhr(win, url) {
	return new Promise(function (resolve, reject) {
		const x = new win.XMLHttpRequest();
		x.open('GET', url, true);
		x.onload = function () {
			if (x.status === 200 || (x.status === 0 && x.responseText !== '')) {
				try {
					resolve(JSON.parse(x.responseText));
				} catch (e) {
					reject(e);
				}
			} else {
				reject(new Error('http ' + x.status));
			}
		};
		x.onerror = function () {
			reject(new Error('network ' + url));
		};
		x.send();
	});
}

// makeAssetEnv(win, doc) -> {loadJson, loadImage, makeCanvas, setTimeout}.
// setTimeout is undefined when win has no setTimeout; the sprite loader then just
// waits for the files without a time limit.
export function makeAssetEnv(win, doc) {
	const hasXhr = function () {
		return typeof win.XMLHttpRequest === 'function';
	};

	return {
		// loadJson(url): fetch first; if fetch is missing or rejects, try XHR. Both
		// paths reject on failure and the loader catches it.
		loadJson: function (url) {
			if (typeof win.fetch !== 'function') {
				if (hasXhr()) {
					return jsonViaXhr(win, url);
				}
				return Promise.reject(new Error('no loader for ' + url));
			}
			let first;
			try {
				first = jsonViaFetch(win, url);
			} catch (e) {
				first = Promise.reject(e);
			}
			return first.catch(function (err) {
				if (hasXhr()) {
					return jsonViaXhr(win, url);
				}
				throw err;
			});
		},

		// loadImage(url): resolves with the <img> once it has loaded and, when the
		// browser has decode(), once decoded (a failed decode still resolves). No
		// crossOrigin: same-origin images keep getImageData working on http and webb://.
		loadImage: function (url) {
			return new Promise(function (resolve, reject) {
				const img = new win.Image();
				img.onload = function () {
					if (typeof img.decode !== 'function') {
						resolve(img);
						return;
					}
					let d;
					try {
						d = img.decode();
					} catch (e) {
						d = null;
					}
					Promise.resolve(d).then(
						function () {
							resolve(img);
						},
						function () {
							resolve(img);
						}
					);
				};
				img.onerror = function () {
					reject(new Error('image ' + url));
				};
				img.src = url;
			});
		},

		// makeCanvas(w, h): an offscreen canvas of that size.
		makeCanvas: function (w, h) {
			const c = doc.createElement('canvas');
			c.width = w;
			c.height = h;
			return c;
		},

		setTimeout: typeof win.setTimeout === 'function' ? function (fn, ms) {
			return win.setTimeout(fn, ms);
		} : undefined,
	};
}
