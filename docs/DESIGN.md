# Webb, where's my car? — Design Bible

Single source of truth. Every job card cites a section of this file. If a card and this file disagree, the card wins; if you are unsure, stop and report BLOCKED.

## 1. Pitch

Comedy management game. You are **Mark Webb**, boss of **Webb's Wheels**, a classic-car hire firm. You start with a small pot of money and one year (365 days) to build the firm. Every action you take costs exactly one day. Menu-driven, silly, full of daft headlines and daft customers. Heavily inspired by *Rock Star Ate My Hamster* (Codemasters, 1989) but with modern-era graphics.

Platforms: iPhone (landscape, installed as a web app from Safari "Add to Home Screen") and any desktop browser. Same code for both.

Tone: affectionate British slapstick. Never cruel. Mark Webb is a real person and a friend of the author: jokes about him are gentle (his luck, the cars, the customers), never about his real life. No real brand names: every car marque, company and product is a parody with a changed spelling (Section 6). The only real name in the game is Mark Webb, used affectionately.

## 2. What we learned from the original (research)

Rock Star Ate My Hamster (1988/89, C64, Spectrum, Amstrad, Amiga, ST):
- Almost entirely menu-driven. A fixed office screen with the agent and his sidekick (Cecil Pitt and Drop Dead Clive) sat in front of a TV set, a phone and a desk. No scrolling, no action sequences.
- Time passes in chunks as you choose actions (practice, gig, publicity, gifts, record, release). Weekly chart screen every Sunday.
- Goal: win 4 gold discs within a year. Lose by going bankrupt or losing all the band.
- Risk and gamble: publicity stunts could kill a band member, charity gigs might be fake, bootleggers can be paid off or "sent the boys round".
- The humour is the product: satirical band names (Wacky Jacko, Witless Houston), daft chart entries, sarcastic text. Reviewers praised the sarcasm and tunes; they criticised thin depth.
- C64 look: blocky 160x200 multicolour bitmap screens, the 16-colour C64 palette, chunky 8x8 text, barren office, a bleepy chip-tune. Menus are command lists chosen by joystick or keys.

What we keep: fixed-room hub with clickable props, one-action-one-day clock, 4-gold-targets-in-a-year goal, gambling on publicity, headline and chart screens, sarcasm, chunky text.
What we fix: more depth (condition, reliability, auctions, rentals), better feedback and pacing, high-resolution art, touch controls, save games.

## 3. Visual direction ("a C64 game as a pixel artist would paint it today")

- Logical canvas 1280x720 (16:9), always scaled to fit with letterbox bars. Landscape only; portrait shows a "turn your phone sideways" card.
- Hi-res smooth vector art drawn in code (no image files): soft gradients, drop shadows, warm lamp lighting, tiny animations (blinking, bobbing, TV static, dust motes). Cars are drawn by a parametric car drawer (Section 7).
- Colour language comes from the C64 palette (below) so the game feels C64 even though it is smooth. Shades are allowed; flat 8-bit colour banding is not required.
- Fonts: **Press Start 2P** for titles, buttons and numbers (chunky C64 feel); **VT323** for body text and lists (readable at small sizes). Both are in `assets/fonts/` (OFL licensed).
- UI chrome: thick rounded-pixel borders, cream panels on dark blue, black drop-shadow text, a blinking block cursor on the selected menu row.
- Optional CRT filter (scanlines, soft vignette) in Settings, default OFF on iPhone, ON on desktop.

C64 palette (Pepto) used as theme colours:
```
black #000000  white #FFFFFF  red #68372B  cyan #70A4B2
purple #6F3D86  green #588D43  blue #352879  yellow #B8C76F
orange #6F4F25  brown #433900  lightred #9A6759  darkgrey #444444
midgrey #6C6C6C  lightgreen #9AD284  lightblue #6C5EB5  lightgrey #959595
```
Extra "modern" accents allowed: cream #F4E9C8, warm lamp #FFD27A, soft shadow rgba(0,0,0,0.35).

## 4. Rules of the game

### 4.1 Time
- Year = 365 days (no leap day). `state.day` runs 1..365. Month lengths: 31,28,31,30,31,30,31,31,30,31,30,31. Month names: January..December.
- Every successful player action costs exactly **1 day**: it calls `advanceDay(state)` as its last step. A refused action (not enough money, no room, invalid choice) costs no day.
- A "Wait a day" action ("Put the kettle on") also costs a day.
- When `state.day` becomes the first day of a new month, month-end processing runs (Section 4.9) inside `advanceDay`.
- After day 365 has been completed, the year ends (Section 4.11).

### 4.2 Money
- Start: `cash = 20000` (pounds, integers only; always round).
- Cash may only go below 0 through month-end bills. Player actions that cost money are refused if `cash < cost`.
- Overdraft limit: if after month-end bills `cash < -2000` the firm is bankrupt (game over).

