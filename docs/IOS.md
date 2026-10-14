# Webb, where's my car? on the iPhone (TestFlight)

How Lee puts the game on the iPhone. No Apple password is ever typed by an
assistant: uploads are signed with the App Store Connect API key.

## 1. ONE-TIME: App Store Connect

1. Sign in at `appstoreconnect.apple.com` as Lee.
2. My Apps -> the + button -> New App:
   - Name: `Webb, where's my car?`
   - Bundle ID: `com.leelangley.webbwheresmycar` (register it under
     Identifiers first; automatic signing with the API key can do this)
   - SKU: `webbwheresmycar`
   - Primary language: English (UK)
3. TestFlight tab -> create the internal group `Lee` and add Lee's iPhone
   (the Apple ID email on that phone) to it.

## 2. EACH BUILD: ship a build to TestFlight

Make a `git worktree` of the commit to ship, then from it:

    source ~/.appstoreconnect/rage.env
    bash tools/ios/testflight.sh build <name>
    bash tools/ios/testflight.sh upload <name>

- `build` syncs `ios/www`, regenerates the Xcode project with a fresh build
  number (the date and time) and archives to
  `/tmp/WebbWheresMyCar-<name>.xcarchive`.
- `upload` signs and uploads to App Store Connect, retrying every 30 s.
- Wait 10-15 minutes for Apple to process the build.
- On the iPhone: open TestFlight, group `Lee`, press Install (or Update).

## 3. Simulator check (no Apple account needed)

Run from the worktree. The first line copies the game into `ios/www` (git
ignores that folder, so a fresh worktree needs it). To pick another phone,
run `xcrun simctl list devices available` and use any listed iPhone name
in place of `iPhone 17`.

    sh tools/ios/sync_www.sh
    xcodebuild -project ios/WebbWheresMyCar.xcodeproj -scheme WebbWheresMyCar \
      -configuration Debug -sdk iphonesimulator \
      -derivedDataPath /tmp/wmc-sim build
    xcrun simctl boot "iPhone 17"
    xcrun simctl install booted /tmp/wmc-sim/Build/Products/Debug-iphonesimulator/WebbWheresMyCar.app
    xcrun simctl launch booted com.leelangley.webbwheresmycar

## 4. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Not signed in, or the API key is rejected | Check the three env vars from `rage.env` (`ASC_KEY_PATH`, `ASC_KEY_ID`, `ASC_ISSUER_ID`) are set -- never print their values. |
| Build number too low | Run `bash tools/ios/testflight.sh build <name>` again (the number is the date and time, so a fresh one is higher). |
| Blank screen in the app | Run `sh tools/ios/sync_www.sh` and check `ios/www/index.html` exists. |
| No sound until the first tap | That is an iOS rule: audio may start only after the first user tap. Tap once. |
