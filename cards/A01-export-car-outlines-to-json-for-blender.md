[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash A01 Export car outlines to JSON for Blender

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: A01
Needs (already merged into `dev`): W49
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Blender will build the 3D cars from the same 13 side-view outlines the game already has. This card exports `PROFILES` (src/art/profiles.js) to a JSON file that a Python script can read.

## Read first
- docs/ART_BIBLE.md
- src/art/profiles.js (PROFILES: lengthPx, wheels, head, tail, parts)
- Makefile

## Files you may change (and nothing else)
- `tools/art/export_profiles.mjs`
- `tools/art/profiles.json`
- `Makefile`
- `tests/art_profiles_json.test.mjs`

## Steps
1. Create `tools/art/export_profiles.mjs` (run with jsc `-m`): `import { PROFILES } from '../../src/art/profiles.js'; print(JSON.stringify(PROFILES, null, 1));`.
2. In the `Makefile` add a target `art-profiles` (also in `.PHONY`) that runs `$(JSC) -m tools/art/export_profiles.mjs > tools/art/profiles.json`. Run it and commit the generated `tools/art/profiles.json`.
3. Write `tests/art_profiles_json.test.mjs`: use jsc's global `read('tools/art/profiles.json')` (relative to the repo root, where `make test` runs) and `JSON.parse` it; assert it deep-equals (`JSON.stringify` of both with the keys sorted by archetype name) the imported `PROFILES`; assert 13 archetypes; assert `trike` has 3 wheels.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `make art-profiles` exits 0 and `git status --short` shows no change to `tools/art/profiles.json` afterwards (the committed file equals a fresh export).
- `python3 -c "import json; d=json.load(open('tools/art/profiles.json')); print(len(d))"` prints `13`.

## Out of scope (do not touch)
- No Blender script yet (card A02).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `A01: Export car outlines to JSON for Blender`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
