[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash I05 iOS wrapper: instructions for Lee

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: I05
Needs (already merged into `dev`): I04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A short, exact guide so Lee can put the game on his iPhone through TestFlight.

## Read first
- tools/ios/testflight.sh and ios/ (previous cards)
- ~/Documents/Christs of Rage/HANDOFF.md lines about TestFlight (how Lee ships Rage of Christ)

## Files you may change (and nothing else)
- `docs/IOS.md`

## Steps
1. Write `docs/IOS.md` (plain ASCII markdown, 30 to 70 lines): (1) ONE-TIME: in App Store Connect create a new app named `Webb, where's my car?`, bundle id `com.leelangley.webbwheresmycar` (it must be registered first; automatic signing with the API key can register it), SKU `webbwheresmycar`, primary language English (UK); add the internal TestFlight group `Lee`. (2) EACH BUILD: a `git worktree` of the commit to ship, then `source ~/.appstoreconnect/rage.env`, `bash tools/ios/testflight.sh build <name>`, `bash tools/ios/testflight.sh upload <name>`; wait 10-15 minutes for Apple to process; open TestFlight on the iPhone and press Install or Update. (3) Simulator check with no account: the simulator xcodebuild command, then `xcrun simctl boot`, `xcrun simctl install booted <path to .app>`, `xcrun simctl launch booted com.leelangley.webbwheresmycar`. (4) A troubleshooting table: not signed in or key rejected -> check the three env vars (never print them); build number too low -> run build again (the number is the date and time); blank screen -> run `sh tools/ios/sync_www.sh` and check `ios/www/index.html`; no sound until the first tap (an iOS rule). State that no Apple password is ever typed by an assistant.

## Acceptance (all must pass; exact commands)
- `wc -l docs/IOS.md` is between 30 and 70 and `grep -nP '[^\x00-\x7F]' docs/IOS.md` prints nothing.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `I05: iOS wrapper: instructions for Lee`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
