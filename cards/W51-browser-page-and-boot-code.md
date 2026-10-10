[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W51 Browser page and boot code

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W51
Needs (already merged into `dev`): W42, W43, W47
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The web page that hosts the game, and the boot code that connects the canvas, the pointer/keyboard events and the draw loop to the app. Works on desktop and iPhone.

## Read first
- docs/DESIGN.md section 1, 3, 9.5, 9.7
- src/ui/canvas.js, src/ui/scenes.js, src/ui/theme.js

## Files you may change (and nothing else)
- `index.html`
- `src/boot.js`
- `src/main.js`
- `tests/boot.test.mjs`

## Steps
1. Create `index.html`: HTML5 doctype, `lang="en-GB"`, meta charset, meta viewport `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`, `apple-mobile-web-app-capable` yes, `apple-mobile-web-app-status-bar-style` black-translucent, `apple-mobile-web-app-title` 'Webb Wheels', `theme-color` #14102a, `<title>Webb, where's my car?</title>`. A `<style>` block: `@font-face` for 'Press Start 2P' (`assets/fonts/PressStart2P-Regular.ttf`) and 'VT323' (`assets/fonts/VT323-Regular.ttf`) with `font-display: block`; `html, body {margin:0; height:100%; background:#000; overflow:hidden; touch-action:none; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;}`; `canvas {display:block; touch-action:none;}`; a `#rotate` overlay (full screen, ink background, cream text 'TURN YOUR PHONE SIDEWAYS', hidden by default, shown by `@media (orientation: portrait) and (max-width: 900px)`). Body: `<canvas id="game"></canvas>`, `<div id="rotate">...</div>`, `<script type="module" src="src/main.js"></script>`.
2. Create `src/boot.js` exporting `bootGame(env)`; `env` = `{window, document, storage}`. It: finds `document.getElementById('game')`; `layoutInfo = applyLayout(canvas, window)` and re-applies on `resize` and `orientationchange` events; creates `app = createApp({now: () => window.performance ? window.performance.now() : 0})`; registers a placeholder scene `{id:'title', draw(ctx, app, t)}` that draws the text `WEBB, WHERE'S MY CAR?` centred (title font 36px, colour PALETTE.cream, shadow) and `A WEBB'S WHEELS PRODUCTION` below it (body font 28); `app.go('title')`; adds `pointerdown`, `pointermove`, `pointerup`, `pointercancel` listeners on the canvas that call `toLogical(layout, e.clientX, e.clientY)` and, when non-null, `app.pointer('down'|'move'|'up', x, y)` (`pointercancel` maps to 'up'), calling `e.preventDefault()`; `keydown` listener on window calling `app.key(e.key)`; asks the browser to load the fonts when `document.fonts && document.fonts.load` exists (`document.fonts.load('16px "Press Start 2P"')` and `document.fonts.load('16px VT323')`, each inside try/catch, results ignored) but does NOT wait for them: the loop starts immediately; `function frame(ms) { app.draw(layoutInfo.ctx, ms / 1000); window.requestAnimationFrame(frame); }`. Returns `{app, getLayout() {...}}`. Keep it tolerant: wrap font loading in try/catch.
3. Create `src/main.js`: imports `bootGame`; defines `safeStorage()` returning `window.localStorage` inside try/catch (or an in-memory `{getItem, setItem, removeItem}` fallback); calls `bootGame({window, document, storage: safeStorage()})`.
4. Write `tests/boot.test.mjs` with fakes: a fake window (`innerWidth 1280, innerHeight 720, devicePixelRatio 1`, `addEventListener(name, fn)` storing handlers by name, `requestAnimationFrame(fn)` storing the callback, `performance: {now: () => 0}`), a fake canvas (as in the W42 test; its `addEventListener` also stores handlers; `getContext` returns a `makeCtx()`), a fake document (`getElementById('game')` returns the canvas; no `fonts`). Assert: `bootGame` returns an object with `app`; `app.current().id === 'title'`; calling the stored RAF callback with 16 draws the text `WEBB, WHERE'S MY CAR?` (check `texts(ctx)`) and schedules the next frame (RAF called again); a stored `pointerdown` handler called with `{clientX: 640, clientY: 360, preventDefault(){}}` reaches `app.pointer` (replace the title scene's `pointer` with a recording one before invoking, via `app.scenes.title.pointer = ...`) with logical (640,360) and type 'down'; a pointer event in the letterbox area (use window 2000x720 and clientX 10) is ignored; a `keydown` handler call routes the key; a `resize` handler call re-applies layout (canvas.style.width changes when `innerWidth` changes).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c '<canvas id="game">' index.html` prints `1`.
- `grep -c 'user-scalable=no' index.html` prints `1`.

## Out of scope (do not touch)
- No game scenes (placeholder title only). No manifest or service worker (later card). Do not edit src/ui files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W51: Browser page and boot code`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
