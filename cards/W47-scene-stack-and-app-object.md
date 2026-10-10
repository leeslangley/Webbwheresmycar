[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W47 Scene stack and app object

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W47
Needs (already merged into `dev`): W44, W45
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The thing that owns the current screen: a stack of scenes, input routing, toast messages and the draw loop entry point.

## Read first
- docs/DESIGN.md section 9.5 and 9.7 (the app and scene contracts)
- src/ui/kit_draw.js (panel, label)
- src/ui/theme.js
- tests/fakectx.js

## Files you may change (and nothing else)
- `src/ui/scenes.js`
- `tests/scenes.test.mjs`

## Steps
1. Create `src/ui/scenes.js` exporting `createApp(env = {})`. `env` may contain `now` (function returning ms, default `() => 0`), `state` (default null), `settings` (default `{crt:false, sound:true, music:true}`), `audio` (default `{play() {}}`). Return an object `app` with: `state`, `w: 1280`, `h: 720`, `settings`, `audio`, `scenes: {}`, `stack: []`, `toasts: []`, `now()` (calls env.now), and methods below.
2. `register(scene)` stores `app.scenes[scene.id] = scene` and returns app. `push(id, params)`: throws `Error('unknown scene ' + id)` if missing; pushes `{scene, enteredAt: app.now()}` and calls `scene.enter(app, params)` if defined. `pop()`: removes the top entry (do nothing if the stack has 1 or fewer... allow popping to empty only via `go`), calls `leave(app)` if defined, then calls `resume(app)` on the new top scene if defined. `go(id, params)`: calls `leave` on every scene on the stack (top to bottom), empties the stack, then `push(id, params)`. `current()` returns the top scene or null.
3. `toast(text, ms = 2500)` pushes `{text, until: app.now() + ms}`. `act` default is `(fn) => fn()` (the game flow card replaces it).
4. `pointer(type, x, y)`: calls `current().pointer(app, type, x, y)` if defined. `key(k)`: calls `current().key(app, k)` if defined.
5. `draw(ctx, t)`: fill the whole 1280x720 with `PALETTE.ink`. Find the index of the top-most scene whose `overlay` is not true (or 0 if all are overlays); draw scenes from that index up to the top by calling `scene.draw(ctx, app, t)`. Then draw toasts: remove those with `until <= app.now()`, and for the rest draw (stacked upward from y 640, 44px apart) a `panel` 560 wide centred horizontally with the text in `label` (body font, size 28). Return nothing.
6. Write `tests/scenes.test.mjs` using fake scenes `{id, enter(app,p){log.push('enter '+id+JSON.stringify(p))}, leave(){...}, resume(){...}, draw(){log.push('draw '+id)}, pointer(app,t,x,y){...}, key(app,k){...}}`: push calls enter with params; pop calls leave then resume of the one below; go clears the stack and calls leave on all; unknown id throws; `current()`; pointer and key route to the top scene only; `draw` draws only the top scene when it is not an overlay, but draws the scene below too when the top scene has `overlay: true` (order: below first); toasts: after `toast('hi')` a draw shows `hi` in `texts(ctx)`; after advancing the fake `now` past its `until` the next draw no longer shows it and `app.toasts.length` is 0; the first drawing call is a `fillRect` covering 0,0,1280,720; default `act` runs the function and returns its value.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No DOM. No game scenes yet.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W47: Scene stack and app object`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
