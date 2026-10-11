[Project: Webbwheresmycar]
# Task: [GLM-SPARK] Sparks-alias-glm-5.3-flash W01 Test harness and Makefile

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W01
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (Sparks-alias-glm-5.3-flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Create the test gate every later card relies on: a tiny assertion library, a runner that runs every `tests/*.test.mjs` file with macOS `jsc -m`, and a `make test` target. Also a `make serve` target that serves the repo on localhost for browser testing.

## Read first
- docs/DESIGN.md section 9.1 and 9.6
- The jsc binary is at `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`

## Files you may change (and nothing else)
- `Makefile`
- `tools/run_tests.sh`
- `tools/serve.sh`
- `tests/harness.js`
- `tests/harness.test.mjs`

## Steps
1. `Makefile`: set `JSC ?= /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc`, `export JSC`. Targets: `test` (runs `sh tools/run_tests.sh`) and `serve` (runs `sh tools/serve.sh`). Mark both `.PHONY`.
2. `tools/run_tests.sh` (POSIX sh): `cd` to the repo root (the directory above `tools`). Loop over `tests/*.test.mjs` in sorted order. For each file run `"$JSC" -m "$f"` capturing stdout+stderr. If exit code is 0 print `PASS <file>`. Otherwise print `FAIL <file>` followed by the captured output and remember the failure. Count files. At the end: all passed -> print `ALL TESTS PASS (<n> files)` and exit 0; any failed -> print `TESTS FAILED (<k> of <n> files)` and exit 1; zero files -> print `NO TESTS` and exit 1.
3. `tools/serve.sh` (POSIX sh): `cd` to repo root, print `Serving http://127.0.0.1:${PORT:-8000}/`, then `exec python3 -m http.server "${PORT:-8000}" --bind 127.0.0.1`.
4. `tests/harness.js` exports: `test(name, fn)` runs `fn` immediately inside try/catch and counts pass/fail (remember failure messages); `eq(actual, expected, msg)` passes when `actual === expected` for primitives or `JSON.stringify(actual) === JSON.stringify(expected)` for objects/arrays, otherwise throws `Error('eq failed: ' + msg + ' expected ' + JSON.stringify(expected) + ' got ' + JSON.stringify(actual))`; `ok(cond, msg)` throws `Error('ok failed: ' + msg)` when falsy; `near(actual, expected, eps, msg)` throws unless `Math.abs(actual-expected) <= eps`; `throws(fn, msg)` throws unless `fn` throws; `done()` prints `ok <n> tests` when there were no failures, otherwise prints one `FAIL <name>: <message>` line per failure and throws `Error('<k> test(s) failed')`. Assertions called outside `test()` simply throw.
5. `tests/harness.test.mjs`: use the harness to test itself. Cases: eq on primitives, eq on nested objects, eq mismatch is caught by `throws`, ok(false) is caught by `throws`, near within and outside eps, throws() fails when the function does not throw (wrap in an outer throws), and a `test()` whose body throws does not abort the file. End with `done()`. NOTE: because `test()` records failures, the self-test must not contain a deliberately failing `test()`; check failure behaviour only through `throws`.

## Acceptance (all must pass; exact commands)
- `make test` exits 0 and its last line is exactly `ALL TESTS PASS (1 files)`.
- `sh tools/run_tests.sh | grep -c '^PASS'` prints `1`.
- Failure path check (do it, then delete the temp file): create `tests/zz_tmp.test.mjs` containing `throw new Error('x');`, run `make test; echo EXIT=$?` and confirm the output has a line `FAIL tests/zz_tmp.test.mjs`, a line starting `TESTS FAILED (1 of 2 files)` and `EXIT=2` (make reports 2 when a recipe fails); then delete the file and rerun `make test` to see `ALL TESTS PASS (1 files)` again.
- `git status --short` shows no leftover `tests/zz_tmp.test.mjs`.

## Out of scope (do not touch)
- No game code. No `index.html`. No `package.json`, no npm, no node.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W01: Test harness and Makefile`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
