[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash B01 Balance v1: fatter fees and easier requests

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: B01
Needs (already merged into `dev`): W41, W32
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First balance pass, chosen from measured data (`make playbot`): customers pay 40% more and their requirements are one point easier on style and reliability, so a starter car can actually earn money. Measure first, then change numbers: the exact expected result is given below.

## Read first
- docs/DESIGN.md section 10 (Balance log, the reasoning and expected numbers) and 4.7
- src/sim/jobsim.js (generateRequests)
- tests/jobsim_requests.test.mjs
- tools/playbot.mjs (do not change it)

## Files you may change (and nothing else)
- `src/sim/jobsim.js`
- `tests/jobsim_requests.test.mjs`

## Steps
1. In `src/sim/jobsim.js` add three exported constants near the top: `export const FEE_MULT = 1.4;`, `export const EASE_DESIRABILITY = 1;`, `export const EASE_RELIABILITY = 1;`.
2. In `generateRequests` change the fee to: `const fee = Math.round((job.feeMin + rand(state) * (job.feeMax - job.feeMin)) * (0.85 + 0.30 * state.reputation / 100) * FEE_MULT);` (the same expression as now with `* FEE_MULT` added inside `Math.round`; the order of random draws must NOT change).
3. In the same function change the request thresholds to `minDesirability: Math.max(0, job.minD - EASE_DESIRABILITY)` and `minReliability: Math.max(0, job.minR - EASE_RELIABILITY)`; `minCondition: job.minCond` stays unchanged.
4. Update `tests/jobsim_requests.test.mjs` so it still passes under the new numbers and keeps its meaning: the fee range check must expect `Math.round(job.feeMin * 0.85 * 1.4)` up to `Math.round(job.feeMax * 1.15 * 1.4)` (import `FEE_MULT` and use it rather than writing 1.4 in the test); the threshold checks must expect `Math.max(0, job.minD - 1)` and `Math.max(0, job.minR - 1)` for desirability and reliability (import the EASE constants) and unchanged `minCond`. Add one test that asserts the three constants have the values 1.4, 1, 1.
5. Do NOT change `tools/playbot.mjs`, any data file, or any other test. If another test fails because of these new numbers, report STATUS: BLOCKED naming the test (do not edit it).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `make playbot | grep -E '^(BANKRUPT|AVG_NETWORTH|AVG_JOBS_DONE) '` prints EXACTLY these six lines in this order: `BANKRUPT 8`, `AVG_NETWORTH 3479.9`, `AVG_JOBS_DONE 3.5`, `BANKRUPT 5`, `AVG_NETWORTH 92285.5`, `AVG_JOBS_DONE 143.4` (the first three are the naive bot, the last three the smart bot).
- `make playbot | grep -E '^(PLATES_FATCAT|PLATES_HOUSEHOLD) '` prints exactly: `PLATES_FATCAT 0`, `PLATES_HOUSEHOLD 5`, `PLATES_FATCAT 39`, `PLATES_HOUSEHOLD 96`.

## Out of scope (do not touch)
- Do not touch anything except the two files named. Do not tune any other number (later balance cards do that).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `B01: Balance v1: fatter fees and easier requests`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
