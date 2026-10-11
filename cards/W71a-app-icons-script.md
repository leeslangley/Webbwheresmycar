[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W71a App icons script

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W71a
Needs (already merged into `dev`): W51
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A python script that writes three PNG app icons, and the icons.

## Read first
- docs/DESIGN.md section 1 for the look (dark blue, gold number plate)

## Files you may change (and nothing else)
- `tools/make_icons.py`
- `assets/icons/icon-192.png`
- `assets/icons/icon-512.png`
- `assets/icons/apple-touch-icon.png`

## Steps
1. Create `tools/make_icons.py` (python 3.9, standard library only: `zlib`, `struct`) that writes `assets/icons/icon-192.png` (192x192), `assets/icons/icon-512.png` (512x512) and `assets/icons/apple-touch-icon.png` (180x180). Each: dark blue `#14102A` background, a gold `#E8B923` number-plate rectangle in the middle (about 70% width, 28% height) with a dark border, and a simple red car silhouette above it made of filled rectangles and circles. Run it and commit the three PNGs.

## Acceptance (all must pass; exact commands)
- `python3 tools/make_icons.py && file assets/icons/*.png` shows three PNG images of the right sizes.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W71a: App icons script`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
