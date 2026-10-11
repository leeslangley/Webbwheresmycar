# Project Plan: Webb, where's my car?

Status: all 74 job cards written (W01-W72, with W50 split into W50, W50b, W50c). Dispatch has started (W01 running). Later polish cards will be added after the visual review.

## How the work is run
- Every card is a Dawn-board card (`[Project: Webbwheresmycar]`, `# Task: [GLM-SPARK] ...`). The cards live in `cards/` (source of truth); a card is submitted to the board only when it is about to run (`dawn-card new`), so the shared board is not flooded.
- One git worktree per card: `~/wt/webbwheresmycar/<stem>`, branch `card/<stem>`, branched from `dev`. Local commits only.
- `main` holds docs and accepted milestones. `dev` is the integration branch: a card branch is merged into `dev` locally only after the reviewer passes it and `make test` is green on the merge.
- GLM-5.3-Flash on the DGX Sparks writes the code and self-reviews (re-reads its diff, re-runs acceptance, tries to break it). Then the Sonnet 5.5 `glm-reviewer` gives the verdict. One retry with the reviewer's exact fix notes, then the card is parked for Lee.
- Dispatch rule: any card whose `Needs` are all merged into `dev` is ready. Run up to 5 at once, never two cards that touch the same file, prefer the cards that unblock the most others. Phase 2 UI foundations and art do not depend on the game logic, so they run alongside Phase 1.
- Mirror: commit on the MacBook first, then push `main` and `dev` to https://github.com/leeslangley/Webbwheresmycar after each passed batch.
- Test gate: `make test` (macOS `jsc -m`, no node needed). Visual checks are done by the planner with screenshots in the browser pane, never by GLM.
- After the logic is complete: `make playbot` produces balance numbers; tuning cards are written from those numbers (measure, then fix).

## Critical path
W01 -> data cards (W06-W24) -> W09/W17/W23 aggregators -> W25 -> W26-W32 -> W33 (day clock) -> W34-W38 (actions) -> W40 (bot playthrough) -> scenes W57-W67 -> W68 (flow) -> visual polish.
Parallel track: W42-W56 (UI kit, car art, office art) can run as soon as W01 is merged.

## Card index
### Phase 0-1: foundations, data, game logic
| Card | Title | Needs |
|---|---|---|
| W01 | Test harness and Makefile | - |
| W02 | Seeded random number module | W01 |
| W03 | Calendar module | W01 |
| W04 | Text formatting helpers | W01 |
| W05 | New game state | W02, W03 |
| W06 | Car catalogue data: Tier 1 (bangers) | W01 |
| W07 | Car catalogue data: Tier 2 (proper classics) | W01 |
| W08 | Car catalogue data: Tier 3 (dream machines) | W01 |
| W09 | Car catalogue aggregator and paint | W06, W07, W08 |
| W10 | Owner and customer name lists | W02 |
| W11 | Faults data | W01 |
| W12 | Advertising media data | W01 |
| W13 | Customer job types data, set A | W01 |
| W14 | Customer job types data, set B | W01 |
| W15 | Customer job types data, set C | W01 |
| W16 | Customer job types data, set D | W01 |
| W17 | Job types aggregator | W13, W14, W15, W16 |
| W18 | Headlines pool: generic_a | W01 |
| W19 | Headlines pool: generic_b | W01 |
| W20 | Headlines pool: carworld_a | W01 |
| W21 | Headlines pool: carworld_b | W01 |
| W22 | Reactive headline templates | W01 |
| W23 | Headlines aggregator | W18, W19, W20, W21, W22 |
| W24 | Sidekick chatter lines | W01 |
| W25 | Car stats and condition maths | W09, W02 |
| W26 | Fault roll | W25, W11, W09 |
| W27 | TV shop listings | W25, W10, W09, W02, W05 |
| W28 | Headline chooser | W23, W04, W02 |
| W29 | Goals, net worth and ranks | W25, W05, W03 |
| W30 | Auction lots and stat reveal | W25, W09, W02, W03 |
| W31 | Month-end bills | W25, W26, W30, W05 |
| W32 | Customer request generator | W17, W10, W25, W02 |
| W33 | The day clock: advanceDay | W26, W27, W28, W29, W31, W32 |
| W34 | Buy, rent, sell actions | W33, W27 |
| W35 | Garage actions: service and repair | W33, W25 |
| W36 | Advertising gamble | W33, W12 |
| W37 | Accept and resolve a customer job | W32, W33, W26, W17 |
| W38 | Auction bidding and sales | W30, W33, W34 |
| W39 | Save and load | W05 |
| W40 | Start a game and bot playthrough test | W34, W35, W36, W37, W38, W39 |
| W41 | Playbot balance report tool | W40 |

