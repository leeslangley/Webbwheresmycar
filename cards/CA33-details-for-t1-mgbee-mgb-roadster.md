[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA33 Details for t1_mgbee (MGB roadster)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA33
Needs (already merged into `dev`): CA01, D09
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Fill the structured details file for the game car `t1_mgbee` so the Blender builder can add its lamps, grille, bumpers, trim, handles and badges. This is data only.

## Read first
- docs/CAR_DETAILS_SPEC.md (CA01: every kind, field and default)
- docs/cars/t1_mgbee.json (the dossier: coordinates and the free-text features you must translate)
- tests/fixtures/details_ok.json (a small valid example)
- Coordinates in every part: car units (1 unit = 0.1 Blender m = `carlib.U`). `x` runs -50 (tail) to +50 (nose); `y` is HEIGHT above ground (Blender Z); `lat` is sideways offset from the centre line (Blender Y). The camera looks from -Y, so side `near` = -Y, `far` = +Y, `both` = both, `centre` = lat 0.

## Files you may change (and nothing else)
- `docs/cars/details/t1_mgbee.json`

## Steps
1. Open `docs/cars/t1_mgbee.json`. Write `docs/cars/details/t1_mgbee.json` (create the folder): version 2, id, `belt_y`, `window_frame`, `caricature`, `wheel` (style and `hub`/`whitewall` from the dossier wheel style and the recognisers below), `roof`, `windows` and `pillars` (see rules). Then the FRONT parts: the headlamps, small lamps, grille, bumper, plate, badges. 
2. REAR parts: tail lamps, bumper, plate, exhaust, boot or hatch handle, badges, reversing lamp, fuel cap. SIDE parts: strips, creases, shut lines for EVERY door, bonnet and boot lid (a path per line), door handles, mirrors (only if the era had them: say in `note`), vents, fins or running boards if any. At least 24 parts in total.
3. Recognisers for this car (the things a person uses to know it: each must appear as a part, or as `wheel` / `paint` / `roof` setting): classic roadster face: a chrome slatted grille (`vertical_bars` bars 11) with a badge octagon (shape disc, colour red) at the top centre; round recessed headlamps (`bezel` chrome); chrome blade bumpers with overriders (overriders 2); a long chrome strip down the flank (`strip` role sweep); wire wheels with knock-off spinners (`wheel.style` knockoff) when the dossier says wire; `roof.variant` soft_down (or soft_up per dossier) with a `cockpit` block; wing mirrors (`mirror` wing); bonnet bulge (`vent` bulge); chrome door handle; rear lamps rectangular with an amber and red stack; boot badge and an exhaust.
4. Validate and fix until clean: `python3 tools/art/details.py docs/cars/details/t1_mgbee.json --dossier docs/cars/t1_mgbee.json --strict`. Rules for the details file: schema `docs/CAR_DETAILS_SPEC.md` (CA01). Read the dossier's `front`, `rear`, `side_features`, `special`, `side_profile`, `greenhouse`, `wheels`, `typical_paint` and TRANSLATE every feature there into a part with exact numbers from the dossier (never invent a number that the dossier gives). Mirror pairs use `side: both`. `belt_y` = the height of the lowest point of the greenhouse polygon on the doors. `windows` = split the greenhouse into side panes at the B pillar (one pane per door window; one rear quarter pane if any; the windscreen and rear glass stay in the side-view polygon as their slanted outline) with the pillar bands as `pillars` entries (A pillar: from the windscreen base up to the roof along the screen edge, `lat_from` 0.82). `caricature`: `eyes` 1.15, `mouth` 1.1, `wheels` 1.05, `bumper` 1.1 unless a note below says otherwise (the RSAMH-style comic exaggeration).

## Acceptance (all must pass; exact commands)
- `python3 tools/art/details.py docs/cars/details/t1_mgbee.json --dossier docs/cars/t1_mgbee.json --strict` prints `DETAILS OK t1_mgbee parts=` with parts >= 24 and kinds >= 8.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files (do not edit the dossier; if a dossier number looks wrong write `note` and keep it).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA33: Details for t1_mgbee (MGB roadster)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
