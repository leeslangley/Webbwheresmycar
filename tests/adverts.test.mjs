// Tests for the advertising media data, run under `jsc -m`.

import { ADVERTS, ADVERT_BY_ID } from '../src/data/adverts.js';
import { test, eq, ok, near, done } from './harness.js';

test('ADVERTS has exactly 7 media in the stated order', () => {
	ok(Array.isArray(ADVERTS), 'ADVERTS is an array');
	eq(ADVERTS.map(function (m) { return m.id; }), [
		'paper', 'internet', 'magazine', 'youtube', 'radio', 'billboard', 'tv'
	], 'ids in order');
});

test('media names match the design table exactly', () => {
	const names = ADVERTS.map(function (m) { return m.name; });
	eq(names, [
		'Parish Pump Gazette',
		'Webb-Book banner ads',
		'Classic & Sporty Wheels',
		'WheelTube video',
		'Radio Gaga FM',
		'A-road billboard',
		'Channel Fore TV spot'
	], 'names in order');
});

test('costs are exactly 150, 300, 600, 800, 900, 1500, 4000', () => {
	eq(ADVERTS.map(function (m) { return m.cost; }),
		[150, 300, 600, 800, 900, 1500, 4000], 'costs in order');
});

test('every medium has the right keys and shape', () => {
	for (let i = 0; i < ADVERTS.length; i++) {
		const m = ADVERTS[i];
		eq(Object.keys(m).length, 5, 'medium ' + m.id + ' has 5 keys');
		ok(Object.prototype.hasOwnProperty.call(m, 'id'), 'medium ' + m.id + ' has id');
		ok(Object.prototype.hasOwnProperty.call(m, 'name'), 'medium ' + m.id + ' has name');
		ok(Object.prototype.hasOwnProperty.call(m, 'cost'), 'medium ' + m.id + ' has cost');
		ok(Object.prototype.hasOwnProperty.call(m, 'blurb'), 'medium ' + m.id + ' has blurb');
		ok(Object.prototype.hasOwnProperty.call(m, 'outcomes'), 'medium ' + m.id + ' has outcomes');
		eq(typeof m.blurb, 'string', 'medium ' + m.id + ' blurb is a string');
		ok(m.blurb.length > 0, 'medium ' + m.id + ' blurb is non-empty');
		ok(Array.isArray(m.outcomes), 'medium ' + m.id + ' outcomes is an array');
		for (let j = 0; j < m.outcomes.length; j++) {
			const o = m.outcomes[j];
			eq(Object.keys(o).length, 5, 'outcome ' + m.id + '.' + o.id + ' has 5 keys');
			eq(typeof o.id, 'string', 'outcome id is a string');
			ok(Number.isInteger(o.w), 'outcome ' + m.id + '.' + o.id + ' w is an integer');
			ok(Number.isInteger(o.buzz), 'outcome ' + m.id + '.' + o.id + ' buzz is an integer');
			ok(Number.isInteger(o.rep), 'outcome ' + m.id + '.' + o.id + ' rep is an integer');
			ok(Array.isArray(o.texts), 'outcome ' + m.id + '.' + o.id + ' texts is an array');
		}
	}
});

test('every medium has outcome weights summing to exactly 100', () => {
	for (let i = 0; i < ADVERTS.length; i++) {
		const m = ADVERTS[i];
		let sum = 0;
		for (let j = 0; j < m.outcomes.length; j++) {
			sum += m.outcomes[j].w;
		}
		eq(sum, 100, 'medium ' + m.id + ' weights sum');
	}
});

test('tv has exactly 4 outcomes', () => {
	eq(ADVERT_BY_ID.tv.outcomes.length, 4, 'tv outcome count');
});

