// Pure hit-testing and scroll-list logic (no drawing, no DOM).
// See DESIGN.md section 9.7: ui/kit_hits.js.

// Tap areas: a flat list of rectangles scanned back-to-front, so the
// entry added last (drawn on top) wins when two overlap.
export function makeHits() {
	const hits = {
		list: [],
		add(id, x, y, w, h, onTap, opts = {}) {
			const entry = { id, x, y, w, h, onTap, enabled: opts.enabled !== false };
			hits.list.push(entry);
			return entry;
		},
		clear() {
			hits.list.length = 0;
		},
		hit(x, y) {
			for (let i = hits.list.length - 1; i >= 0; i--) {
				const e = hits.list[i];
				if (!e.enabled) continue;
				if (x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h) return e;
			}
			return null;
		},
		tap(x, y) {
			const e = hits.hit(x, y);
			if (e && typeof e.onTap === 'function') {
				e.onTap(e);
				return true;
			}
			return false;
		},
	};
	return hits;
}

// Pure scrolling model for a list of `count` rows of `rowH` pixels in a
// view `viewH` tall. Drag up to scroll down (offset grows); release with
// velocity for a fling that decays exponentially.
export class ScrollList {
	constructor(opts) {
		this.viewH = opts.viewH;
		this.rowH = opts.rowH;
		this.count = opts.count;
		this.offset = 0;
		this.vel = 0;
		this.dragging = false;
		this.startY = 0;
		this.lastY = 0;
		this.lastT = 0;
	}

	max() {
		return Math.max(0, this.count * this.rowH - this.viewH);
	}

	setCount(n) {
		this.count = n;
		this.offset = clamp(this.offset, 0, this.max());
	}

	scrollBy(dy) {
		this.offset = clamp(this.offset + dy, 0, this.max());
	}

	beginDrag(y, nowMs) {
		this.startY = y;
		this.lastY = y;
		this.lastT = nowMs;
		this.dragging = false;
		this.vel = 0;
	}

	dragTo(y, nowMs) {
		if (Math.abs(y - this.startY) > 8) this.dragging = true;
		if (!this.dragging) return;
		this.scrollBy(this.lastY - y);
		this.vel = (this.lastY - y) / Math.max(1, nowMs - this.lastT);
		this.lastY = y;
		this.lastT = nowMs;
	}

	endDrag() {
		const tapped = !this.dragging;
		// Keep vel for a fling only when the gesture was a real drag.
		if (tapped) this.vel = 0;
		this.dragging = false;
		return { tapped };
	}

	update(dtMs) {
		if (this.dragging) return;
		if (Math.abs(this.vel) <= 0.01) {
			this.vel = 0;
			return;
		}
		this.scrollBy(this.vel * dtMs);
		this.vel *= Math.pow(0.95, dtMs / 16);
		if (this.offset <= 0 || this.offset >= this.max()) this.vel = 0;
		if (Math.abs(this.vel) <= 0.01) this.vel = 0;
	}

	// Index of the row under a y coordinate local to the view, or -1.
	rowAt(localY) {
		if (localY < 0 || localY >= this.viewH) return -1;
		const idx = Math.floor((localY + this.offset) / this.rowH);
		if (idx < 0 || idx >= this.count) return -1;
		return idx;
	}

	// Inclusive range of row indices overlapping the view.
	visibleRange() {
		if (this.count === 0) return { first: 0, last: -1 };
		const first = Math.floor(this.offset / this.rowH);
		const last = Math.min(this.count - 1, Math.ceil((this.offset + this.viewH) / this.rowH) - 1);
		return { first, last };
	}
}

function clamp(x, lo, hi) {
	return x < lo ? lo : x > hi ? hi : x;
}
