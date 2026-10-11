[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W08 Car catalogue data: Tier 3 (dream machines)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W08
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the 11 catalogue cars of Tier 3 (dream machines) as plain data, transcribed exactly, plus a test that locks the values.

## Read first
- docs/DESIGN.md section 6 and 4.3 (what the stats mean)

## Files you may change (and nothing else)
- `src/data/cars_t3.js`
- `tests/cars_t3.test.mjs`

## Steps
1. Create `src/data/cars_t3.js` exporting `CARS_T3`, an array of 11 objects in EXACTLY this order. Each object has the keys `id, name, year, archetype, tier, basePrice, baseRent, desirability, maintenance, reliability, quip` (tier is the number 3; `desirability`=D, `maintenance`=M, `reliability`=R). The rows are (id | name | year | archetype | price | rent | D M R | quip):
`t3_mercedez` | Mercedez Pagoda SL | 1967 | roadster | price 42000 | rent 1900 | D8 M6 R6 | "A temple on wheels. Priests not included."
`t3_porshe` | Porshe 9-Eleventy | 1968 | coupe | price 45000 | rent 2000 | D8 M6 R6 | "Engine at the wrong end, owners at the wrong price."
`t3_delorean` | DeLoreon DMC-Twelve | 1981 | gullwing | price 55000 | rent 2400 | D8 M5 R3 | "Needs 1.21 gigawatts and a miracle."
`t3_jagwar` | Jagwar E-Type | 1963 | longnose | price 85000 | rent 3000 | D9 M7 R4 | "The most beautiful car ever made, says everyone, including the car."
`t3_cloudy` | Rolls-Roice Silver Cloudy | 1961 | limo | price 95000 | rent 3200 | D8 M8 R7 | "The only sound is the clock. And your bank balance sobbing."
`t3_cobbra` | Shellby Cobbra | 1965 | longnose | price 150000 | rent 4500 | D9 M7 R4 | "Hisses. Bites. Insurance company hates it."
`t3_dinosore` | Furrari Dino-sore | 1970 | wedge | price 180000 | rent 5200 | D9 M9 R3 | "Extinct in all but price."
`t3_lamborgonzo` | Lamborgonzo Countdown | 1975 | wedge | price 220000 | rent 6000 | D10 M9 R2 | "Doors open upwards, hopes go downwards."
`t3_gtforty` | Fjord GT-Forty | 1966 | coupe | price 260000 | rent 6800 | D9 M8 R4 | "Forty inches tall. Four hundred ways to go wrong."
`t3_blowhard` | Bentlee Blowhard | 1929 | tourer | price 300000 | rent 7400 | D9 M9 R3 | "Green, loud, hand-built, hand-wringing."
`t3_aston` | Aston Martian DB-Fiver | 1964 | coupe | price 320000 | rent 8000 | D10 M8 R5 | "Ejector seat button is strictly decorative. Probably."
2. Copy the quip text exactly from the table in DESIGN.md section 6 (the rows above show them); do not alter spelling or punctuation of names.
3. Write `tests/cars_t3.test.mjs` that: (a) imports `CARS_T3` and checks the length is 11; (b) checks the ids in order equal `t3_mercedez`, `t3_porshe`, `t3_delorean`, `t3_jagwar`, `t3_cloudy`, `t3_cobbra`, `t3_dinosore`, `t3_lamborgonzo`, `t3_gtforty`, `t3_blowhard`, `t3_aston`; (c) checks every car has all 11 keys, `typeof` string for id/name/archetype/quip, integers for year/prices/stats, `tier === 3`; (d) checks D, M, R are integers 1-10; (e) checks `archetype` is one of: micro, saloon, beetle, hatch, roadster, coupe, longnose, wedge, gullwing, tourer, limo, boxy, trike; (f) checks `basePrice` is non-decreasing in array order; (g) spot-checks three full rows exactly against the table above (pick the first, a middle and the last row).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c 'id:' src/data/cars_t3.js` prints `11`.

## Out of scope (do not touch)
- Do NOT create `src/data/cars.js` (card W09 does that). Do not touch other tiers.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W08: Car catalogue data: Tier 3 (dream machines)`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
