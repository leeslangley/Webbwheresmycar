[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash G01 Dossier game_name check and three name fixes

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: G01
Needs (already merged into `dev`): R00
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Three merged dossiers carry the fixture's game_name `Webb, wheres my car?` instead of the real game name. Fix them and make the checker reject that mistake so it cannot happen again.

## Read first
- tools/check_dossier.py and tests/run_dossier_check.sh (the checker and its sh test)
- docs/CAR_DOSSIER_SPEC.md (game_name field)

## Files you may change (and nothing else)
- `tools/check_dossier.py`
- `tests/fixtures/dossier_ok.json`
- `tests/fixtures/dossier_bad.json`
- `tests/fixtures/dossier_taper.json`
- `tests/run_dossier_check.sh`
- `docs/cars/t1_maurice.json`
- `docs/cars/t1_cooker.json`
- `docs/cars/t1_volksbeagle.json`

## Steps
1. In `docs/cars/` set `game_name` to `Maurice Minor` in `t1_maurice.json`, `Minnie Cooker` in `t1_cooker.json`, `Volksbeagle Bug` in `t1_volksbeagle.json`. Change nothing else in those files.
2. In `tests/fixtures/dossier_ok.json`, `dossier_bad.json` and `dossier_taper.json` set `game_name` to `Test Car` (they currently have the fake game title).
3. In `tools/check_dossier.py` add a check: `game_name` must be a non-empty ASCII string, must not contain the text `Webb` and must not equal the text `wheres my car`; the failure line is `DOSSIER FAIL <file>: game_name looks copied from the fixture`.
4. In `tests/run_dossier_check.sh` add a case: copy `dossier_ok.json` to /tmp with `game_name` set to `Webb, wheres my car?` (use python3 -c to edit the JSON), require exit 1 and the text `game_name`; keep every existing case and the final `DOSSIER CHECKER OK` line.

## Acceptance (all must pass; exact commands)
- `sh tests/run_dossier_check.sh` prints `DOSSIER CHECKER OK`.
- `for f in docs/cars/*.json; do python3 tools/check_dossier.py $f; done` prints DOSSIER OK for every file.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `G01: Dossier game_name check and three name fixes`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
