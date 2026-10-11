[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash D16 Real-car dossier: t2_eclair

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: D16
Needs (already merged into `dev`): R00
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Write ONE real-car dossier file, `docs/cars/t2_eclair.json`, so the 3D model of the game car `t2_eclair` ('Lotos Eclair') can be built to look like the real car: Lotus Elan S3 convertible 1966 (hood DOWN, fixed headlamps, tiny). LEE'S HARD RULE: the finished model must look like the real car, so figures and the side outline must be as accurate as you can make them.

## Read first
- docs/CAR_DOSSIER_SPEC.md (the whole file: method, coordinate system, every field, the self-check)
- docs/ART_SPEC.md (the old rough outline for this car's archetype: too crude, yours must be better)
- tests/fixtures/dossier_ok.json (a complete example of the exact format)
- `python3 tools/check_dossier.py` checks your file

## Files you may change (and nothing else)
- `docs/cars/t2_eclair.json`

## Steps
1. Recall the real car's figures: overall length, width, height, wheelbase, track, tyre overall diameter in mm. You have no web access; use what you reliably know and set `dims_confidence` to `medium` or `low` (never `high` without a figure you are sure of) and say in `notes` which figures are estimates.
2. WRITE THE JSON FILE DIRECTLY BY HAND with the Write tool. Do NOT write Python or other scripts to generate curves or points (an earlier attempt burned 45 minutes doing that and wrote nothing). Work out each outline point by simple arithmetic: unit = overall length / 100, so a car 4000 mm long and 1200 mm high is 30 units high. Use 20 to 24 side_profile points (the checker needs at least 20; do not use more, the model is slow) that follow the real shape (nose, bonnet, windscreen base, roof, rear window, tail, rear bumper, sill line), and ONE greenhouse polygon of 4 to 8 points for the window area. Keep your reasoning short: decide the numbers quickly, write the file, let the checker find mistakes.
3. Run `python3 tools/check_dossier.py docs/cars/t2_eclair.json`. If it prints FAIL, fix the numbers in the file (usually the height, wheelbase or width) and run it again until it prints `DOSSIER OK t2_eclair`.
4. Commit as soon as it prints OK (message `D16: t2_eclair dossier`). Then re-read the file once as a car enthusiast would: does the outline have the right nose, roofline and tail for this exact car? Fix anything wrong, run the checker again, commit again.
5. In your final summary give: the real car, dims_confidence, and each figure you were not sure of.

## Acceptance (all must pass; exact commands)
- `python3 tools/check_dossier.py docs/cars/t2_eclair.json` prints `DOSSIER OK t2_eclair`.
- `git diff --stat dev...HEAD` lists only `docs/cars/t2_eclair.json`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No other cars. No code or scripts. No downloading of images (ref_urls are links only).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `D16: Real-car dossier: t2_eclair`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
