// Pixel icons drawn in code (docs/art/GU.md). Each icon is a text bitmap:
// rows separated by '|', one letter per cell, '.' is transparent. Utility
// icons are 12x12 cells, the four Gold Number Plate discs are 16x16 cells.
// drawIcon merges horizontal runs of the same letter into one fillRect.
// Pure: no DOM, no Date, no Math.random.

export const ICON_DATA = {
	coin: '...oooooo...|..oYYYYYyo..|.oYYyyooyyo.|.oYyyoyyyyd.|.oYyyoyyyyd.|.oYyooooyyd.|.oYyyoyyyyd.|.oYyyoyyyyd.|.oYyoooooyd.|.oyyyyyyydo.|..oddddddo..|...oooooo...',
	star: '............|.....oo.....|....oYyo....|....oYyo....|ooooyYyyoooo|.oYYYyyyyyo.|..oYYyyyyo..|...oyyyyo...|...oyyddo...|..oyyoodyo..|..oyo..oyo..|..ooo..ooo..',
	buzz: '.......oooo.|......oYYyo.|.....oYYyo..|....oYYyo...|...oYYyoooo.|..oYYYYyyYo.|..ooooYYyo..|.....oYYo...|....oYyo....|...oYyo.....|..oyyo......|..ooo.......',
	calendar: '..o......o..|.oloooooolo.|ooRRRRRRRRoo|orRRRRRRRRRo|ocwwwwwwwwco|ocwoowowowco|ocwwwwwwwwco|ocwowowoowco|ocwwwwwwwwco|ocwoowowrwco|ocwwwwwwwwco|.oooooooooo.',
	wrench: '......ooo...|....oollllo.|...olloooll.|...ollo.olo.|....olloll..|...oolllo...|..oolllo....|.oollko.....|.olllko.....|oollko......|olkko.......|.oo.........',
	key: '...oooo.....|..olllllo...|.olloooll...|.oloo.ool...|.oll.ollo...|..olllloo...|....olko....|....olko....|....olkooo..|....olkllo..|....olkooo..|.....ooo....',
	phone: '..oooooooo..|.orrrrrrrrro|orrrRRRRrrro|oooooooooooo|.oRRRooRRRo.|..oRRoooRo..|...ooooooo..|..oowwwwoo..|.owwwwwwwwo.|.owowowowwo.|.owwwwwwwwo.|..oooooooo..',
	paper: '............|.ooooooooooo|.occccccccco|.ocoooccccco|.occccccccco|.ocooooooooo|.occccccccco|.ocooooocooo|.occccccccco|.ocooooooooo|.occccccccco|.oooooooooo.',
	tick: '............|..........oo|.........ogo|........oggo|........oggo|oo.....oggo.|ogo...oggo..|ogGo.oggo...|.ogGoggo....|..ogggo.....|...ogo......|....o.......',
	cross: '............|.oo......oo.|.orro..orro.|..orro.orro.|...orrorro..|....orrro...|....orrro...|...orrorro..|..orro.orro.|.orro..orro.|.oo......oo.|............',
	padlock: '...oooooo...|..olllllko..|..ol....ko..|..ol....ko..|.oooooooooo.|.oyYYYYYYdo.|.oyYYooYYdo.|.oyYYooYYdo.|.oyYYYoYYdo.|.oyyyyyyydo.|.oddddddddo.|..oooooooo..',
	warning: '.....oo.....|....oyyo....|...oyyyyo...|...oyooyo...|..oyyooyyo..|..oyyooyyo..|.oyyyooyyyo.|.oyyyyyyyyo.|oyyyyooyyyyo|oyyyyooyyyyo|oyyyyyyyyyyo|oooooooooooo',
	fuel: '..oooooo....|.orrrrrRo.o.|.orwwwwRooRo|.orwwwwRo.Ro|.orwwwwRo.Ro|.orrrrrRo.Ro|.orrrrrRooRo|.orrrmrRo.o.|.orrrmrRo...|.orrrrrRo...|.oRRRRRRo...|..oooooo....',
	tyre: '....oooo....|..ooookoooo.|.ookkkkkkkoo|.okkoooookko|okkoollloko.|okkolwwlokko|okkolwwlokko|okkoollloko.|.okkoooookko|.ookkkkkkkoo|..ooookoooo.|....oooo....',
	plate_fatcat: '.....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.oooYYYYyyyyooo.|.oYooYYyyyyoodo.|oYYooooooooooydo|oYYooooooooooydo|oYYooyoooyoooddo|oYYooooooooooddo|oYyooooyyooooddo|oyyooooooooooddo|.oyoyoooooyoodo.|.ooyoooooooodoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....',
	plate_stable: '.....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.ooooYYYyyyoooo.|.oYooYYyyyyoodo.|oYYooYyyyyyooydo|oYYooyyyyyyooydo|oYYooyyyyyyooddo|oYYooyyyyyyooddo|oYyyooyyyyoodddo|oyyyyooooooddddo|.oyyyyooooddddo.|.ooyyyyydddddoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....',
	plate_household: '.....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.ooYYYYooyyyyoo.|.oYYYYooooyyydo.|oYYYYooooooyyydo|oYYYooooooooyydo|oYYooooooooooddo|oYYyoooooooodddo|oYyyoooyyooodddo|oyyyoooyyooodddo|.oyyoooyyoooddo.|.ooyoooooooodoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....',
	plate_hammer: '.....oooooo.....|...ooYYYYYyoo...|..ooYYYYYyyyoo..|.ooYYooooooyyoo.|.oYYooooooooydo.|oYYYooooooooyydo|oYYYYooooooyyydo|oYYYyyyooyyyyddo|oYYyyyyooyyydddo|oYyyyyyooyyddddo|oyyyyyyooydddddo|.oyyyoooooodddo.|.ooyyooooooddoo.|..oodyydddddoo..|...ooddddddoo...|.....oooooo.....',
};

