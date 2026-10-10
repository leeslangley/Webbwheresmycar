// Tests for tests/fakectx.js and tests/fakeapp.js under macOS `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, texts, count, lastSet, anySet, reset } from './fakectx.js';
import { makeApp } from './fakeapp.js';

test('recording works', () => {
	const ctx = makeCtx();
	ctx.fillRect(0, 0, 10, 10);
	ctx.fillText('hi', 1, 2);
	eq(count(ctx, 'fillRect'), 1, 'one fillRect call');
	eq(count(ctx, 'fillText'), 1, 'one fillText call');
	eq(texts(ctx), ['hi'], 'texts collects fillText args');
	eq(ctx.calls[0], ['fillRect', [0, 0, 10, 10]], 'call recorded as [name, args]');
	eq(ctx.calls[1], ['fillText', ['hi', 1, 2]], 'fillText args recorded');
});

test('strokeText is also collected by texts', () => {
	const ctx = makeCtx();
	ctx.fillText('a', 0, 0);
	ctx.strokeText('b', 0, 0);
	eq(texts(ctx), ['a', 'b'], 'texts collects fill and stroke text');
});

test('property set is recorded and readable', () => {
	const ctx = makeCtx();
	ctx.fillStyle = 'red';
	eq(lastSet(ctx, 'fillStyle'), 'red', 'lastSet returns assigned value');
	eq(ctx.fillStyle, 'red', 'reading a set property returns its value');
	eq(ctx.calls[0], ['set:fillStyle', ['red']], 'assignment recorded as set:name');
	eq(count(ctx, 'set:fillStyle'), 1, 'set recorded once');
	ok(anySet(ctx, 'fillStyle', 'red'), 'anySet finds the value');
	ok(!anySet(ctx, 'fillStyle', 'blue'), 'anySet rejects other values');
	ok(!anySet(ctx, 'strokeStyle', 'red'), 'anySet rejects other props');
});

test('default props include font', () => {
	const ctx = makeCtx();
	eq(ctx.props.font, '10px sans-serif', 'default font');
	eq(ctx.font, '10px sans-serif', 'font readable through ctx');
});

test('measureText scales with font size', () => {
	const ctx = makeCtx();
	ctx.font = '20px Foo';
	near(ctx.measureText('abcd').width, 48, 0.0001, '20px: 4 * 0.6 * 20');
});

test('measureText default font', () => {
	const ctx = makeCtx();
	near(ctx.measureText('abcd').width, 24, 0.0001, '10px: 4 * 0.6 * 10');
});

test('measureText records the call', () => {
	const ctx = makeCtx();
	ctx.measureText('abcd');
	eq(count(ctx, 'measureText'), 1, 'measureText recorded');
	eq(ctx.calls[0], ['measureText', ['abcd']], 'measureText args recorded');
});

test('measureText handles decimal and odd fonts', () => {
	const ctx = makeCtx();
	ctx.font = '12.5px Bar';
	near(ctx.measureText('ab').width, 15, 0.0001, '12.5px: 2 * 0.6 * 12.5');
	const bare = makeCtx();
	bare.font = 'Foo';
	near(bare.measureText('abcd').width, 24, 0.0001, 'no px in font falls back to 10');
});

test('gradients record stops', () => {
	const ctx = makeCtx();
	const g = ctx.createLinearGradient(0, 0, 10, 0);
	g.addColorStop(0, 'white');
	g.addColorStop(1, 'black');
	eq(g.stops, [[0, 'white'], [1, 'black']], 'linear gradient stops recorded');
	eq(count(ctx, 'createLinearGradient'), 1, 'linear gradient call recorded');
	const r = ctx.createRadialGradient(5, 5, 0, 5, 5, 10);
	r.addColorStop(0.5, 'grey');
	eq(r.stops, [[0.5, 'grey']], 'radial gradient stops recorded');
	eq(count(ctx, 'createRadialGradient'), 1, 'radial gradient call recorded');
});

test('reset empties calls', () => {
	const ctx = makeCtx();
	ctx.fillRect(0, 0, 1, 1);
	ctx.fillStyle = 'red';
	reset(ctx);
	eq(ctx.calls, [], 'calls emptied');
	eq(ctx.fillStyle, 'red', 'property values kept after reset');
	eq(texts(ctx), [], 'no texts after reset');
});

test('makeApp basics and act', () => {
	const state = { day: 1 };
	const app = makeApp(state);
	eq(app.state, state, 'state is kept');
	eq(app.w, 1280, 'w is 1280');
	eq(app.h, 720, 'h is 720');
	eq(app.settings, { crt: false, sound: true, music: true }, 'default settings');
	eq(app.act(() => 'result'), 'result', 'act returns the function result');
	eq(app.hasSave(), false, 'hasSave is false');
});

test('makeApp navigation calls are recorded', () => {
	const app = makeApp({ day: 1 });
	app.go('shop', { x: 1 });
	app.push('detail');
	app.pop();
	eq(app.calls, [['go', 'shop', { x: 1 }], ['push', 'detail', undefined], ['pop']], 'nav calls recorded');
});

test('makeApp toast collects text', () => {
	const app = makeApp({ day: 1 });
	app.toast('sold!');
	app.toast('nice one');
	eq(app.toasts, ['sold!', 'nice one'], 'toasts collected');
	eq(app.calls, [], 'toast does not touch calls');
});

test('makeApp audio play records on app.calls', () => {
	const app = makeApp({ day: 1 });
	app.audio.play('click');
	eq(app.calls, [['play', 'click']], 'play recorded on app.calls');
});

test('makeApp game lifecycle calls are recorded', () => {
	const app = makeApp({ day: 1 });
	app.newGame();
	app.continueGame();
	app.saveSettings();
	eq(app.calls, [['newGame'], ['continueGame'], ['saveSettings']], 'lifecycle calls recorded');
});

done();
