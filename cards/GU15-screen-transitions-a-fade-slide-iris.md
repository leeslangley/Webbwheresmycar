[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU15 Screen transitions A: fade, slide, iris

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU15
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A transition runner that draws an outgoing and an incoming screen through callbacks (no offscreen canvas needed): cross-fade, slide in four directions, and the iris close-and-open.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/transitions.js`
- `tests/transitions.test.mjs`

## Steps
1. `src/ui/transitions.js` (imports EASE, MOTION, clamp01 from tokens). Export `makeTransition(kind, nowMs, durMs)`: kind is 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'iris' (the card GU16 adds 'static' and 'pageturn'; an unknown kind throws Error('bad transition')); default durMs from MOTION: fade -> fade, slide-* -> slide, iris -> iris. Returns {kind, start: nowMs, dur}. `transProgress(tr, nowMs)` = clamp01((nowMs - tr.start)/tr.dur); `transDone(tr, nowMs)` = nowMs >= tr.start + tr.dur.
2. Export `drawTransition(ctx, tr, nowMs, drawFrom, drawTo, w = 1280, h = 720)`; u = transProgress. fade: e = EASE.inOutQuad(u); drawFrom(); save; globalAlpha = e; drawTo(); restore. slide-*: e = EASE.outCubic(u); this exact table (old screen first, then new screen): left: old translate(-e*w, 0), new translate((1-e)*w, 0); right: old translate(e*w, 0), new translate(-(1-e)*w, 0); up: old translate(0, -e*h), new translate(0, (1-e)*h); down: old translate(0, e*h), new translate(0, -(1-e)*h). Each draw is wrapped in save/restore and a clip: beginPath, rect(0,0,w,h), clip, inside the save. iris: fillStyle '#000000', fillRect(0,0,w,h); R = Math.hypot(w/2, h/2); when u < 0.5: r = R*(1 - 2u), scene = drawFrom, else r = R*(2u - 1), scene = drawTo; save; beginPath; arc(w/2, h/2, r, 0, Math.PI*2); clip; scene(); restore (only ONE scene is drawn per frame). u >= 1 draws only drawTo() without any transform for every kind.
3. `tests/transitions.test.mjs`: makeTransition('fade',1000) is {kind:'fade',start:1000,dur:250}; 'slide-left' dur 350; 'iris' dur 500; makeTransition('wipe',0) throws; transProgress at start+125 of a fade is 0.5; transDone true at start+dur. Count callbacks with counters: fade at u 0.5 calls both once and sets globalAlpha 0.5 (inOutQuad(0.5)) between a save and restore; slide-left at u 0.5 (e 0.875): translate calls [-1120,0] then [160,0]; slide-right: [1120,0] then [-160,0]; slide-up at u 0.5: [0,-630] then [0,90]; each slide draw has a `clip` call; iris at u 0.25 calls only drawFrom, with arc radius 734.3023900274328*0.5 within 1e-6 at (640,360); iris at u 0.75 calls only drawTo with the same radius; iris at u 0 has radius R and at u 0.5 radius 0; any kind at u >= 1 calls only drawTo with zero translate calls.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/transitions.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Wiring into the app (GU22); static and page-turn (GU16).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU15: Screen transitions A: fade, slide, iris`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