### Phase 2: engine, art, screens
| Card | Title | Needs |
|---|---|---|
| W42 | Canvas fit and pointer mapping | W01 |
| W43 | Theme: palette, fonts, colour helpers | W01 |
| W44 | Fake canvas and fake app for tests | W01 |
| W45 | UI kit: drawing helpers | W43, W44, W04 |
| W46 | UI kit: hit areas and scrolling lists | W01 |
| W47 | Scene stack and app object | W44, W45 |
| W48 | Art helpers | W43, W44 |
| W49 | Car profile data | W01 |
| W51 | Browser page and boot code | W42, W43, W47 |
| W52 | Office layout and static background | W43, W44, W48 |
| W53 | Characters: Mark Webb and Dave | W48, W43, W44 |
| W54 | Animated props: TV, phone, laptop, newspaper, kettle | W48, W43, W44 |
| W55 | Wall calendar | W48, W43, W44, W03 |
| W56 | HUD strip | W43, W44, W04, W05, W29 |
| W57 | Title screen | W45, W46, W47, W50c, W44 |
| W58 | Office hub scene | W45, W46, W47, W52, W53, W54, W55, W56, W24, W40 |
| W59 | TV shop scene | W45, W46, W47, W50c, W40, W09 |
| W60 | Garage scene | W45, W46, W47, W50c, W40 |
| W61 | Advertising scene | W45, W46, W47, W50c, W40, W12 |
| W62 | Bookings scene (the phone) | W45, W46, W47, W50c, W40, W17 |
| W63 | Newspaper and month report scene | W45, W47, W40 |
| W64 | Ledger and workshop scene | W45, W47, W29, W34, W40 |
| W65 | Auction scene | W45, W46, W47, W50c, W40, W38 |
| W66 | Year end and game over scene | W45, W47, W29, W40 |
| W67 | Settings scene | W45, W47 |
| W68 | Game flow: wiring everything together | W51, W57, W58, W59, W60, W61, W62, W63, W64, W65, W66, W67, W39, W40 |
| W50 | Car drawer core: flat shapes | W48, W49 |
| W50b | Car drawer finish: paint, glass, arches | W50 |
| W50c | Car drawer wear: rust and smoke | W50b |

### Phase 3: sound, polish, shipping
| Card | Title | Needs |
|---|---|---|
| W69 | Sound effects engine | W01 |
| W70 | Chip-tune music | W69 |
| W71 | Installable web app (PWA) files | W51 |
| W72 | CRT filter overlay | W44, W43 |

## ART PIVOT (11 Oct 2026)
Lee rejected the code-drawn vector art. New route: Blender-rendered modern HD pixel art (see docs/ART_BIBLE.md). Cards A01+ build the render pipeline and the assets; the screens keep their drawing interfaces, and the old code-drawn art modules are replaced by sprite-based ones once the assets exist. Screen logic cards (W58 to W68) continue.

## Visual review loop (after W68)
Open the game in the browser pane, screenshot every scene (desktop and iPhone-sized viewport), then write small exact polish cards (colours, spacing, animation timing, car shapes). Mark Webb's caricature is checked against Lee's reference photos (not stored in the repo).

## Phase 4 (optional): native iPhone app
A minimal Xcode project that hosts the game in a WKWebView, built with Xcode 27 for the simulator and a device. Needs Lee for signing and App Store steps. Not carded yet.

## Risks and how we handle them
- Art quality: code-drawn art by a small model will be rough on the first pass. Mitigation: parametric car drawer with explicit outline data (docs/ART_SPEC.md), the visual review loop, and the option for Lee to supply SVG/PNG art later (art modules are isolated).
- Humour quality: GLM writes the gag lists; the planner reads them and sends a polish card if they are flat.
- Balance: unknown until the bot reports; measure then tune.
- Real people and brands: Mark Webb is real and the hero, so jokes stay gentle and Mark should see the game before it is public. All cars and companies are parodies.
- Shared Sparks: the Rage of Christ queue also uses the Sparks, so cards may wait for a free slot (glm-worker exit 75).

