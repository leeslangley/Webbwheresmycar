// Screen zones of the 1280x720 canvas (docs/art/GE.md, RSAMH echo): speech
// banner on top, one fixed tableau in the middle, HUD strip at the bottom.
// Art plates are 640x360 pixels drawn at x2. Pure data and tiny functions,
// no drawing.

export const STAGE = {
	w: 1280,
	h: 720,
	banner: { x: 0, y: 0, w: 1280, h: 120 },
	tableau: { x: 0, y: 120, w: 1280, h: 470 },
	hud: { x: 0, y: 590, w: 1280, h: 130 },
};

export const ART = { w: 640, h: 360, scale: 2 };

export const ROOM_IDS = ['office', 'garage', 'auction', 'title', 'ledger', 'bookings'];

// True when rect r = {x, y, w, h} lies fully inside the tableau zone.
export function inTableau(r) {
	const t = STAGE.tableau;
	return r.x >= t.x && r.y >= t.y && r.x + r.w <= t.x + t.w && r.y + r.h <= t.y + t.h;
}

// Screen rect to plate pixels (the plates are drawn at x2).
export function artRect(r) {
	return { x: r.x / ART.scale, y: r.y / ART.scale, w: r.w / ART.scale, h: r.h / ART.scale };
}

// Plate rows that hold the tableau: y0 = 120 / 2, y1 = 590 / 2.
export function bandRows() {
	return { y0: STAGE.tableau.y / ART.scale, y1: STAGE.hud.y / ART.scale };
}
