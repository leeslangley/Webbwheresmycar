[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W39 Save and load

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W39
Needs (already merged into `dev`): W05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Turn a game state into a string and back, and save it to a storage object (like localStorage) safely.

## Read first
- docs/DESIGN.md section 9.3 (save/save.js) and 9.1
- src/core/state.js

## Files you may change (and nothing else)
- `src/save/save.js`
- `tests/save.test.mjs`

## Steps
1. Create `src/save/save.js` exporting `SAVE_KEY = 'webb_save_v1'`, `serialize(state)` (`JSON.stringify(state)`), `deserialize(str)`: returns the parsed state or `null` if `str` is not a string, not valid JSON, `v !== 1`, or is missing any of the keys `day, cash, reputation, buzz, garageSlots, cars, shop, requests, auction, stats, plates, flags, rng` or if `cars` is not an array.
2. `saveTo(storage, state)`: try `storage.setItem(SAVE_KEY, serialize(state))`; return true on success, false if it throws. `loadFrom(storage)`: try `deserialize(storage.getItem(SAVE_KEY))`; return null on any error or missing key. `clearSave(storage)`: try `storage.removeItem(SAVE_KEY)`; returns boolean.
3. Write `tests/save.test.mjs` with an in-memory storage helper (`getItem` returns null for missing keys like localStorage does): round trip of `newGameState(3)` is deep-equal; garbage strings return null (`'', 'nope', '{}', '[]', '{"v":2}'`, null, undefined, 42); a state missing `cars` returns null; loadFrom on an empty storage returns null; saveTo on a storage whose setItem throws returns false and does not throw; loadFrom on a storage whose getItem throws returns null; clearSave removes the key; a modified state after saving does not alter the stored string.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No `localStorage` or `window` references anywhere in the file.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W39: Save and load`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
