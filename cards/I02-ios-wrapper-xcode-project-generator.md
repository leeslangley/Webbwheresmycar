[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash I02 iOS wrapper: Xcode project generator

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: I02
Needs (already merged into `dev`): I01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A python script that writes `ios/WebbWheresMyCar.xcodeproj/project.pbxproj`, so the Xcode project is generated, not hand-edited.

## Read first
- Xcode 27 is installed. Build checks use `xcodebuild` for the iOS Simulator only (no signing): `xcodebuild -project ios/WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`.
- ios/Sources/*.swift and ios/Info.plist (from I01)

## Files you may change (and nothing else)
- `ios/make_project.py`
- `ios/Assets.xcassets/Contents.json`
- `ios/Assets.xcassets/AppIcon.appiconset/Contents.json`
- `ios/.gitignore`

## Steps
1. `ios/make_project.py` (python3 standard library only; run from the repo root) writes `ios/WebbWheresMyCar.xcodeproj/project.pbxproj` (create the folder). One app target `WebbWheresMyCar`, product `WebbWheresMyCar.app`, bundle identifier `com.leelangley.webbwheresmycar`, `DEVELOPMENT_TEAM = G3G9X5XV82`, `CODE_SIGN_STYLE = Automatic`, `IPHONEOS_DEPLOYMENT_TARGET = 16.0`, `TARGETED_DEVICE_FAMILY = 1` (iPhone only), `SWIFT_VERSION = 5.0`, `MARKETING_VERSION = 0.1`, `CURRENT_PROJECT_VERSION` from the env var `BUILD_NUMBER` (default `1`), `INFOPLIST_FILE = Info.plist`, `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`, `GENERATE_INFOPLIST_FILE = NO`. Sources build phase: the three Swift files in `Sources/`. Resources build phase: `Assets.xcassets` and a FOLDER REFERENCE to `www` (`lastKnownFileType = folder`, so the whole folder is copied into the bundle as `www/`). Object ids: 24 hex characters made deterministically from `md5(name)`. Also write the shared scheme `ios/WebbWheresMyCar.xcodeproj/xcshareddata/xcschemes/WebbWheresMyCar.xcscheme` so `-scheme WebbWheresMyCar` works.
2. Create `ios/Assets.xcassets/Contents.json` (`{"info":{"version":1,"author":"xcode"}}`) and `ios/Assets.xcassets/AppIcon.appiconset/Contents.json` for the single-size 1024 universal iOS icon (`"images":[{"idiom":"universal","platform":"ios","size":"1024x1024","filename":"icon-1024.png"}]`). Make the PNG with `sips -z 1024 1024 assets/icons/icon-512.png --out ios/Assets.xcassets/AppIcon.appiconset/icon-1024.png` (a placeholder; a better icon comes later).
3. `ios/.gitignore`: `www/`, `build/`, `*.xcarchive`. The script creates an empty `ios/www/index.html` if `ios/www` is missing so the project builds on its own. Run the script, then the simulator build command from Read-first: it must print `BUILD SUCCEEDED`. Commit the generated `ios/WebbWheresMyCar.xcodeproj` too.

## Acceptance (all must pass; exact commands)
- `python3 ios/make_project.py && xcodebuild -project ios/WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -3` shows `BUILD SUCCEEDED`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `I02: iOS wrapper: Xcode project generator`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
