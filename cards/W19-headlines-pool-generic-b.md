[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W19 Headlines pool: generic_b

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W19
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Write 40 newspaper headlines about more general nonsense news (celebrity-free gossip, sports day, supermarket queues, lost property, gnomes). Nothing about cars. This pool feeds the daily headline screen, so jokes matter more than anything else.

## Read first
- docs/DESIGN.md section 1 (tone) and 8.4

## Files you may change (and nothing else)
- `src/data/headlines_generic_b.js`
- `tests/headlines_generic_b.test.mjs`

## Steps
1. Create `src/data/headlines_generic_b.js` exporting `HEADLINES_GENERIC_B` (array of exactly 40 unique strings). Style: tabloid newspaper headlines (this is the Daily Sprocket), pun-driven, daft, British, 6-14 words each (20-110 characters), no swearing, no real people, real politicians, real brands or celebrities. Examples of the tone (write NEW ones, do not reuse these): `Vicar's Vauxhall Vanishes: Verger Vexed`, `Local man marries Mini; guests blame carburettor`, `Roundabout declared a nation by confused villagers`.
2. Write `tests/headlines_generic_b.test.mjs`: the array has exactly 40 entries; all unique (case-insensitive); each is 20-110 characters; none contains the characters `{` or `}`; none is purely upper case; no entry ends with a space.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- One file only. Do not copy headlines from any real newspaper.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W19: Headlines pool: generic_b`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
