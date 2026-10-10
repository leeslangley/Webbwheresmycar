[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W17 Job types aggregator

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W17
Needs (already merged into `dev`): W13, W14, W15, W16
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Join the four job sets into one list with lookups.

## Read first
- docs/DESIGN.md section 8.2 and 9.3

## Files you may change (and nothing else)
- `src/data/jobtypes.js`
- `tests/jobtypes.test.mjs`

## Steps
1. Create `src/data/jobtypes.js`: `export const JOB_TYPES = [...JOBS_A, ...JOBS_B, ...JOBS_C, ...JOBS_D]` (16 job types), `export const JOB_BY_ID` (object keyed by id), `export function jobTypeOf(id)` (returns it or throws `Error('unknown job ' + id)`), and `export function fillText(template, vars)` which replaces `{customer}` and `{car}` (all occurrences) with `vars.customer` and `vars.car`, leaving a placeholder untouched when the var is undefined.
2. Write `tests/jobtypes.test.mjs`: 16 job types; ids unique and in the order wedding, photoshoot, concours, period, musicvideo, stag, prom, film, surprise, estate, parade, hen, proposal, vicar, panto, chef; `jobTypeOf('film').feeMax === 3800`; `jobTypeOf('zzz')` throws; `fillText('{customer} drove {car}. {customer} smiled.', {customer:'Bob', car:'Mini'})` equals `Bob drove Mini. Bob smiled.`; `fillText('{customer} x', {})` equals `{customer} x`; for every job `feeMin < feeMax`, `wearMin < wearMax`; across all 16 jobs there are 48 blurbs, 48 success, 48 mishap, 32 disaster strings.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit the four data files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W17: Job types aggregator`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