### 4.3 Cars
Each car **model** (catalogue entry, Section 6) has: `id`, `name`, `year`, `archetype`, `tier` (1-3), `basePrice`, `baseRent` (monthly), `desirability` D, `maintenance` M, `reliability` R (all 1-10 integers) and a one-line `quip`.

Each car **instance** in the stable has: `id` (unique string like `c1`), `modelId`, `owned` (true = Webb's Wheels owns it; false = rented), `owner` (string, rented only), `rentMonthly` (rented only), `paid` (price paid, owned only), `condition` (float 0-10, one decimal shown), `fault` (null or `{faultId, label, cost}`), `lastServiceDay`, `jobsDone`, `boughtDay`, `impoundedUntil` (0 normally), `rentedAtCondition` (rented only).

Condition acts on everything. Effective stats (all clamped 0-10, never rounded in the maths, shown with one decimal):
```
effD  = D * (0.40 + 0.06 * condition)        // condition 10 -> D, condition 0 -> 0.4*D
effR  = R * (0.30 + 0.07 * condition)        // condition 10 -> R, condition 0 -> 0.3*R
maintMult = 1 + (10 - condition) * 0.08      // condition 10 -> x1.0, condition 0 -> x1.8
valueFactor = 0.50 + 0.05 * condition        // condition 10 -> 1.0, 0 -> 0.5
```
- Market value of a car: `marketValue = round(basePrice * valueFactor * state.market.priceMult)` (priceMult drifts +-3% per month, starts 1.0).
- Monthly running cost of an owned car: `round(M * (60 + basePrice * 0.0025) * maintMult)`.
- Rented cars: pay `rentMonthly` each month-end instead (no running cost). Rent = `baseRent` (+-10% per listing).
- Condition decay: every day an idle car loses `0.01 + (10 - R) * 0.002` condition; every job subtracts that job's wear (Section 4.7). Servicing and repairs add condition back (Section 4.5). Condition is clamped 0-10.
- Garage slots: 3 at the start (`state.garageSlots`); the stable (owned + rented) cannot exceed it. Extra slot upgrade costs £3,000 per slot, max 8 slots (a Workshop action, 1 day).

### 4.4 TV shop (buying and renting)
- `state.shop.listings` holds up to 8 listings. A listing: `{listingId, modelId, mode:'sale'|'rent', price, condition, owner, blurb}`.
  - `mode:'sale'`: `price = round(basePrice * valueFactor(condition) * priceMult * (0.9 + 0.2*random))`.
  - `mode:'rent'`: `price` = monthly rent = `round(baseRent * (0.9 + 0.2*random))`, `owner` = random name from `OWNERS`.
- Starting listings guarantee at least 3 sale listings priced <= £14,000 and at least 2 rent listings of tier 2 or 3.
- Listings refresh every 7 days (day % 7 === 1): 1-3 random listings are replaced. Bought/rented listings are removed immediately and replaced next refresh.
- Tier mix for random listings: tier 1 50%, tier 2 35%, tier 3 15%. Sale/rent split 60/40.
- Condition of listed cars: 3.0-8.0 uniform, rounded to 0.1. Tier 3 cars rarely above 7.
- Buying: pay `price` now. Renting: first month's rent is paid now (one month up-front); then monthly at month-end. Rented cars can be returned any time via the Garage (1 day); returning pays a damage fee of `round(max(0, conditionAtRent - conditionNow) * 0.02 * basePrice)`.

### 4.5 Servicing and repairs (Garage)
Three treatments, each costs 1 day and money, each acts on one car:
| Treatment | Cost | Effect |
|---|---|---|
| Quick tinker | `round(40 + basePrice*0.002)` | +1.0 condition; does not fix a fault |
| Full service | `round(150 + basePrice*0.008)` | +2.5 condition; sets `lastServiceDay = day`; does not fix a fault |
| Fix fault | the fault's `cost` | clears `fault`; also +0.5 condition |
| Full restoration | `round(basePrice*0.06)` (min £1,200) | condition set to 10; clears fault |
A car with a fault cannot be sent on a job until fixed.

### 4.6 Faults and reliability
- Fault roll happens (a) when a car goes out on a job, (b) once per month-end per owned/rented car with a 25% weight.
- `faultChance = clamp(0.02 + (1 - effR/10) * 0.35, 0.02, 0.60)`; month-end roll uses `faultChance * 0.5`.
- If it triggers, pick a fault from the table (data/faults.js): first pick the severity with `weighted`, using these weights, then pick one fault of that severity uniformly:
  - weightMinor = max(20, 70 - (10-condition)*5), weightMedium = 25 + (10-condition)*2, weightMajor = 5 + (10-condition)*3.
- Fault cost = `fault.baseCost * tierMult` with tierMult = 1.0 / 1.8 / 3.5 for tier 1 / 2 / 3. Rounded to nearest £10.
- A major fault in the middle of a job ruins the job (Section 4.7).

### 4.7 Customers and jobs
- Each day `advanceDay` generates booking requests: `expected = 0.20 + 0.006*reputation + 0.015*buzz`; `n = floor(expected)` plus 1 more with probability `expected - floor(expected)`. The requests list holds max 6; new requests beyond 6 are dropped. Requests expire after 4-9 days (`expiresDay`).
- A request: `{id, jobTypeId, customer, fee, minDesirability, minReliability, minCondition, expiresDay, blurb}`. `fee = round(jobType.fee[0] + random*(fee[1]-fee[0]))` then x `(0.85 + 0.30*reputation/100)`.
- The player accepts a request with a car whose effD >= minDesirability, effR >= minReliability, condition >= minCondition and no fault. Accepting costs 1 day and resolves immediately in `advanceDay`'s same call (the job "happens" that day).
- Resolution order: (1) fault roll (Section 4.6): a major fault = **breakdown**; (2) customer/random event roll: mishap 5%, disaster 0.7%; (3) otherwise success.
  - Success: cash += fee; reputation += 2 (+1 if effD >= minDesirability + 2); stats.jobsDone++.
  - Breakdown: cash += round(fee*0.25) (call-out only); reputation -= 4; the fault is applied to the car; stats.jobsFailed++.
  - Mishap: customer pays round(fee*0.6); condition -= wear*2; reputation -1; funny text.
  - Disaster: customer pays 0; condition -= wear*4; one of: car gets a major fault; customer demands £ compensation round(fee*0.5); car is "impounded": set `car.impoundedUntil = day + 3` (it cannot go on jobs until that day). Reputation -6. Funny text.
- Wear (condition lost on success) is `jobType.wear` range, rolled uniform, 1 decimal.
- Customers have silly names from `data/names.js`.

### 4.8 Advertising
- Seven media (Section 8). Each costs money and takes 1 day. Outcome is rolled from that medium's outcome table: each outcome has a weight, a `buzz` gain, an optional `reputation` change, and a funny text. This is the gamble: TV usually pays off but can flop; YouTube is cheap and wild.
- `state.buzz` (0-100) is clamped at 100 and decays by 10% every day (`buzz = round1(buzz*0.9)`, one decimal). Buzz raises the daily request chance (Section 4.7).

### 4.9 Month-end (runs inside advanceDay when a new month starts)
In order: (1) rent for each rented car; (2) running cost for each owned car; (3) garage lease £400 flat ("Webb's Wheels Workshop & Kettle Fund"); (4) idle decay already applied daily; (5) one fault roll per car at half chance; (6) market priceMult drifts by `(random-0.5)*0.06`, clamped 0.85-1.25; (7) auction for the new month is prepared (Section 4.10); (8) bankruptcy check (cash < -2000 -> game over). A `monthReport` object `{month, rent, running, lease, total, cashAfter, newFaults:[...]}` is stored in `state.today.monthReport` and `state.lastMonthReport`.

### 4.10 Auction (monthly)
- Auction day is **day-of-month 24** every month (only when that month has >= 24 days: all of them do). The Auction scene is only available that day; visiting is the player's action for the day (1 day) and it resolves in one visit: the player can make several bids and consign actions, then leaves and the day advances.
- Lots: 6 lots generated at month-end for the coming auction day: `{lotId, modelId, condition (hidden), reserve, revealed:{desirability:false, maintenance:false, reliability:false, condition:false}, seller:'house'}`. The player sees only model name, year, archetype picture and an estimated price range (market value for condition 5.0 +-35%).
- Reveal: pay £150 to reveal one hidden stat of a lot; maximum 2 reveals per lot.
- Player cars consigned to the auction (from the Garage, owned cars only, only before auction day, 0 days cost) are sold on auction day: sale price = `marketValue * (0.85 + 0.40*random)` at least the player's reserve (reserve chosen by the player; if not met the car comes back unsold). Auction house fee 8% of sale price. Best sale tracked in `stats.bestAuctionSale`.
- Bidding: AI bidders (3 per lot) each have a ceiling `marketValue * (0.70 + 0.50*random)`. Ascending bid steps of 5% of reserve. Player bids by choosing "Bid +step", "Bid +3 steps", "Walk away". The lot goes to the highest ceiling vs the player's last bid. Winning costs the hammer price; needs a free garage slot.

### 4.11 Goals, win and lose
Four **Gold Number Plates** (the equivalent of the original's four gold discs). Win the game by holding all four at any time before the year ends:
1. **Plate 1: Fat Cat** — net worth >= £100,000 (cash + market value of owned cars).
2. **Plate 2: Stable Boy** — own at least 6 cars at once.
3. **Plate 3: Household Name** — reputation >= 85.
4. **Plate 4: Hammer Time** — sell a car at auction for >= £100,000.
Lose: bankrupt (Section 4.2), or day 365 ends without all four plates. Final score = netWorth + 5000*platesWon + 100*reputation. Ranks by score: <0 "Pavement Pete", <30k "Learner Driver", <80k "Weekend Mechanic", <150k "Gearbox Guru", <300k "Concours Champion", >=300k "Legend of the Lay-by". Win = all four plates (rank gets "Gold" prefix).

### 4.12 Reputation
0-100, starts 40, clamped.

## 5. The office hub (main screen) and calendar

The main screen is Mark Webb's office, shown at 1280x720, one fixed painted room (like the original). Clickable props (each is a hotspot, 44px minimum touch size):
- **TV set** (centre-left): opens the TV shop (buy/rent).
- **Phone** (desk): opens Bookings (customer requests). Rings and shakes when there are open requests.
- **Garage door** (right): opens the Garage/Stable.
- **Laptop** (desk): opens Advertising.
- **Newspaper** (desk): shows today's headline (read-only, 0 days).
- **Ledger / filing cabinet**: shows finances.
- **Kettle** (side table): "Wait a day".
- **Wall calendar** (left wall, "the calendar on the side"): shows the month page with every past day crossed out in red, today circled, and big text "DAY 123 of 365". When a day passes, the next square gets crossed with a short scribble animation. Month name at top, in a different picture strip per month optional.
- **Auction poster** (wall): glows and is clickable only on auction day (day-of-month 24).
- **Workshop board** (wall): buy an extra garage slot.
- HUD strip along the top: cash, reputation, buzz, plates won (4 little number plates, grey until won).
- Mark Webb sits at the desk (blinks, taps fingers) and his sidekick **Dave "Spanner" Dobbs** (an overalls-wearing mechanic with a cup of tea) leans on the garage door. Their speech bubble shows a one-line comment per day (data/chatter.js).

## 6. Car catalogue (31 cars, parody names)

Columns: id | name | year | archetype | tier | basePrice | baseRent/month | D | M | R | quip.
Archetypes (the car drawer must support all of them): `micro` (tiny saloon), `saloon`, `beetle`, `hatch`, `roadster`, `coupe`, `longnose`, `wedge`, `gullwing`, `tourer`, `limo`, `boxy`, `trike`.

### Tier 1: Bangers and Bargains
| id | name | year | arch | price | rent | D | M | R | quip |
|---|---|---|---|---|---|---|---|---|---|
| t1_allergy | Austen Allergy | 1976 | saloon | 3500 | 220 | 1 | 2 | 2 | "Makes you sneeze just looking at it." |
| t1_robbin | Reliable Robbin | 1974 | trike | 4500 | 260 | 2 | 2 | 2 | "Three wheels, zero dignity. Do not corner." |
| t1_chimp | Hillbilly Chimp | 1969 | micro | 5500 | 300 | 3 | 2 | 3 | "Engine in the back, brain also in the back." |
| t1_maurice | Maurice Minor | 1962 | micro | 6500 | 340 | 3 | 2 | 4 | "Humble, wobbly, secretly beloved." |
| t1_volksbeagle | Volksbeagle Bug | 1968 | beetle | 7000 | 380 | 4 | 2 | 5 | "Sounds like a sewing machine in a bucket." |
| t1_trumpet | Trumpet Spitfarm | 1972 | roadster | 8500 | 450 | 4 | 3 | 3 | "Open-top fun until it rains. It will rain." |
| t1_cooker | Minnie Cooker | 1966 | hatch | 9000 | 480 | 5 | 3 | 4 | "Small car, big cheese-wire handling." |
| t1_fjord | Fjord Escorte | 1974 | saloon | 9500 | 500 | 5 | 3 | 4 | "Every wedding in 1978 arrived in one." |
| t1_mgbee | Em-Gee Beeeee | 1970 | roadster | 10500 | 560 | 5 | 3 | 5 | "Wire wheels and optimism." |
| t1_alpaca | Sunbeem Alpaca | 1965 | roadster | 11000 | 600 | 5 | 3 | 4 | "Spits a bit. Looks lovely though." |

### Tier 2: Proper Classics
| id | name | year | arch | price | rent | D | M | R | quip |
|---|---|---|---|---|---|---|---|---|---|
| t2_fjordcapri | Fjord Capriccio 3.0 | 1973 | coupe | 16500 | 800 | 6 | 4 | 4 | "The car every bloke called Kev was born to own." |
| t2_trsixish | Trumph TR-Sixish | 1971 | roadster | 19000 | 900 | 6 | 4 | 5 | "Six cylinders and a lot of leather." |
| t2_spyder | Alpha Romero Spyder | 1969 | roadster | 21000 | 1000 | 7 | 6 | 3 | "Gorgeous. Occasionally goes. Mostly doesn't." |
| t2_serious | Land Roamer Serious One | 1955 | boxy | 22000 | 950 | 5 | 4 | 5 | "Won't win a beauty contest. Will win a field." |
| t2_zed | Dutsun 24-Zed | 1972 | coupe | 23000 | 1050 | 6 | 4 | 6 | "Japanese, reliable, annoyingly sensible." |
| t2_eclair | Lotos Eclair | 1966 | roadster | 24000 | 1100 | 7 | 5 | 4 | "Weighs the same as a handbag. Handles like one on ice." |
| t2_lancer | Lanzia Fulvio | 1968 | coupe | 26000 | 1150 | 7 | 6 | 3 | "Italian charm, Italian electrics." |
| t2_healthy | Austen Healthy 3000 | 1965 | roadster | 28000 | 1250 | 7 | 5 | 5 | "Big engine, big wheel, big moustache required." |
| t2_morganish | Morgin Plus Four-ish | 1962 | roadster | 33000 | 1400 | 7 | 4 | 5 | "Built from ash, tradition and stubbornness." |
| t2_dees | Citron Dees-Ess | 1970 | limo | 38000 | 1600 | 8 | 7 | 3 | "Rises up like a startled cat. Space-age, bonkers." |

### Tier 3: Dream Machines
| id | name | year | arch | price | rent | D | M | R | quip |
|---|---|---|---|---|---|---|---|---|---|
| t3_mercedez | Mercedez Pagoda SL | 1967 | roadster | 42000 | 1900 | 8 | 6 | 6 | "A temple on wheels. Priests not included." |
| t3_porshe | Porshe 9-Eleventy | 1968 | coupe | 45000 | 2000 | 8 | 6 | 6 | "Engine at the wrong end, owners at the wrong price." |
| t3_delorean | DeLoreon DMC-Twelve | 1981 | gullwing | 55000 | 2400 | 8 | 5 | 3 | "Needs 1.21 gigawatts and a miracle." |
| t3_jagwar | Jagwar E-Type | 1963 | longnose | 85000 | 3000 | 9 | 7 | 4 | "The most beautiful car ever made, says everyone, including the car." |
| t3_cloudy | Rolls-Roice Silver Cloudy | 1961 | limo | 95000 | 3200 | 8 | 8 | 7 | "The only sound is the clock. And your bank balance sobbing." |
| t3_cobbra | Shellby Cobbra | 1965 | longnose | 150000 | 4500 | 9 | 7 | 4 | "Hisses. Bites. Insurance company hates it." |
| t3_dinosore | Furrari Dino-sore | 1970 | wedge | 180000 | 5200 | 9 | 9 | 3 | "Extinct in all but price." |
| t3_lamborgonzo | Lamborgonzo Countdown | 1975 | wedge | 220000 | 6000 | 10 | 9 | 2 | "Doors open upwards, hopes go downwards." |
| t3_gtforty | Fjord GT-Forty | 1966 | coupe | 260000 | 6800 | 9 | 8 | 4 | "Forty inches tall. Four hundred ways to go wrong." |
| t3_blowhard | Bentlee Blowhard | 1929 | tourer | 300000 | 7400 | 9 | 9 | 3 | "Green, loud, hand-built, hand-wringing." |
| t3_aston | Aston Martian DB-Fiver | 1964 | coupe | 320000 | 8000 | 10 | 8 | 5 | "Ejector seat button is strictly decorative. Probably." |

(Tier 3 has 11 entries, so the catalogue is 10 + 10 + 11 = 31 cars. The ids above are final.)

## 7. Art direction details (all drawn in code)

### 7.1 Car drawer
`drawCar(ctx, archetype, x, y, scale, opts)` draws a side-on car, facing right, centred on x with its wheel-bottoms at y. `opts = {body:'#hex', roof:'#hex'|null, stripe:'#hex'|null, wheel:'#hex', cond:0..10, t:seconds}`.
- Parametric: each archetype has a table of numbers (length, height, roof start/end, bonnet length, boot length, wheel radius, arch radius, window line). Wheels spin with `t`. Condition < 4 adds rust patches, < 2 adds a smoking exhaust puff.
- All 13 archetypes (Section 6). Archetype 'trike' has 3 wheels (1 front).
- Each catalogue car has a `paint` colour (fixed in the catalogue file `data/paint.js`).

### 7.2 The office
Layered: wall and wallpaper, skirting, floor boards, window with a moving sky, TV set on stand, desk with phone, laptop, newspaper, mug; ledger cabinet; garage door at right; calendar at left; kettle table; lamp glow; rug. Static layers cached to an offscreen canvas; animated props drawn on top.

### 7.3 Characters
Mark Webb: affectionate cartoon caricature: big tousled wavy light-brown hair, round dark-rimmed glasses, light stubble, wide surprised eyes, lopsided half-smile, dark denim jacket over a cream tee (alternative outfit: maroon zip hoodie over a yellow tee); Dave "Spanner" Dobbs: overalls, tea mug. Both vector-drawn with idle animation (blink every 3-5 s, head bob, mug steam).

### 7.4 Scenes
Title, Office, TV Shop, Garage, Advertising, Bookings, Newspaper, Ledger, Auction, Month Report, Year End, Settings. Each is a Scene object (Section 9.5).

## 8. Data tables

### 8.1 Advertising media
| id | name | cost | outcomes (weight: buzz, rep, text idea) |
|---|---|---|---|
| paper | Parish Pump Gazette (local paper) | 150 | 30:0:flop; 60:+8:ok; 10:+15:good |
| internet | Webb-Book banner ads | 300 | 40:0:flop; 45:+10:ok; 14:+20:good; 1:+60:viral |
| magazine | Classic & Sporty Wheels magazine | 600 | 20:0:flop; 50:+20:ok; 25:+32:good; 5:+45:great |
| youtube | WheelTube video | 800 | 55:0 (rep -3):cringe; 20:+15:ok; 15:+35:good; 10:+80:viral |
| radio | Radio Gaga FM | 900 | 25:0:flop; 45:+22:ok; 25:+38:good; 5:+50:great |
| billboard | Billboard on the A-road | 1500 | 15:0:flop; 55:+28:ok; 30:+40:good |
| tv | Channel Fore TV spot | 4000 | 10:+5:flop; 30:+40:ok; 40:+60:good; 20:+90:great |

### 8.2 Job types (16)
`id | name | fee range | minD | minR | minCond | wear range | blurb idea`
| id | name | fee | minD | minR | minCond | wear |
|---|---|---|---|---|---|---|
| wedding | Wedding | 600-1400 | 6 | 5 | 6 | 0.2-0.5 |
| photoshoot | Magazine photo shoot | 400-1000 | 6 | 4 | 5 | 0.1-0.3 |
| concours | Classic car show (concours) | 500-1500 | 7 | 5 | 7 | 0.1-0.4 |
| period | TV costume drama | 900-2200 | 7 | 5 | 5 | 0.3-0.8 |
| musicvideo | Rock band music video | 1200-3000 | 6 | 4 | 4 | 0.8-2.0 |
| stag | Stag do driving day | 500-1100 | 4 | 3 | 3 | 1.0-2.5 |
| prom | School prom arrival | 300-800 | 5 | 5 | 5 | 0.2-0.6 |
| film | Film villain getaway | 1500-3800 | 7 | 5 | 5 | 1.0-3.0 |
| surprise | Retirement surprise | 250-700 | 3 | 4 | 4 | 0.1-0.4 |
| estate | Estate agent brochure | 200-600 | 4 | 3 | 3 | 0.1-0.3 |
| parade | Mayor's carnival parade | 400-900 | 5 | 4 | 4 | 0.4-1.0 |
| hen | Hen weekend | 400-950 | 4 | 3 | 3 | 0.8-2.0 |
| proposal | Marriage proposal | 350-900 | 6 | 5 | 6 | 0.1-0.3 |
| vicar | Vicar's blessing tour | 250-600 | 3 | 4 | 4 | 0.1-0.3 |
| panto | Amateur panto | 300-700 | 4 | 3 | 3 | 0.5-1.5 |
| chef | Celebrity chef taxi | 700-1800 | 7 | 6 | 6 | 0.2-0.6 |
Each job type also has 3 `success`, 3 `mishap`, 2 `disaster` text templates using `{customer}` and `{car}` placeholders.

### 8.3 Faults (24)
Table `data/faults.js`: `{id, label, severity:'minor'|'medium'|'major', baseCost, text}`. 8 minor (baseCost 40-180), 8 medium (500-1400), 8 major (2400-6500). Example: major "gearbox" baseCost 3200 label "Gearbox exploded"; medium "clutch" 900; minor "puncture" 90. The other ids are chosen by the card.

### 8.4 Headlines (Daily Sprocket newspaper)
Headlines are the soul of the game. Four pools in `data/headlines_*.js`, each exporting an array of strings; pools: `generic` (nonsense news, 80 strings), `carworld` (classic-car silliness, 60), `reactive` (templates keyed by game situation, Section 9.4). One headline per day, shown after each action. Style: tabloid pun-driven, 6-14 words, British, e.g. "Vicar's Vauxhall Vanishes: Verger Vexed", "Local man marries Mini; guests blame the carburettor", "Freddie Starr ate my... oh, not again". No swearing, no real politicians or celebrities by name.

## 9. Code architecture (rules for every card)

### 9.1 Stack and rules
- Plain JavaScript ES modules, no frameworks, no npm, no build step. Files are `.js` in `src/`; tests are `.test.mjs` in `tests/`.
- Everything under `src/core`, `src/data`, `src/sim`, `src/save` must be **pure**: no DOM, no `window`, no `document`, no `Date.now()`, no `Math.random()`. Randomness only through `src/core/rng.js` using `state.rng`.
- Tests run with macOS `jsc -m` (JavaScriptCore shell). There is **no console**: use `print()`. There is no `structuredClone`, no `require`. Use `JSON.parse(JSON.stringify(x))` to clone.
- UI code (`src/ui`, `src/art`) may use canvas 2D API but receives `ctx` as a parameter, so it can be tested with `tests/fakectx.js`.
- British spelling in text. Money shown as `£1,234`.
- Max about 300 changed lines and 5 files per card.

### 9.2 Files
```
index.html  manifest.webmanifest  sw.js  Makefile
assets/fonts/*.ttf
src/main.js
src/core/{rng,clock,format,state}.js
src/data/{cars,paint,owners,names,faults,jobtypes,adverts,chatter}.js  (+cars_t1/t2/t3, jobs_a..d, headlines_*.js)
src/sim/{carstats,shop,faultsim,actions,advance,month,adsim,jobsim,auction,endgame}.js
src/save/save.js
src/ui/{canvas,theme,kit,scenes,input}.js   src/ui/scenes/*.js
src/art/{cardraw*,office,characters,tv,calendar}.js
src/audio/{sfx,music}.js
tests/harness.js tests/fakectx.js tests/*.test.mjs
tools/run_tests.sh tools/serve.sh tools/playbot.mjs
```

### 9.3 Module API (exact signatures; all sim functions mutate `state` in place)
```
core/rng.js:    seedRng(state,seed)  rand(state)->[0,1)  randInt(state,lo,hi)->int inclusive  chance(state,p)->bool
                pick(state,arr)  weighted(state,[{w,...}])->item  roundTo(x,step)  clamp(x,lo,hi)
core/clock.js:  MONTH_NAMES, MONTH_LENGTHS, DAYS_IN_YEAR, AUCTION_DAY_OF_MONTH, dateOf(day)->{month(1-12),dayOfMonth,monthName}
                dayOfYearStart(month)  isMonthStart(day)  isAuctionDay(day)  daysLeftInMonth(day)
core/format.js: money(n)->'£1,234' (negatives '-£1,234')  oneDp(n)->string  dateText(day)->'24 March'  stars(n)
core/state.js:  newGameState(seed)->state  (shape in 9.4)
data/cars.js:   CARS, CAR_BY_ID, ARCHETYPES, modelOf(id)  (throws on unknown id)
sim/carstats.js: effD(model,car) effR(model,car) maintMult(car) valueFactor(car) marketValue(state,model,car) runningCost(model,car)
                 idleDecay(model)  changeCondition(car,delta)  isAvailable(state,car)
sim/shop.js:    makeListing(state,opts)  initShop(state)  refreshShop(state)  shouldRefresh(day)
sim/faultsim.js: rollFault(state,model,car,mult)->null|{faultId,label,cost,severity}
sim/news.js:    chooseHeadline(state,situations,ctx)->string
sim/endgame.js: netWorth(state) evaluatePlates(state)->[newPlateKeys] finalScore(state) rankOf(score) checkEnd(state)
sim/auction.js: prepareAuction(state) lotView(state,lotId) revealStat(state,lotId,stat) consignCar(state,carId,reserve) unconsign(state,carId)
                minBid(lot) placeBid(state,lotId,steps) attendAuction(state)
sim/month.js:   monthEnd(state,opts)->report
sim/jobsim.js:  expireRequests(state)  generateRequests(state)
sim/advance.js: advanceDay(state)->void
sim/actions.js: buyCar(state,listingId) rentCar(state,listingId) returnRental(state,carId) sellToDealer(state,carId) buySlot(state) waitDay(state)
sim/garage.js:  serviceCar(state,carId,kind) fixFault(state,carId) restoreCar(state,carId)
sim/adsim.js:   advertise(state,mediaId)
sim/jobresolve.js: acceptJob(state,requestId,carId)->{ok,msg,outcome}
sim/newgame.js: startGame(seed)->state
save/save.js:   SAVE_KEY, serialize(state)->string  deserialize(str)->state|null  saveTo(storage,state)->bool  loadFrom(storage)->state|null
(every action returns {ok:boolean,msg:string}; ok:true means a day has passed; ok:false means nothing changed and no day passed.
 Exception: revealStat, consignCar, unconsign, placeBid cost no day; attendAuction costs the day.)
```

### 9.4 State shape (`newGameState`)
```
{ v:1, seed, rng, day:1, cash:20000, reputation:40, buzz:0, garageSlots:3, nextId:1,
  market:{priceMult:1}, cars:[], shop:{listings:[],refreshedDay:1}, requests:[],
  auction:{month:1,lots:[],consigned:[],lastResults:[]},
  stats:{jobsDone:0,jobsFailed:0,adsRun:0,carsBought:0,carsSold:0,bestAuctionSale:0,faults:0},
  plates:{fatcat:false,stable:false,household:false,hammer:false},
  headlines:[], pending:[], sit:[], today:{day:1,headline:'',events:[],monthReport:null}, lastMonthReport:null,
  flags:{gameOver:false,won:false,reason:''}, log:[] }
```
`pending` = strings written by an action during the day (outcomes); `sit` = situation tags (e.g. 'breakdown','bigwin','viral') written by actions; `advanceDay` moves both into `today` and clears them. `reactive` headline templates: situations `broke` (cash < 1000), `rich` (cash > 50000), `breakdown` (a car broke on a job today), `bigwin` (job fee >= 2000), `viral` (ad buzz >= 80), `fullgarage`, `emptygarage`, `monthend`, `auctionday`. Each situation has 4-6 strings, placeholders `{car}` `{customer}` `{cash}`.

### 9.5 Scene interface
```
scene = { id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y) /* 'down'|'move'|'up', logical coords */, key(app,key) }
app   = { state, scenes, go(sceneId,params), toast(text), now, settings, audio }
```
`ui/scenes.js` implements a stack: `go`, `push`, `pop`, `current()`, and routes input. UI kit draws a Button as `{x,y,w,h,label,enabled,onTap}` entries kept in the scene's hit list (`kit.hitTest(list,x,y)`).

### 9.6 Testing conventions
`tests/harness.js` exports `test(name,fn)`, `eq(a,b,msg)`, `ok(cond,msg)`, `near(a,b,eps,msg)`, `throws(fn,msg)`, `done()` (prints `PASS <file>: <n> tests` or throws). Every `*.test.mjs` ends with `done()`. `make test` runs all and prints the last line `ALL TESTS PASS (<n> files)`.

### 9.7 UI contracts (exact)
```
ui/canvas.js:   LOGICAL_W=1280  LOGICAL_H=720  fitLayout(winW,winH)->{scale,offX,offY,viewW,viewH}
                toLogical(layout,clientX,clientY)->{x,y}|null (null when outside the game rectangle)  isPortrait(winW,winH)->bool
                applyLayout(canvas,win)->{layout,dpr,ctx}  (win = {innerWidth,innerHeight,devicePixelRatio})
ui/theme.js:    PALETTE (named colours incl. the 16 C64 colours + cream, lamp, shadow)  font(kind,px)->css font string (kind 'title'|'body')
                shade(hex,amount)->hex (amount -1..1: + mixes toward white, - toward black)  rgba(hex,alpha)->'rgba(r,g,b,a)'
ui/kit_draw.js: panel(ctx,x,y,w,h,opts)  label(ctx,text,x,y,opts)  wrapLines(ctx,text,maxW,fontStr)->string[]  paragraph(ctx,text,x,y,maxW,opts)->bottomY
                button(ctx,b)  bar(ctx,x,y,w,h,value,max,color)  moneyText(n)->string (uses core/format money)
ui/kit_hits.js: makeHits()->{list,add(id,x,y,w,h,onTap,opts),clear(),hit(x,y)->entry|null}   ScrollList (pure scrolling model for lists)
ui/scenes.js:   createApp(env)->app  (app.go, app.push, app.pop, app.current, app.toast, app.pointer, app.key, app.draw)
tests/fakectx.js: makeCtx()->recording fake 2D context; helpers texts(ctx), count(ctx,name)
```
Scene objects: `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key), leave(app)}` (enter/key/leave optional). Each scene file exports one object named `<name>Scene`. Scenes call sim actions ONLY through `app.act(() => sim.fn(app.state, ...))` which returns that function's `{ok,msg}`; when ok is true `app.act` also autosaves and plays the day transition (news screen). In tests `app.act` is a fake `fn => fn()`.
`app = {state, w:1280, h:720, settings:{crt,sound,music}, scenes:{}, now, toasts:[], act, go, push, pop, current, toast, audio:{play(name)}}`.
Colours: scenes use only `PALETTE` entries. Fonts: titles/buttons `font('title',px)` (Press Start 2P, use px 10-28); body `font('body',px)` (VT323, use px 20-40).
