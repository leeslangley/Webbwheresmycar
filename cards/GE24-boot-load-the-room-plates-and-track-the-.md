[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE24 Boot: load the room plates and track the pointer for parallax

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE24
Needs (already merged into `dev`): GE13, W68d
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Connect the room plate loader to the real game: the browser (and the iPhone web view) creates the loader, starts loading, hands it to the app as `app.rooms`, and keeps `app.look` (pointer position as -1..1) up to date so plates and layers can shift a few pixels.

## Read first
- src/boot.js (as changed by W68d)
- tests/boot.test.mjs (how the fake window and document are built)
- src/art/rooms.js (GE13)
- src/ui/canvas.js (`toLogical`)

## Files you may change (and nothing else)
- `src/boot.js`
- `tests/boot.test.mjs`

## Steps
1. In `bootGame` after the app is created: when `typeof win.fetch === 'function' && typeof win.Image === 'function'` build `loadJson = url => win.fetch(url).then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })` and `loadImage = url => new Promise((res, rej) => { const im = new win.Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = url; })`; then `app.rooms = createRooms({loadJson, loadImage}); app.rooms.load();` (import from `./art/rooms.js`). Without fetch or Image (tests, old browsers) `app.rooms` stays undefined and nothing else changes. Set `app.look = {x: 0, y: 0}` always.
2. In the existing `onPointer` function, when `p` is not null (any pointer type): `app.look = { x: Math.max(-1, Math.min(1, (p.x - 640) / 640)), y: Math.max(-1, Math.min(1, (p.y - 360) / 360)) };`.
3. `tests/boot.test.mjs`: add tests (keep all existing ones): with a fake window that has no `fetch`, `app.rooms` is undefined and `app.look` deep-equals `{x:0,y:0}`; with a fake `fetch` (returns `Promise.resolve({ok:true, json: () => ({})})`) and a fake `Image` class, `app.rooms` exists (`typeof app.rooms.has === 'function'`); a pointer move at logical (1280, 720) via the fake canvas listener sets `app.look` to `{x:1,y:1}` and at (0, 0) to `{x:-1,y:-1}` (use the same fake-event style as the existing pointer tests, remembering `toLogical` maps through the layout).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep boot` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE24: Boot: load the room plates and track the pointer for parallax`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
