[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W65 Auction scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W65
Needs (already merged into `dev`): W45, W46, W47, W50c, W40, W38
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The monthly car auction: look at the lots with their hidden stats, pay to reveal up to two, bid against the computer bidders, then leave so the sales settle.

## Read first
- docs/DESIGN.md section 4.10, 9.5, 9.7
- src/sim/auction.js (lotView, revealStat, placeBid, minBid, bidStep, attendAuction, AUCTION_REVEAL_COST), src/data/paint.js, src/art/cardraw.js, src/core/clock.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/auction.js`
- `tests/scene_auction.test.mjs`

## Steps
1. Create `src/ui/scenes/auction.js` exporting `auctionScene` (id `'auction'`) and `LAYOUT = {prev:{x:40,y:300,w:60,h:80}, next:{x:1180,y:300,w:60,h:80}, picture:{x:120,y:100,w:1040,h:260}, reveals:[{x:60,y:390,w:280,h:50},{x:60,y:446,w:280,h:50},{x:60,y:502,w:280,h:50},{x:60,y:558,w:280,h:50}], bid1:{x:700,y:520,w:260,h:64}, bid3:{x:980,y:520,w:260,h:64}, leave:{x:700,y:600,w:540,h:70}, back:{x:40,y:650,w:200,h:50}}`. `enter` checks `isAuctionDay(state.day)`; if not, toast `The auction is only on the 24th` and `app.pop()`. Keeps `lotIndex = 0`.
2. Look: an auction hall: wooden stage, a spotlight cone on the lot, a gavel icon, a crowd of silhouettes at the bottom (simple heads, a few paddles that wave when bidding). Show lot `n/6`, lot name (title font 22px), year, `Estimate <money> to <money>`, the car picture via `drawCar` (colour from `paintOf`, cond from the REVEALED condition if revealed else 6 (neutral)), four stat rows `STYLE`, `UPKEEP`, `GRIT`, `CONDITION` each showing `???` (grey) until revealed or the value with a bar; next to each hidden row a button `REVEAL £150` (disabled with the toast `Max 2 reveals per lot` after 2, or `Not enough money`). Current bid text `Bid: <money or none>`, leader `You`, `Rival bidder` or `Nobody`; minimum next bid text. Buttons `BID +1 <money>` (steps 1) and `BID +3 <money>` (steps 3): amounts from `minBid`/`bidStep`. Bids and reveals cost no day, so do NOT use `app.act` for them: call `placeBid(app.state, lotId, steps)` and `revealStat(app.state, lotId, stat)` directly and toast the returned `msg`.
3. Your consigned cars appear in a small panel `YOUR LOTS` listing each car with its reserve. Button `LEAVE & SETTLE` (primary) calls `app.act(() => attendAuction(app.state))`. When `ok` the app handles the day; show nothing else. Prev/next buttons and Left/Right keys change `lotIndex` (wrap around). Escape/BACK pops without settling (only allowed when no lot is led by the player, otherwise toast `You are winning a lot. Settle first`).
4. Write `tests/scene_auction.test.mjs` using `startGame(8)` with `state.day = 24`: the first lot's model name appears; its hidden stats show `???` and the lot's true condition value does not appear anywhere in the texts (assert that the number text is absent when not revealed); tapping the first REVEAL deducts 150 and shows the stat value; three reveals: the third is refused with the toast `Max 2 reveals per lot`; BID +1 toasts and updates the `Bid:` text (set `lot.ceilings = [1,1,1]` to guarantee the player leads and assert leader text `You`); LEAVE & SETTLE settles (cars in the stable, day 25); on day 10 `enter` toasts `The auction is only on the 24th` and pops; next/prev change the lot name; leaving with a led lot via BACK is refused with the toast.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No sim changes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W65: Auction scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
