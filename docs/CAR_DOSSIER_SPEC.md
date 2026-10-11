# Car dossier spec (real-car research files)

We are building a comedy classic-car game. Every game car is a parody-named copy of ONE real classic car and its 3D model MUST accurately resemble that real car (Lee's hard requirement). A Blender script will build each car from a JSON spec you write. Your card names the cars you must write specs for. Accuracy of proportions and recognisable features matters more than anything else.

## Method (per car)
1. If your tools include WebSearch/WebFetch, use them (otherwise rely on what you reliably know and set dims_confidence to low or medium; never invent a precise-looking figure you do not know: put your best estimate and say so in notes). Sources:  Wikipedia, manufacturer heritage pages, classic-car sites, Wikimedia Commons file descriptions, to get REAL figures for the exact model/year listed: overall length, width (excluding mirrors), height, wheelbase, front and rear track, overhang front/rear, tyre size / overall wheel diameter, ground clearance, body style. Cross-check at least two sources when a figure looks odd. Note anything you could not confirm in "notes".
2. Work out the side-view silhouette from those figures plus a careful written description of the real car's shape (bonnet line, windscreen rake, roof shape, rear window, boot/tail, sills, belt line, wheel arch shape). If you can open reference images via the browser tools, look at them; if not, rely on the text. Be concrete: give the numbers, not adjectives.
3. List every distinctive feature a person would use to recognise it (grille shape, headlamp shape and count, pop-up lamps, bumpers, side strakes, vents, tail fins, spare wheel, wire wheels, soft top, gullwing doors, split screen, hatch, Kamm tail, quad lamps, bonnet bulge, chrome strips, number of wheels, etc.) and say where each goes (x position in car units, height, which end).

## Coordinate system (same as docs/ART_SPEC.md, read it)
Car units: x runs from -50 (rear bumper) to +50 (front bumper), so 100 units = overall length. y is height above the ground in the same units (so a car 1.2 m high and 4.0 m long is 30 units high). The car faces +x (right). Width is a separate number `width_units` = width / length * 100. The game art draws the car from the side, slightly from the front quarter, so the side profile and the front/rear faces are what matter.

## Output: one file per car at /Users/leelangley/Documents/WebbWheresmycar/docs/cars/<id>.json (create nothing else besides what your card lists)
Strict JSON, ASCII only:
{
 "id": "<game id>",
 "real_car": "<real make model year, for the developers only, never shown to players>",
 "game_name": "<copy of the game name given below>",
 "dims_mm": {"length":0,"width":0,"height":0,"wheelbase":0,"track_front":0,"track_rear":0,"tyre_overall_diameter":0},
 "dims_confidence": "high|medium|low",
 "body_style": "e.g. 2-door fastback coupe",
 "doors": 2,
 "wheels": [{"x":-30.0,"r":7.5,"style":"steel|wire|alloy|knockoff|spoked|disc"}],   // x and radius in car units; tell me if there are 3 wheels
 "wheel_arch": "round|squared|flared|none-skirted|cycle-wing", 
 "side_profile": [[x,y],...],   // ONE closed polygon for the painted body shell as seen from the side, going anticlockwise from the rear bottom corner: rear bottom, up the tail, along the boot/deck, to the base of the rear window, ... , the front bumper, nose, back along the sills. 20-40 points, accurate to about 0.5 units. This excludes glass.
 "greenhouse": [[x,y],...],     // the glass area / cabin upper part seen from the side (window outline); a list of polygons is allowed: [[[x,y],...],[[x,y],...]] for several windows
 "roof": {"type":"hard|soft-top-up|soft-top-down|targa|open", "colour_split": false},
 "plan": {"width_units":0, "nose_width_pct":0, "tail_width_pct":0, "tumblehome":"low|medium|high", "waist_pinch": false},
 "front": {"grille":"describe shape and size in units","headlamps":{"count":2,"shape":"round|square|oval|pop-up|slanted","x":0,"y":0,"r":0,"y_offset_from_centre":0},"bumper":"describe","extras":["..."]},
 "rear": {"taillamps":"describe shape, size, y and x","bumper":"describe","exhaust":"one|two|quad|none seen","extras":["..."]},
 "side_features": ["each with x range and height in units, e.g. 'chrome sill strip x -20..20 y 6'"],
 "special": ["anything unusual: gullwing doors, 3 wheels, tail fins 4 units high, exposed spare, running boards ..."],
 "typical_paint": ["#rrggbb", "..."],   // 3-4 period-correct colours
 "ref_urls": ["https://commons.wikimedia.org/wiki/File:..."],   // 2-3 good reference photo pages (side view and front 3/4 if possible). Links only; do not download.
 "notes": "figures you could not confirm, assumptions, the one or two proportions that are most important to get right"
}
Make the JSON valid (no comments, no trailing commas); the // notes above are explanations only. After writing each file, check it parses: `python3 -c "import json,sys; json.load(open(sys.argv[1]))" <file>`.
Self-check each car: the side_profile polygon's x range must be about -50..50, its max y plus the greenhouse top should equal height_mm / length_mm * 100 within 0.5, and the wheel positions should give wheelbase_mm / length_mm * 100 between the two wheel x values within 0.5.

## Checking
Run `python3 tools/check_dossier.py docs/cars/<id>.json` (card R00). It must print `DOSSIER OK <id>` for every car you write.
Note: real car names appear ONLY in these developer files (field real_car and ref_urls), never in anything the player sees.
