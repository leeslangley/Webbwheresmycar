[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W67 Settings scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W67
Needs (already merged into `dev`): W45, W47
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A small settings screen: CRT filter, sound, music and erase save.

## Read first
- docs/SCENE_RULES.md (tap rule and scene structure)
- tests/fakeapp.js (has `settings`, `saveSettings`, `now`)

## Files you may change (and nothing else)
- `src/ui/scenes/settings.js`
- `tests/scene_settings.test.mjs`

## Steps
1. Create `src/ui/scenes/settings.js` exporting `settingsScene` (id `'settings'`) and `LAYOUT = {crt:{x:340,y:200,w:600,h:70}, sound:{x:340,y:290,w:600,h:70}, music:{x:340,y:380,w:600,h:70}, erase:{x:340,y:470,w:600,h:70}, back:{x:340,y:580,w:600,h:60}}`. Title `SETTINGS` (title font 32px, lamp colour, shadow).
2. Toggle buttons labelled `CRT FILTER: ON/OFF`, `SOUND: ON/OFF`, `MUSIC: ON/OFF`; a tap flips `app.settings.crt|sound|music` and calls `app.saveSettings()`. `ERASE SAVED GAME` (danger style): the first tap changes the label to `TAP AGAIN TO CONFIRM` for 3 seconds (use `app.now()`; read the clock like news.js does); a second tap in time calls `app.eraseSave()` if it exists and toasts `Save erased`. BACK and Escape pop.
3. Write `tests/scene_settings.test.mjs`: initial labels `CRT FILTER: OFF`, `SOUND: ON`, `MUSIC: ON`; each toggle flips, records `['saveSettings']` and changes its label; ERASE needs two taps (the test adds `app.eraseSave` that records a call) and the confirm expires after 3000 ms (the test sets `app.now` to a function); BACK and Escape pop.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_settings` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W67: Settings scene`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
