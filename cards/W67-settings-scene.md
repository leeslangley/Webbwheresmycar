[Project: Webbwheresmycar]
# Task: [GLM-SPARK] MiMo-v2.6-Flash W67 Settings scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W67
Needs (already merged into `dev`): W45, W47
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (MiMo-v2.6-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A small settings screen: CRT filter, sound effects, music, and erase save.

## Read first
- docs/DESIGN.md section 3 and 9.7
- tests/fakeapp.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. TAP RULE (a bug found in review of the title screen, obey it exactly): the screen is redrawn many times between a finger-down and its finger-up, so never keep the pressed hit as an object and NEVER reset the pressed state inside `draw`. On `'down'` do `const h = this.hits.hit(x, y); this.pressed = h ? h.id : null;` (remember the hit's ID). On `'up'` do `const e = this.hits.hit(x, y); if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') e.onTap(e); this.pressed = null;`. Reset `this.pressed` only in `enter` and after `'up'`. Scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up and treat `endDrag().tapped` as the tap signal. Every scene test file MUST contain a test that does down, then calls `draw` again with a different `t`, then up, and expects the action to fire exactly once.

## Files you may change (and nothing else)
- `src/ui/scenes/settings.js`
- `tests/scene_settings.test.mjs`

## Steps
1. Create `src/ui/scenes/settings.js` exporting `settingsScene` (id `'settings'`) and `LAYOUT = {crt:{x:340,y:200,w:600,h:70}, sound:{x:340,y:290,w:600,h:70}, music:{x:340,y:380,w:600,h:70}, erase:{x:340,y:470,w:600,h:70}, back:{x:340,y:580,w:600,h:60}}`.
2. Each toggle is a `button` whose label shows its state: `CRT FILTER: ON`/`OFF`, `SOUND: ON`/`OFF`, `MUSIC: ON`/`OFF`. Tapping flips `app.settings.crt|sound|music` and calls `app.saveSettings()` (a method the fake app has). `ERASE SAVED GAME` (danger): first tap changes the label to `TAP AGAIN TO CONFIRM` for 3 seconds (use `app.now()`); a second tap within the time calls `app.eraseSave()` if it exists (else nothing) and toasts `Save erased`. `BACK` pops. Title `SETTINGS` (title font 32px, lamp, shadow). Escape pops.
3. Write `tests/scene_settings.test.mjs`: labels show `CRT FILTER: OFF`, `SOUND: ON`, `MUSIC: ON` initially; tapping CRT flips `app.settings.crt` and records `['saveSettings']` and the label changes to `ON`; sound and music likewise; ERASE needs two taps (first changes the label, no `eraseSave` call; second calls the fake's `eraseSave` which the test adds) and the confirm expires after 3000 ms of fake time (set `app.now` function: the fake app has `now: 0` as a number: in this test replace it with a function); BACK pops; Escape pops.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No audio or CRT drawing here.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W67: Settings scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
