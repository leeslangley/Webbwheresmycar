[Project: Webbwheresmycar]
# Task: [GLM-SPARK] Sparks-alias-glm-5.3-flash W07 Car catalogue data: Tier 2 (proper classics)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W07
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (Sparks-alias-glm-5.3-flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the 10 catalogue cars of Tier 2 (proper classics) as plain data, transcribed exactly, plus a test that locks the values.

## Read first
- docs/DESIGN.md section 6 and 4.3 (what the stats mean)

## Files you may change (and nothing else)
- `src/data/cars_t2.js`
- `tests/cars_t2.test.mjs`

## Steps
1. Create `src/data/cars_t2.js` exporting `CARS_T2`, an array of 10 objects in EXACTLY this order. Each object has the keys `id, name, year, archetype, tier, basePrice, baseRent, desirability, maintenance, reliability, quip` (tier is the number 2; `desirability`=D, `maintenance`=M, `reliability`=R). The rows are (id | name | year | archetype | price | rent | D M R | quip):
`t2_fjordcapri` | Fjord Capriccio 3.0 | 1973 | coupe | price 16500 | rent 800 | D6 M4 R4 | "The car every bloke called Kev was born to own."
`t2_trsixish` | Trumph TR-Sixish | 1971 | roadster | price 19000 | rent 900 | D6 M4 R5 | "Six cylinders and a lot of leather."
`t2_spyder` | Alpha Romero Spyder | 1969 | roadster | price 21000 | rent 1000 | D7 M6 R3 | "Gorgeous. Occasionally goes. Mostly doesn't."
`t2_serious` | Land Roamer Serious One | 1955 | boxy | price 22000 | rent 950 | D5 M4 R5 | "Won't win a beauty contest. Will win a field."
`t2_zed` | Dutsun 24-Zed | 1972 | coupe | price 23000 | rent 1050 | D6 M4 R6 | "Japanese, reliable, annoyingly sensible."
`t2_eclair` | Lotos Eclair | 1966 | roadster | price 24000 | rent 1100 | D7 M5 R4 | "Weighs the same as a handbag. Handles like one on ice."
`t2_lancer` | Lanzia Fulvio | 1968 | coupe | price 26000 | rent 1150 | D7 M6 R3 | "Italian charm, Italian electrics."
`t2_healthy` | Austen Healthy 3000 | 1965 | roadster | price 28000 | rent 1250 | D7 M5 R5 | "Big engine, big wheel, big moustache required."
`t2_morganish` | Morgin Plus Four-ish | 1962 | roadster | price 33000 | rent 1400 | D7 M4 R5 | "Built from ash, tradition and stubbornness."
`t2_dees` | Citron Dees-Ess | 1970 | limo | price 38000 | rent 1600 | D8 M7 R3 | "Rises up like a startled cat. Space-age, bonkers."
2. Copy the quip text exactly from the table in DESIGN.md section 6 (the rows above show them); do not alter spelling or punctuation of names.
3. Write `tests/cars_t2.test.mjs` that: (a) imports `CARS_T2` and checks the length is 10; (b) checks the ids in order equal `t2_fjordcapri`, `t2_trsixish`, `t2_spyder`, `t2_serious`, `t2_zed`, `t2_eclair`, `t2_lancer`, `t2_healthy`, `t2_morganish`, `t2_dees`; (c) checks every car has all 11 keys, `typeof` string for id/name/archetype/quip, integers for year/prices/stats, `tier === 2`; (d) checks D, M, R are integers 1-10; (e) checks `archetype` is one of: micro, saloon, beetle, hatch, roadster, coupe, longnose, wedge, gullwing, tourer, limo, boxy, trike; (f) checks `basePrice` is non-decreasing in array order; (g) spot-checks three full rows exactly against the table above (pick the first, a middle and the last row).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c 'id:' src/data/cars_t2.js` prints `10`.

## Out of scope (do not touch)
- Do NOT create `src/data/cars.js` (card W09 does that). Do not touch other tiers.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W07: Car catalogue data: Tier 2 (proper classics)`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
