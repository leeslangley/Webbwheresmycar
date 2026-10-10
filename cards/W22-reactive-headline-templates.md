[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W22 Reactive headline templates

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W22
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Headlines that react to what is happening in the player's game (broke, rich, breakdown, big win, viral advert, full garage, empty garage, month end, auction day).

## Read first
- docs/DESIGN.md section 8.4 and 9.4 (reactive situations)

## Files you may change (and nothing else)
- `src/data/headlines_reactive.js`
- `tests/headlines_reactive.test.mjs`

## Steps
1. Create `src/data/headlines_reactive.js` exporting `REACTIVE`, an object whose keys are exactly: `broke, rich, breakdown, bigwin, viral, fullgarage, emptygarage, monthend, auctionday`. Each value is an array of exactly 5 unique headline strings. Placeholders allowed: `{car}` (a car name), `{customer}` (a customer name), `{cash}` (a money amount such as £512). Use the placeholders where natural: `breakdown` headlines must each contain `{car}`; `bigwin` headlines must each contain `{customer}`; `broke` and `rich` headlines must each contain `{cash}`. Meaning: broke = Webb's Wheels has under £1,000; rich = over £50,000; breakdown = a car broke down on a job; bigwin = a job paid £2,000+; viral = an advert went viral; fullgarage = no free garage slots; emptygarage = no cars at all; monthend = the bills landed; auctionday = auction day is here. Style: tabloid newspaper headlines (this is the Daily Sprocket), pun-driven, daft, British, 6-14 words each (20-110 characters), no swearing, no real people, real politicians, real brands or celebrities. Examples of the tone (write NEW ones, do not reuse these): `Vicar's Vauxhall Vanishes: Verger Vexed`, `Local man marries Mini; guests blame carburettor`, `Roundabout declared a nation by confused villagers`.
2. Write `tests/headlines_reactive.test.mjs`: exact key list; each array has 5 unique strings of 20-110 characters; placeholder rules above hold; any `{...}` token in any string is one of `car`, `customer`, `cash`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- One file only.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W22: Reactive headline templates`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
