[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC24 Game: character sprite loader, actor drawing and customer portrait pick

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC24
Needs (already merged into `dev`): GC23, S01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Load assets/art/characters/manifest.json and the PNGs it lists, draw an actor frame (body sprite plus head sprite placed on the neck anchor) with crisp whole-number pixel scale, draw a bust, and pick a customer portrait deterministically from a name and a job id (never using the game's rng).

## Read first
- src/art/sprites.js (copy its loader style, load() that never rejects, env.loadJson/env.loadImage, drawImage with imageSmoothingEnabled=false)
- tests/sprites.test.mjs (fake env, drawArgs helper)
- src/art/anim.js (card GC23: the `at(t)` result: {bodyId, neck, headId})
- Manifest shape: see card GC19 text: `{version, scale:{world,bust}, characters:{<id>:{frame:{w,h}, head:{w,h,pivot:[x,y]}, clips, heads, head_back, bust:{w,h}, busts:{<face>:<id>}}}, customers:{<jobId>:{variants:<n>, w, h, ids:[<id>...]}}}`

## Files you may change (and nothing else)
- `src/art/charsprites.js`
- `tests/charsprites.test.mjs`

## Steps
1. Create `src/art/charsprites.js` exporting `createCharSprites(env)` with `env = {loadJson, loadImage}`: `load()` fetches `assets/art/characters/manifest.json`, collects every id string found in `characters.*.clips.*.frames[].id`, `heads` (all nested ids), `head_back`, `busts` and `customers.*.ids`, loads each `assets/art/characters/<id>.png` (a failing image is skipped; load never rejects; `ready` becomes true at the end). Members: `ready`, `manifest` (the loaded object or null), `has(id)`, `size(id)` -> {w,h} or null (from the loaded image width/height, falling back to the manifest frame sizes), `character(id)` -> the manifest block or null.
2. `drawActor(ctx, charId, frame, x, y, scale)` where `frame` is the object from `actor.at(t)`: `p = Math.max(1, Math.round(scale))`; the body sprite is drawn with its bottom centre at (x, y): `bx = x - w*p/2`, `by = y - h*p`, `ctx.drawImage(img, bx, by, w*p, h*p)`; then the head sprite (`frame.headId`) at `hx = bx + (neck[0] - pivot[0]) * p`, `hy = by + (neck[1] - pivot[1]) * p`, size `hw*p` x `hh*p`; both inside one `ctx.save()` with `imageSmoothingEnabled = false` and `restore()`. Returns true when the body was drawn; a missing body sprite draws nothing and returns false; a missing head still draws the body. `drawBust(ctx, charId, face, x, y, scale)` draws `busts[face]` (fallback `busts.neutral`) with its bottom centre at (x, y), same pixel rule. `drawCustomer(ctx, jobId, variant, x, y, scale)` draws `customers[jobId].ids[variant % ids.length]` the same way, returns false when unknown.
3. `customerPortrait(customers, name, jobId)` (exported as a plain function, not a method; `customers` is the manifest `customers` block): returns the sprite id string: `hash = 5381; for each char code c of the name: hash = ((hash * 33) + c) >>> 0`; names that start with 'The ' and end with ' Family' use the `x_family` entry; otherwise the entry for `jobId`, falling back to the first entry; the id is `entry.ids[hash % entry.ids.length]`; returns null when `customers` is empty or missing. It never uses the game's rng.
4. Create `tests/charsprites.test.mjs` with a fake env (manifest with one character `mark`: frame {w:144,h:144}, head {w:80,h:80,pivot:[40,66]}, clips {idle:{view:'front',fps:3,loop:true,hold:0,frames:[{id:'mark_idle_00',neck:[72,75],angle:'fwd'}]}}, heads {neutral:{fwd:'mark_head_fwd_neutral'}}, busts {neutral:'mark_bust_neutral'}; customers {wedding:{variants:2,w:144,h:96,ids:['cust_wedding_v0','cust_wedding_v1']}, x_family:{variants:1,w:144,h:96,ids:['cust_x_family_v0']}}; loadImage resolves `{width, height}` objects of the right sizes and rejects for any other url). Assert: after `load()` `has('mark_idle_00')` is true and a broken image is skipped; `drawActor(ctx,'mark',{bodyId:'mark_idle_00',neck:[72,75],headId:'mark_head_fwd_neutral'}, 640, 500, 2)` makes exactly two `drawImage` calls: body args `(img, 496, 212, 288, 288)` and head args `(img, 560, 230, 160, 160)` (hx = 496 + (72-40)*2, hy = 212 + (75-66)*2); `imageSmoothingEnabled` set to false and `save`/`restore` balanced; a missing body returns false with no drawImage; a missing head still draws the body; `drawBust` uses the bust sprite and `drawCustomer(ctx,'wedding',3,x,y,2)` uses variant `3 % 2 = 1`; `customerPortrait(c, 'Arthur Crumpet', 'wedding')` returns the same id on repeated calls and always one of the two wedding ids; `customerPortrait(c, 'The Smith Family', 'wedding') == 'cust_x_family_v0'`; `customerPortrait({}, 'x', 'wedding') == null`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep charsprites` shows `PASS tests/charsprites.test.mjs`.
- `grep -c 'Math.random\|Date' src/art/charsprites.js` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC24: Game: character sprite loader, actor drawing and customer portrait pick`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
