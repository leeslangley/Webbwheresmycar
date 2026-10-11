[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash R07 Real-car dossiers 7 of 8 (t3_cloudy .. t3_lamborgonzo)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: R07
Needs (already merged into `dev`): R00
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Write the real-car dossier file for each of these 4 cars so the 3D model can be built accurately. LEE'S HARD RULE: the finished model must look like the real car, so the figures and the side outline must be accurate, not guessed. Cars: `t3_cloudy` = game name 'Rolls-Roice Silver Cloudy', real car: Rolls-Royce Silver Cloud II/III 1961 (standard steel saloon, upright radiator, long bonnet); `t3_cobbra` = game name 'Shellby Cobbra', real car: Shelby Cobra 289 1965 (AC Ace based roadster, hood DOWN; mention the flared 427 version in notes only); `t3_dinosore` = game name 'Furrari Dino-sore', real car: Ferrari Dino 246 GT 1970 (berlinetta); `t3_lamborgonzo` = game name 'Lamborgonzo Countdown', real car: Lamborghini Countach LP400 1975 (the clean early car, no wing; scissor doors CLOSED).

## Read first
- docs/CAR_DOSSIER_SPEC.md (the whole file: method, coordinate system, every field, the self-check)
- docs/ART_SPEC.md (the old rough outlines for the same cars, to see the format of points: they are too crude, yours must be better)
- `python3 tools/check_dossier.py` (card R00) checks your files

## Files you may change (and nothing else)
- `docs/cars/t3_cloudy.json`
- `docs/cars/t3_cobbra.json`
- `docs/cars/t3_dinosore.json`
- `docs/cars/t3_lamborgonzo.json`

## Steps
1. For EACH car in turn: gather the real figures (length, width, height, wheelbase, tracks, tyre overall diameter) using web search/fetch tools if you have them; then work out the side profile points and the features exactly as `docs/CAR_DOSSIER_SPEC.md` says, and write `docs/cars/<id>.json`.
2. After EACH file run `python3 tools/check_dossier.py docs/cars/<id>.json`. If it prints FAIL, fix the file (usually a height, wheelbase or width figure that does not agree with the profile points) until it prints `DOSSIER OK <id>`. Do the car's arithmetic carefully: unit = overall length / 100, so a car 4000 mm long and 1200 mm high is 30 units high.
3. `git add` and `git commit` after every car (message `R07: <id> dossier`), so work is saved if you run out of time.
4. In your final summary list, per car: id, real car, dims_confidence, and any figure you could not confirm. Be honest: if you had no web access and used memory, say so for each car.

## Acceptance (all must pass; exact commands)
- Each of these exact commands prints `DOSSIER OK <id>`: `python3 tools/check_dossier.py docs/cars/t3_cloudy.json`; `python3 tools/check_dossier.py docs/cars/t3_cobbra.json`; `python3 tools/check_dossier.py docs/cars/t3_dinosore.json`; `python3 tools/check_dossier.py docs/cars/t3_lamborgonzo.json`.
- `git diff --stat dev...HEAD` lists only the 4 dossier files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No other cars. No code. No downloading of images or photos (ref_urls are links only).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `R07: Real-car dossiers 7 of 8 (t3_cloudy .. t3_lamborgonzo)`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
