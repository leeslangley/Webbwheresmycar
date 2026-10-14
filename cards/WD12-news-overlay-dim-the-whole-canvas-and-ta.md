[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD12 News overlay: dim the whole canvas and tap anywhere in the strips

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD12
Needs (already merged into `dev`): WD05, W63
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The newspaper dims 'the room behind the paper' with a 60 percent black rectangle over 0..1280 only: on a wide screen the strips would stay bright (a visible step at the stage edge), and 'any tap advances the paper' would not work in a strip. Make both cover the full canvas. A 16:9 view gives identical calls. TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: after WD05 (fakeapp has `app.view`) and W63 (the news scene).

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/scenes/news.js (the `draw` function: `hits.add('anywhere', 0, 0, app.w, app.h, function () {` and `ctx.fillRect(0, 0, app.w, app.h);` under the 'Dim the room behind the paper' comment)
- tests/scene_news.test.mjs (helpers `freshApp`, `drawOnce`, `tap`; keep every test green)
- tests/fakeapp.js
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/scenes/news.js`
- `tests/scene_news_view.test.mjs`

## Steps
1. In `draw` after the `state` guard add `const left = app.view ? app.view.left : 0; const right = app.view ? app.view.right : app.w;`. Change `hits.add('anywhere', 0, 0, app.w, app.h, ...)` to `hits.add('anywhere', left, 0, right - left, app.h, ...)` and the dim `ctx.fillRect(0, 0, app.w, app.h);` to `ctx.fillRect(left, 0, right - left, app.h);`. Nothing else in the file changes.
2. `tests/scene_news_view.test.mjs`: copy `baseState`, `freshApp`, `drawOnce`, `tap` from tests/scene_news.test.mjs. Default view: the dim fillRect (fillStyle 'rgba(0,0,0,0.6)') is `[0,0,1280,720]`. Wide view (`app.view = {...app.view, left: -140, right: 1420, stageX: 140, wide: true}`): it is `[-140,0,1560,720]`; a tap (down then up after a draw) at stage (-100, 300) advances the paper exactly like a tap at (640, 300) does in the existing tests (compare `newsScene.page` or the `app.calls` the existing tests check); a tap at (1400, 10) does the same; with the default view a tap at (-100, 300) does nothing.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/scene_news_view.test.mjs'` prints one line.
- `make test 2>&1 | grep 'PASS tests/scene_news.test.mjs'` prints one line.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Paper layout, month report, any other scene.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD12: News overlay: dim the whole canvas and tap anywhere in the strips`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