## Polish backlog (collected from reviews; turn into small cards after the logic is done)
- W11 faults: replace curly apostrophes (U+2019) in the `batterydead` and `fuelpump` texts with plain `'` (the pixel fonts may lack the glyph); tighten flat jokes (`engine`, `crankshaft`, `differential`, `sparkplug`, `alternator`, `headgasket` comma splice); assert the `bad severity` error message in the test.
- Check every data card for non-ASCII punctuation (curly quotes, en/em dashes) before the UI cards render them.
- W10 names: owners.js `Petunia Grubb of the Co-op` (real retailer) -> use the Chippy or the Bowls Club; `Auntie Jean and the Morris` -> and the Old Banger; consider replacing LAST `Wilson` (random pairs can match real people).
- W09 paint.js: code comments mention real brand/model words (lotus, healey, Alfa, countach, gulf, guard's); reword to plain colour names (never shown to players, low priority).
- W12 adverts: four texts read clunky after substitution ("TV spot advert", "billboard advert"); drop the trailing word "advert" at adverts.js lines ~261, 298, 308, 318.
- W20 headlines_carworld_a.js humour polish (taste notes from review): line 20 echoes a real album title (rewrite: "Rust never sleeps, but it did nap in the boot, say MOT inspectors"); line 21 muddy (chrome bill / greenhouse); line 24 forced Dino-sore pun; line 15 wheelbarrow logic unclear; line 25 repeats the confused-ferret gag from generic_a (use "one very smug hedgehog").
- W27 tests/shop.test.mjs: the "refreshShop keeps 8 listings" test also asserts the initShop guarantees (>=3 cheap sales, >=2 tier-2+ rents) after a refresh, which only holds by seed luck; reduce it to length 8, unique models, refreshedDay.
- W21 headlines_carworld_b.js humour polish: barn-find/hidden-car jokes repeat (lines 8, 15, 22, 28, 34) and parking-warden lines dominate (about 6); replace weak lines 22, 24, 25, 30, 34 with the reviewer's suggestions (e.g. 'Local man finds classic car under hay; hay was the valuable bit') and add driving-instructor and caravan jokes for variety.
- W22 headlines_reactive.js polish: rich[4] (paper boy/cheques) muddled; bigwin[1] (tank of petrol) does not suggest a big fee; fullgarage[3], auctionday[3] flat; emptygarage[3] says Showroom (should be garage).
- W30 auction.js: revealStat message is 'Max 2 reveals per lot.' (trailing period) while scene card W65 expects the exact toast 'Max 2 reveals per lot'; the scene should show the message returned by the function (note for W65).
- W24 chatter.js polish: newmonth pool has no bills-flavoured line (suggest 'Boss, new month means bills. I hid them under the tea tin.'); a few weak lines; add chatterFor tests for 'toString' and '__proto__'.
- W44 tests/fakectx.js: Proxy get uses `name in t.props`, which also matches inherited names (toString, constructor); switch to Object.prototype.hasOwnProperty.call(t.props, name).
- W35 tests/garage.test.mjs line ~188: a pound sign in a comment (ASCII rule); change to 'GBP 1,200'.
- W34 tests/actions.test.mjs lines ~112, ~271: literal pound signs in strings; use money(...) instead.
- Actions after game over: advertise (and probably other actions) still charge and return ok:true when flags.gameOver is true while advanceDay is a no-op; add a gameOver guard (return {ok:false,msg:'Game over'}) to all actions, or guard in the UI flow card W68.
- W37 jobresolve.js: on a disaster with d=2 or d=3, outcome.faultLabel reports a rolled minor/medium fault that was not applied (set faultLabel = null at the top of the disaster branch); 'bigwin' triggers on the job fee not the amount paid (matches DESIGN 9.4, leave); tests/jobresolve.test.mjs has a vacuous `|| true` assertion (~line 173), does not assert major-fault/TIER_MULT in the breakdown test, does not exercise d=1/2/3 separately, no tests for low-reliability refusal, impounded cars, bigwin or reputation clamp.
- W38 auction.js: literal pound sign at ~line 188 (string) and ~205 (comment); use money(0) / words to keep sim source ASCII (endgame.js and a few tests have the same precedent).
- VISUAL (W52 office background, checked in browser 10 Oct): coherent but bare. Poster line '24th of every month' overflows the poster width (shrink/wrap); rug is a plain rounded rect (add pattern/fringe); desk and TV unit need detail (wood grain, items on desk, wires, cables); wall is flat (add dado rail, picture frames, a plant, skirting detail); consider more warmth/contrast so it reads less dim.
- VISUAL (W50 cars): trike's far-side wheel looks muddy; check car proportions against the catalogue (limo/tourer very long); roadster hood line.
- W56 hud.js: cash panel is 200px wide; a balance like -1,234,567 sticks out 10px (widen to 220). Cash text starts at x 28 inside a panel at x 16 (fine).
- W53d speech.js: with 3 lines the text box bottom is about 92px vs bubble height 90; consider OFFICE.bubble.h 96. null/undefined text draws the words 'null'/'undefined' (harden to empty). Over-wide single words overflow (comment says hard break).
- W53e characters.js line 2: an em dash in a comment (the ASCII-only rule is for player-visible text; the reviewer flagged it and the planner overruled it as cosmetic). Replace with ';' during a cleanup pass.

## CAR LIKENESS REQUIREMENT (Lee, 11 Oct 2026)
"The car models MUST accurately resemble the cars they are based on, however call them by nearly the same name (Rolls Boyce etc)."
- So the 13 shared archetypes are NOT enough for the final art: every one of the 31 cars needs its own model that is recognisably the real car (proportions from real dimensions, correct roofline, nose/tail, lights, grille, wheels, special features such as gullwing doors, Kamm tail, tail fins, three wheels, fabric hood).
- Names stay parody spellings (one or two letters changed, still instantly recognisable). Review all 31 names for being "nearly the same" as the real ones (e.g. Rolls-Roice -> Rolls Boyce if Lee prefers).
- Real-car mapping and dimension/feature dossiers live in `docs/cars/<id>.json` (research, one file per car). The Blender builder is driven by these specs.
- Reference photos are for looking at only; never committed to the repo.
