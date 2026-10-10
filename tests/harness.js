// Minimal assertion harness for tests run under macOS `jsc -m`.
// There is no `console` in jsc: output goes through `print()`.
// Assertions called outside test() simply throw; test() catches, counts
// and remembers failures, and done() reports the verdict.

let passed = 0;
let failed = 0;
let failures = [];

export function test(name, fn) {
	try {
		fn();
		passed += 1;
	} catch (e) {
		failed += 1;
		failures.push({ name: name, message: e && e.message ? e.message : String(e) });
	}
}

function isObj(x) {
	return x !== null && typeof x === 'object';
}

export function eq(actual, expected, msg) {
	let good;
	if (isObj(actual) && isObj(expected)) {
		good = JSON.stringify(actual) === JSON.stringify(expected);
	} else {
		good = actual === expected;
	}
	if (!good) {
		throw new Error('eq failed: ' + msg + ' expected ' + JSON.stringify(expected) + ' got ' + JSON.stringify(actual));
	}
}

export function ok(cond, msg) {
	if (!cond) {
		throw new Error('ok failed: ' + msg);
	}
}

export function near(actual, expected, eps, msg) {
	if (!(Math.abs(actual - expected) <= eps)) {
		throw new Error('near failed: ' + msg + ' expected ' + expected + ' +/- ' + eps + ' got ' + actual);
	}
}

export function throws(fn, msg) {
	let threw = false;
	try {
		fn();
	} catch (e) {
		threw = true;
	}
	if (!threw) {
		throw new Error('throws failed: ' + msg);
	}
}

export function done() {
	if (failed === 0) {
		print('ok ' + passed + ' tests');
		return;
	}
	for (let i = 0; i < failures.length; i++) {
		print('FAIL ' + failures[i].name + ': ' + failures[i].message);
	}
	throw new Error(failed + ' test(s) failed');
}
