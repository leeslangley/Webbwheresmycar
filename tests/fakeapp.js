// Recording fake app object for scene tests run under macOS `jsc -m`.
// Mirrors the app contract in DESIGN.md 9.5/9.7: navigation, toasts, audio
// and settings are all stubbed; every call is recorded for assertions.

export function makeApp(state) {
	const app = {
		state: state,
		w: 1280,
		h: 720,
		now: 0,
		settings: { crt: false, sound: true, music: true },
		calls: [],
		toasts: [],
		act: function (fn) {
			return fn();
		},
		go: function (id, p) {
			this.calls.push(['go', id, p]);
		},
		push: function (id, p) {
			this.calls.push(['push', id, p]);
		},
		pop: function () {
			this.calls.push(['pop']);
		},
		toast: function (t) {
			this.toasts.push(t);
		},
		audio: {
			play: function (n) {
				app.calls.push(['play', n]);
			},
		},
		hasSave: function () {
			return false;
		},
		newGame: function () {
			this.calls.push(['newGame']);
		},
		continueGame: function () {
			this.calls.push(['continueGame']);
		},
		saveSettings: function () {
			this.calls.push(['saveSettings']);
		},
	};
	return app;
}
