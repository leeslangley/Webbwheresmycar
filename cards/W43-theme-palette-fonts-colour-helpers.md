[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W43 Theme: palette, fonts, colour helpers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W43
Needs (already merged into `dev`): W01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Shared colours, font strings and two colour helper functions.

## Read first
- docs/DESIGN.md section 3 (palette) and 9.7 (ui/theme.js)

## Files you may change (and nothing else)
- `src/ui/theme.js`
- `tests/theme.test.mjs`

## Steps
1. Create `src/ui/theme.js`. Export `PALETTE` (frozen not required) with these keys and values: the 16 C64 colours `black #000000, white #FFFFFF, red #68372B, cyan #70A4B2, purple #6F3D86, green #588D43, blue #352879, yellow #B8C76F, orange #6F4F25, brown #433900, lightred #9A6759, darkgrey #444444, midgrey #6C6C6C, lightgreen #9AD284, lightblue #6C5EB5, lightgrey #959595`, plus `cream #F4E9C8, paper #FFF7DC, lamp #FFD27A, ink #14102A, good #3FAE49, bad #D9483B, gold #E8B923`.
2. Export `font(kind, px)`: kind `'title'` returns `px + 'px "Press Start 2P", monospace'`; kind `'body'` returns `px + 'px VT323, monospace'`; any other kind throws `Error('bad font kind')`.
3. Export `shade(hex, amount)`: parse `#rrggbb` (case-insensitive); for `amount > 0` each channel becomes `c + (255 - c) * amount`; for `amount < 0` each channel becomes `c * (1 + amount)`; clamp amount to [-1, 1]; round each channel; return lowercase `#rrggbb`. Export `rgba(hex, alpha)` returning `'rgba(r,g,b,alpha)'` (no spaces, alpha printed as given).
4. Write `tests/theme.test.mjs`: PALETTE has 23 keys, all matching `/^#[0-9A-Fa-f]{6}$/`; `font('title',16)` is `16px "Press Start 2P", monospace`; `font('body',24)` is `24px VT323, monospace`; `font('x',1)` throws; `shade('#000000',0.5)` is `#808080`; `shade('#ffffff',-0.5)` is `#808080`; `shade('#336699',0)` is `#336699`; `shade('#336699',1)` is `#ffffff`; `shade('#336699',-1)` is `#000000`; `rgba('#ff0000',0.5)` is `rgba(255,0,0,0.5)`; bad hex throws.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not touch index.html (another card adds the @font-face rules).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W43: Theme: palette, fonts, colour helpers`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
