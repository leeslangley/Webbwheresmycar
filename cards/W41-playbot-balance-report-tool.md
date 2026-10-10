[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W41 Playbot balance report tool

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W41
Needs (already merged into `dev`): W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A measuring tool (no tuning yet): runs the bot over many seeds and prints a balance report so we can later tune prices and odds with real numbers.

## Read first
- tests/playthrough.test.mjs (the bot policy; copy its `bot` function into the tool, do not import from tests)
- docs/DESIGN.md section 4.11

## Files you may change (and nothing else)
- `tools/playbot.mjs`
- `Makefile`

## Steps
1. Create `tools/playbot.mjs` (run with `jsc -m`). It has its own copy of the `bot(state)` policy. For seeds 1..100 it plays to the end and then prints EXACTLY these lines at the end (numbers filled in; averages printed with 1 decimal): `SEEDS 100`, `WON n`, `YEAR_END n`, `BANKRUPT n`, `AVG_NETWORTH x`, `AVG_JOBS_DONE x`, `AVG_JOBS_FAILED x`, `AVG_ADS x`, `AVG_FAULTS x`, `AVG_CARS_BOUGHT x`, `AVG_FINAL_REP x`, `PLATES_FATCAT n`, `PLATES_STABLE n`, `PLATES_HOUSEHOLD n`, `PLATES_HAMMER n`, `FIRST_BANKRUPT_DAY_AVG x` (average of the day of bankruptcies, or `0.0` if none). Counts are the number of seeds in which the thing happened (for plates: plate true at game end).
2. In the `Makefile` add a target `playbot` that runs `$(JSC) -m tools/playbot.mjs` and mark it `.PHONY`.

## Acceptance (all must pass; exact commands)
- `make playbot | tail -16 | head -1` prints exactly `SEEDS 100` (the 16 report lines must be the LAST 16 lines of output; do not print anything after them).
- `make playbot | grep -c '^[A-Z_]* '` prints `16`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No changes to any src file or number. Measuring only. Paste the full 16-line report into your summary so the planner can tune.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W41: Playbot balance report tool`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
