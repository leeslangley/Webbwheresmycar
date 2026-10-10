// Canvas fit and pointer mapping (DESIGN.md 3, 9.7): scale the fixed
// 1280x720 logical canvas to any window with letterbox bars, and convert
// screen pointer coordinates back to logical game coordinates.
// Pure apart from applyLayout, which touches only the canvas passed in.

export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

// fitLayout(winW, winH) -> {scale, offX, offY, viewW, viewH}. The game view
// is the largest 16:9 rectangle that fits, centred with letterbox offsets.
export function fitLayout(winW, winH) {
	if (typeof winW !== 'number' || typeof winH !== 'number' || winW <= 0 || winH <= 0) {
		throw new RangeError('winW and winH must both be positive numbers, got ' + winW + 'x' + winH);
	}
	const scale = Math.min(winW / LOGICAL_W, winH / LOGICAL_H);
	const viewW = LOGICAL_W * scale;
	const viewH = LOGICAL_H * scale;
	const offX = (winW - viewW) / 2;
	const offY = (winH - viewH) / 2;
	return { scale: scale, offX: offX, offY: offY, viewW: viewW, viewH: viewH };
}

// toLogical(layout, clientX, clientY) -> {x, y} in game coordinates, or
// null when the point falls outside the game rectangle (in a letterbox bar).
export function toLogical(layout, clientX, clientY) {
	const x = (clientX - layout.offX) / layout.scale;
	const y = (clientY - layout.offY) / layout.scale;
	if (x < 0 || x > LOGICAL_W || y < 0 || y > LOGICAL_H) {
		return null;
	}
	return { x: x, y: y };
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
