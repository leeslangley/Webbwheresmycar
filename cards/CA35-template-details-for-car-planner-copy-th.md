[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA35 TEMPLATE: details for {car} (planner: copy this card once per car, replacing {car} and {dossier_card})

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA35
Needs (already merged into `dev`): CA01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Fill the structured details file for the game car `{car}` (planner: replace the placeholder with the car id and add the car's dossier card id (D11..D31) to `needs`). Same method as CA25..CA34. Data only.

## Read first
- docs/CAR_DETAILS_SPEC.md (CA01)
- docs/cars/{car}.json (the dossier)
- docs/cars/details/t1_trumpet.json and docs/cars/details/t1_cooker.json (finished examples from CA30 and CA31)
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `docs/cars/details/{car}.json`

## Steps
1. Write `docs/cars/details/{car}.json`: version 2, id, `belt_y`, `window_frame`, `caricature` (eyes 1.15, mouth 1.1, wheels 1.05, bumper 1.1), `wheel`, `roof`, `windows`, `pillars`, and when open `cockpit`; zones in `paint` for any two-tone or stripe the dossier lists.
2. Then translate the dossier's `front`, `rear`, `side_features`, `special` text into parts, one part per feature with the exact numbers the dossier gives: lamps (type from the dossier headlamp shape: pop-up, quad, slanted ...), grille style, bumpers (and overriders), plates, exhaust (count from the dossier), door/bonnet/boot shut lines, handles, badges, strips, creases, vents, fins, running boards, spare wheel, racks. For exotic features no kind covers (gullwing doors, 6 exhausts, a roll bar) put a `note` on the nearest part and list them in your summary as `NEEDS A CAR MODULE: <feature>` so the planner can write a `tools/art/cars/{car}.py` card.
3. At least 24 parts; run `python3 tools/art/details.py docs/cars/details/{car}.json --dossier docs/cars/{car}.json --strict` until it prints `DETAILS OK`.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/details.py docs/cars/details/{car}.json --dossier docs/cars/{car}.json --strict` prints `DETAILS OK {car} parts=` with parts >= 24.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files. This template is used for: t2_fjordcapri t2_trsixish t2_spyder t2_serious t2_zed t2_eclair t2_lancer t2_healthy t2_morganish t2_dees t3_mercedez t3_porshe t3_delorean t3_jagwar t3_cloudy t3_cobbra t3_dinosore t3_lamborgonzo t3_gtforty t3_blowhard t3_aston (21 cars; dossier cards D11..D31 in that order).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA35: TEMPLATE: details for {car} (planner: copy this card once per car, replacing {car} and {dossier_card})`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
