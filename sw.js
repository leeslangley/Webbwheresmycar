// Service worker: cache-first offline shell for "Webb, where's my car?".
const CACHE = 'webb-v1';
const ASSETS = [
	'./',
	'./index.html',
	'./manifest.webmanifest',
	'./assets/fonts/PressStart2P-Regular.ttf',
	'./assets/fonts/VT323-Regular.ttf',
	'./assets/icons/apple-touch-icon.png',
	'./assets/icons/icon-192.png',
	'./assets/icons/icon-512.png',
	'./src/art/calendar.js',
	'./src/art/cardraw.js',
	'./src/art/characters_dave.js',
	'./src/art/characters_mark.js',
	'./src/art/characters.js',
	'./src/art/common.js',
	'./src/art/hud.js',
	'./src/art/office.js',
	'./src/art/officelayout.js',
	'./src/art/profiles.js',
	'./src/art/props.js',
	'./src/art/speech.js',
	'./src/art/sprites.js',
	'./src/boot.js',
	'./src/core/clock.js',
	'./src/core/format.js',
	'./src/core/rng.js',
	'./src/core/state.js',
	'./src/data/adverts.js',
	'./src/data/cars_t1.js',
	'./src/data/cars_t2.js',
	'./src/data/cars_t3.js',
	'./src/data/cars.js',
	'./src/data/chatter.js',
	'./src/data/faults.js',
	'./src/data/headlines_carworld_a.js',
	'./src/data/headlines_carworld_b.js',
	'./src/data/headlines_generic_a.js',
	'./src/data/headlines_generic_b.js',
	'./src/data/headlines_reactive.js',
	'./src/data/headlines.js',
	'./src/data/jobs_a.js',
	'./src/data/jobs_b.js',
	'./src/data/jobs_c.js',
	'./src/data/jobs_d.js',
	'./src/data/jobtypes.js',
	'./src/data/names.js',
	'./src/data/owners.js',
	'./src/data/paint.js',
	'./src/main.js',
	'./src/save/save.js',
	'./src/sim/actions.js',
	'./src/sim/adsim.js',
	'./src/sim/advance.js',
	'./src/sim/auction.js',
	'./src/sim/carstats.js',
	'./src/sim/endgame.js',
	'./src/sim/faultsim.js',
	'./src/sim/garage.js',
	'./src/sim/jobresolve.js',
	'./src/sim/jobsim.js',
	'./src/sim/month.js',
	'./src/sim/newgame.js',
	'./src/sim/news.js',
	'./src/sim/shop.js',
	'./src/ui/canvas.js',
	'./src/ui/kit_draw.js',
	'./src/ui/kit_hits.js',
	'./src/ui/scenes/adverts.js',
	'./src/ui/scenes/auction.js',
	'./src/ui/scenes/endgame.js',
	'./src/ui/scenes/garage.js',
	'./src/ui/scenes/ledger.js',
	'./src/ui/scenes/news.js',
	'./src/ui/scenes/office.js',
	'./src/ui/scenes/settings.js',
	'./src/ui/scenes/title.js',
	'./src/ui/scenes/tvshop.js',
	'./src/ui/scenes.js',
	'./src/ui/theme.js'
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE)
			.then(function (cache) {
				return cache.addAll(ASSETS);
			})
			.then(function () {
				return self.skipWaiting();
			})
	);
});

self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys()
			.then(function (keys) {
				return Promise.all(keys.map(function (key) {
					if (key !== CACHE) {
						return caches.delete(key);
					}
					return null;
				}));
			})
			.then(function () {
				return self.clients.claim();
			})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(
		caches.match(event.request).then(function (cached) {
			return cached || fetch(event.request);
		})
	);
});
