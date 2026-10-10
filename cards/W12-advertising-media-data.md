[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W12 Advertising media data

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W12
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The seven places Mark Webb can advertise, each with a cost and a gamble table of outcomes with funny result text.

## Read first
- docs/DESIGN.md section 4.8 and 8.1

## Files you may change (and nothing else)
- `src/data/adverts.js`
- `tests/adverts.test.mjs`

## Steps
1. Create `src/data/adverts.js` exporting `ADVERTS`, an array of 7 media in this order with these costs: `paper` 'Parish Pump Gazette' 150; `internet` 'Webb-Book banner ads' 300; `magazine` 'Classic & Sporty Wheels' 600; `youtube` 'WheelTube video' 800; `radio` 'Radio Gaga FM' 900; `billboard` 'A-road billboard' 1500; `tv` 'Channel Fore TV spot' 4000. Each medium: `{id, name, cost, blurb, outcomes:[{id, w, buzz, rep, texts:[t1,t2]}]}` where `blurb` is one funny line describing the medium.
2. Outcomes per medium (id : weight : buzz : rep). paper: flop 30 0 0; ok 60 8 0; good 10 15 0. internet: flop 40 0 0; ok 45 10 0; good 14 20 0; viral 1 60 0. magazine: flop 20 0 0; ok 50 20 0; good 25 32 0; great 5 45 0. youtube: cringe 55 0 -3; ok 20 15 0; good 15 35 0; viral 10 80 0. radio: flop 25 0 0; ok 45 22 0; good 25 38 0; great 5 50 0. billboard: flop 15 0 0; ok 55 28 0; good 30 40 0. tv: flop 10 5 0; ok 30 40 0; good 40 60 0; great 20 90 0.
3. Each outcome has TWO different funny `texts` (one sentence each, British humour; e.g. a TV flop: `Your advert aired during a power cut. Only the cat saw it.`). Texts may use `{medium}` as a placeholder for the medium name. Texts must all be unique.
4. Export `ADVERT_BY_ID`. Write `tests/adverts.test.mjs`: 7 media in the stated order; costs exactly as listed; for every medium the outcome weights sum to exactly 100; `ADVERT_BY_ID.tv.outcomes.length === 4`; every outcome has exactly 2 non-empty texts; all texts unique; expected buzz of tv (sum of w*buzz/100) is within 0.01 of 54.5; youtube cringe has rep -3 and viral has buzz 80; every `buzz` is between 0 and 100.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Data only. No gamble logic (a later card).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W12: Advertising media data`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
