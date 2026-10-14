[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF14 Godot: API reference docs/GODOT_API.md

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF14
Needs (already merged into `dev`): GDF03, GDF04, GDF05, GDF06, GDF07, GDF08, GDF09, GDF10, GDF11, GDF12, GDF13
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A single reference, written from the code AS BUILT, that the other Godot cards (sim ports, UI, rooms, art) read first. Short, exact, ASCII.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules)
- godot/core/*.gd, godot/autoload/*.gd, godot/ui/tokens.gd, godot/tests/harness.gd, godot/tests/golden_util.gd, godot/tests/runner.gd
- tools/godot/*.sh, tools/godot/*.mjs
- godot/project.godot
- Run `grep -n -E '^(static )?func |^signal |^const |^var |^class_name ' <file>` on each file to get the exact public signatures

## Files you may change (and nothing else)
- `docs/GODOT_API.md`

## Steps
1. Write `docs/GODOT_API.md` (plain ASCII markdown, 120 to 260 lines). One level-2 heading per item, spelled exactly: `## Project layout`, `## CoreJson`, `## CoreRng`, `## CoreClock`, `## CoreFormat`, `## CoreState`, `## CoreSave`, `## Game`, `## Data`, `## Sfx`, `## UiTokens`, `## Tests`, `## Golden fixtures`, `## Conventions`.
2. For each class/autoload heading: file path, `class_name` (or autoload name), then a bullet list with ONE LINE per public function, signal or constant exactly as declared in the code (copy the signature line; add a few words on behaviour only where the JS differs, e.g. out-of-range sentinels, hi/lo inclusive). Do not invent anything: every name in the doc must exist in the code (check with grep).
3. `## Project layout`: the folder list (`autoload/ core/ sim/ data/ scenes/ tv/ ui/ art/ tests/`) with one line each and where the autoloads are registered (project.godot). `## Tests`: how to run all tests and one (`sh tools/godot/gtest.sh`, `sh tools/godot/gtest.sh test_rng`, `make gtest`), the harness helpers, the rule that a test file is `godot/tests/test_<name>.gd` extending `res://tests/harness.gd`, that `autoload(name)` gives the singleton and fixtures are loaded with `GoldenUtil`, and how scenes are checked (`sh tools/godot/gshot.sh scenes/hello.tscn /tmp/x.png`). `## Golden fixtures`: the 4-step pattern (write `tools/godot/golden_<name>.mjs` using `emit`, run `sh tools/godot/golden.sh <name>`, load with `GoldenUtil.fixture`, compare with `GoldenUtil.diff`).
4. `## Conventions` must contain these rules as short bullets: sim ports are `Sim` + PascalCase of the JS file name in `godot/sim/<file>.gd` (e.g. `SimJobResolve`), static functions taking the state Dictionary first, function names are the JS names in snake_case, state keys keep the JS camelCase; every action returns `{ok: bool, msg: String}`; whole JSON numbers are ints, GDScript `/` on ints truncates (convert with `float()`); no `randf`/`randi`/`Time` in sim code, only `CoreRng`; player text ASCII only, pound sign only via `CoreFormat.money()`, stars via `CoreFormat.stars()`; scenes read `Game.state` and call `Game.act(name, params)` only; the JS functions inside data modules (chatterFor, ownerName, customerName, fillText, modelOf, ...) are ported by sim cards, `Data` only serves tables; where the JS threw an error the GDScript returns a sentinel (empty Dictionary, -1, empty String, null).

## Acceptance (all must pass; exact commands)
- `for n in CoreJson CoreRng CoreClock CoreFormat CoreState CoreSave Game Data Sfx UiTokens Tests Conventions; do grep -q "^## $n" docs/GODOT_API.md || echo MISSING $n; done` prints nothing.
- `grep -nP '[^\x00-\x7F]' docs/GODOT_API.md` prints nothing, and `wc -l docs/GODOT_API.md` is between 120 and 260.
- For every function name you documented under CoreRng, e.g. `grep -c 'static func rand_int' godot/core/rng.gd` is 1 (spot check three names per class and paste the output).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Any code change. Describing classes that other planners add later (sim ports, TV, rooms): they add their own sections.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF14: Godot: API reference docs/GODOT_API.md`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
