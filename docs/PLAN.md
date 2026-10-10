# Project Plan: Webb, where's my car?

Status: Phase 0 and Phase 1 cards written (W01-W41). Phase 2 to 4 are outlined below and get full cards just before their wave (rolling-wave planning), because they depend on what the first phases produce.

## How the work is run
- Every card is a Dawn-board card (`[Project: Webbwheresmycar]`, `# Task: [GLM-SPARK] ...`). The cards live in `cards/` (source of truth) and are submitted to the board a wave at a time with `dawn-card new`.
- One git worktree per card: `~/wt/webbwheresmycar/<stem>`, branch `card/<stem>`, branched from `dev`. Local commits only.
- `main` holds docs and the accepted milestones. `dev` is the integration branch: a card branch is merged into `dev` (locally) only after the reviewer passes it and `make test` is green on the merge.
- GLM-5.3-Flash on the Sparks writes the code and self-reviews (re-reads its diff, re-runs acceptance, tries to break it). Then the Sonnet 5.5 `glm-reviewer` gives the verdict. One retry with the reviewer's exact fix notes, then the card is parked for Lee.
- Up to 5 cards run at once; cards in the same wave touch different files so they can run in parallel.
- Mirror: commit on the MacBook first, then push `main` and `dev` to https://github.com/leeslangley/Webbwheresmycar after each passed wave.
- Test gate: `make test` (macOS `jsc -m`, no node needed). Browser/visual checks are done by the planner with screenshots, never by GLM.

## Waves (Phase 0 and 1)
| Wave | Cards | Notes |
|---|---|---|
| 1 | W01 | Harness. Everything waits for this. |
| 2 | W02 W03 W04 W06 W07 | Foundations and first data. |
| 3 | W08 W10 W11 W12 W13 | Data. |
| 4 | W14 W15 W16 W18 W19 | Data. |
| 5 | W20 W21 W22 W24 W05 | Data and state. |
| 6 | W09 W17 W23 W25 W29 | Aggregators and car maths. |
| 7 | W26 W27 W28 W30 W32 | Faults, shop, news, auction lots, requests. |
| 8 | W31 W39 | Month end and saving. |
| 9 | W33 | Day clock. |
| 10 | W34 W35 W36 W37 W38 | All the actions. |
| 11 | W40 W41 | Integration and balance report. |
After wave 11: balance tuning cards written from the real `make playbot` numbers (measure, then fix).

## Phase 0 and 1 card index
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
| W27 | TV shop listings | W25, W10, W09, W02 |
| W28 | Headline chooser | W23, W04, W02 |
| W29 | Goals, net worth and ranks | W25, W05, W03 |
| W30 | Auction lots and stat reveal | W25, W09, W02, W03 |
| W31 | Month-end bills | W25, W26, W30 |
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

## Phase 2: Engine, art and screens (cards written after Phase 1 passes)
UI foundations: canvas fit and pointer mapping (`ui/canvas.js`), theme and fonts (`ui/theme.js`), UI kit (panel, button, text wrap, stat bars, hit lists, `ui/kit.js`), scene stack (`ui/scenes.js`), `index.html` + `src/main.js` game loop, fake canvas context for tests.
Art (all drawn in code): car drawer shared helpers, then three archetype card sets (13 archetypes), office background, Mark Webb and Dave characters with idle animation, TV set with static, wall calendar with crossing-off animation, HUD strip with four number plates.
Scenes: Title, Office hub, TV shop, Garage, Advertising, Bookings (phone), Daily Sprocket newspaper + month report, Ledger and Workshop board, Auction, Year end, Settings.
Wiring: game flow, new/continue, autosave after every action.
Visual review loop: the planner screenshots each scene in the browser pane, then writes small, exact polish cards (colours, spacing, animation timing).

## Phase 3: Sound, polish, shipping
WebAudio sound effects and a procedural chip-tune style music loop (no audio files), CRT filter option, PWA files (manifest, service worker, icons) so it installs from Safari to the iPhone home screen and works offline, safe-area and touch tuning, performance pass.

## Phase 4: Optional native iPhone app
A minimal Xcode project that hosts the game in a WKWebView, built with Xcode 27 for the iPhone simulator and a device. Needs Lee for signing and App Store steps.

## Risks and how we handle them
- Art quality: code-drawn art by a small model will be rough on the first pass. Mitigation: parametric drawers, the visual review loop above, and the option for Lee to commission or supply SVG/PNG art later (the art modules are isolated).
- Humour quality: GLM writes the gag lists; the planner reads them and sends back a polish card if they are flat.
- Balance: unknown until the bot reports; measure then tune.
- Real person: Mark Webb is real; jokes stay gentle. Mark should see the game before it is public.
