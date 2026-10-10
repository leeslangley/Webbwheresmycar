// Tests for src/ui/kit_hits.js, run under `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { makeHits, ScrollList } from '../src/ui/kit_hits.js';

test('hits: topmost (last added) entry wins when two overlap', () => {
	const hits = makeHits();
	const order = [];
	hits.add('a', 0, 0, 100, 100, () => order.push('a'));
	hits.add('b', 50, 50, 100, 100, () => order.push('b'));
	eq(hits.hit(60, 60).id, 'b', 'last added wins in the overlap');
	eq(hits.hit(10, 10).id, 'a', 'outside the overlap the older entry still hits');
});

test('hits: disabled entries are skipped', () => {
	const hits = makeHits();
	hits.add('off', 0, 0, 100, 100, () => {}, { enabled: false });
	hits.add('on', 0, 0, 100, 100, () => {});
	eq(hits.hit(50, 50).id, 'on', 'disabled entry is skipped, next one hits');
	eq(hits.tap(50, 50), true, 'tap still lands on the enabled entry');
});

test('hits: right and bottom edges are exclusive', () => {
	const hits = makeHits();
	hits.add('a', 10, 10, 50, 50, () => {});
	eq(hits.hit(10, 10).id, 'a', 'left/top edges inclusive');
	eq(hits.hit(59, 30).id, 'a', 'just inside the right edge hits');
	eq(hits.hit(60, 30), null, 'right edge exclusive');
	eq(hits.hit(30, 59).id, 'a', 'just inside the bottom edge hits');
	eq(hits.hit(30, 60), null, 'bottom edge exclusive');
	eq(hits.hit(9, 30), null, 'left of the box misses');
	eq(hits.hit(30, 9), null, 'above the box misses');
});

test('hits: clear empties the same array object', () => {
	const hits = makeHits();
	const list = hits.list;
	hits.add('a', 0, 0, 10, 10, () => {});
	hits.clear();
	eq(list.length, 0, 'the same array object is emptied');
	ok(hits.list === list, 'list identity is preserved');
	eq(hits.hit(5, 5), null, 'nothing hits after clear');
});

test('hits: tap calls onTap exactly once and returns true; a miss returns false', () => {
	const hits = makeHits();
	let calls = 0;
	let got = null;
	hits.add('a', 0, 0, 10, 10, (e) => {
		calls += 1;
		got = e;
	});
	eq(hits.tap(5, 5), true, 'hit returns true');
	eq(calls, 1, 'onTap called exactly once');
	eq(got.id, 'a', 'onTap receives the entry');
	eq(hits.tap(20, 20), false, 'a miss returns false');
	eq(calls, 1, 'onTap not called on a miss');
});

test('hits: tap returns false when onTap is not a function', () => {
	const hits = makeHits();
	hits.add('nope', 0, 0, 10, 10, null);
	eq(hits.hit(5, 5).id, 'nope', 'entry still hits');
	eq(hits.tap(5, 5), false, 'tap returns false without an onTap');
});

test('ScrollList: max and clamped scrolling', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	eq(list.max(), 200, 'max is count * rowH - viewH');
	list.scrollBy(1000);
	eq(list.offset, 200, 'scrollBy clamps to max');
	list.scrollBy(-1000);
	eq(list.offset, 0, 'scrollBy clamps to 0');
});

test('ScrollList: setCount clamps offset and max', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	list.scrollBy(150);
	list.setCount(4);
	eq(list.max(), 0, 'setCount(4) makes max 0');
	eq(list.offset, 0, 'offset clamped to 0');
});

test('ScrollList: rowAt', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	eq(list.rowAt(10), 0, 'rowAt(10) is 0 at offset 0');
	eq(list.rowAt(60), 1, 'rowAt(60) is 1 at offset 0');
	list.scrollBy(100);
	eq(list.rowAt(10), 2, 'at offset 100 rowAt(10) is 2');
	eq(list.rowAt(-1), -1, 'above the view is -1');
	eq(list.rowAt(300), -1, 'at the view bottom edge is -1');
});

test('ScrollList: visibleRange', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	eq(list.visibleRange(), { first: 0, last: 5 }, 'offset 0 shows rows 0-5');
	list.scrollBy(100);
	eq(list.visibleRange(), { first: 2, last: 7 }, 'offset 100 shows rows 2-7');
	list.scrollBy(100);
	eq(list.visibleRange(), { first: 4, last: 9 }, 'offset 200 shows rows 4-9');
});

test('ScrollList: a 5px drag is a tap and does not scroll', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	list.scrollBy(40);
	list.beginDrag(200, 0);
	list.dragTo(195, 50);
	const res = list.endDrag();
	eq(res.tapped, true, 'small movement counts as a tap');
	eq(list.offset, 40, 'offset unchanged by a tap');
});

test('ScrollList: a 60px upward drag scrolls 60 and is not a tap', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	list.beginDrag(200, 0);
	list.dragTo(140, 100);
	eq(list.offset, 60, 'offset moved by 60');
	eq(list.endDrag().tapped, false, 'a real drag is not a tap');
});

test('ScrollList: fling decays to rest and never leaves 0..max', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	list.beginDrag(200, 0);
	list.dragTo(140, 100);
	eq(list.endDrag().tapped, false, 'drag releases with velocity');
	let moved = false;
	for (let i = 0; i < 400; i++) {
		const before = list.offset;
		list.update(16);
		if (list.offset !== before) moved = true;
		ok(list.offset >= 0 && list.offset <= list.max(), 'offset stays within 0..max');
	}
	ok(moved, 'the fling kept scrolling after release');
	eq(list.vel, 0, 'vel returns to 0 after repeated updates');
	eq(list.dragging, false, 'no longer dragging');
});

test('ScrollList: update does not coast while dragging', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	list.beginDrag(200, 0);
	list.dragTo(140, 100);
	const at = list.offset;
	list.update(16);
	eq(list.offset, at, 'no fling movement mid-drag');
	list.endDrag();
});

test('ScrollList: zero rows gives an empty visible range', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 0 });
	eq(list.visibleRange(), { first: 0, last: -1 }, 'count 0 range');
	eq(list.max(), 0, 'count 0 max');
	eq(list.rowAt(10), -1, 'count 0 rowAt');
});

test('ScrollList: near returns sane numbers for a short fling', () => {
	const list = new ScrollList({ viewH: 300, rowH: 50, count: 10 });
	list.beginDrag(200, 0);
	list.dragTo(140, 100);
	list.endDrag();
	near(list.vel, 0.6, 0.0001, 'vel is pixels per ms');
});

done();
