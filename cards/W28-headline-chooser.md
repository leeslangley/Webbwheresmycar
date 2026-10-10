[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W28 Headline chooser

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W28
Needs (already merged into `dev`): W23, W04, W02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Choose the headline for each new day: sometimes reacting to the player's situation, otherwise a random one that has not been used recently.

## Read first
- docs/DESIGN.md section 8.4 and 9.4
- src/data/headlines.js, src/core/rng.js, src/core/format.js (money)

## Files you may change (and nothing else)
- `src/sim/news.js`
- `tests/news.test.mjs`

## Steps
1. Create `src/sim/news.js` exporting `chooseHeadline(state, situations = [], ctx = {})` returning a string and recording it. Behaviour: (1) if `situations` is non-empty and `chance(state, 0.6)`: `sit = pick(state, situations)`, template = `pick(state, REACTIVE[sit])` (ignore unknown situation names by filtering `situations` to keys of REACTIVE first); (2) otherwise draw from the pool: `weighted(state, [{w:55, pool: GENERIC}, {w:45, pool: CARWORLD}])` then `pick` from that pool; (3) for pool headlines, if the text appears in the first 20 entries of `state.headlines`, retry (up to 10 attempts), then accept whatever you have; (4) fill placeholders: `{car}` -> `ctx.car` or `'a mystery car'`; `{customer}` -> `ctx.customer` or `'a mystery customer'`; `{cash}` -> `money(ctx.cash)` if `ctx.cash` is a number else `'some money'`; (5) `state.headlines.unshift(text)`; keep at most 30 entries; return text.
2. Write `tests/news.test.mjs`: (a) 60 consecutive calls on one state (no situations) never repeat any headline within the last 20 returned; (b) `state.headlines.length` never exceeds 30 and newest is first; (c) same seed gives the same sequence; (d) with `situations=['broke']` and `ctx={cash:512}` over 200 calls on seed 2, at least 80 results contain `£512` (reactive picks) and no result contains `{`; (e) unknown situation `['zzz']` behaves like no situation; (f) with ctx `{car:'Mini Cooker'}` and situation `['breakdown']` over 200 calls at least one result contains `Mini Cooker`; (g) with empty ctx and situation `['breakdown']` no result contains `{`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit data files.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W28: Headline chooser`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
