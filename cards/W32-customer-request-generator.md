[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W32 Customer request generator

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W32
Needs (already merged into `dev`): W17, W10, W25, W02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Create the daily stream of customer booking requests, and remove expired ones.

## Read first
- docs/DESIGN.md section 4.7 (exact rules) and 9.3 (sim/jobsim.js)
- src/data/jobtypes.js (JOB_TYPES, fillText), src/data/names.js (customerName), src/core/rng.js

## Files you may change (and nothing else)
- `src/sim/jobsim.js`
- `tests/jobsim_requests.test.mjs`

## Steps
1. Create `src/sim/jobsim.js` exporting `expireRequests(state)`: removes requests whose `expiresDay < state.day`; returns the number removed.
2. Export `generateRequests(state)`: `expected = 0.20 + 0.006 * state.reputation + 0.015 * state.buzz`; `n = Math.floor(expected)` plus 1 if `chance(state, expected - Math.floor(expected))`. For each of the n: if `state.requests.length >= 6` stop. Otherwise create a request: `job = pick(state, JOB_TYPES)`; `customer = customerName(state)`; `fee = Math.round((job.feeMin + rand(state) * (job.feeMax - job.feeMin)) * (0.85 + 0.30 * state.reputation / 100))`; `{id: 'Q' + state.nextId++, jobTypeId: job.id, customer, fee, minDesirability: job.minD, minReliability: job.minR, minCondition: job.minCond, expiresDay: state.day + randInt(state, 4, 9), blurb: fillText(pick(state, job.blurbs), {customer})}`. Push it to `state.requests`. Return the number added.
3. Write `tests/jobsim_requests.test.mjs`: (a) with reputation 40, buzz 0: over 2000 calls (reset `state.requests = []` and bump `state.nextId` is fine) the mean count added is between 0.38 and 0.50; (b) with reputation 40, buzz 60: mean between 1.28 and 1.40; (c) with 6 requests already present nothing is added; (d) request fields: id string starting 'Q', unique across 200 requests, fee a positive integer within the job's range scaled by 0.85-1.15, `expiresDay` between day+4 and day+9, blurb has no `{`, blurb contains the customer name; thresholds match the job type's minD/minR/minCond; (e) `expireRequests` removes exactly those with `expiresDay < day` (a request expiring today stays); (f) same seed same requests.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No accepting or resolving jobs (card W37). No day advance.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W32: Customer request generator`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
