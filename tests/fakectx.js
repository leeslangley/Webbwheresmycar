// Recording fake 2D canvas context for tests run under macOS `jsc -m`.
// No real canvas: every method call and property assignment is recorded so
// UI code can be exercised without a browser. See DESIGN.md 9.7.

// Extracts the first integer or decimal followed by 'px' from a CSS font
// string, e.g. '20px Foo' -> 20. Falls back to 10 when nothing matches.
function pxOf(font) {
	const m = String(font).match(/(\d+(?:\.\d+)?)px/);
	return m ? parseFloat(m[1]) : 10;
}

// A gradient stub that only remembers its colour stops.
function makeGradient(name, args, calls) {
	calls.push([name, args]);
	return {
		stops: [],
		addColorStop: function (o, c) {
			this.stops.push([o, c]);
		},
	};
}

export function makeCtx() {
	const target = {
		calls: [],
		props: { font: '10px sans-serif' },
	};
	return new Proxy(target, {
		get(t, name) {
			if (name === 'calls' || name === 'props') {
				return t[name];
			}
			if (name === 'measureText') {
				return function (text) {
					t.calls.push(['measureText', [text]]);
					return { width: String(text).length * 0.6 * pxOf(t.props.font) };
				};
			}
			if (name === 'createLinearGradient' || name === 'createRadialGradient') {
				return function () {
					const args = Array.prototype.slice.call(arguments);
					return makeGradient(name, args, t.calls);
				};
			}
			if (name in t.props) {
				return t.props[name];
			}
			return function () {
				const args = Array.prototype.slice.call(arguments);
				t.calls.push([name, args]);
				return undefined;
			};
		},
		set(t, name, v) {
			t.props[name] = v;
			t.calls.push(['set:' + name, [v]]);
			return true;
		},
	});
}

// First argument of every fillText and strokeText call, in order.
export function texts(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		const name = ctx.calls[i][0];
		if (name === 'fillText' || name === 'strokeText') {
			out.push(ctx.calls[i][1][0]);
		}
	}
	return out;
}

// Number of recorded calls with the given method name.
export function count(ctx, name) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			n += 1;
		}
	}
	return n;
}

// Last value assigned to prop via the ctx, or undefined if never assigned.
export function lastSet(ctx, prop) {
	let v;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:' + prop) {
			v = ctx.calls[i][1][0];
		}
	}
	return v;
}

// True if prop was ever assigned value via the ctx.
export function anySet(ctx, prop, value) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'set:' + prop && c[1][0] === value) {
			return true;
		}
	}
	return false;
}

// Empty the call log (property values are kept).
export function reset(ctx) {
	ctx.calls.length = 0;
}
