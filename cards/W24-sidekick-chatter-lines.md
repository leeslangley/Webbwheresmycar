[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W24 Sidekick chatter lines

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W24
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One-line comments from Dave 'Spanner' Dobbs, Mark Webb's sidekick, that appear in a speech bubble in the office.

## Read first
- docs/DESIGN.md section 1 (tone) and 5 (the office)

## Files you may change (and nothing else)
- `src/data/chatter.js`
- `tests/chatter.test.mjs`

## Steps
1. Create `src/data/chatter.js` exporting `CHATTER`, an object with these keys and exact counts: `idle` 20, `broke` 6, `rich` 6, `newmonth` 6, `auctionday` 6, `breakdown` 6, `fullgarage` 4, `emptygarage` 4. Each is an array of unique strings, each 15-70 characters, spoken by Dave (a cheerful, unreliable mechanic who loves tea and says 'Boss' a lot). No placeholders. Example tone (write NEW ones): `Boss, the kettle's broken. Priorities.`
2. Export `chatterFor(state, sit)`: imports `pick` from `../core/rng.js`; if `sit` is a key of CHATTER (and not idle) returns `pick(state, CHATTER[sit])`, otherwise returns `pick(state, CHATTER.idle)`.
3. Write `tests/chatter.test.mjs`: key list and counts as above; all strings unique across the whole object; lengths 15-70; `chatterFor` with a made-up state `{rng: 5}` and sit `'broke'` returns a member of `CHATTER.broke`; sit `'whatever'` returns a member of `CHATTER.idle`; same state seed twice gives the same line.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- One data file plus its test.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W24: Sidekick chatter lines`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
