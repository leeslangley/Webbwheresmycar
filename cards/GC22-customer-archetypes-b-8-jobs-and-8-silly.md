[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC22 Customer archetypes B (8 jobs) and 8 silly extras

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC22
Needs (already merged into `dev`): GC21
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The other eight job customers (surprise, estate, parade, hen, proposal, vicar, panto, chef) and eight silly extras for cameos and 'The X Family', as data for render_customers.py. Same schema as customers_a.json.

## Read first
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- docs/characters/customers_a.json (copy its schema)
- tools/art/customerlib.py (valid hair, hat, accessory and top names)
- src/data/jobs_c.js and src/data/jobs_d.js

## Files you may change (and nothing else)
- `docs/characters/customers_b.json`

## Steps
1. Create `docs/characters/customers_b.json` with the same schema. Jobs: `surprise` one: older (hair_col 4, `none` or `short`), `party_hat`, `sash`, `glasses_round`, `suit` `#8a5a2a`, face `shock`; `estate` one: `short` hair, `suit` `#3a3a8a`, `badge`, face `grin` (shiny too-wide grin); `parade` one: `mayor_hat`, `sash`, `moustache_big`, `robe` `#7a1f2b`, build `broad`, face `smug`; `hen` three: `tiara`, `sash`, `earrings` variations, `dress` `#f06aa8`, `#6f3d86`, `#e8b923`, faces `laugh`, `grin`, `laugh`; `proposal` one: `short`, `bowtie`, `suit` `#243a66`, face `worried`; `vicar` one: `none` hair, `glasses_round`, `robe` `#14141c`, face `happy`; `panto` one: `crown_wig` hat, `earrings`, `dress` `#d9483b`, build `broad`, face `grin`; `chef` one: `chef_hat`, `moustache_big`, `apron` `#ffffff`, face `smug`.
2. Extras (ids `x_pigeon`, `x_knight`, `x_beekeeper`, `x_clown`, `x_lollipop`, `x_ghost`, `x_robot`, `x_family`): each one or three people from the existing names: `x_pigeon` a person with `bowler` and `moustache_big` plus `badge` (the pigeon fancier); `x_knight` `hard_hat` as the helmet and `robe` `#9aa0aa`; `x_beekeeper` `veil` hat, `robe` `#f4e9c8`; `x_clown` `mohawk` hair colour 5, `bowtie`, `suit` `#e8d44a`, face `grin`; `x_lollipop` `hard_hat`, `badge`, `suit` `#e8b923`, face `neutral`; `x_ghost` `veil` hat with `robe` `#ffffff`, face `shock`; `x_robot` `headphones`, `sunglasses`, `robe` `#9aa0aa`, face `neutral`; `x_family` three people (x -0.75, 0, 0.75) of different `build` (broad, average, slim), sizes via `build`, same surname-coloured tops `#3fae49`, faces `happy`, `neutral`, `laugh`. Each also needs `alt`.
3. Validate: `python3 -c` loads the file and asserts 16 archetype ids exactly (8 jobs + 8 extras), every `people` list has 1-3 entries, every person has the keys `skin hair hair_col head hat acc top top_col build x face`. Then run the render script in `--check` mode on it.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/render_customers.py -- --in docs/characters/customers_b.json --out-dir /tmp/gc22 --check` prints `CUSTOMERS PLAN n=32`.
- `python3 -c "import json;d=json.load(open('docs/characters/customers_b.json'));print(len(d['archetypes']))"` prints 16.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC22: Customer archetypes B (8 jobs) and 8 silly extras`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
