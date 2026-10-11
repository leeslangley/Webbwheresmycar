[Project: Webbwheresmycar]
# Task: [GLM-SPARK] MiMo-v2.6-Flash W71 Installable web app (PWA) files

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W71
Needs (already merged into `dev`): W51
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (MiMo-v2.6-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
So the game installs from Safari to the iPhone home screen, fills the screen like an app and works offline.

## Read first
- docs/DESIGN.md section 1
- index.html (existing)

## Files you may change (and nothing else)
- `manifest.webmanifest`
- `sw.js`
- `tools/make_icons.py`
- `assets/icons/icon-192.png`
- `assets/icons/icon-512.png`
- `assets/icons/apple-touch-icon.png`
- `index.html`
- `tests/pwa.test.mjs`

## Steps
1. Create `tools/make_icons.py` (python 3.9, standard library only: `zlib`, `struct`) that writes three PNGs: `assets/icons/icon-192.png` (192x192), `assets/icons/icon-512.png` (512x512), `assets/icons/apple-touch-icon.png` (180x180). Each icon: dark blue (`#14102A`) background, a gold (`#E8B923`) rounded number-plate rectangle in the middle (about 70% width, 28% height) with a dark border, and a simple red car silhouette above it made of rectangles/circles drawn by filling pixels. Run it and commit the three PNG files.
2. Create `manifest.webmanifest` (JSON): `name` `Webb, where's my car?`, `short_name` `Webb Wheels`, `start_url` `./index.html`, `scope` `./`, `display` `fullscreen`, `orientation` `landscape`, `background_color` `#14102a`, `theme_color` `#14102a`, `icons` the 192 and 512 PNGs (with `type` `image/png`, `sizes`).
3. Create `sw.js`: a service worker with `const CACHE = 'webb-v1'` and `const ASSETS = [...]` listing `./`, `./index.html`, `./manifest.webmanifest`, the two fonts, the three icons and EVERY `.js` file currently under `src/` (use the real list from `find src -name '*.js' | sort`). `install` caches them all and calls `skipWaiting`; `activate` deletes other caches and claims clients; `fetch` answers from cache first, falling back to the network.
4. Edit `index.html`: add `<link rel="manifest" href="manifest.webmanifest">`, `<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">`, and an inline script at the end of body that registers the service worker (`navigator.serviceWorker.register('sw.js')`, inside a feature test and a try/catch; skip registration on `localhost` addresses to avoid stale caches during development).
5. Write `tests/pwa.test.mjs` (jsc has a global `read(path)` that returns file text, and `read(path, 'binary')` for bytes; paths are relative to the repo root where `make test` runs): parse the manifest JSON and check `name`, `display === 'fullscreen'`, `orientation === 'landscape'`, 2 icons; read `sw.js` as text, extract the ASSETS array entries with a regex (`/'(\.\/[^']*)'/g`), and check that every listed file other than `./` exists (use `read` for each; for the three PNGs check the first 8 bytes equal the PNG signature `137,80,78,71,13,10,26,10`); check every `.js` file listed in `sw.js` appears and that there are at least 20 entries starting with `./src/`; `index.html` text contains `rel="manifest"` and `serviceWorker.register`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `python3 tools/make_icons.py` runs without error and `file assets/icons/*.png` reports PNG image data of the right sizes.

## Out of scope (do not touch)
- Do not change any src file. Do not add dependencies.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W71: Installable web app (PWA) files`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
