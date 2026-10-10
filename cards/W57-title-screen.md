[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W57 Title screen

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W57
Needs (already merged into `dev`): W45, W46, W47, W50c, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The title screen: big logo, a car driving across, and the buttons NEW GAME, CONTINUE and SETTINGS.

## Read first
- docs/DESIGN.md section 1, 3, 9.5, 9.7
- src/ui/kit_draw.js, kit_hits.js, theme.js, src/art/cardraw.js, tests/fakeapp.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/title.js`
- `tests/scene_title.test.mjs`

## Steps
1. Create `src/ui/scenes/title.js` exporting `titleScene` (id `'title'`) and `LAYOUT = {newGame:{x:480,y:420,w:320,h:64}, continueBtn:{x:480,y:500,w:320,h:64}, settings:{x:480,y:580,w:320,h:56}}`.
2. Draw: a night-sky gradient (`PALETTE.ink` to `PALETTE.blue`), 40 twinkling stars (deterministic positions from a simple formula using the index, alpha from `Math.sin(t + i)`), a road strip at the bottom (y 640..720, dark grey with dashed centre line moving left with `t`), and `drawCar` driving left-to-right across the road: cycle through the archetypes `['saloon','roadster','trike','wedge']`, one per 6 seconds (`Math.floor(t/6) % 4`), x = `-300 + ((t % 6) / 6) * 1900`, colour `#9a2a2a`, `cond` 10, y 660.
3. Logo: the text `WEBB,` (title font 64px, `PALETTE.lamp`, shadow) at y 120 centred and `WHERE'S MY CAR?` (title font 48px, `PALETTE.cream`, shadow) at y 210 centred; below, `A WEBB'S WHEELS PRODUCTION` (body font 30px, `PALETTE.lightgrey`) at y 300 and the line `Starring Mark Webb` (body font 28px, `PALETTE.yellow`) at y 340. The logo bobs `Math.sin(t*1.5)*4` px.
4. Buttons (kit `button`): `NEW GAME` kind primary; `CONTINUE` enabled only when `app.hasSave()` is true; `SETTINGS` normal. Taps: new game -> `app.newGame()`; continue -> `app.continueGame()`; settings -> `app.push('settings')`. Keyboard: Enter or `n` starts a new game, `c` continues when possible, `s` opens settings.
5. Write `tests/scene_title.test.mjs`: draw includes the texts `WEBB,`, `WHERE'S MY CAR?`, `NEW GAME`, `CONTINUE`, `SETTINGS`; tapping the centre of NEW GAME records `['newGame']` in `app.calls`; CONTINUE does nothing when `hasSave()` is false and records `['continueGame']` when the fake app's `hasSave` is overridden to return true; SETTINGS records `['push','settings',undefined]`; key `Enter` starts a new game; draw at t=0 and t=7 both work and the logs differ.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No saving or game logic here.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W57: Title screen`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
