[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W10 Owner and customer name lists

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W10
Needs (already merged into `dev`): W02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Silly names for the people who own rental cars and for customers. Comedy is the product here: aim for British, affectionate, daft.

## Read first
- docs/DESIGN.md section 1 (tone), 4.4, 4.7
- src/core/rng.js (pick)

## Files you may change (and nothing else)
- `src/data/owners.js`
- `src/data/names.js`
- `tests/names.test.mjs`

## Steps
1. Create `src/data/owners.js`: `export const OWNERS` = array of exactly 24 unique strings, each 8-40 characters, names of car owners who rent cars out. Examples of the tone (write 24 NEW ones in the same spirit, do not reuse these): `Lord Fotherington-Smythe`, `Doreen Pickles (retired)`, `Gary from Gary's Garage`, `The Reverend Mike Torque`. No real people, no celebrities. Also `export function ownerName(state)` returning `pick(state, OWNERS)` (import `pick` from `../core/rng.js`).
2. Create `src/data/names.js`: `export const FIRST` (40 unique first names, mixed old-fashioned and modern British), `export const LAST` (40 unique surnames; at least 10 of them should be amusing, e.g. `Crumpet`, `Bottomley`), `export const PREFIX` = `['Mr','Mrs','Ms','Dr','Sir','Lady','Captain','Reverend']`. Export `customerName(state)`: 60% `First Last`, 25% `Prefix Last`, 15% `The Last Family`. Use `chance`/`pick` from rng with these exact calls in this order: first `const r = rand(state)`; r<0.60 -> First Last; r<0.85 -> Prefix Last; else The Last Family; each branch then uses `pick(state, ...)` for each needed part (first before last).
3. Write `tests/names.test.mjs`: OWNERS length 24 and unique, each string length 8-40; FIRST and LAST length 40 and unique; same-seed determinism for 20 customerName calls; over 300 calls with seed 7 at least 60 distinct names appear; every customerName result is non-empty and has at least one space; `ownerName` returns a member of OWNERS.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No other files. No real people's names.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W10: Owner and customer name lists`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
