[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC21 Customer archetypes A (8 jobs) and the customer render script

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC21
Needs (already merged into `dev`): GC20, GC17, GC19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The first eight customer types from src/data/jobs_a.js and jobs_b.js (wedding, photoshoot, concours, period, musicvideo, stag, prom, film) as data, and the script that renders each in two variants into pixel busts. Group customers (wedding couple, stag party) are 2-3 people in one wide bust.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/customerlib.py
- src/data/jobs_a.js and src/data/jobs_b.js (job ids and blurbs: the visuals follow the jokes)
- tools/art/charpix.py (arguments)
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)

## Files you may change (and nothing else)
- `docs/characters/customers_a.json`
- `tools/art/render_customers.py`
- `tools/art/render_customers.sh`

## Steps
1. Create `docs/characters/customers_a.json`: `{"archetypes": {"<jobId>": {"people": [person, ...], "face": "<default face>", "alt": {"skin_shift": 2, "hair_col_shift": 3, "top_col": ["#rrggbb", ...]}}}}`, `person` as in customerlib.build_customer. Ids and the look (each has 1-3 people; set `x` = -0.75, 0, 0.75 for three, -0.4, 0.4 for two; `face` neutral unless noted): `wedding` two people: one in `dress` (white `#f4f4f4`, `veil` hat, `tiara`) smiling, one in `tux` (`#1b1b24`, `tophat`, `bowtie`) happy; `photoshoot` one: `beret`, `glasses_square`, `earrings`, a long scarf as `sash`, face `smug`, top `hoodie`; `concours` one: `bowler`, `moustache_big`, `badge`, `suit` `#3a5a3a`, face `smug`; `period` one: `crown_wig`, `bowtie`, `robe` `#7a1f2b`, face `shock`; `musicvideo` two: `mohawk` hair, `sunglasses`, `hoodie` `#14141c` and a `long` hair person with `headphones`; `stag` three: `party_hat`, `sash`, tops `#e8d44a`, `#d9483b`, `#3fae49`, faces `laugh`, `grin`, `worried`; `prom` two: `tux` + `bowtie`, `dress` `#6f3d86` with `tiara`, faces `happy`; `film` one: `beret`, `sunglasses`, `hoodie` `#3a3a42`, accessory `headphones`, face `angry`.
2. Create `tools/art/render_customers.py`: arguments `--in <customers json> [--in <more>...] --out-dir <dir> [--variants 2] [--only <jobId>] [--check]`. For each archetype and variant `k` (0 = as written; 1 = `skin` index `(skin + alt.skin_shift) % 6`, `hair_col` index `(hair_col + alt.hair_col_shift) % 8`, tops recoloured from `alt.top_col` in order): `clear_scene()`, build each person with `customerlib.build_customer`. One person: final frame 96 x 96 (ortho 1.6, centre (0, 1.40)); two or three people: final frame 144 x 96 (ortho 2.4, centre (0, 1.40)); rendered at 4x supersample (384 x 384 or 576 x 384) to `<out-dir>/single/cust_<jobId>_v<k>.png` or `<out-dir>/wide/cust_<jobId>_v<k>.png`. It also writes `<out-dir>/customers_frames.json` = `{"cust_wedding_v0": {"w":144,"h":96}, ...}` (merge with an existing file so a second run with customers_b.json adds to it). `--check` only validates the JSON by building each person once (an unknown part name must fail with a clear message) and prints `CUSTOMERS PLAN n=<files that a full run would write>`; a full run prints `CUSTOMERS OK files=<n>`.
3. Create `tools/art/render_customers.sh` (sh, run from the repo root): for each json in `docs/characters/customers_*.json` run `render_customers.py` (into `/tmp/customers`), then `charpix.py` twice with `--build-palette` (singles: `--in-dir /tmp/customers/single --w 96 --h 96 --palette /tmp/customers/single_palette.json`; groups: `--in-dir /tmp/customers/wide --w 144 --h 96 --palette /tmp/customers/wide_palette.json`), both into `assets/art/characters/`, then `python3 tools/art/build_manifest.py --customers /tmp/customers/customers_frames.json`. Print `RENDER_CUSTOMERS DONE`. Test only the check mode and `--only wedding` for the render script; do not commit generated PNGs.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/render_customers.py -- --in docs/characters/customers_a.json --out-dir /tmp/gc21 --check` prints `CUSTOMERS PLAN n=16`.
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/render_customers.py -- --in docs/characters/customers_a.json --out-dir /tmp/gc21 --only wedding` prints `CUSTOMERS OK files=2`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC21: Customer archetypes A (8 jobs) and the customer render script`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
