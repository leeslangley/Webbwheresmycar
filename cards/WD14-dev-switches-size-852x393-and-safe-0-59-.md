[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD14 Dev switches: ?size=852x393 and ?safe=0,59,21,59 to test phone layouts in a desktop browser

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD14
Needs (already merged into `dev`): WD06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Let the planner, the visual QA loop and Lee check the wide layout without a phone: opening index.html with `?size=852x393` lays the game out as if the window were 852x393 (canvas placed top-left, rest black) and `&safe=0,59,21,59` fakes the iPhone insets (top,right,bottom,left in CSS px). Without the parameters nothing changes. ORDER: after WD06 (boot.js).

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/boot.js (as changed by WD06: both `applyLayout(canvas, win)` calls, `currentView`, `readCssInsets(win, doc)`)
- tests/boot_view.test.mjs (WD06: copy its helpers)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/devsize.js`
- `src/boot.js`
- `tests/devsize.test.mjs`

## Steps
1. `src/ui/devsize.js` (pure): `parseDevSize(search)` returns `{w, h}` when the query string (a string like '?a=1&size=852x393', with or without the leading '?') contains `size=<w>x<h>` with w and h integers between 200 and 4000, else null (also for undefined, '' and non-strings). `parseDevInsets(search)` returns `{top, right, bottom, left}` from `safe=<t>,<r>,<b>,<l>` (four numbers 0..200) else null. `devWindow(win, search)` returns `{innerWidth: w, innerHeight: h, devicePixelRatio: win.devicePixelRatio}` when `parseDevSize(search)` is set, else `win` itself.
2. `src/boot.js`: `const search = win.location && typeof win.location.search === 'string' ? win.location.search : '';` near the top of bootGame. Use `devWindow(win, search)` as the window argument of BOTH `applyLayout` calls (the first and the one in `reapply`) and in `currentView` use `viewInsets(layoutInfo.layout, parseDevInsets(search) || readCssInsets(win, doc))`. Nothing else changes (`win.innerWidth` is still read from the real window by the resize event).
3. `tests/devsize.test.mjs`: parseDevSize('?size=852x393') is {w:852,h:393}; '?a=1&size=1560x720' {w:1560,h:720}; 'size=852x393' (no '?') works; '?size=0x0', '?size=99999x10', '?size=abc', '', undefined and 5 give null. parseDevInsets('?safe=0,59,21,59') is {top:0,right:59,bottom:21,left:59}; '?safe=1,2,3' and '?safe=a,b,c,d' give null. devWindow with a search of '' returns the same win object (`===`); with '?size=852x393' returns {innerWidth:852, innerHeight:393, devicePixelRatio: win's}. Boot: copy the helper functions of tests/boot_view.test.mjs; a fake window 1280x720 with `location: {search: '?size=852x393&safe=0,59,21,59'}` and dpr 3: after bootGame `app.view.fullW` is 1564, `stageX` 142, `safe.bottom` near 38.4733 (1e-3), `parseFloat(canvas.style.height)` is near 393 (1e-6); a window with no `location` boots normally with `app.view.fullW` 1280.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/devsize.test.mjs'` prints one line.
- `make test 2>&1 | grep -E 'PASS tests/boot(_view)?.test.mjs'` prints two lines.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- index.html; any scene; src/ui/canvas.js.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD14: Dev switches: ?size=852x393 and ?safe=0,59,21,59 to test phone layouts in a desktop browser`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
