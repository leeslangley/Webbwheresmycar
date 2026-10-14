[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash I01 iOS wrapper: Swift sources

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: I01
Needs (already merged into `dev`): W51
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The native iPhone shell for the web game: a full-screen WKWebView that serves the bundled game files through a custom `webb://` URL scheme (ES modules do not load from file:// in WKWebView).

## Read first
- index.html and src/boot.js (how the game starts in a browser)
- docs/DESIGN.md section 1 (landscape 1280x720 game, canvas letterboxed)

## Files you may change (and nothing else)
- `ios/Sources/AppDelegate.swift`
- `ios/Sources/GameViewController.swift`
- `ios/Sources/AssetSchemeHandler.swift`
- `ios/Info.plist`

## Steps
1. `AssetSchemeHandler.swift`: `final class AssetSchemeHandler: NSObject, WKURLSchemeHandler` with `init(root: URL)`. `webView(_:start:)`: take `task.request.url?.path`; `/` means `/index.html`; reject any path containing `..` with a 404; read the file under `root` with `Data(contentsOf:)`; answer with an `HTTPURLResponse` (status 200, HTTP/1.1) with `Content-Type` from the extension (html `text/html; charset=utf-8`, js and mjs `text/javascript; charset=utf-8`, json and webmanifest `application/json`, css `text/css`, png `image/png`, jpg `image/jpeg`, svg `image/svg+xml`, woff2 `font/woff2`, woff `font/woff`, ttf `font/ttf`, mp3 `audio/mpeg`, wav `audio/wav`, otherwise `application/octet-stream`), `Content-Length` and `Access-Control-Allow-Origin: *`; then `didReceive(response)`, `didReceive(data)`, `didFinish()`. A missing file: status 404 with an empty body. `webView(_:stop:)` does nothing.
2. `GameViewController.swift`: `final class GameViewController: UIViewController`. In `viewDidLoad` build a `WKWebViewConfiguration`: `setURLSchemeHandler(AssetSchemeHandler(root: <Bundle.main.resourceURL>/www), forURLScheme: "webb")`, `allowsInlineMediaPlayback = true`, `mediaTypesRequiringUserActionForPlayback = []`; create the `WKWebView` filling the view (black background, `isOpaque = false`, `scrollView.isScrollEnabled = false`, `scrollView.bounces = false`, `scrollView.contentInsetAdjustmentBehavior = .never`), `isInspectable = true` in DEBUG builds only, and `load(URLRequest(url: URL(string: "webb://app/index.html")!))`. Override `supportedInterfaceOrientations` -> `.landscape`, `prefersStatusBarHidden` -> true, `prefersHomeIndicatorAutoHidden` -> true, `shouldAutorotate` -> true.
3. `AppDelegate.swift`: `@main final class AppDelegate: UIResponder, UIApplicationDelegate` that creates a `UIWindow` with `GameViewController` as root (no storyboard) in `application(_:didFinishLaunchingWithOptions:)` and returns true; implement `application(_:supportedInterfaceOrientationsFor:)` -> `.landscape`.
4. `ios/Info.plist` (XML plist): `CFBundleDevelopmentRegion` en, `CFBundleDisplayName` `Webb Wheels`, `CFBundleExecutable` `$(EXECUTABLE_NAME)`, `CFBundleIdentifier` `$(PRODUCT_BUNDLE_IDENTIFIER)`, `CFBundleName` `$(PRODUCT_NAME)`, `CFBundlePackageType` `APPL`, `CFBundleShortVersionString` `$(MARKETING_VERSION)`, `CFBundleVersion` `$(CURRENT_PROJECT_VERSION)`, `LSRequiresIPhoneOS` true, `UIRequiresFullScreen` true, `UISupportedInterfaceOrientations` = [`UIInterfaceOrientationLandscapeLeft`, `UIInterfaceOrientationLandscapeRight`], `UIStatusBarHidden` true, `UIViewControllerBasedStatusBarAppearance` true, `ITSAppUsesNonExemptEncryption` false, `UILaunchScreen` as an empty dict. Check it with `plutil -lint ios/Info.plist`.

## Acceptance (all must pass; exact commands)
- `plutil -lint ios/Info.plist` prints OK.
- `xcrun swiftc -typecheck -sdk $(xcrun --sdk iphonesimulator --show-sdk-path) -target arm64-apple-ios16.0-simulator ios/Sources/*.swift` exits 0 with no errors.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `I01: iOS wrapper: Swift sources`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
