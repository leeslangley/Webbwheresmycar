[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W68 Game flow: wiring everything together

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W68
Needs (already merged into `dev`): W51, W57, W58, W59b, W60, W61, W62, W63, W64, W65, W66, W67, W39, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Connect it all: the real app with every scene registered, new game and continue, autosave after every action, the day transition (newspaper) after each action, and the redirect to the end screen.

## Read first
- docs/DESIGN.md section 9.5, 9.7
- src/boot.js (existing), src/ui/scenes.js, all src/ui/scenes/*.js, src/save/save.js, src/sim/newgame.js

## Files you may change (and nothing else)
- `src/game.js`
- `src/boot.js`
- `tests/game.test.mjs`

## Steps
1. Create `src/game.js` exporting `createGame(env)` where `env = {storage, now}`. It builds `app = createApp({now})`; registers the scenes `titleScene, officeScene, tvshopScene, garageScene, advertsScene, bookingsScene, newsScene, ledgerScene, auctionScene, endgameScene, settingsScene`; loads settings from `storage` key `webb_settings_v1` (JSON `{crt,sound,music}`, defaults `{crt:false,sound:true,music:true}`), implements `app.saveSettings()` (writes it), `app.hasSave()` (`loadFrom(storage) !== null`), `app.newGame()` (`app.state = startGame(seed)` with `seed = Math.floor(env.now()) + 1`, `env.now` being the injected function; then `saveTo`, `app.dayChangedAt = app.now()`, `app.go('office')`), `app.continueGame()` (`app.state = loadFrom(storage)`; if null toast `No saved game` else `app.go('office')`), `app.eraseSave()` (`clearSave`).
2. `app.act(fn)`: `const before = app.state.day; const r = fn(); if (r && r.ok === true) { saveTo(storage, app.state); app.dayChangedAt = app.now(); app.audio.play('cash'); app.push('news'); } return r;`. A failed action (`ok:false`) toasts `r.msg` (do this inside `act` when `r.ok === false` and `r.msg`). Results with no `ok` field are returned untouched.
3. Game over redirect: wrap the news scene's pop: in `createGame` register a `resume` hook by adding to the app a method `afterNews()`; simplest: give `officeScene` no change, instead override `app.pop` so that after popping the `'news'` scene, if `app.state.flags.gameOver` is true then `app.go('endgame')` and `saveTo`. Keep the original `pop` behaviour otherwise.
4. Edit `src/boot.js` so that `bootGame` uses `createGame({storage: env.storage, now})` instead of the placeholder title scene (keep exports and all event wiring working: the boot test from card W51 must be updated so it still passes: it should now expect `app.current().id === 'title'` and the draw text `WEBB,`).
5. Write `tests/game.test.mjs` with an in-memory storage: `createGame` returns an app whose `scenes` contains all 11 ids; `app.go('title')`; `app.newGame()` makes `app.state.day === 1`, current scene `office`, and storage now has a save; `app.hasSave()` is true; `app.act(() => waitDay(app.state))` returns `ok:true`, day 2, current scene `news`, storage save has day 2; a failing action (`buyCar(app.state, 'nope')`) leaves the day alone, pushes no news and adds a toast; popping the news scene returns to the office; with `state.flags.gameOver = true` and reason `'year-end'` set before popping, `app.pop()` from news lands on `endgame`; a second `createGame` on the same storage with `continueGame()` restores day 2; settings persist through `saveSettings` and reload; `eraseSave` makes `hasSave()` false.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- Update `tests/boot.test.mjs` only as far as needed to keep it passing.

## Out of scope (do not touch)
- No scene changes. No new game rules.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W68: Game flow: wiring everything together`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
