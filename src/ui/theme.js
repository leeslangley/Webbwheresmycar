// Theme constants and colour helpers (DESIGN.md section 3, 9.7): the C64
// palette plus modern accents, CSS font strings, and hex shade/rgba helpers.
// Pure: no DOM, no Date.

// 16 C64 (Pepto) colours plus the "modern" accents from DESIGN.md section 3.
export const PALETTE = {
	black: '#000000',
	white: '#FFFFFF',
	red: '#68372B',
	cyan: '#70A4B2',
	purple: '#6F3D86',
	green: '#588D43',
	blue: '#352879',
	yellow: '#B8C76F',
	orange: '#6F4F25',
	brown: '#433900',
	lightred: '#9A6759',
	darkgrey: '#444444',
	midgrey: '#6C6C6C',
	lightgreen: '#9AD284',
	lightblue: '#6C5EB5',
	lightgrey: '#959595',
	cream: '#F4E9C8',
	paper: '#FFF7DC',
	lamp: '#FFD27A',
	ink: '#14102A',
	good: '#3FAE49',
	bad: '#D9483B',
	gold: '#E8B923',
};

// font(kind, px) -> CSS font string. 'title' is Press Start 2P, 'body' is VT323.
export function font(kind, px) {
	if (kind === 'title') {
		return px + 'px "Press Start 2P", monospace';
	}
	if (kind === 'body') {
		return px + 'px VT323, monospace';
	}
	throw new Error('bad font kind');
}

// Parse '#rrggbb' (case-insensitive) -> [r, g, b]. Throws on anything else.
function parseHex(hex) {
	if (typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
		throw new Error('bad hex colour: ' + hex);
	}
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16),
	];
}

function clamp(x, lo, hi) {
	return x < lo ? lo : x > hi ? hi : x;
}

// shade(hex, amount) -> '#rrggbb'. amount clamped to -1..1; positive mixes
// toward white, negative toward black. Channels are rounded.
export function shade(hex, amount) {
	if (typeof amount !== 'number' || amount !== amount) {
		throw new Error('bad shade amount: ' + amount);
	}
	const a = clamp(amount, -1, 1);
	const channels = parseHex(hex).map(function (c) {
		return a > 0 ? c + (255 - c) * a : c * (1 + a);
	});
	return '#' + channels.map(function (c) {
		const v = clamp(Math.round(c), 0, 255);
		return (v < 16 ? '0' : '') + v.toString(16);
	}).join('');
}

// rgba(hex, alpha) -> 'rgba(r,g,b,a)' (no spaces).
export function rgba(hex, alpha) {
	const channels = parseHex(hex);
	return 'rgba(' + channels[0] + ',' + channels[1] + ',' + channels[2] + ',' + alpha + ')';
}
