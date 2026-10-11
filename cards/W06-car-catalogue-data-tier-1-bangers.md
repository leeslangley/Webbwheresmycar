[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W06 Car catalogue data: Tier 1 (bangers)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W06
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the 10 catalogue cars of Tier 1 (bangers) as plain data, transcribed exactly, plus a test that locks the values.

## Read first
- docs/DESIGN.md section 6 and 4.3 (what the stats mean)

## Files you may change (and nothing else)
- `src/data/cars_t1.js`
- `tests/cars_t1.test.mjs`

## Steps
1. Create `src/data/cars_t1.js` exporting `CARS_T1`, an array of 10 objects in EXACTLY this order. Each object has the keys `id, name, year, archetype, tier, basePrice, baseRent, desirability, maintenance, reliability, quip` (tier is the number 1; `desirability`=D, `maintenance`=M, `reliability`=R). The rows are (id | name | year | archetype | price | rent | D M R | quip):
`t1_allergy` | Austen Allergy | 1976 | saloon | price 3500 | rent 220 | D1 M2 R2 | "Makes you sneeze just looking at it."
`t1_robbin` | Reliable Robbin | 1974 | trike | price 4500 | rent 260 | D2 M2 R2 | "Three wheels, zero dignity. Do not corner."
`t1_chimp` | Hillbilly Chimp | 1969 | micro | price 5500 | rent 300 | D3 M2 R3 | "Engine in the back, brain also in the back."
`t1_maurice` | Maurice Minor | 1962 | micro | price 6500 | rent 340 | D3 M2 R4 | "Humble, wobbly, secretly beloved."
`t1_volksbeagle` | Volksbeagle Bug | 1968 | beetle | price 7000 | rent 380 | D4 M2 R5 | "Sounds like a sewing machine in a bucket."
`t1_trumpet` | Trumpet Spitfarm | 1972 | roadster | price 8500 | rent 450 | D4 M3 R3 | "Open-top fun until it rains. It will rain."
`t1_cooker` | Minnie Cooker | 1966 | hatch | price 9000 | rent 480 | D5 M3 R4 | "Small car, big cheese-wire handling."
`t1_fjord` | Fjord Escorte | 1974 | saloon | price 9500 | rent 500 | D5 M3 R4 | "Every wedding in 1978 arrived in one."
`t1_mgbee` | Em-Gee Beeeee | 1970 | roadster | price 10500 | rent 560 | D5 M3 R5 | "Wire wheels and optimism."
`t1_alpaca` | Sunbeem Alpaca | 1965 | roadster | price 11000 | rent 600 | D5 M3 R4 | "Spits a bit. Looks lovely though."
2. Copy the quip text exactly from the table in DESIGN.md section 6 (the rows above show them); do not alter spelling or punctuation of names.
3. Write `tests/cars_t1.test.mjs` that: (a) imports `CARS_T1` and checks the length is 10; (b) checks the ids in order equal `t1_allergy`, `t1_robbin`, `t1_chimp`, `t1_maurice`, `t1_volksbeagle`, `t1_trumpet`, `t1_cooker`, `t1_fjord`, `t1_mgbee`, `t1_alpaca`; (c) checks every car has all 11 keys, `typeof` string for id/name/archetype/quip, integers for year/prices/stats, `tier === 1`; (d) checks D, M, R are integers 1-10; (e) checks `archetype` is one of: micro, saloon, beetle, hatch, roadster, coupe, longnose, wedge, gullwing, tourer, limo, boxy, trike; (f) checks `basePrice` is non-decreasing in array order; (g) spot-checks three full rows exactly against the table above (pick the first, a middle and the last row).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c 'id:' src/data/cars_t1.js` prints `10`.

## Out of scope (do not touch)
- Do NOT create `src/data/cars.js` (card W09 does that). Do not touch other tiers.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W06: Car catalogue data: Tier 1 (bangers)`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