test('outcome ids per medium match the design table', () => {
	eq(ADVERT_BY_ID.paper.outcomes.map(function (o) { return o.id; }),
		['flop', 'ok', 'good'], 'paper');
	eq(ADVERT_BY_ID.internet.outcomes.map(function (o) { return o.id; }),
		['flop', 'ok', 'good', 'viral'], 'internet');
	eq(ADVERT_BY_ID.magazine.outcomes.map(function (o) { return o.id; }),
		['flop', 'ok', 'good', 'great'], 'magazine');
	eq(ADVERT_BY_ID.youtube.outcomes.map(function (o) { return o.id; }),
		['cringe', 'ok', 'good', 'viral'], 'youtube');
	eq(ADVERT_BY_ID.radio.outcomes.map(function (o) { return o.id; }),
		['flop', 'ok', 'good', 'great'], 'radio');
	eq(ADVERT_BY_ID.billboard.outcomes.map(function (o) { return o.id; }),
		['flop', 'ok', 'good'], 'billboard');
	eq(ADVERT_BY_ID.tv.outcomes.map(function (o) { return o.id; }),
		['flop', 'ok', 'good', 'great'], 'tv');
});

test('every outcome has exactly 2 non-empty text strings', () => {
	for (let i = 0; i < ADVERTS.length; i++) {
		const m = ADVERTS[i];
		for (let j = 0; j < m.outcomes.length; j++) {
			const o = m.outcomes[j];
			eq(o.texts.length, 2, 'outcome ' + m.id + '.' + o.id + ' has 2 texts');
			for (let k = 0; k < o.texts.length; k++) {
				eq(typeof o.texts[k], 'string', 'outcome ' + m.id + '.' + o.id + ' text ' + k + ' is a string');
				ok(o.texts[k].length > 0, 'outcome ' + m.id + '.' + o.id + ' text ' + k + ' is non-empty');
			}
			ok(o.texts[0] !== o.texts[1], 'outcome ' + m.id + '.' + o.id + ' has two different texts');
		}
	}
});

test('all texts across every medium are unique', () => {
	const seen = {};
	for (let i = 0; i < ADVERTS.length; i++) {
		const m = ADVERTS[i];
		for (let j = 0; j < m.outcomes.length; j++) {
			const o = m.outcomes[j];
			for (let k = 0; k < o.texts.length; k++) {
				const t = o.texts[k];
				ok(!seen[t], 'text is unique: "' + t + '"');
				seen[t] = true;
			}
		}
	}
});

test('expected buzz of tv is 54.5 (within 0.01)', () => {
	const tv = ADVERT_BY_ID.tv;
	let expected = 0;
	for (let i = 0; i < tv.outcomes.length; i++) {
		expected += tv.outcomes[i].w * tv.outcomes[i].buzz;
	}
	expected /= 100;
	near(expected, 54.5, 0.01, 'tv expected buzz');
});

test('youtube cringe has rep -3 and buzz 0; viral has buzz 80', () => {
	const youtube = ADVERT_BY_ID.youtube;
	const byId = {};
	for (let i = 0; i < youtube.outcomes.length; i++) {
		byId[youtube.outcomes[i].id] = youtube.outcomes[i];
	}
	eq(byId.cringe.rep, -3, 'youtube cringe rep');
	eq(byId.cringe.buzz, 0, 'youtube cringe buzz');
	eq(byId.viral.buzz, 80, 'youtube viral buzz');
});

test('every buzz is between 0 and 100', () => {
	for (let i = 0; i < ADVERTS.length; i++) {
		const m = ADVERTS[i];
		for (let j = 0; j < m.outcomes.length; j++) {
			const o = m.outcomes[j];
			ok(o.buzz >= 0 && o.buzz <= 100, 'buzz in 0-100 for ' + m.id + '.' + o.id);
		}
	}
});

test('ADVERT_BY_ID maps all 7 ids and nothing else', () => {
	eq(Object.keys(ADVERT_BY_ID).length, 7, 'ADVERT_BY_ID has 7 keys');
	for (let i = 0; i < ADVERTS.length; i++) {
		const m = ADVERTS[i];
		ok(Object.prototype.hasOwnProperty.call(ADVERT_BY_ID, m.id), 'has ' + m.id);
		eq(ADVERT_BY_ID[m.id], m, 'ADVERT_BY_ID.' + m.id + ' is the same object');
	}
});

done();
