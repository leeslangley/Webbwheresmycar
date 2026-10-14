// Canvas fit and pointer mapping (DESIGN.md 3, 9.7): the logical canvas is
// 720 high and 1280..1568 wide (the window's aspect at height 720, capped).
// A 1280x720 STAGE sits in the middle of it and holds every control and all
// text; the strips either side (stage x < 0 and x > 1280) show background art
// only. Screen pointers are converted to STAGE coordinates. 16:9 and narrower
// windows get the old 1280x720 letterbox. Pure apart from applyLayout, which
// touches only the canvas passed in.

export const LOGICAL_W = 1280;   // stage width: every scene LAYOUT is in these units (name kept so old imports still work)
export const LOGICAL_H = 720;
export const STAGE_W = 1280;
export const FULL_W_MAX = 1568;  // widest canvas: 19.5:9 phones; (1568 - 1280) / 2 = 144 px strip each side
export const BLEED_MAX = 144;
const SNAP_PX = 16;              // less than this much extra width is not worth a strip

function checkWin(winW, winH) {
	if (typeof winW !== 'number' || typeof winH !== 'number' || winW <= 0 || winH <= 0) {
		throw new RangeError('winW and winH must both be positive numbers, got ' + winW + 'x' + winH);
	}
}

// Canvas width in logical px: 1280 for 16:9 and narrower windows, else the window aspect at height 720
// rounded UP to a multiple of 4 (so the stage offset is an even number), at most 1568.
// Why these numbers: raw = 720 * winW / winH is the canvas width that fills the window at full height.
// Under 1296 (1280 + SNAP_PX) the window is 16:9 or narrower, so the old fit is used. Otherwise
// scale = winH / 720 and fullW is rounded UP to a multiple of 4 (stageX = (fullW - 1280) / 2 is then a
// whole number of 2 px art pixels) and capped at 1568 (iPhone 16 Pro 874x402 needs 1565.4; iPhone 15 Pro
// 852x393 needs 1560.9). Rounding up means the canvas overhangs the window by under 2 CSS px each side.
export function fullWidthFor(winW, winH) {
	checkWin(winW, winH);
	const raw = LOGICAL_H * winW / winH;
	if (raw < STAGE_W + SNAP_PX) {
		return STAGE_W;
	}
	return Math.min(FULL_W_MAX, 4 * Math.ceil(raw / 4 - 1e-9));
}

// fitLayout(winW, winH) -> {scale, offX, offY, viewW, viewH, fullW, fullH, stageX, stageW}.
// viewW x viewH is the whole canvas in CSS px. offX may be slightly negative (the canvas overhangs the
// window by a pixel or two, only strip art is cropped) or positive (thin bars when the window is wider than 1568:720).
export function fitLayout(winW, winH) {
	const fullW = fullWidthFor(winW, winH);
	const scale = fullW === STAGE_W ? Math.min(winW / STAGE_W, winH / LOGICAL_H) : winH / LOGICAL_H;
	const viewW = fullW * scale;
	const viewH = LOGICAL_H * scale;
	return {
		scale: scale, offX: (winW - viewW) / 2, offY: (winH - viewH) / 2, viewW: viewW, viewH: viewH,
		fullW: fullW, fullH: LOGICAL_H, stageX: (fullW - STAGE_W) / 2, stageW: STAGE_W,
	};
}

// toFull(layout, clientX, clientY) -> {x, y} in CANVAS coordinates (0..fullW), or null outside the canvas.
export function toFull(layout, clientX, clientY) {
	const x = (clientX - layout.offX) / layout.scale;
	const y = (clientY - layout.offY) / layout.scale;
	if (x < 0 || x > layout.fullW || y < 0 || y > LOGICAL_H) {
		return null;
	}
	return { x: x, y: y };
}

// toLogical(layout, clientX, clientY) -> {x, y} in STAGE coordinates (x is negative in the left strip and
// above 1280 in the right strip), or null outside the canvas (bars).
export function toLogical(layout, clientX, clientY) {
	const p = toFull(layout, clientX, clientY);
	return p === null ? null : { x: p.x - layout.stageX, y: p.y };
}

// isPortrait(winW, winH) -> true when the window is taller than it is wide
// (show the "turn your phone sideways" card).
export function isPortrait(winW, winH) {
	return winH > winW;
}

// applyLayout(canvas, win) -> {layout, dpr, ctx}. Sizes the canvas element
// for the given window (win = {innerWidth, innerHeight, devicePixelRatio}),
// backing it at device resolution and scaling the context so scene code can
// keep drawing in 1280x720 logical coordinates.
export function applyLayout(canvas, win) {
	const layout = fitLayout(win.innerWidth, win.innerHeight);
	const dpr = Math.min(3, win.devicePixelRatio || 1);
	canvas.style.position = 'absolute';
	canvas.style.left = layout.offX + 'px';
	canvas.style.top = layout.offY + 'px';
	canvas.style.width = layout.viewW + 'px';
	canvas.style.height = layout.viewH + 'px';
	canvas.width = Math.round(layout.viewW * dpr);
	canvas.height = Math.round(layout.viewH * dpr);
	const ctx = canvas.getContext('2d');
	ctx.setTransform(layout.scale * dpr, 0, 0, layout.scale * dpr, 0, 0);
	return { layout: layout, dpr: dpr, ctx: ctx };
}
