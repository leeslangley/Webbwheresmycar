[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W11 Faults data

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W11
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The table of things that go wrong with old cars: 24 faults in three severities, each with a funny one-line description.

## Read first
- docs/DESIGN.md section 4.6 and 8.3

## Files you may change (and nothing else)
- `src/data/faults.js`
- `tests/faults.test.mjs`

## Steps
1. Create `src/data/faults.js` exporting `FAULTS`, an array of 24 objects `{id, label, severity, baseCost, text}` in exactly this order (severity | id | label | baseCost):
minor | `puncture` | Puncture | 90
minor | `batterydead` | Flat battery | 110
minor | `blownbulb` | Blown bulb | 40
minor | `wipers` | Wipers snapped | 55
minor | `sparkplug` | Fouled spark plug | 70
minor | `fanbelt` | Fan belt snapped | 120
minor | `horn` | Horn stuck on | 45
minor | `leakyroof` | Leaky roof | 180
medium | `clutch` | Clutch burnt out | 900
medium | `radiator` | Radiator leak | 650
medium | `brakes` | Brakes gave up | 1100
medium | `alternator` | Alternator died | 700
medium | `exhaust` | Exhaust fell off | 800
medium | `suspension` | Suspension collapsed | 1300
medium | `carburettor` | Carburettor tantrum | 950
medium | `fuelpump` | Fuel pump packed in | 600
major | `gearbox` | Gearbox exploded | 3200
major | `engine` | Engine blew up | 6500
major | `headgasket` | Head gasket gone | 2400
major | `chassisrot` | Chassis rot | 5000
major | `differential` | Differential disaster | 2800
major | `wiring` | Wiring fire | 3000
major | `crankshaft` | Crankshaft snapped | 5800
major | `cylinderhead` | Cylinder head cracked | 4200
The `text` for each is a NEW funny one-sentence description (8-14 words, British, e.g. for the gearbox: `The gearbox left the car and joined a circus.`). Texts must be unique.
2. Also export `FAULT_BY_ID` (object keyed by id), `faultsOfSeverity(sev)` (array of faults with that severity; throws `Error('bad severity')` for anything other than minor/medium/major) and `TIER_MULT = {1: 1.0, 2: 1.8, 3: 3.5}`.
3. Write `tests/faults.test.mjs`: 24 faults, 8 of each severity; ids unique; `FAULT_BY_ID.gearbox.baseCost === 3200`; `FAULT_BY_ID.puncture.severity === 'minor'`; `faultsOfSeverity('major').length === 8`; `faultsOfSeverity('x')` throws; texts unique and each has 5-20 words; `TIER_MULT[3] === 3.5`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No simulation logic here, data only.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W11: Faults data`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
