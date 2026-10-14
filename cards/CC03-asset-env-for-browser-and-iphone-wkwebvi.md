[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC03 Asset env for browser and iPhone WKWebView

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC03
Needs (already merged into `dev`): CC02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The real `env` for the sprite loader: `loadJson`, `loadImage`, `makeCanvas`, `setTimeout`, built from the page's window and document. It must work from http://localhost AND from the iPhone app's custom `webb://app/` scheme (ES modules + images served by AssetSchemeHandler), where fetch can return status 0.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- cards/I01-ios-wrapper-swift-sources.md (the webb:// scheme handler: same-origin, sends Access-Control-Allow-Origin: *)
- src/art/sprites.js (how env is used)

## Files you may change (and nothing else)
- `src/art/assetenv.js`
- `tests/assetenv.test.mjs`

## Steps
1. `src/art/assetenv.js` (pure apart from the objects passed in). Export `makeAssetEnv(win, doc)` returning `{loadJson, loadImage, makeCanvas, setTimeout}`. `loadJson(url)`: if `typeof win.fetch === 'function'` use `win.fetch(url).then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })`; if fetch is missing OR its promise rejects, fall back to `win.XMLHttpRequest` (open GET, async; `onload` accepts `status === 200 || (status === 0 && responseText !== '')`, then `JSON.parse(responseText)`; `onerror` rejects). Both paths reject on failure; the loader catches it.
2. `loadImage(url)`: `const img = new win.Image(); img.onload = ...; img.onerror = () => reject(new Error('image ' + url)); img.src = url;`. On load, if `typeof img.decode === 'function'` resolve after `img.decode()` (a rejected decode still resolves with img), else resolve with img. Do NOT set `crossOrigin` (same origin images keep `getImageData` allowed on http and on webb://). `makeCanvas(w, h)`: `const c = doc.createElement('canvas'); c.width = w; c.height = h; return c;`. `setTimeout`: `function (fn, ms) { return win.setTimeout(fn, ms); }` (only when win.setTimeout exists, else undefined).
3. `tests/assetenv.test.mjs`: fake `win` with `fetch` (returns `{ok:true, json: () => Promise.resolve({a:1})}`), then a second env whose fetch rejects and whose `XMLHttpRequest` fake fires `onload` with `status: 0, responseText: '{"b":2}'`, then a third whose XHR fires `onerror`: expect `{a:1}`, `{b:2}` and a rejection (use `.then`/`.catch` or top-level await). Fake `win.Image` class: when `src` is assigned it calls `onload` synchronously in a microtask; with `decode` present the promise resolves to the same object; a second fake that calls `onerror` rejects. `makeCanvas(40, 20)` returns an object with width 40 and height 20 from a fake `doc.createElement` that records the tag name `canvas`.
4. In your summary, state in one line that real iPhone behaviour (status 0 from the custom scheme, decode) is untested here and is checked by the planner in the simulator.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep assetenv` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC03: Asset env for browser and iPhone WKWebView`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
