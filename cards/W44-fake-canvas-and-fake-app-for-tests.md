[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W44 Fake canvas and fake app for tests

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W44
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Test helpers so UI code can be tested without a browser: a recording fake 2D canvas context and a fake app object.

## Read first
- docs/DESIGN.md section 9.5 and 9.7
- tests/harness.js

## Files you may change (and nothing else)
- `tests/fakectx.js`
- `tests/fakeapp.js`
- `tests/fakectx.test.mjs`

## Steps
1. Create `tests/fakectx.js` exporting `makeCtx()`. It returns a `Proxy` over an object `{calls: [], props: {font: '10px sans-serif'}}`. Reading `ctx.calls` and `ctx.props` returns those. Reading any property named in `props` returns its stored value. Reading any other name returns a function that pushes `[name, args]` onto `calls` and returns `undefined`, EXCEPT these special functions: `measureText(text)` (records the call, returns `{width: String(text).length * 0.6 * pxOf(ctx.props.font)}` where `pxOf` extracts the first integer or decimal followed by `px` from the font string, default 10); `createLinearGradient(...)` and `createRadialGradient(...)` (record the call, return `{stops: [], addColorStop(o, c) { this.stops.push([o, c]); }}`); `getContext` is not needed. Assigning a property (`ctx.fillStyle = v`) stores it in `props` AND pushes `['set:' + name, [v]]` onto `calls`.
2. Also export `texts(ctx)` (array of the first argument of every `fillText` and `strokeText` call), `count(ctx, name)` (number of calls with that name), `lastSet(ctx, prop)` (the last value assigned to `prop`, or undefined), `anySet(ctx, prop, value)` (true if `prop` was ever assigned `value`) and `reset(ctx)` (empties `calls`).
3. Create `tests/fakeapp.js` exporting `makeApp(state)`: returns `{state, w: 1280, h: 720, now: 0, settings: {crt: false, sound: true, music: true}, calls: [], toasts: [], act(fn) { return fn(); }, go(id, p) { this.calls.push(['go', id, p]); }, push(id, p) { this.calls.push(['push', id, p]); }, pop() { this.calls.push(['pop']); }, toast(t) { this.toasts.push(t); }, audio: {play: (n) => app.calls.push(['play', n])}, hasSave() { return false; }, newGame() { this.calls.push(['newGame']); }, continueGame() { this.calls.push(['continueGame']); }, saveSettings() { this.calls.push(['saveSettings']); }}` (build it so `audio.play` closes over the same object; use a local `const app = {...}; return app;`).
4. Write `tests/fakectx.test.mjs`: recording works (`fillRect` then `fillText('hi',1,2)` -> `count(ctx,'fillRect') === 1`, `texts(ctx)` equals `['hi']`); property set is recorded and readable (`ctx.fillStyle = 'red'` then `lastSet(ctx,'fillStyle') === 'red'` and `ctx.fillStyle === 'red'`); `ctx.font = '20px Foo'` then `measureText('abcd').width` is 48 (use `near`); default font gives `measureText('abcd').width` of 24; gradient has addColorStop and records stops; `reset` empties calls; `makeApp` act returns the function result and go/push/pop record calls; `toast` collects text; `audio.play('click')` records `['play','click']`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not create any file under src/.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W44: Fake canvas and fake app for tests`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
