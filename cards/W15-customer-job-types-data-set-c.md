[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W15 Customer job types data, set C

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W15
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Four customer job types with their numbers and a lot of funny text. This is where the silly customers live.

## Read first
- docs/DESIGN.md section 1 (tone), 4.7 and 8.2

## Files you may change (and nothing else)
- `src/data/jobs_c.js`
- `tests/jobs_c.test.mjs`

## Steps
1. Create `src/data/jobs_c.js` exporting `JOBS_C`, an array of 4 objects in this order: `surprise`, `estate`, `parade`, `hen`. Each object: `{id, name, feeMin, feeMax, minD, minR, minCond, wearMin, wearMax, blurbs, success, mishap, disaster}`. Numbers (id | name | fee | minD | minR | minCond | wear):
`surprise` | Retirement surprise | fee 250-700 | minD 3 | minR 4 | minCond 4 | wear 0.1-0.4
`estate` | Estate agent brochure | fee 200-600 | minD 4 | minR 3 | minCond 3 | wear 0.1-0.3
`parade` | Mayor's carnival parade | fee 400-900 | minD 5 | minR 4 | minCond 4 | wear 0.4-1.0
`hen` | Hen weekend | fee 400-950 | minD 4 | minR 3 | minCond 3 | wear 0.8-2.0
2. `blurbs`: 3 different one-sentence request descriptions per job, written as the customer would phone in, each containing the placeholder `{customer}` (e.g. for a wedding: `{customer} needs something posh for a wedding. The bride is 40 minutes late already.`).
3. `success`: 3 funny outcome sentences. `mishap`: 3 funny sentences where something silly goes slightly wrong (customer reverses into a hedge, the best man is sick in the boot...). `disaster`: 2 sentences where it goes properly wrong (use farm animals, rivers, vicars, bees, and so on). Every outcome sentence must contain at least one of `{customer}` or `{car}`. Keep each sentence 8-30 words, British humour, affectionate not cruel, no swearing, no real people or brands.
4. Write `tests/jobs_c.test.mjs`: array length 4; ids in order; the numeric fields for every job exactly match the table above; `blurbs` length 3 and each contains `{customer}`; success length 3, mishap length 3, disaster length 2; each outcome string contains `{customer}` or `{car}`; no string contains any other `{...}` placeholder (use a regex to find all `{word}` tokens and assert each is `customer` or `car`); all strings in the file are unique.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do NOT create `src/data/jobtypes.js` (card W17). Other job sets belong to other cards.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W15: Customer job types data, set C`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
