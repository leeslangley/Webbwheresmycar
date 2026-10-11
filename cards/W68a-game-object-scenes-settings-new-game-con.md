[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W68a Game object: scenes, settings, new game, continue

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W68a
Needs (already merged into `dev`): W51, W57, W58, W59b, W60, W61, W62, W63, W64b, W65d, W66b, W67
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Create the real app: register every scene, settings storage, new game, continue and erase.

## Read first
- src/ui/scenes.js (createApp), src/save/save.js (saveTo, loadFrom, clearSave), src/sim/newgame.js (startGame), src/boot.js
- docs/DESIGN.md section 9.5

## Files you may change (and nothing else)
- `src/game.js`
- `tests/game_a.test.mjs`

## Steps
1. Create `src/game.js` exporting `createGame(env)` with `env = {storage, now}` (`now` is a function). It builds `app = createApp({now})` and registers `titleScene, officeScene, tvshopScene, garageScene, advertsScene, bookingsScene, newsScene, ledgerScene, auctionScene, endgameScene, settingsScene` (import each from `src/ui/scenes/<name>.js`; read each file for its export name).
2. Settings: `app.settings` loads from `storage` key `webb_settings_v1` (JSON `{crt,sound,music}`, defaults `{crt:false,sound:true,music:true}`); `app.saveSettings()` writes it. `app.hasSave()` is `loadFrom(storage) !== null`. `app.newGame()`: `app.state = startGame(Math.floor(env.now()) + 1)`, `saveTo(storage, app.state)`, `app.dayChangedAt = app.now()`, `app.go('office')`. `app.continueGame()`: `app.state = loadFrom(storage)`; if null toast `No saved game`, else `app.go('office')`. `app.eraseSave()`: `clearSave(storage)`. Return `app`.
3. Write `tests/game_a.test.mjs` with an in-memory storage object (read how tests/save.test.mjs fakes it): the app has all 11 scene ids; `newGame()` gives day 1, current scene `office` and a stored save; `hasSave()` is true; a second `createGame` on the same storage with `continueGame()` restores the state; settings persist across two `createGame` calls; `eraseSave()` makes `hasSave()` false; `continueGame()` with no save toasts `No saved game`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep game_a` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W68a: Game object: scenes, settings, new game, continue`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
