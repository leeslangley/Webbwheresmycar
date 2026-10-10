[Project: Webbwheresmycar]
# Task: [GLM-SPARK] W49 Car profile data

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W49
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The outline data for the 13 car body types, copied exactly from the art spec.

## Read first
- docs/ART_SPEC.md (the whole file)

## Files you may change (and nothing else)
- `src/art/profiles.js`
- `tests/profiles.test.mjs`

## Steps
1. Create `src/art/profiles.js` exporting `PROFILES` = the object literal inside the code block of `docs/ART_SPEC.md`, copied VERBATIM (all 13 archetypes, same numbers). Also export `PROFILE_KEYS = Object.keys(PROFILES)` and `profileOf(arch)` which returns the profile or throws `Error('unknown archetype ' + arch)`.
2. Write `tests/profiles.test.mjs`: the keys equal (as a sorted list) `beetle, boxy, coupe, gullwing, hatch, limo, longnose, micro, roadster, saloon, tourer, trike, wedge`; for each profile: `lengthPx` between 280 and 500; at least 2 wheels with `r` between 6 and 12 and `x` between -50 and 50; `head` and `tail` exist with numeric fields; every part has `k` in `body, glass, dark, chrome, line`; every non-line part has at least 4 points; line parts have exactly 2; all point x within -51..51 and y within 0..46; every profile has at least one `body` part and at least one `glass` part; `trike` has exactly 3 wheels and the third has `dim: true`; every other profile has exactly 2 wheels; `profileOf('micro').lengthPx === 300`; `profileOf('x')` throws; spot check: `PROFILES.saloon.parts[0].pts.length === 10`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not change any number. Do not write drawing code.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W49: Car profile data`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