// The 18 icon names, in card order.
export const ICON_NAMES = [
	'coin', 'star', 'buzz', 'calendar', 'wrench', 'key', 'phone', 'paper', 'tick',
	'cross', 'padlock', 'warning', 'fuel', 'tyre', 'plate_fatcat', 'plate_stable',
	'plate_household', 'plate_hammer',
];

// Letter -> colour. Grey variant (opts.grey) is applied in drawIcon.
export const ICON_PAL = {
	o: '#14102A',
	w: '#FFFFFF',
	y: '#E8B923',
	Y: '#FFE27A',
	d: '#A57A12',
	g: '#3FAE49',
	G: '#1F6B2E',
	r: '#D9483B',
	R: '#8E2A22',
	l: '#C9CCD2',
	k: '#6C6C6C',
	c: '#F4E9C8',
	m: '#F2A93B',
};

// Colours used instead of y, Y and d when opts.grey is true (plates not won).
const GREY_PAL = {
	Y: '#B8B8B8',
	y: '#959595',
	d: '#6C6C6C',
};

// Parsed rows per icon, split once at module load.
const ROWS = {};
for (const name of ICON_NAMES) {
	ROWS[name] = ICON_DATA[name].split('|');
}

// Rows of a named icon, or throws for an unknown name.
function rowsOf(name) {
	if (!Object.prototype.hasOwnProperty.call(ROWS, name)) {
		throw new Error('bad icon');
	}
	return ROWS[name];
}

// Number of non-transparent cells in an icon.
export function iconCells(name) {
	const rows = rowsOf(name);
	let n = 0;
	for (let r = 0; r < rows.length; r++) {
		for (let c = 0; c < rows[r].length; c++) {
			if (rows[r][c] !== '.') {
				n += 1;
			}
		}
	}
	return n;
}

// Grid size of an icon in cells: 12 or 16.
export function iconSize(name) {
	return rowsOf(name).length;
}

// Draw an icon with its top-left corner at (x, y), scaled to size logical px.
// opts: {alpha: 1, grey: false}. Returns nothing.
export function drawIcon(ctx, name, x, y, size, opts) {
	const rows = rowsOf(name);
	const o = opts || {};
	const alpha = typeof o.alpha === 'number' ? o.alpha : 1;
	const grey = o.grey === true;
	const cell = size / rows.length;
	const wrap = alpha < 1;

	if (wrap) {
		ctx.save();
		ctx.globalAlpha = alpha;
	}

	let last;
	for (let r = 0; r < rows.length; r++) {
		const row = rows[r];
		let c = 0;
		while (c < row.length) {
			const letter = row[c];
			if (letter === '.') {
				c += 1;
				continue;
			}
			let end = c + 1;
			while (end < row.length && row[end] === letter) {
				end += 1;
			}
			const colour = grey && GREY_PAL[letter] ? GREY_PAL[letter] : ICON_PAL[letter];
			if (colour !== last) {
				ctx.fillStyle = colour;
				last = colour;
			}
			ctx.fillRect(x + c * cell, y + r * cell, (end - c) * cell, cell);
			c = end;
		}
	}

	if (wrap) {
		ctx.restore();
	}
}
