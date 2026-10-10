[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W23 Headlines aggregator

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W23
Needs (already merged into `dev`): W18, W19, W20, W21, W22
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Join the four pools and make sure there are no duplicate headlines across them.

## Read first
- docs/DESIGN.md section 8.4

## Files you may change (and nothing else)
- `src/data/headlines.js`
- `tests/headlines.test.mjs`

## Steps
1. Create `src/data/headlines.js` exporting `GENERIC` (generic_a then generic_b, 80 strings), `CARWORLD` (carworld_a then carworld_b, 60 strings) and re-exporting `REACTIVE`.
2. Write `tests/headlines.test.mjs`: `GENERIC.length === 80`, `CARWORLD.length === 60`; the 140 strings together have no duplicates (case-insensitive); `Object.keys(REACTIVE).length === 9`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit the pool files. If a duplicate across pools makes the test fail, report STATUS: BLOCKED naming both files and the string.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W23: Headlines aggregator`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
