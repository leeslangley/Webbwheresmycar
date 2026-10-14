[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash I04 iOS wrapper: TestFlight build script

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: I04
Needs (already merged into `dev`): I02, I03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two commands: `build <name>` makes an unsigned archive of the app; `upload <name>` signs it and sends it to App Store Connect (TestFlight). It copies the approach of Lee's script `docs/ref/roc_testflight.sh` (read it first). Never read or print any Apple key or password.

## Read first
- docs/ref/roc_testflight.sh and ExportOptions.plist (the working example: copy its upload() retry loop and its ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID handling)
- ios/make_project.py (I02) and tools/ios/sync_www.sh (I03)
- Xcode 27 is installed. Build checks use `xcodebuild` for the iOS Simulator only (no signing): `xcodebuild -project ios/WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`.

## Files you may change (and nothing else)
- `tools/ios/testflight.sh`
- `tools/ios/ExportOptions.plist`

## Steps
1. `tools/ios/testflight.sh` (bash, `set -u`, header comment explaining usage). `build <name>`: `cd` to the repo root; `sh tools/ios/sync_www.sh`; build number `N` = `date +%y%m%d%H%M` (digits only, always increasing); `BUILD_NUMBER=$N python3 ios/make_project.py`; `xcodebuild -project ios/WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar -configuration Release -sdk iphoneos -archivePath /tmp/WebbWheresMyCar-<name>.xcarchive CODE_SIGNING_ALLOWED=NO archive`; print the archive path and N. `upload <name>`: needs that archive; export and upload with `xcodebuild -exportArchive -archivePath <archive> -exportOptionsPlist tools/ios/ExportOptions.plist -exportPath /tmp/WebbWheresMyCar-export-<name> -allowProvisioningUpdates` PLUS the API key arguments `-authenticationKeyPath $ASC_KEY_PATH -authenticationKeyID $ASC_KEY_ID -authenticationKeyIssuerID $ASC_ISSUER_ID` when those three env vars are set (the caller runs `source ~/.appstoreconnect/rage.env` first); retry every 30 seconds up to 20 times; print `UPLOAD DONE` on success and `ALREADY AT APPLE` when the log says the build was already uploaded. No arguments or an unknown command: print usage, exit 2.
2. `tools/ios/ExportOptions.plist`: `method` `app-store-connect`, `destination` `upload`, `teamID` `G3G9X5XV82`, `signingStyle` `automatic`, `uploadSymbols` true, `manageAppVersionAndBuildNumber` false. Check with `plutil -lint`.
3. Test only the unsigned build: `bash tools/ios/testflight.sh build ci1` and confirm `/tmp/WebbWheresMyCar-ci1.xcarchive` exists. If the unsigned device archive fails with a signing message, report the exact error in your summary and add `CODE_SIGN_IDENTITY=""` to the build command. Do NOT run `upload`.

## Acceptance (all must pass; exact commands)
- `plutil -lint tools/ios/ExportOptions.plist` prints OK.
- `bash tools/ios/testflight.sh` with no arguments prints usage and exits 2.
- `bash tools/ios/testflight.sh build ci1` ends with the archive path (report the exact output).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `I04: iOS wrapper: TestFlight build script`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
