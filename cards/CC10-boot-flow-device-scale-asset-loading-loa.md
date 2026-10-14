[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC10 Boot flow: device scale, asset loading, loading scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC10
Needs (already merged into `dev`): CC01, CC03, CC07, CC09, W68d
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wire everything at game start, in the browser and in the iPhone WKWebView: set the device scale, create the sprite loader and variant cache, configure the car art, start loading with a timeout, and show the loading scene before the title. Without `env.assetEnv` the game still starts directly on the title (code-drawn cars), so tests and old pages keep working.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- src/boot.js (as changed by W68d: it builds the app with createGame)
- src/main.js
- tests/boot.test.mjs
- src/art/assetenv.js (CC03), src/art/modelcar.js (CC07), src/ui/scenes/loading.js (CC09), src/art/pixelscale.js (CC01)

## Files you may change (and nothing else)
- `src/boot.js`
- `src/main.js`
- `tests/boot.test.mjs`

## Steps
1. In `bootGame(env)` right after the first `applyLayout`, and again inside `reapply()`, call `setDeviceScale(layoutInfo.layout.scale * layoutInfo.dpr)` (import from `./art/pixelscale.js`).
2. After the app exists: `if (env.assetEnv) { const sprites = createSprites(env.assetEnv); const variants = createVariants(env.assetEnv, sprites); configureCarArt({sprites, variants}); app.assets = {progress: () => sprites.progress(), ready: () => sprites.ready, timedOut: () => sprites.timedOut}; app.register(loadingScene); app.go('loading'); sprites.load({timeoutMs: 6000}); }`. Also wait (bounded) for fonts: leave the existing `doc.fonts.load` calls as they are. Do not change the other event wiring. Return value gains `sprites` (or null).
3. `src/main.js`: import `makeAssetEnv` and pass `assetEnv: makeAssetEnv(window, document)` in the `bootGame` call.
4. `tests/boot.test.mjs`: keep every existing test. Add: with window 1280x720 and `devicePixelRatio: 2` after `bootGame`, `getDeviceScale() === 2`; after a resize event to 640x360 with dpr 2 it is 1; with `env.assetEnv = {loadJson: () => Promise.resolve({}), loadImage: () => Promise.resolve({width:1,height:1}), makeCanvas: ..., setTimeout: function(){}}` the first scene id is `loading` and `app.assets.progress()` exists; without `assetEnv` the first scene is `title`. Reset the device scale to 1 at the end.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep boot` shows PASS.
- Planner visual check later: `sh tools/serve.sh` then open http://127.0.0.1:8000/ shows the loading scene then the title with no console errors.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC10: Boot flow: device scale, asset loading, loading scene`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
