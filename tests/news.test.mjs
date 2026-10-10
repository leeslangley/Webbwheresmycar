// Tests for the headline chooser, run under `jsc -m`.

import { chooseHeadline } from '../src/sim/news.js';
import { newGameState } from '../src/core/state.js';
import { test, eq, ok, done } from './harness.js';

test('60 calls never repeat a headline within the last 20 returned', () => {
	const state = newGameState(7);
	const out = [];
	for (let i = 0; i < 60; i++) {
		const text = chooseHeadline(state);
		for (let j = 0; j < out.length && j < 20; j++) {
			ok(out[out.length - 1 - j] !== text,
				'call ' + i + ' repeated headline from ' + (j + 1) + ' calls ago: ' + text);
		}
		out.push(text);
	}
});

test('headlines never exceeds 30 entries and newest is first', () => {
	const state = newGameState(8);
	for (let i = 0; i < 60; i++) {
		const text = chooseHeadline(state);
		ok(state.headlines.length <= 30, 'headlines grew to ' + state.headlines.length);
		eq(state.headlines[0], text, 'newest headline must be first');
	}
	eq(state.headlines.length, 30, 'capped at exactly 30 after 60 calls');
});

test('same seed gives the same sequence', () => {
	const a = newGameState(123);
	const b = newGameState(123);
	for (let i = 0; i < 40; i++) {
		eq(chooseHeadline(a), chooseHeadline(b), 'call ' + i + ' must match');
	}
});

test('broke situation with cash 512 reacts often and never leaves placeholders', () => {
	const state = newGameState(2);
	let reacted = 0;
	for (let i = 0; i < 200; i++) {
		const text = chooseHeadline(state, ['broke'], { cash: 512 });
		if (text.indexOf('£512') !== -1) {
			reacted++;
		}
		ok(text.indexOf('{') === -1, 'unfilled placeholder in: ' + text);
	}
	ok(reacted >= 80, 'expected at least 80 reactive picks, got ' + reacted);
});

test('unknown situation zzz behaves like no situation', () => {
	const a = newGameState(5);
	const b = newGameState(5);
	for (let i = 0; i < 40; i++) {
		eq(chooseHeadline(a, ['zzz']), chooseHeadline(b, []), 'call ' + i + ' must match');
	}
});

test('breakdown with ctx car fills Mini Cooker at least once in 200 calls', () => {
	const state = newGameState(4);
	let filled = 0;
	for (let i = 0; i < 200; i++) {
		const text = chooseHeadline(state, ['breakdown'], { car: 'Mini Cooker' });
		if (text.indexOf('Mini Cooker') !== -1) {
			filled++;
		}
	}
	ok(filled >= 1, 'no headline mentioned the Mini Cooker in 200 calls');
});

test('breakdown with empty ctx leaves no placeholders', () => {
	const state = newGameState(6);
	for (let i = 0; i < 200; i++) {
		const text = chooseHeadline(state, ['breakdown'], {});
		ok(text.indexOf('{') === -1, 'unfilled placeholder in: ' + text);
	}
});

test('call with only the state works and records the headline', () => {
	const state = newGameState(9);
	const text = chooseHeadline(state);
	eq(state.headlines[0], text, 'headline recorded first');
	ok(text.indexOf('{') === -1, 'no placeholder with no ctx');
});

test('odd arguments behave like no situation and no ctx', () => {
	const state = newGameState(10);
	for (let i = 0; i < 30; i++) {
		const text = chooseHeadline(state, null, null);
		ok(text.indexOf('{') === -1, 'unfilled placeholder in: ' + text);
	}
	for (let i = 0; i < 30; i++) {
		const text = chooseHeadline(state, 'notanarray', undefined);
		ok(text.indexOf('{') === -1, 'unfilled placeholder in: ' + text);
	}
	const last = chooseHeadline(state, [], {});
	eq(state.headlines[0], last, 'still recording');
});

test('a state without a headlines array is repaired, not broken', () => {
	const state = newGameState(10);
	delete state.headlines;
	const text = chooseHeadline(state);
	eq(state.headlines.length, 1, 'exactly one headline recorded');
	eq(state.headlines[0], text, 'recorded headline matches return');
});

done();
