[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash R00 Dossier checker for real-car spec files

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: R00
Needs (already merged into `dev`): A01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Every game car is modelled on one real car and described in a JSON dossier (`docs/cars/<id>.json`, format in `docs/CAR_DOSSIER_SPEC.md`). This card writes the checker that other cards run to prove a dossier is complete and sane.

## Read first
- docs/CAR_DOSSIER_SPEC.md (the whole file; it defines every field)
- Makefile (see how `test` is defined)

## Files you may change (and nothing else)
- `tools/check_dossier.py`
- `tests/fixtures/dossier_ok.json`
- `tests/fixtures/dossier_bad.json`
- `tests/run_dossier_check.sh`
- `Makefile`

## Steps
1. Create `tools/check_dossier.py` (python3, standard library only). Usage `python3 tools/check_dossier.py <file.json> [more.json ...]`. For each file print `DOSSIER OK <id>` when valid, otherwise print `DOSSIER FAIL <file>: <reason>` (one line per problem) and finish with exit code 1 if any file failed, else 0.
2. Checks, all of them: (1) the file parses as JSON and the text is pure ASCII (every character code below 128); (2) required keys exist with the right types: id (str), real_car (str), game_name (str), dims_mm (object with positive numbers length width height wheelbase track_front track_rear tyre_overall_diameter), dims_confidence (one of high, medium, low), body_style (str), doors (int 0 to 5), wheels (list of 2 or 3 objects, each with numbers x and r and str style), wheel_arch (str), side_profile (list of 20 to 40 [x,y] number pairs), greenhouse (non-empty list: either a list of [x,y] pairs or a list of such lists), roof (object with type str), plan (object with numbers width_units nose_width_pct tail_width_pct), front (object), rear (object), side_features (list of str), special (list of str), typical_paint (list of 3 or 4 strings each matching #rrggbb), ref_urls (list of 2 or 3 strings starting with https://), notes (str); (3) the file name without .json equals the id; (4) the side_profile x values span at least -49.0 to +49.0 and no x is outside -51 to 51; (5) height check: max(y of side_profile and greenhouse) is within 1.0 of dims_mm.height / dims_mm.length * 100; (6) wheelbase check: the distance between the smallest and largest wheel x is within 1.5 of dims_mm.wheelbase / dims_mm.length * 100 (skip this check when there are 3 wheels); (7) plan.width_units is within 1.0 of dims_mm.width / dims_mm.length * 100; (8) every wheel r is between 2 and 14.
3. Create `tests/fixtures/dossier_ok.json`: a complete valid dossier for a made-up car with id `dossier_ok` (a simple box-shaped car: length 4000, width 1600, height 1200, wheelbase 2400 mm; 24-point side_profile spanning x -50 to 50 with top y 30 including the greenhouse; wheels at x -30 and 30, r 8: so wheelbase 60 units = 2400/4000*100; width_units 40). `real_car` is `Test Car 1970`. Create `tests/fixtures/dossier_bad.json` that is the same but with id `dossier_bad`, height_mm 2000 (so the height check fails) and a non-ASCII character in notes.
4. Create `tests/run_dossier_check.sh` (sh): runs the checker on `dossier_ok.json` and requires exit 0 and the text `DOSSIER OK dossier_ok`; runs it on `dossier_bad.json` and requires exit 1 and the texts `height` and `ASCII`; also copies dossier_ok.json to /tmp/wrongname.json and requires a failure mentioning the file name; prints `DOSSIER CHECKER OK` at the end and exits 0 only if all of that held.
5. In the `Makefile` add the line `sh tests/run_dossier_check.sh` to the end of the `test` recipe (look at how `test` runs `tools/run_tests.sh` and keep its final `ALL TESTS PASS` line as the LAST line of output: run the dossier check BEFORE the JS tests, not after).

## Acceptance (all must pass; exact commands)
- `python3 tools/check_dossier.py tests/fixtures/dossier_ok.json` prints `DOSSIER OK dossier_ok` and exits 0.
- `python3 tools/check_dossier.py tests/fixtures/dossier_bad.json` exits 1 and prints lines mentioning height and ASCII.
- `sh tests/run_dossier_check.sh` prints `DOSSIER CHECKER OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No dossiers for real cars (other cards). No game code.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `R00: Dossier checker for real-car spec files`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
