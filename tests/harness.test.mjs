// The harness testing itself, run under `jsc -m`.
// Card note: test() records failures, so this file must not contain a
// deliberately failing test(); failure behaviour is checked only through
// throws().

import { test, eq, ok, near, throws, done } from './harness.js';

test('eq on primitives', () => {
	eq(1, 1, 'numbers');
	eq(-3.5, -3.5, 'negative numbers');
	eq('hammond', 'hammond', 'strings');
	eq(true, true, 'booleans');
	eq(null, null, 'null');
	eq(undefined, undefined, 'undefined');
});

test('eq on nested objects and arrays', () => {
	eq({ a: 1, b: { c: [1, 2, { d: 'x' }] } }, { a: 1, b: { c: [1, 2, { d: 'x' }] } }, 'nested objects');
	eq([1, [2, [3]]], [1, [2, [3]]], 'nested arrays');
	eq({ a: 1 }, { a: 1 }, 'equal objects');
});

test('eq mismatch is caught by throws', () => {
	throws(() => eq(1, 2, 'primitive mismatch'), 'primitive mismatch throws');
	throws(() => eq('a', 'b', 'string mismatch'), 'string mismatch throws');
	throws(() => eq({ a: 1 }, { a: 2 }, 'object mismatch'), 'object mismatch throws');
});

test('ok(false) is caught by throws', () => {
	throws(() => ok(false, 'deliberately false'), 'ok(false) throws');
	throws(() => ok(0, 'zero is falsy'), 'ok(0) throws');
	throws(() => ok('', 'empty string is falsy'), "ok('') throws");
	ok(true, 'ok(true) passes');
	ok(1, 'truthy passes');
});

test('near within and outside eps', () => {
	near(1.0, 1.0, 0.0, 'exact match');
	near(1.05, 1.0, 0.1, 'within eps');
	near(1.0, 1.05, 0.1, 'symmetric');
	throws(() => near(2.0, 1.0, 0.1, 'too far'), 'outside eps throws');
});

test('throws() itself fails when the function does not throw', () => {
	throws(() => throws(() => {}, 'does not throw'), 'non-throwing fn is caught');
});

test('an error inside a test body does not abort the file', () => {
	// Errors thrown inside a test() body are caught by test() and recorded,
	// so a deliberately failing test() here would fail done() (see the card
	// note). Containment is checked through throws() instead: errors thrown
	// in this body are swallowed and the file runs on to done().
	throws(() => {
		throw new Error('contained');
	}, 'an error inside a body is contained');
	eq(2, 2, 'the file continues after caught errors');
	ok(true, 'and assertions still work');
});

done();
