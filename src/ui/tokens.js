// UI tokens for the new UI language (docs/art/GU.md): every colour, spacing
// step, screen zone, type size, motion timing and easing curve lives here so
// that later cards never invent numbers. Pure: no DOM, no Date, no Math.random.

import { font } from './theme.js';

// Palette additions for the wood, brass, enamel, paper, banner, HUD and cash
// colours. Exactly these 29 keys.
export const COLOR = {
	ink: '#14102A',
	night: '#1B1735',
	well: '#241E45',
	wood: '#6B4423',
	woodLight: '#8C5E34',
	woodDark: '#3F2814',
	woodGrain: '#4E3119',
	brass: '#C9A24A',
	brassLight: '#F2D98A',
	brassDark: '#8A6B1F',
	enamelRed: '#B3282D',
	enamelGreen: '#1E5A3C',
	enamelNavy: '#1C2E5A',
	paper: '#FFF7DC',
	paperShade: '#D9CBA0',
	paperFold: '#C2B183',
	bannerTop: '#F6CFA0',
	bannerBottom: '#D9A66F',
	bannerDither: '#C48B55',
	hudBg: '#1B1735',
	hudEdge: '#0B0818',
	chartWhite: '#F8F6EE',
	cashGreen: '#3FAE49',
	cashDark: '#1F6B2E',
	rivet: '#C9CCD2',
	phosphor: '#7CFF8A',
	amber: '#FFB84D',
	warn: '#F2A93B',
	info: '#70A4B2',
};

// Spacing grid (4px base). sp(n) returns SPACE[n] for n in 1..7 only.
export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 };

export function sp(n) {
	if (typeof n !== 'number' || !Object.prototype.hasOwnProperty.call(SPACE, n)) {
		throw new Error('bad space');
	}
	return SPACE[n];
}

// Screen zones on the 1280x720 logical canvas. They stack top to bottom.
export const ZONES = {
	banner: { x: 0, y: 0, w: 1280, h: 120 },
	tableau: { x: 0, y: 120, w: 1280, h: 470 },
	hud: { x: 0, y: 590, w: 1280, h: 130 },
};

// Smallest allowed logical px per font kind (see docs/art/GU.md).
export const FLOOR = { title: 16, body: 22 };

// Type scale: each role names a font kind and a logical px size.
export const TYPE = {
	logo: { kind: 'title', px: 64 },
	h1: { kind: 'title', px: 32 },
	h2: { kind: 'title', px: 24 },
	h3: { kind: 'title', px: 16 },
	button: { kind: 'title', px: 16 },
	bannerText: { kind: 'title', px: 16, lineH: 28 },
	hero: { kind: 'body', px: 40 },
	body: { kind: 'body', px: 28 },
	caption: { kind: 'body', px: 24 },
};

// fontFor(role) -> CSS font string for a TYPE role. Throws on an unknown role.
export function fontFor(role) {
	if (!Object.prototype.hasOwnProperty.call(TYPE, role)) {
		throw new Error('bad role');
	}
	return font(TYPE[role].kind, TYPE[role].px);
}

// Motion timings in milliseconds.
export const MOTION = {
	tap: 90,
	press: 80,
	toast: 260,
	toastHold: 2500,
	toastOut: 200,
	bar: 450,
	count: 700,
	page: 320,
	slide: 350,
	fade: 250,
	iris: 500,
	static: 400,
	flip: 700,
	shake: 300,
	flash: 180,
	dayChange: 2400,
};

// Clamp a progress value to 0..1.
export function clamp01(u) {
	return u < 0 ? 0 : u > 1 ? 1 : u;
}

// Linear interpolation from a to b by u (u is not clamped here).
export function lerp(a, b, u) {
	return a + (b - a) * u;
}

const N1 = 7.5625;
const D1 = 2.75;
const C1 = 1.70158;
const C3 = C1 + 1;

// Easing curves: each takes u in 0..1 and returns the eased value.
export const EASE = {
	linear: function (u) {
		return u;
	},
	outQuad: function (u) {
		return 1 - (1 - u) * (1 - u);
	},
	outCubic: function (u) {
		return 1 - Math.pow(1 - u, 3);
	},
	inOutQuad: function (u) {
		return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
	},
	outBack: function (u) {
		return 1 + C3 * Math.pow(u - 1, 3) + C1 * Math.pow(u - 1, 2);
	},
	outBounce: function (u) {
		let x = u;
		if (x < 1 / D1) {
			return N1 * x * x;
		}
		if (x < 2 / D1) {
			x -= 1.5 / D1;
			return N1 * x * x + 0.75;
		}
		if (x < 2.5 / D1) {
			x -= 2.25 / D1;
			return N1 * x * x + 0.9375;
		}
		x -= 2.625 / D1;
		return N1 * x * x + 0.984375;
	},
};

// ease(name, u): clamps u to 0..1, then applies the named curve.
// Throws Error('bad ease') for an unknown name.
export function ease(name, u) {
	if (!Object.prototype.hasOwnProperty.call(EASE, name)) {
		throw new Error('bad ease');
	}
	return EASE[name](clamp01(u));
}
