# WD cards: widen the picture. On a tall iPhone held landscape (about 19.5:9) the game fills the whole screen.
# Plan, decision and the conflict list for other cards: docs/art/WD.md. Every JS card is small, pure and has a jsc test.
FK = "tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)"
PLAN = "docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)"
RUN = "Run one test file with `$JSC -m tests/<name>.test.mjs` (JSC is set by `make test`; on this Mac it is /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc)."
BL = "Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy; no PIL."
TERMS = "TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`."

CANVAS_CODE = """```js
export const LOGICAL_W = 1280;   // stage width: every scene LAYOUT is in these units (name kept so old imports still work)
export const LOGICAL_H = 720;
export const STAGE_W = 1280;
export const FULL_W_MAX = 1568;  // widest canvas: 19.5:9 phones; (1568 - 1280) / 2 = 144 px strip each side
export const BLEED_MAX = 144;
const SNAP_PX = 16;              // less than this much extra width is not worth a strip

function checkWin(winW, winH) {
	if (typeof winW !== 'number' || typeof winH !== 'number' || winW <= 0 || winH <= 0) {
		throw new RangeError('winW and winH must both be positive numbers, got ' + winW + 'x' + winH);
	}
}

// Canvas width in logical px: 1280 for 16:9 and narrower windows, else the window aspect at height 720
// rounded UP to a multiple of 4 (so the stage offset is an even number), at most 1568.
export function fullWidthFor(winW, winH) {
	checkWin(winW, winH);
	const raw = LOGICAL_H * winW / winH;
	if (raw < STAGE_W + SNAP_PX) {
		return STAGE_W;
	}
	return Math.min(FULL_W_MAX, 4 * Math.ceil(raw / 4 - 1e-9));
}

// fitLayout(winW, winH) -> {scale, offX, offY, viewW, viewH, fullW, fullH, stageX, stageW}.
// viewW x viewH is the whole canvas in CSS px. offX may be slightly negative (the canvas overhangs the
// window by a pixel or two, only strip art is cropped) or positive (thin bars when the window is wider than 1568:720).
export function fitLayout(winW, winH) {
	const fullW = fullWidthFor(winW, winH);
	const scale = fullW === STAGE_W ? Math.min(winW / STAGE_W, winH / LOGICAL_H) : winH / LOGICAL_H;
	const viewW = fullW * scale;
	const viewH = LOGICAL_H * scale;
	return {
		scale: scale, offX: (winW - viewW) / 2, offY: (winH - viewH) / 2, viewW: viewW, viewH: viewH,
		fullW: fullW, fullH: LOGICAL_H, stageX: (fullW - STAGE_W) / 2, stageW: STAGE_W,
	};
}

// toFull(layout, clientX, clientY) -> {x, y} in CANVAS coordinates (0..fullW), or null outside the canvas.
export function toFull(layout, clientX, clientY) {
	const x = (clientX - layout.offX) / layout.scale;
	const y = (clientY - layout.offY) / layout.scale;
	if (x < 0 || x > layout.fullW || y < 0 || y > LOGICAL_H) {
		return null;
	}
	return { x: x, y: y };
}

// toLogical(layout, clientX, clientY) -> {x, y} in STAGE coordinates (x is negative in the left strip and
// above 1280 in the right strip), or null outside the canvas (bars).
export function toLogical(layout, clientX, clientY) {
	const p = toFull(layout, clientX, clientY);
	return p === null ? null : { x: p.x - layout.stageX, y: p.y };
}
```"""

VIEW_CODE = """```js
import { STAGE_W, LOGICAL_H } from './canvas.js';

export function defaultView() {
	return {
		fullW: STAGE_W, fullH: LOGICAL_H, stageX: 0, stageW: STAGE_W, dx: 0, left: 0, right: STAGE_W,
		scale: 1, dpr: 1, ds: 1, wide: false, safe: { top: 0, right: 0, bottom: 0, left: 0 },
	};
}

// makeView(layout, dpr, insets): layout from fitLayout; insets = stage-relative safe insets or null.
// dx is stageX snapped to a whole number of DEVICE pixels, so snapped sprites stay crisp on the stage.
export function makeView(layout, dpr, insets) {
	const d = typeof dpr === 'number' && dpr > 0 ? dpr : 1;
	const ds = layout.scale * d;
	const ins = insets || {};
	return {
		fullW: layout.fullW, fullH: layout.fullH, stageX: layout.stageX, stageW: layout.stageW,
		dx: Math.round(layout.stageX * ds) / ds, left: 0 - layout.stageX, right: layout.stageW + layout.stageX,
		scale: layout.scale, dpr: d, ds: ds, wide: layout.stageX > 0,
		safe: { top: ins.top || 0, right: ins.right || 0, bottom: ins.bottom || 0, left: ins.left || 0 },
	};
}

// setView(target, v): copy v into target IN PLACE (target.safe too) so every holder of the object sees it.
export function setView(target, v) {
	const safe = target.safe || (target.safe = { top: 0, right: 0, bottom: 0, left: 0 });
	for (const k in v) {
		if (k !== 'safe') {
			target[k] = v[k];
		}
	}
	safe.top = v.safe.top;
	safe.right = v.safe.right;
	safe.bottom = v.safe.bottom;
	safe.left = v.safe.left;
	return target;
}

// The whole canvas as a rect in stage coordinates.
export function fullRect(view) {
	return { x: view.left, y: 0, w: view.fullW, h: view.fullH };
}

export function inStage(x) {
	return x >= 0 && x <= STAGE_W;
}
```"""

SAFE_CODE = """```js
import { LOGICAL_H } from './canvas.js';

// viewInsets(layout, css): css = {top, right, bottom, left} in CSS px (missing, negative or NaN -> 0).
// Result is in STAGE logical px (how far inside the stage rectangle the unsafe zone reaches), so a notch that
// lies in the strips costs the stage nothing.
export function viewInsets(layout, css) {
	const c = css || {};
	const side = function (v) { return typeof v === 'number' && v > 0 ? v : 0; };
	const s = layout.scale;
	const fullL = Math.max(0, (side(c.left) - layout.offX) / s);
	const fullR = Math.max(0, (side(c.right) - layout.offX) / s); // the right bar equals the left bar
	return {
		top: Math.max(0, (side(c.top) - layout.offY) / s),
		bottom: Math.max(0, (side(c.bottom) - layout.offY) / s),
		left: Math.max(0, fullL - layout.stageX),
		right: Math.max(0, fullR - layout.stageX),
	};
}

export function safeRect(i) {
	return { x: i.left, y: i.top, w: 1280 - i.left - i.right, h: LOGICAL_H - i.top - i.bottom };
}

export function physicalPx(px, scale) {
	return px * scale;
}

export function minLogicalPx(cssMin, scale) {
	return Math.ceil(cssMin / scale);
}

// parseInset('59px') -> 59; '' , 'abc', negative -> 0.
export function parseInset(s) {
	const v = parseFloat(s);
	return v > 0 ? v : 0;
}

// readCssInsets(win, doc) -> {top, right, bottom, left} CSS px from the --sai-* custom properties (index.html).
// All zeros when getComputedStyle or documentElement is missing (tests, old browsers).
export function readCssInsets(win, doc) {
	const zero = { top: 0, right: 0, bottom: 0, left: 0 };
	if (!win || typeof win.getComputedStyle !== 'function' || !doc || !doc.documentElement) {
		return zero;
	}
	const cs = win.getComputedStyle(doc.documentElement);
	if (!cs || typeof cs.getPropertyValue !== 'function') {
		return zero;
	}
	return {
		top: parseInset(cs.getPropertyValue('--sai-t')), right: parseInset(cs.getPropertyValue('--sai-r')),
		bottom: parseInset(cs.getPropertyValue('--sai-b')), left: parseInset(cs.getPropertyValue('--sai-l')),
	};
}
```"""

SMEAR_CODE = """```js
// smearStrips(ctx, view, canvas): fills ONLY the still-empty (transparent) pixels of the two strips by stretching
// the stage's outermost pixel column outwards ('destination-over' never overwrites anything already drawn, so a
// scene that painted real art into the strips keeps it). Does nothing (returns false) on a 1280 canvas or when
// `canvas` has no numeric width and height (tests pass a plain object {width, height}).
export function smearStrips(ctx, view, canvas) {
	const cv = canvas || null;
	if (!view.wide || !cv || typeof cv.width !== 'number' || typeof cv.height !== 'number') {
		return false;
	}
	const ds = view.ds;
	const leftDev = Math.round(view.dx * ds);
	const rightDev = Math.round((view.dx + view.stageW) * ds);
	const colW = Math.max(1, Math.round(ds));
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-over';
	ctx.imageSmoothingEnabled = false;
	if (leftDev > 0) {
		ctx.drawImage(cv, leftDev, 0, colW, cv.height, 0, 0, leftDev, cv.height);
	}
	if (cv.width - rightDev > 0) {
		ctx.drawImage(cv, rightDev - colW, 0, colW, cv.height, rightDev, 0, cv.width - rightDev, cv.height);
	}
	ctx.restore();
	return true;
}

// underlay(ctx, view, color): paints `color` behind everything, over the whole canvas, in logical coordinates.
export function underlay(ctx, view, color) {
	ctx.save();
	ctx.setTransform(view.ds, 0, 0, view.ds, 0, 0);
	ctx.globalCompositeOperation = 'destination-over';
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, view.fullW, view.fullH);
	ctx.restore();
}

// finishStrips(ctx, view, color, canvas): smear then underlay; call it at base transform after the scenes are drawn.
export function finishStrips(ctx, view, color, canvas) {
	if (!view.wide) {
		return false;
	}
	smearStrips(ctx, view, canvas);
	underlay(ctx, view, color);
	return true;
}
```"""

ROOMWIDE_CODE = """```python
# tools/art/roomwide.py: render any room script on a wider frame (card WD08).
# blender --background --python-exit-code 1 --python tools/art/roomwide.py -- <room_script.py> [the room script's own args]
import os, sys
import bpy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import roomlib

MARGIN = 144                    # extra screen px each side of the 1280 stage
STAGE_W, FRAME_H = 1280, 720
EDGE_TOL = 0.02                 # metres (2 px): a box this close to the old frame edge counts as touching it


def frame_w(margin=None):
    return STAGE_W + 2 * (MARGIN if margin is None else margin)


def extend_edges(margin=None):
    \"\"\"Stretch every axis-aligned box that touches the old left or right frame edge out to the new edge. Returns how many.\"\"\"
    m = MARGIN if margin is None else margin
    lo, hi = roomlib.wx(-m), roomlib.wx(STAGE_W + m)
    n = 0
    for ob in bpy.data.objects:
        if ob.type != 'MESH' or len(ob.data.vertices) == 0:
            continue
        if any(abs(ob.matrix_world[i][j] - (1.0 if i == j else 0.0)) > 1e-9 for i in range(4) for j in range(4)):
            continue            # only boxes made by roomlib.box (identity transform)
        xs = [v.co.x for v in ob.data.vertices]
        x0, x1 = min(xs), max(xs)
        changed = False
        if x0 <= roomlib.wx(0) + EDGE_TOL and x0 > lo + 1e-6:
            for v in ob.data.vertices:
                if v.co.x <= x0 + 1e-6:
                    v.co.x = lo
            changed = True
        if x1 >= roomlib.wx(STAGE_W) - EDGE_TOL and x1 < hi - 1e-6:
            for v in ob.data.vertices:
                if v.co.x >= x1 - 1e-6:
                    v.co.x = hi
            changed = True
        if changed:
            ob.data.update()
            n += 1
    return n


def install(margin=None):
    \"\"\"Patch roomlib so room scripts render wide without any change: wider camera and image, project() still returns
    game-screen px (x minus the margin), and the edge boxes are stretched just before the render starts.\"\"\"
    m = MARGIN if margin is None else margin
    fw = frame_w(m)
    orig_cam, orig_proj = roomlib.setup_camera, roomlib.project

    def setup_camera(scene, w=None, h=FRAME_H):
        orig_cam(scene, fw if w is None else w, h)
        scene.camera.data.ortho_scale = (fw if w is None else w) / 100.0
        # roomlib.reset() clears app handlers, and setup_camera always runs after reset: register here.
        bpy.app.handlers.render_pre[:] = [f for f in bpy.app.handlers.render_pre if getattr(f, '__name__', '') != 'wide_pre']

        def wide_pre(*a):
            print('WIDE extended=%d frame=%dx%d' % (extend_edges(m), fw, FRAME_H))
        bpy.app.handlers.render_pre.append(wide_pre)

    def project(scene, point):
        x, y = orig_proj(scene, point)
        return x - m, y

    roomlib.setup_camera, roomlib.project = setup_camera, project
    return m


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:]
    script, rest = args[0], args[1:]
    install()
    sys.argv = [script, '--'] + rest
    g = {'__name__': '__main__', '__file__': os.path.abspath(script)}
    exec(compile(open(script).read(), script, 'exec'), g)
```"""

PROBE = """```python
import sys, bpy
sys.path.insert(0, 'tools/art')
import roomlib as R, roomwide as W
W.install()
sc = R.reset()
R.setup_camera(sc)
R.setup_render(sc, '/tmp/wd08/probe.png', 4)
R.world(sc, '#808080', 1.0)
m = R.mat('g', '#c08040')
R.box('wall', 0.0, 12.8, 0.0, 0.3, R.wz(700), R.wz(-200), m, 0)
R.box('mid', R.wx(400), R.wx(500), -0.5, 0.0, R.wz(400), R.wz(300), m, 0)
R.light('SUN', 'sun', (0, 5, 8), 3.0, '#ffffff', 1.0, (1.0, 0, 0))
print('WD08 res', sc.render.resolution_x, sc.render.resolution_y, round(sc.camera.data.ortho_scale, 3))
bpy.ops.render.render(write_still=True)
xs = [v.co.x for v in bpy.data.objects['wall'].data.vertices]
print('WD08 wall', round(min(xs), 3), round(max(xs), 3))
xs = [v.co.x for v in bpy.data.objects['mid'].data.vertices]
print('WD08 mid', round(min(xs), 3), round(max(xs), 3))
print('WD08 proj0 %.1f' % R.project(sc, (R.wx(0), 0.0, R.wz(300)))[0])
print('WD08 proj1280 %.1f' % R.project(sc, (R.wx(1280), 0.0, R.wz(300)))[0])
im = bpy.data.images.load('/tmp/wd08/probe.png')
w, h = im.size
a = im.pixels[:]
def alpha(x, y):
    return a[((h - 1 - y) * w + x) * 4 + 3]
print('WD08 img', w, h, 'alphaL %.2f alphaR %.2f alphaC %.2f' % (alpha(10, 300), alpha(w - 10, 300), alpha(w // 2, 300)))
```"""

CARDS = [
 dict(id="WD01", title="Canvas layout: variable-width canvas, 1280 stage, pointer maps to stage", needs=["W42"],
  files=["src/ui/canvas.js", "tests/canvas.test.mjs"],
  goal="Make the pure layout maths fill a tall phone screen: the logical canvas stays 720 high but is 1280 to 1568 wide (the window's aspect), a 1280x720 stage sits in the middle, and the pointer is converted to STAGE coordinates (negative x or above 1280 means a tap in a strip). 16:9 and 4:3 windows behave exactly as today (letterbox top and bottom). " + TERMS + " ORDER: after W42 (this card rewrites W42's canvas.js and tests/canvas.test.mjs). Cards that import canvas.js (GU20 is dropped, see docs/art/WD.md) keep working because LOGICAL_W, LOGICAL_H, fitLayout, toLogical, isPortrait and applyLayout keep their names.",
  read=[PLAN, "src/ui/canvas.js (read all of it) and tests/canvas.test.mjs", FK],
  steps=[
   "In `src/ui/canvas.js` replace the constants, `fitLayout` and `toLogical` (everything above `isPortrait`) by exactly this code, and keep the file header comment updated to say the canvas is 720 high and 1280..1568 wide. Keep `isPortrait` and `applyLayout` exactly as they are (applyLayout already uses fitLayout's scale, offX, offY, viewW, viewH, so the canvas element is now fullW*scale wide and `ctx.setTransform` is unchanged).\n" + CANVAS_CODE,
   "Why these numbers (write them in a short comment, do not change them): raw = 720 * winW / winH is the canvas width that fills the window at full height; under 1296 the window is 16:9 or narrower so the old fit is used; otherwise scale = winH/720 and fullW is rounded UP to a multiple of 4 (so stageX = (fullW - 1280)/2 is even, i.e. a whole number of 2 px art pixels) and capped at 1568 (iPhone 16 Pro 874x402 needs 1565.4; iPhone 15 Pro 852x393 needs 1560.9). Rounding up means the canvas overhangs the window by under 2 CSS px each side (offX slightly negative); only strip art is cropped.",
   "`tests/canvas.test.mjs`: KEEP these existing tests unchanged: 'logical size is 1280x720', 'fitLayout exact fit 1280x720', 'fitLayout 2560x1440', 'fitLayout 1000x1000', 'fitLayout rejects zero and negative sizes', 'toLogical maps the centre of a letterboxed view to 640,360', 'toLogical maps corners of the game rectangle', 'isPortrait only when taller than wide', 'applyLayout 1280x720 dpr 2', 'applyLayout caps devicePixelRatio at 3', 'applyLayout defaults devicePixelRatio to 1', 'applyLayout rejects an invalid window'. REWRITE these four: (a) 'fitLayout 844x390 iPhone landscape': fullW 1560, stageX 140, stageW 1280, fullH 720, scale 390/720 (near 1e-9), viewW 845 (near 1e-6), viewH 390, offX -0.5 (near 1e-6), offY 0. (b) 'toLogical gives null for points in the letterbox bars': keep the 1000x1000 top bar (500,100) and bottom bar (500,900) null checks; replace the side checks by `fitLayout(2560,1080)` (scale 1.5, offX 104): `toLogical(l, 50, 500)` is null and `toLogical(l, 2457, 500)` is null. (c) 'applyLayout 844x390 dpr 3': canvas.width 2535, canvas.height 1170, style.left parseFloat near -0.5 (1e-6), style.top '0px', style.width parseFloat near 845 (1e-6), style.height '390px', one setTransform with args [1.625,0,0,1.625,0,0] (near 1e-9 each), dpr 3. (d) 'toLogical round-trips any in-view point': with fitLayout(844,390) the STAGE point (1024,300) is at client x = offX + (1024 + stageX) * scale and y = offY + 300 * scale (630 and 162.5); `toLogical` returns (1024,300) near 1e-9; also stage point (-100,300) and (1380,300) round-trip (both lie in the strips).",
   "ADD these tests: `fullWidthFor` returns 1280 for (1280,720), (667,375), (1366,768), (1024,768), (1000,1000); 1316 for (1316,720); 1560 for (844,390); 1564 for (852,393); 1568 for (874,402), (956,440), (2560,1080), (1600,720); it throws RangeError for (0,100). `fitLayout(852,393)`: fullW 1564, stageX 142, scale 393/720, viewW near 853.6833 (1e-3), offX near -0.84167 (1e-3), offY near 0 (1e-6). `fitLayout(2560,1080)`: scale 1.5, viewW 2352, offX 104, offY 0, stageX 144. `fitLayout(1316,720)`: stageX 18, offX 0. `fitLayout(1024,768)` (4:3): fullW 1280, stageX 0, scale 0.8, offY 96. Property loop: for winH in [393, 402, 440, 720, 1080] and winW from 1300 to 2400 step 7: fullW is between 1280 and 1568, (fullW - 1280) % 4 === 0, offY >= -1e-6, and when 1280 < fullW < 1568 then viewW >= winW - 1e-6 and offX <= 1e-6 (the canvas always covers the window until the 1568 cap). `fitLayout(1560,720)`: toLogical(l,140,360) is {x:0,y:360}; toLogical(l,0,360) has x -140; toLogical(l,1560,720) is {x:1420,y:720}; toLogical(l,1561,10) is null; `toFull(l,140,360)` is {x:140,y:360}. `BLEED_MAX` is 144 and `FULL_W_MAX` is 1568 and `(FULL_W_MAX - STAGE_W) / 2 === BLEED_MAX`.",
  ],
  accept=["`$JSC -m tests/canvas.test.mjs 2>&1 | tail -3` shows no FAIL line.", "`make test 2>&1 | grep 'PASS tests/canvas.test.mjs'` prints one line.", "`grep -c 'FULL_W_MAX = 1568' src/ui/canvas.js` prints 1.", "`make test 2>&1 | grep -c '^FAIL'` prints 0 (boot.test.mjs and every other existing test still pass: at 1280x720 nothing changes)."],
  oos=["src/boot.js and every scene (WD06 and later cards wire it up).", "`isPortrait` and `applyLayout` bodies."]),

 dict(id="WD02", title="View object: stage offset, snapped dx, strip bounds, safe insets holder", needs=["WD01"],
  files=["src/ui/view.js", "tests/view.test.mjs"],
  goal="One tiny pure module that builds the `app.view` object scenes and the GU, GE and CC components read: where the stage sits in the canvas (stageX), the device-pixel-snapped translate to apply (dx), the strip bounds in stage coordinates (left, right), whether the canvas is wider than the stage (wide) and the stage-relative safe insets. ORDER: after WD01; before WD04, WD05, WD06 which import it.",
  read=[PLAN, "src/ui/canvas.js (as changed by WD01: `fitLayout`, `STAGE_W`, `LOGICAL_H`)", FK],
  steps=[
   "Create `src/ui/view.js` with exactly this code (pure, no DOM, no Date):\n" + VIEW_CODE,
   "Say in a comment above `makeView` why `dx` is snapped: sprites are snapped to whole device pixels (src/art/pixelscale.js, `snapPx`); translating the stage by a fractional device pixel would blur every sprite. `ds` is device pixels per logical pixel (scale * dpr, the same product boot gives `setDeviceScale`).",
   "`tests/view.test.mjs` (import `fitLayout` from '../src/ui/canvas.js'): `defaultView()` is {fullW 1280, fullH 720, stageX 0, stageW 1280, dx 0, left 0, right 1280, scale 1, dpr 1, ds 1, wide false, safe all 0}; two calls return different objects (and different `safe` objects). THREE ASPECTS: 16:9 `makeView(fitLayout(1280,720), 1, null)` deep-equals `defaultView()`; 4:3 `makeView(fitLayout(1024,768), 2, null)`: fullW 1280, wide false, dx 0, left 0, right 1280, ds 1.6 (near 1e-9); 19.5:9 `makeView(fitLayout(1560,720), 1, null)`: fullW 1560, stageX 140, dx 140, left -140, right 1420, wide true. Phone `makeView(fitLayout(852,393), 3, null)`: fullW 1564, stageX 142, left -142, right 1422, wide true, ds near 1.6375 (1e-9), dx near 142.2900763 (1e-6) and `Math.abs(dx * ds - 233) < 1e-9` (a whole number of device pixels). A missing, zero or NaN dpr counts as 1 (`makeView(fitLayout(1280,720), 0, null).dpr === 1`). insets {top:1,right:2,bottom:38.5,left:3} are copied (the result's `safe` is a new object with those numbers; later changes to the input do not leak in); missing keys are 0.",
   "`setView` tests: `const app = {view: defaultView()}; const s = app.view.safe; const r = setView(app.view, makeView(fitLayout(1560,720), 1, {bottom: 38.4, left: 3}));` then `r === app.view`, `app.view.safe === s`, `s.bottom === 38.4`, `s.left === 3`, `s.top === 0`, `app.view.fullW === 1560`, `app.view.wide === true`; then `setView(app.view, makeView(fitLayout(1280,720), 1, null))` gives `wide === false`, `fullW === 1280`, `s.bottom === 0` and still `app.view.safe === s`. `fullRect(makeView(fitLayout(1560,720),1,null))` deep-equals {x:-140,y:0,w:1560,h:720}. `inStage(0)` and `inStage(1280)` are true; `inStage(-1)` and `inStage(1281)` are false. Pointer link: with `l = fitLayout(1560,720)` and `v = makeView(l,1,null)`, `toLogical(l, 0, 360).x === v.left` and `toLogical(l, 1560, 360).x === v.right` (import toLogical).",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/view.test.mjs'` prints one line.", "`grep -c 'dx: Math.round' src/ui/view.js` prints 1.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Every existing file; do not wire the view into createApp or boot (WD05, WD06)."]),

 dict(id="WD03", title="Safe areas: CSS insets to stage-relative insets (replaces GU20)", needs=["WD01", "W71b"],
  files=["src/ui/safearea.js", "index.html", "tests/safearea.test.mjs"],
  goal="Replace the idea of card GU20 for the new canvas: read the iPhone notch and home-indicator insets from CSS `env(safe-area-inset-*)` and turn them into STAGE-relative logical insets. On a 19.5:9 phone the notch side lies inside the strip, so the stage gets inset 0 on left and right and only the home-indicator inset at the bottom. Also the physical-size helpers the text-size audit needs. ORDER: after WD01 and W71b (both edit index.html). Card GU20 was dropped (its maths assumed the old letterbox and its offX 76.67 test fails with the new fitLayout); GU23 now needs WD03 (see docs/art/WD.md).",
  read=[PLAN, "src/ui/canvas.js (as changed by WD01: `fitLayout` -> {scale, offX, offY, viewW, viewH, fullW, fullH, stageX, stageW})", "index.html (already has viewport-fit=cover in the viewport meta)", FK],
  steps=[
   "Create `src/ui/safearea.js` with exactly this code:\n" + SAFE_CODE,
   "`index.html`: inside the existing `<style>` add `:root { --sai-t: env(safe-area-inset-top, 0px); --sai-r: env(safe-area-inset-right, 0px); --sai-b: env(safe-area-inset-bottom, 0px); --sai-l: env(safe-area-inset-left, 0px); }` as the first rule. Change nothing else in the file.",
   "`tests/safearea.test.mjs` (import fitLayout from '../src/ui/canvas.js'). `viewInsets`: phone 852x393 with css {top:0,right:59,bottom:21,left:59}: top 0, left 0, right 0 (the notch lies in the strip: 59 css px is 109.6 logical px from the canvas edge, the stage starts at 142) and bottom near 38.4733 (1e-3). Same window with css {left:200}: left near 225.954 (1e-3), right 0. 16:9 1280x720 with css {top:20,left:50}: top 20, left 50 (no strips, same as the old behaviour). 2560x1080 with css {left:50}: left 0 (the 104 css px bar covers it). 1024x768 with all css 0: all 0. Missing keys, negative numbers and NaN count as 0; `viewInsets(l, null)` is all 0. `safeRect({top:0,right:0,bottom:38.4733,left:0})` is {x:0,y:0,w:1280,h:681.5267} (near 1e-3). `physicalPx(22, 0.5458333)` near 12.0083 (1e-3); `minLogicalPx(12, 0.5458333)` is 22; `minLogicalPx(9, 0.5458333)` is 17.",
   "`parseInset('59px')` is 59, `parseInset('')`, `parseInset('abc')`, `parseInset('-4px')` and `parseInset(undefined)` are 0. `readCssInsets`: with a fake `win = {getComputedStyle: () => ({getPropertyValue: (n) => ({'--sai-b':'21px','--sai-l':'59px','--sai-r':'59px'})[n] || ''})}` and `doc = {documentElement: {}}` it returns {top:0,right:59,bottom:21,left:59}; a win without getComputedStyle, a doc without documentElement, and a getComputedStyle that returns null each give all zeros.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/safearea.test.mjs'` prints one line.", "`grep -c 'safe-area-inset' index.html` prints 4.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["src/boot.js (WD06 calls these functions).", "Any scene (they read `app.view.safe` in later cards)."]),

 dict(id="WD04", title="Strip filler: smear the stage edge into empty strips, then ink underlay", needs=["WD02"],
  files=["src/ui/smear.js", "tests/smear.test.mjs"],
  goal="The cheap default that makes EVERY scene fill the wide screen without touching its code: after a frame is drawn, the still-empty strips beside the stage are filled by stretching the stage's outermost pixel column outwards (bands, gradients, HUD strip and floor/wall bars just continue), then anything still empty gets the ink colour. 'destination-over' compositing never overwrites pixels a scene or a wide room plate already painted. " + TERMS + " ORDER: after WD02; WD05 calls it.",
  read=[PLAN, "src/ui/view.js (WD02: `makeView`, `defaultView`; fields dx, ds, wide, fullW, fullH, stageW)", FK],
  steps=[
   "Create `src/ui/smear.js` with exactly this code (it touches only the ctx and the canvas object passed in):\n" + SMEAR_CODE,
   "`tests/smear.test.mjs` (imports makeView from '../src/ui/view.js', fitLayout from '../src/ui/canvas.js', defaultView; fakectx). Default 16:9 view: `smearStrips(ctx, defaultView(), {width:1280,height:720})` is false and `ctx.calls.length` is 0; `finishStrips(...)` is false with 0 calls. Wide view without a usable canvas: `smearStrips(ctx, v, undefined)` and `smearStrips(ctx, v, {})` are false and make no calls.",
   "THREE ASPECTS. (1) 19.5:9 desktop-sized: v = makeView(fitLayout(1560,720),1,null), canvas {width:1560,height:720}: smearStrips is true and its calls are exactly, in order: save; setTransform [1,0,0,1,0,0]; set:globalCompositeOperation 'destination-over'; set:imageSmoothingEnabled false; drawImage [canvas,140,0,1,720,0,0,140,720]; drawImage [canvas,1419,0,1,720,1420,0,140,720]; restore. (2) Phone: v = makeView(fitLayout(852,393),3,null), canvas {width:2561,height:1179}: the two drawImage calls are [canvas,233,0,2,1179,0,0,233,1179] and [canvas,2327,0,2,1179,2329,0,232,1179]. (3) 4:3: makeView(fitLayout(1024,768),2,null) is not wide: false, no calls.",
   "`finishStrips(ctx, v, '#14102A', canvas)` for case (1): returns true; after the restore of the smear there is a second save, `setTransform [1,0,0,1,0,0]` (ds is 1; assert all six args with near 1e-9), `set:globalCompositeOperation` 'destination-over', `set:fillStyle` '#14102A', `fillRect [0,0,1560,720]`, restore; total save count equals restore count (2 each). For the phone view the underlay `fillRect` is [0,0,1564,720] and its setTransform args are ds (near 1.6375) on the diagonal. A canvas whose width equals the stage's right edge (e.g. {width:1420,height:720} with the 1560 view) gets only the left drawImage.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/smear.test.mjs'` prints one line.", "`grep -c destination-over src/ui/smear.js` prints 3 (one comment, two settings).", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Every existing file; no scene or app wiring (WD05)."]),

 dict(id="WD05", title="App shell: draw the stage translated, full-width transitions, CRT, strips", needs=["GU23", "WD02", "WD04"],
  files=["src/ui/scenes.js", "tests/app_view.test.mjs", "tests/fakeapp.js"],
  goal="`createApp` learns about `app.view`. On a 16:9 or 4:3 view (not wide) every drawn call stays EXACTLY as before. On a wide view the app clears the canvas, draws the scene stack, particles, toasts and tooltip translated by `view.dx` (stage coordinates, so no scene changes), runs transitions and the CRT overlay over the FULL canvas width, and fills the strips with `finishStrips`. Scene code keeps using `app.w` (1280) and `app.h` (720). " + TERMS + " ORDER: after GU22 and GU23 (this edits the draw() they wrote) and WD02, WD04. The one-line edits to GU14, GU16, GU19, GE14 listed in docs/art/WD.md are applied in the specs; WD15 checks them.",
  read=[PLAN, "src/ui/scenes.js as changed by GU22 and GU23 (read all of it: `drawStack(list)`, `fxBegin`/`fxEnd`, the transition draw calls, `drawParticles`, the toast loop with `drawToast2`, `drawTooltip`, `drawCrt`, the `safe` field) and tests/scenes.test.mjs, tests/app_fx.test.mjs, tests/app_overlays.test.mjs (all must stay green)", "src/ui/view.js (WD02) and src/ui/smear.js (WD04)", "tests/fakeapp.js", FK],
  steps=[
   "In `src/ui/scenes.js` import `defaultView` from './view.js' and `finishStrips` from './smear.js'. In `createApp` make `const view = defaultView();` and add the fields `view: view`, `canvas: null` (boot sets it, tests set a plain {width,height}) and replace the `safe: {top:0, right:0, bottom:0, left:0}` field GU23 added by `safe: view.safe` (the same object, so `app.safe` and `app.view.safe` never differ).",
   "In `draw(ctx, t)` at the top: `const view = app.view; const wide = view.wide === true;`. Background: when `wide` do `ctx.clearRect(0, 0, view.fullW, view.fullH)` INSTEAD of the existing ink fillRect (when not wide keep that fillRect line exactly as it is). Add a private `stageDraw(fn)`: when not wide just `fn()`; when wide `ctx.save(); ctx.translate(view.dx, 0); fn(); ctx.restore();`. Wrap in `stageDraw`: the normal `drawStack(app.stack)` call; the `drawFrom` and `drawTo` callbacks given to every transition draw function (so they become `() => stageDraw(() => drawStack(...))`) and pass `view.fullW, view.fullH` as the last two arguments (`w`, `h`) of `drawTransition`, `drawStaticWipe` and `drawPageTurn`; the `drawParticles` call; the whole toast loop; the tooltip draw. Do NOT wrap `fxBegin`/`fxEnd` (the shake moves the whole canvas, strips included). Right after the `fxEnd(...)` call and before the toasts add `if (wide) { finishStrips(ctx, view, PALETTE.ink, app.canvas); }`. Replace `drawCrt(ctx, app.w, app.h, t)` by `drawCrt(ctx, view.fullW, view.fullH, t)` and keep it outside `stageDraw` as the very last draw. `pointer` and `key` stay untouched: scenes receive stage coordinates exactly as boot passes them (x may be negative or above 1280).",
   "`tests/fakeapp.js` (a test helper, keep every existing field): after the `app` object is built add `app.view = {fullW: 1280, fullH: 720, stageX: 0, stageW: 1280, dx: 0, left: 0, right: 1280, scale: 1, dpr: 1, ds: 1, wide: false, safe: {top: 0, right: 0, bottom: 0, left: 0}}; app.safe = app.view.safe;` before `return app`.",
   "`tests/app_view.test.mjs` (fakectx; `createApp({now: () => n})` with a mutable clock; helper `viewFor(w, h, dpr)` = `makeView(fitLayout(w, h), dpr || 1, null)` applied with `setView(app.view, ...)`; one fake scene 'a' whose `draw(ctx, app, t)` does `ctx.fillRect(10, 20, 30, 40)` and whose `pointer(app, type, x, y)` stores its arguments). THREE ASPECTS. 16:9 (1280x720) and 4:3 (1024x768): draw makes the first call `fillRect [0,0,1280,720]` with fillStyle `PALETTE.ink`, and no `translate`, no `clearRect`, no `drawImage`, and the calls recorded around scene a are the same as before this card. 19.5:9 (1560x720, dpr 1; stageX 140, dx 140): the first call is `clearRect [0,0,1560,720]` and there is no `fillRect [0,0,1280,720]`; exactly one `translate [140,0]` occurs before scene a's `fillRect [10,20,30,40]` and a `restore` after it; `app.w` is 1280 and `app.h` is 720; with `app.canvas = {width:1560,height:720}` two `drawImage` calls follow ([canvas,140,0,1,720,0,0,140,720] and [canvas,1419,0,1,720,1420,0,140,720]) and the LAST `fillRect` of the frame is `[0,0,1560,720]` with fillStyle `PALETTE.ink` (the underlay), while without `app.canvas` there is no `drawImage` but the underlay is still drawn; save count equals restore count in all three views. Pointer: on the wide view `app.pointer('down', -50, 100)` reaches scene a as ('down', -50, 100) and `app.pointer('up', 1360, 5)` as ('up', 1360, 5).",
   "More wide-view cases in the same file (19.5:9 1560x720). Transition: `app.go('a')`, `app.push('b', null, {transition: 'slide-left'})`, draw at n = 175 (progress 0.5, eased 0.875): `translate` calls contain [-1365,0] and [195,0] (w is 1560, not 1280) and every transition `clip` is `rect(0,0,1560,720)`; scene a and b are each drawn once, each inside its own `translate [140,0]`. CRT: `app.settings.crt = true` gives `createRadialGradient` args [780,360,252,780,360,1170] and a last-but-one `fillRect [0,0,1560,720]` (vignette) with the sweep rect `[0,yy,1560,80]` last, and no `translate` call lies between the last stage `restore` and the CRT `stroke` (the CRT is drawn at base transform over the full canvas). Toast: `app.toast('hi')` then draw at n = 1000: a `translate [140,0]` precedes the toast panel path that starts `moveTo(370, 640)`. Particles: `app.burst('confetti', 100, 100, 5)` then draw: 5 `fillRect` calls with height 6, preceded by `translate [140,0]`. Flash: `app.disaster()` then draw: a `fillRect` whose fillStyle starts with 'rgba(217,72,59,' exists (after the GU14 edit it is `[-144,0,1568,720]`: assert only that x <= -140 and x + w >= 1420, so the test also passes with the edit applied).",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/app_view.test.mjs'` prints one line.", "`make test 2>&1 | grep -E 'PASS tests/(scenes|app_fx|app_overlays).test.mjs'` prints three lines (every earlier app test is unchanged and green).", "`grep -c 'finishStrips' src/ui/scenes.js` prints 2 (import plus one call).", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Every scene file; boot.js (WD06); any GU or GE module (their one-line edits are listed in docs/art/WD.md)."]),

 dict(id="WD06", title="Boot: build app.view and safe insets, orientation re-fit, DESIGN.md", needs=["WD01", "WD02", "WD03", "W68d", "GE24", "CC10"],
  files=["src/boot.js", "tests/boot_view.test.mjs", "docs/DESIGN.md"],
  goal="Connect the new layout to the running game in the browser and the iPhone WKWebView: after every layout (start, resize, orientation change) `app.view` (and `app.safe`, the same object as `app.view.safe`) is refreshed IN PLACE, the canvas is handed to the app for strip filling, and iOS gets a second re-fit 250 ms after rotation (innerWidth is stale during the rotation event). Pointer code needs NO change: `toLogical` already returns stage coordinates. ORDER: after W68d (it rewrites boot.js). boot.js is also edited by GE24 and CC10; the `needs` fix the order W68d, GE24, CC10, WD06, WD14 (one at a time, each edit is local). WD05 may merge before or after this card.",
  read=[PLAN, "src/boot.js (as changed by W68d, and CC10 / GE24 when merged): `applyLayout`, `layoutInfo`, `reapply`, `createApp`, `onPointer`", "tests/boot.test.mjs (copy its helpers `makeWindow`, `makeCanvas`, `makeDocument`, `makeEvent` into the new test file; do NOT edit boot.test.mjs)", "src/ui/view.js (WD02) and src/ui/safearea.js (WD03)", "docs/DESIGN.md lines 28, 345 and 357"],
  steps=[
   "`src/boot.js`: import `{ defaultView, makeView, setView }` from './ui/view.js' and `{ viewInsets, readCssInsets }` from './ui/safearea.js'. Near the top of `bootGame` add `let appRef = null;` and `function currentView() { return makeView(layoutInfo.layout, layoutInfo.dpr, viewInsets(layoutInfo.layout, readCssInsets(win, doc))); }`. Inside `reapply()`, right after `layoutInfo = applyLayout(canvas, win);`, add `if (appRef) { setView(appRef.view, currentView()); }`. Right after the app object exists (after the `createApp(...)` or `createGame(...)` call W68d uses; `createGame` returns an app built by `createApp`) add: `appRef = app; if (!app.view) { app.view = defaultView(); } app.canvas = canvas; setView(app.view, currentView()); app.safe = app.view.safe;`. Leave the pointer handlers, `toLogical` use, key handler and everything else exactly as they are.",
   "Still in boot.js: the existing `win.addEventListener('orientationchange', reapply);` becomes `win.addEventListener('orientationchange', function () { reapply(); if (typeof win.setTimeout === 'function') { win.setTimeout(reapply, 250); } });` (the fake window in the tests has no setTimeout, so the guard matters).",
   "`docs/DESIGN.md` three edits. Line 28 `- Logical canvas 1280x720 (16:9), always scaled to fit with letterbox bars. Landscape only; portrait shows a \"turn your phone sideways\" card.` becomes `- Logical canvas 720 high and 1280 to 1568 wide (the device aspect: 16:9 desktop and iPad letterbox top and bottom, a 19.5:9 iPhone fills the whole screen). A 1280x720 STAGE sits in the middle; every control and all text live on the stage, the strips either side only show background art. Landscape only; portrait shows a \"turn your phone sideways\" card.` Line 345 `ui/canvas.js:   LOGICAL_W=1280  LOGICAL_H=720  fitLayout(winW,winH)->{scale,offX,offY,viewW,viewH}` becomes `ui/canvas.js:   LOGICAL_W=1280 (stage)  LOGICAL_H=720  fitLayout(winW,winH)->{scale,offX,offY,viewW,viewH,fullW,fullH,stageX,stageW}  toLogical -> STAGE coords (x < 0 or > 1280 = a strip)  ui/view.js: app.view`. Line 357: after `audio:{play(name)}` add `, view:{fullW,fullH,stageX,stageW,dx,left,right,wide,safe}, safe` and add one sentence after the line: `w and h stay 1280 and 720 (the stage); scenes never read fullW except to draw background art into the strips.`",
   "`tests/boot_view.test.mjs` with the copied helpers (`makeWindow` gains an optional third parameter `dpr` and a `getComputedStyle` field set by the test). Phone: window 852x393, dpr 3, `getComputedStyle = () => ({getPropertyValue: (n) => ({'--sai-b':'21px','--sai-l':'59px','--sai-r':'59px'})[n] || ''})`, `documentElement: {}` on the doc: after `bootGame` `app.view.fullW` is 1564, `stageX` 142, `wide` true, `safe.left` 0, `safe.bottom` near 38.4733 (1e-3), `app.safe === app.view.safe`, `app.canvas === canvas`, and `parseFloat(canvas.style.height)` is near 393 (1e-6). Resize: remember `const v = boot.app.view;` set `win.innerWidth = 1280; win.innerHeight = 720;` call every `win.handlers.resize` function: `boot.app.view === v`, `v.fullW` 1280, `v.wide` false, `v.safe === boot.app.safe`. Orientation: a window with a `setTimeout` recorder: dispatching `orientationchange` records exactly one timer with delay 250 and calling its function re-fits; a window without setTimeout does not throw. Pointer (register a spy scene `{id:'spy', pointer(app,type,x,y){log.push([type,x,y]);}}` and `app.go('spy')`): window 1560x720 dpr 1: pointerdown at client (140,360) logs ['down',0,360]; at (100,360) logs x -40; at (1500,360) logs x 1360; window 1280x720: client (100,360) logs x 100; window 2560x1080 (bars of 104 css px): client (50,500) logs nothing (null).",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/boot_view.test.mjs'` prints one line.", "`make test 2>&1 | grep 'PASS tests/boot.test.mjs'` prints one line (existing boot tests unchanged).", "`grep -c 'Logical canvas 720 high' docs/DESIGN.md` prints 1.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["src/ui/scenes.js (WD05); index.html and safearea.js (WD03); any scene.", "boot code owned by other cards: only the lines named above change."]),

 dict(id="WD07", title="Room plates: wide plates drawn at -144, wide manifest first", needs=["GE13", "WD01"],
  files=["src/art/rooms.js", "tests/rooms_wide.test.mjs"],
  goal="The room plate loader learns wide plates: 784x360 art pixels drawn x2 is 1568x720, drawn at stage x -144 so the central 1280 is the old plate and 144 px of room continues on each side (the canvas crops what a narrower screen does not need). It loads `assets/art/rooms/wide/manifest.json` first and falls back per room to the narrow `assets/art/rooms/manifest.json`, so the game works with only narrow plates, only wide plates, or a mix. " + TERMS + " ORDER: after GE13 (it extends rooms.js) and WD01. The six GE scene cards (GE17 to GE23) need NO edit: they call `app.rooms.draw(ctx, id, {look})` which now handles both widths; the strips of a narrow plate are filled by WD04's smear.",
  read=[PLAN, "src/art/rooms.js (GE13: `createRooms(env)`, `PARALLAX`, `load`, `has`, `info`, `draw`, `drawFront`) and tests/rooms.test.mjs (its fake loaders and how it awaits `load()`: copy that style; every GE13 test must stay green)", FK],
  steps=[
   "In `src/art/rooms.js`: `load()` now reads TWO manifests with `env.loadJson`: first `assets/art/rooms/wide/manifest.json`, then `assets/art/rooms/manifest.json`; each may reject or be missing (ignore it, never reject). For every id the WIDE entry wins when it exists, and its images load from `assets/art/rooms/wide/<file>` (and `<front>`); an id only in the narrow manifest loads from `assets/art/rooms/<file>` exactly as in GE13. Keep a private map id -> {dir, entry}. `info(id)` still returns exactly `{w, h, scale, hasFront}` (do not add keys: GE13's test deep-equals it).",
   "Add `plateX(id)`: unknown id or a plate whose `w * scale <= 1280` returns 0; otherwise `-((w * scale - 1280) / 2)` (784 wide at scale 2 gives -144). In `draw` replace the destination x `0` of the single `drawImage` by `plateX(id)` (still `(img, x, 0, w * scale, h * scale)`; a narrow plate still gives `(img, 0, 0, 1280, 720)`). In `drawFront` the x becomes `plateX(id) + Math.round(-look.x * PARALLAX.front.x)` (y unchanged).",
   "`tests/rooms_wide.test.mjs` with fake loaders recording urls (images are `{url, width, height}`; the loaders resolve by url from two maps). Case A: wide manifest {office:{file:'office.png', w:784, h:360, scale:2, front:'office_front.png'}} and narrow manifest {office:{file:'office.png',w:640,h:360,scale:2,front:'office_front.png'}, garage:{file:'garage.png',w:640,h:360,scale:2}}: after `await load()` the office image url is 'assets/art/rooms/wide/office.png' and the garage url 'assets/art/rooms/garage.png'; `draw(ctx,'office')` makes one `drawImage` with args (officeImg,-144,0,1568,720); `draw(ctx,'garage')` (garageImg,0,0,1280,720); `plateX('office')` is -144, `plateX('garage')` 0, `plateX('zzz')` 0; `info('office')` deep-equals {w:784,h:360,scale:2,hasFront:true}; `drawFront(ctx,'office',{look:{x:1,y:-1}})` draws at x -150 and y 3; `drawFront(ctx,'office',{look:{x:0,y:0}})` at -144, 0.",
   "Case B: the wide loader rejects: office draws at (0,0,1280,720) from the narrow url. Case C: the narrow manifest rejects but the wide exists: office draws wide, `has('garage')` is false and `draw(ctx,'garage')` returns false with no drawImage. Case D: both reject: `load()` still resolves, `has('office')` false. In every case `save` count equals `restore` count and `imageSmoothingEnabled` was set to false.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/rooms_wide.test.mjs'` prints one line.", "`make test 2>&1 | grep 'PASS tests/rooms.test.mjs'` prints one line (GE13's tests unchanged).", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["assets (WD10 builds the wide plates); any scene; boot.js."]),

 dict(id="WD08", title="Blender: render any room script on a wider frame (roomwide.py)", needs=["GE02"],
  files=["tools/art/roomwide.py", "tests/run_roomwide.sh"],
  goal="One driver that renders a GE room script 1568x720 instead of 1280x720 WITHOUT editing the room scripts: the camera and image get 144 px more each side, `roomlib.project` still returns game-screen pixels, and every box that touches the old left or right frame edge (wall, floor, skirting, cornice, shop fronts, curtains) is stretched out to the new edge just before the render. The prototype of this driver was run on the office and title prototype scripts and looked at by a human: the code below is that code. ORDER: after GE02 (roomlib.py). WD10 uses it.",
  read=[PLAN, "tools/art/roomlib.py (GE02: `setup_camera`, `project`, `reset`, `wx`, `wz`, `box`, `mat`, `light`, `world`, `setup_render`) and docs/art/ge_proto/room_title.py (how a room script calls them)", BL],
  steps=[
   "Create `tools/art/roomwide.py` with exactly this content (do not redesign; the render_pre handler is registered inside the patched `setup_camera` because `roomlib.reset()` clears all app handlers):\n" + ROOMWIDE_CODE,
   "Create `tests/run_roomwide.sh` (sh, `set -u`, `cd` to the repo root, `BLENDER=${BLENDER:-/opt/homebrew/bin/blender}`, `mkdir -p /tmp/wd08`). It writes this probe to `/tmp/wd08/probe.py` (a here-doc) and runs `$BLENDER --background --python-exit-code 1 --python /tmp/wd08/probe.py`, keeping only lines that contain `WD08` or `WIDE`:\n" + PROBE,
   "The shell script requires these numbers (use `awk`): `WD08 res 1568 720 15.68`; `WIDE extended=` with a number >= 1; `WD08 wall -1.44 14.24`; `WD08 mid 4.0 5.0`; `WD08 proj0` within 1 of 0 and `WD08 proj1280` within 1 of 1280 (so game-screen coordinates are unchanged); `WD08 img 1568 720` with `alphaL 1.00 alphaR 1.00 alphaC 1.00`. Print `ROOMWIDE OK` when all hold, otherwise print the captured lines and exit 1.",
   "Also run it by hand on the real prototype room script as a smoke test and say in your summary what it printed: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/roomwide.py -- tools/art/room_title.py --out /tmp/wd08/title_wide.png --samples 8` (or `docs/art/ge_proto/room_title.py /tmp/wd08/title_wide.png 8` if the production script is not merged yet; the prototype takes the output as its first argument). It must print a `WIDE extended=` line with a number >= 4 and `RENDERED`, and the PNG must be 1568x720 (read the width and height from the PNG header: `struct.unpack('>II', data[16:24])`).",
  ],
  accept=["`sh tests/run_roomwide.sh` prints `ROOMWIDE OK`.", "`python3 -c \"import ast;ast.parse(open('tools/art/roomwide.py').read())\"` prints nothing and exits 0."],
  oos=["tools/art/roomlib.py and every room script (the driver patches them at run time).", "Do not commit PNGs (WD10 does)."]),

 dict(id="WD09", title="Room checker: --wide option (rectangles in stage px, negative x allowed)", needs=["GE03"],
  files=["tools/art/check_room.py", "tests/run_check_room_wide.sh"],
  goal="Teach the numeric room checker about wide plates: `--wide 144` means the plate covers screen x -144..1424, so `--solid -144,0,144,720` is the whole left strip. Without `--wide` nothing changes. ORDER: after GE03. WD10 uses it.",
  read=[PLAN, "tools/art/check_room.py (GE03: the option loop, `sx, sy = w / 1280.0, h / 720.0`, the `x0, y0, rw, rh = ...` line)", "tests/run_pixelbg.sh (GE03: how it makes a synthetic PNG with `blender --background --python-expr` and how it checks the checker's exit code 2: copy both methods)", BL],
  steps=[
   "`tools/art/check_room.py`: add the default `'--wide': '0'` to the `opts` dict (the existing key/value loop already accepts it). After `ew, eh` is computed set `bleed = int(opts['--wide'])` and replace `sx, sy = w / 1280.0, h / 720.0` by `sx, sy = w / float(1280 + 2 * bleed), h / 720.0`. In the per-check line use `x0 = int((v[0] + bleed) * sx)` (instead of `int(v[0] * sx)`); the other three numbers of that line stay. Update the usage comment at the top to mention `[--wide <bleed px>]` and that rectangles are screen px of the 1280 stage (x may be negative with --wide).",
   "`tests/run_check_room_wide.sh` (sh, repo root): make a synthetic 784x360 opaque PNG with Blender numpy (`a[:,:,3]=1; a[:,:,1]=0.6; a[:,:72,:3]=(1,0,0); a[:,712:,:3]=(0,0,1)`: red left 72 columns, blue right 72 columns, green-ish between) saved to /tmp/wd09_syn.png (rows are bottom-up in Blender, but every row is the same).",
   "Require `ROOM OK` from `check_room.py -- /tmp/wd09_syn.png --size 784x360 --max-colors 8 --wide 144 --warm -144,0,144,720,100 --cold 1280,0,144,720,100 --solid -144,0,1568,720`. Require exit code 2 and `ROOM FAIL` from the same file with `--wide 144 --cold -144,0,144,720,100` (the left strip is red, not blue). Require that WITHOUT `--wide` the old behaviour holds: `--size 784x360 --max-colors 8 --solid 0,0,1280,720` is `ROOM OK`. Print `CHECKROOM WIDE OK`.",
  ],
  accept=["`sh tests/run_check_room_wide.sh` prints `CHECKROOM WIDE OK`.", "`sh tests/run_pixelbg.sh` still prints `PIXELBG OK` (GE03's own test, if it is merged).", "`grep -c \"'--wide'\" tools/art/check_room.py` prints 1 or more."],
  oos=["tools/art/pixelbg.py and the room scripts."]),

 dict(id="WD10", title="Build the wide room plates (784x360) and their manifest", needs=["GE12", "WD08", "WD09"],
  files=["tools/art/build_rooms_wide.sh", "tests/run_build_rooms_wide.sh", "assets/art/rooms/wide/manifest.json"],
  goal="One command that renders every room plate on the 1568x720 frame, pixelates it to 784x360 and writes `assets/art/rooms/wide/<id>.png` plus `assets/art/rooms/wide/manifest.json`, which WD07's loader reads before the narrow manifest. Narrow plates (GE12's `assets/art/rooms/*.png`) stay untouched, so nothing of GE12 or its tests changes. ORDER: after GE12 (all room scripts exist), WD08, WD09. The planner looks at the pictures afterwards; the strips are generated, not designed, so QA may ask for per-room tweaks (a prop standing within 20 px of the old edge gets stretched).",
  read=[PLAN, "tools/art/build_rooms.sh and tests/run_build_rooms.sh (GE12: copy its structure, loop and manifest writer) and the room test scripts tests/run_room_office.sh, run_room_garage.sh, run_room_auction.sh, run_room_title.sh, run_room_desk.sh (the exact render, pixelbg and check_room commands per room)", "tools/art/roomwide.py (WD08) and tools/art/check_room.py (WD09: `--wide 144`)", BL],
  steps=[
   "`tools/art/build_rooms_wide.sh [room]` (sh, repo root, `mkdir -p assets/art/rooms/wide /tmp/wd10`; rooms `office garage auction title ledger bookings`; with an argument only that room). For each room render with the wide driver using the SAME room script, arguments and sample count as its GE test script: `$BLENDER --background --python-exit-code 1 --python tools/art/roomwide.py -- tools/art/room_<x>.py --out /tmp/wd10/<id>_raw.png --samples 48` (ledger and bookings use `room_desk.py` with `--variant ledger` or `--variant bookings`; office also renders `--front` into `/tmp/wd10/office_front_raw.png`). Then `$BLENDER --background --python tools/art/pixelbg.py -- --in <raw> --out assets/art/rooms/wide/<id>.png --width 784 --colors <C> --dither <D>` with: office 96 0.22 (front plate `office_front.png`: 32 colours), garage 80 0.2, auction 96 0.22, title 80 0.2, ledger 64 0.2, bookings 64 0.2.",
   "After each pixelbg run `check_room.py -- <png> --size 784x360 --wide 144 --max-colors <C>` plus these strip checks (stage px): office, garage, auction, ledger, bookings: `--solid -144,0,144,720 --solid 1280,0,144,720` (both strips fully opaque); title: `--hole -144,0,144,200 --hole 1280,0,144,200 --solid -144,560,144,60 --solid 1280,560,144,60` (open sky, shops and road continue); office front plate: `--size 784x360 --wide 144 --max-colors 32 --hole -144,0,1568,300`. Print `OK <room>` or `FAIL <room>`; keep going; exit 1 if any failed. Do not change thresholds; if a strip check fails report which room and the numbers (STATUS: BLOCKED), because that means a room script has a gap the driver cannot stretch.",
   "At the end write `assets/art/rooms/wide/manifest.json` with python3 (standard library only, same as GE12): for every `<id>.png` that exists read width and height from the PNG header and write `{id: {file, w, h, scale: 2}}` plus `front` for office when `office_front.png` exists; keys sorted, 1-space indent. Print `MANIFEST <n> rooms`.",
   "`tests/run_build_rooms_wide.sh`: run `sh tools/art/build_rooms_wide.sh title` and require `OK title` and `MANIFEST`; then validate with python3 that every entry of the manifest has w 784, h 360, scale 2 and its file exists next to the manifest. Print `BUILD ROOMS WIDE OK`. Run the FULL `sh tools/art/build_rooms_wide.sh` once yourself and commit the six or seven PNGs (about 100 to 250 KB each) and the manifest; paste the `colors=` and `size=` numbers check_room printed per room into your summary.",
  ],
  accept=["`sh tests/run_build_rooms_wide.sh` prints `BUILD ROOMS WIDE OK`.", "`python3 -c \"import json;d=json.load(open('assets/art/rooms/wide/manifest.json'));print(sorted(d))\"` prints the six ids ['auction', 'bookings', 'garage', 'ledger', 'office', 'title'].", "`python3 -c \"import json;d=json.load(open('assets/art/rooms/wide/manifest.json'));print(set((v['w'],v['h']) for v in d.values()))\"` prints {(784, 360)}."],
  oos=["assets/art/rooms/*.png and assets/art/rooms/manifest.json (GE12's narrow plates stay as they are).", "Room scripts and roomlib."]),

 dict(id="WD11", title="Title scene: stars, sky, road and dashes across the whole canvas", needs=["WD05", "GE23", "CC18"],
  files=["src/ui/scenes/title.js", "tests/scene_title_view.test.mjs"],
  goal="The title scene draws its night sky, stars, road strip and scrolling dashes across the full canvas (`app.view.left` to `app.view.right`) instead of only 0..1280, so the strips show a real sky and a moving road, not a smeared edge pixel (a dash crossing the edge column would flash a yellow streak). Buttons, LAYOUT and the car are unchanged. On a 16:9 view every existing call is identical. " + TERMS + " ORDER: after WD05 (fakeapp has `app.view`), GE23 and CC18 (both rewrite parts of title.js). If a quoted line below was changed by them, apply the same idea to the equivalent line and say so in your summary.",
  read=[PLAN, "src/ui/scenes/title.js (as changed by GE23 and CC18: `starAt`, the sky gradient fill `ctx.fillRect(0, 0, app.w, ROAD_TOP)`, the road fill `ctx.fillRect(0, ROAD_TOP, app.w, ROAD_BOTTOM - ROAD_TOP)`, the dash loop `for (let x = start; x < app.w; x += period)`)", "tests/scene_title.test.mjs and tests/scene_title_plate.test.mjs (GE23) must stay green", "tests/fakeapp.js (WD05 added `app.view`)", FK],
  steps=[
   "In `draw`, first line after the hit-list reset: `const left = app.view ? app.view.left : 0; const right = app.view ? app.view.right : app.w; const span = right - left;`. Change `starAt(i)` to `starAt(i, left, span)` returning `x: left + (i * 137 + 53) % span` (y unchanged); with left 0 and span 1280 the positions are identical to today. Change the sky fill to `ctx.fillRect(left, 0, span, ROAD_TOP)` and the road fill to `ctx.fillRect(left, ROAD_TOP, span, ROAD_BOTTOM - ROAD_TOP)`. The dash loop becomes `const start = left - ((t * speed) % period); for (let x = start; x < right; x += period)`.",
   "In plate mode (GE23) the `app.rooms.draw(ctx, 'title', ...)` call and the lamp glows stay as they are (the wide plate already covers the strips; a narrow plate gets WD04's smear). Do not touch buttons, LAYOUT, the logo text or the car code.",
   "`tests/scene_title_view.test.mjs` (fakectx, fakeapp, copy the draw/tap helpers of tests/scene_title.test.mjs): with the default view the sky fillRect is `[0,0,1280,640]` and the road fillRect is `[0,640,1280,80]`. With `app.view = {...app.view, left: -140, right: 1420, stageX: 140, wide: true}` (19.5:9, 1560x720): the sky fillRect is `[-140,0,1560,640]`, the road fillRect `[-140,640,1560,80]`; at t = 0 the first dash `fillRect` has x -140 and y 676, a dash with x >= 1280 exists, no dash starts below -140 - 100 or at x >= 1420; among the 40 star `fillRect` calls (2x2 with a white rgba fillStyle) at least one has x < 0 and at least one has x > 1280 and none has x < -140 or x > 1420 (stars are at -140 + (i*137+53) % 1560, giving x in [-140, 1367] with 5 below 0 and 3 above 1280). The NEW GAME button still works with the wide view: draw, then pointer down and up at the centre of LAYOUT.newGame records `['newGame']` on the fake app.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/scene_title_view.test.mjs'` prints one line.", "`make test 2>&1 | grep -E 'PASS tests/scene_title'` lists every title test file as PASS.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Buttons, LAYOUT, the car drawing, CC18 drive-by code, GE23 plate code."]),

 dict(id="WD12", title="News overlay: dim the whole canvas and tap anywhere in the strips", needs=["WD05", "W63"],
  files=["src/ui/scenes/news.js", "tests/scene_news_view.test.mjs"],
  goal="The newspaper dims 'the room behind the paper' with a 60 percent black rectangle over 0..1280 only: on a wide screen the strips would stay bright (a visible step at the stage edge), and 'any tap advances the paper' would not work in a strip. Make both cover the full canvas. A 16:9 view gives identical calls. " + TERMS + " ORDER: after WD05 (fakeapp has `app.view`) and W63 (the news scene).",
  read=[PLAN, "src/ui/scenes/news.js (the `draw` function: `hits.add('anywhere', 0, 0, app.w, app.h, function () {` and `ctx.fillRect(0, 0, app.w, app.h);` under the 'Dim the room behind the paper' comment)", "tests/scene_news.test.mjs (helpers `freshApp`, `drawOnce`, `tap`; keep every test green)", "tests/fakeapp.js", FK],
  steps=[
   "In `draw` after the `state` guard add `const left = app.view ? app.view.left : 0; const right = app.view ? app.view.right : app.w;`. Change `hits.add('anywhere', 0, 0, app.w, app.h, ...)` to `hits.add('anywhere', left, 0, right - left, app.h, ...)` and the dim `ctx.fillRect(0, 0, app.w, app.h);` to `ctx.fillRect(left, 0, right - left, app.h);`. Nothing else in the file changes.",
   "`tests/scene_news_view.test.mjs`: copy `baseState`, `freshApp`, `drawOnce`, `tap` from tests/scene_news.test.mjs. Default view: the dim fillRect (fillStyle 'rgba(0,0,0,0.6)') is `[0,0,1280,720]`. Wide view (`app.view = {...app.view, left: -140, right: 1420, stageX: 140, wide: true}`): it is `[-140,0,1560,720]`; a tap (down then up after a draw) at stage (-100, 300) advances the paper exactly like a tap at (640, 300) does in the existing tests (compare `newsScene.page` or the `app.calls` the existing tests check); a tap at (1400, 10) does the same; with the default view a tap at (-100, 300) does nothing.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/scene_news_view.test.mjs'` prints one line.", "`make test 2>&1 | grep 'PASS tests/scene_news.test.mjs'` prints one line.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Paper layout, month report, any other scene."]),

 dict(id="WD13", title="Auction hall: stretch the warm glow band over the whole canvas", needs=["WD05", "GE21", "CC16"],
  files=["src/ui/scenes/auction.js", "tests/scene_auction_view.test.mjs"],
  goal="`drawHall` paints a 10 percent lamp-coloured band exactly as wide as the stage (`P.x - 120` .. `P.x + P.w + 120` is 0..1280): in the strips it would be missing, leaving a faint vertical step at the stage edges. Widen that one rectangle with a fixed overdraw (the hall function has no `app` argument, so use the constants -144 and 1424, the largest strip). The canvas crops what is not needed. ORDER: after WD05, GE21 and CC16 (GE21 and CC16 both rewrite drawHall: if the quoted line below no longer exists, because the plate replaced the band, change nothing, say so in your summary, and write only the test that the scene draws no full-stage-width alpha fill that stops at 0 and 1280).",
  read=[PLAN, "src/ui/scenes/auction.js (`drawHall`, the line `ctx.fillRect(P.x - 120, P.y - 40, P.w + 240, P.h + 120);` after `ctx.fillStyle = rgba(PALETTE.lamp, 0.10);`)", "tests/scene_auction_a.test.mjs and tests/scene_auction_b.test.mjs (their setup helpers; they must stay green)", "tests/fakeapp.js", FK],
  steps=[
   "In `drawHall` change that one `fillRect` to `ctx.fillRect(Math.min(P.x - 120, -144), P.y - 40, Math.max(P.x + P.w + 120, 1424) - Math.min(P.x - 120, -144), P.h + 120);` (with the default layout this is `[-144, 60, 1568, 380]`; the canvas of a 16:9 screen only shows 0..1280 of it, so nothing visible changes there). Nothing else in the file changes.",
   "`tests/scene_auction_view.test.mjs` (copy the app/state setup of tests/scene_auction_a.test.mjs): draw once with the fake app; the `fillRect` whose fillStyle is 'rgba(255,210,122,0.1)' and whose height is 380 now satisfies x <= -144 and x + w >= 1424 (assert those two inequalities, not exact numbers, so a GE21 change of P keeps it valid); no `fillRect` with an rgba fillStyle of alpha below 1 has `x === 0 && x + w === 1280` and height >= 100 (the seam rule of WD15).",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/scene_auction_view.test.mjs'` prints one line.", "`make test 2>&1 | grep -E 'PASS tests/scene_auction'` lists every auction test file as PASS.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Everything else in auction.js (layout, crowd, buttons, GE21 plate code)."]),

 dict(id="WD14", title="Dev switches: ?size=852x393 and ?safe=0,59,21,59 to test phone layouts in a desktop browser", needs=["WD06"],
  files=["src/ui/devsize.js", "src/boot.js", "tests/devsize.test.mjs"],
  goal="Let the planner, the visual QA loop and Lee check the wide layout without a phone: opening index.html with `?size=852x393` lays the game out as if the window were 852x393 (canvas placed top-left, rest black) and `&safe=0,59,21,59` fakes the iPhone insets (top,right,bottom,left in CSS px). Without the parameters nothing changes. ORDER: after WD06 (boot.js).",
  read=[PLAN, "src/boot.js (as changed by WD06: both `applyLayout(canvas, win)` calls, `currentView`, `readCssInsets(win, doc)`)", "tests/boot_view.test.mjs (WD06: copy its helpers)", FK],
  steps=[
   "`src/ui/devsize.js` (pure): `parseDevSize(search)` returns `{w, h}` when the query string (a string like '?a=1&size=852x393', with or without the leading '?') contains `size=<w>x<h>` with w and h integers between 200 and 4000, else null (also for undefined, '' and non-strings). `parseDevInsets(search)` returns `{top, right, bottom, left}` from `safe=<t>,<r>,<b>,<l>` (four numbers 0..200) else null. `devWindow(win, search)` returns `{innerWidth: w, innerHeight: h, devicePixelRatio: win.devicePixelRatio}` when `parseDevSize(search)` is set, else `win` itself.",
   "`src/boot.js`: `const search = win.location && typeof win.location.search === 'string' ? win.location.search : '';` near the top of bootGame. Use `devWindow(win, search)` as the window argument of BOTH `applyLayout` calls (the first and the one in `reapply`) and in `currentView` use `viewInsets(layoutInfo.layout, parseDevInsets(search) || readCssInsets(win, doc))`. Nothing else changes (`win.innerWidth` is still read from the real window by the resize event).",
   "`tests/devsize.test.mjs`: parseDevSize('?size=852x393') is {w:852,h:393}; '?a=1&size=1560x720' {w:1560,h:720}; 'size=852x393' (no '?') works; '?size=0x0', '?size=99999x10', '?size=abc', '', undefined and 5 give null. parseDevInsets('?safe=0,59,21,59') is {top:0,right:59,bottom:21,left:59}; '?safe=1,2,3' and '?safe=a,b,c,d' give null. devWindow with a search of '' returns the same win object (`===`); with '?size=852x393' returns {innerWidth:852, innerHeight:393, devicePixelRatio: win's}. Boot: copy the helper functions of tests/boot_view.test.mjs; a fake window 1280x720 with `location: {search: '?size=852x393&safe=0,59,21,59'}` and dpr 3: after bootGame `app.view.fullW` is 1564, `stageX` 142, `safe.bottom` near 38.4733 (1e-3), `parseFloat(canvas.style.height)` is near 393 (1e-6); a window with no `location` boots normally with `app.view.fullW` 1280.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/devsize.test.mjs'` prints one line.", "`make test 2>&1 | grep -E 'PASS tests/boot(_view)?.test.mjs'` prints two lines.", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["index.html; any scene; src/ui/canvas.js."]),

 dict(id="WD15", title="Seam audit: every scene and every full-screen effect covers the strips", needs=["WD05", "WD11", "WD12", "WD13", "GU14", "GU16", "GU19", "GE14"],
  files=["tests/viewaudit.test.mjs"],
  goal="A permanent numeric gate for the wide screen. Part A draws every scene on a 19.5:9 view and fails when a scene paints a translucent rectangle across exactly the stage width (0..1280) that does not reach the strips (the visible step at the stage edge). Part B checks the four full-screen effects that live in other cards (flash, day-change dim, vignette, TV-static wipe) really cover the strips. If a Part B check fails, a one-line edit listed in docs/art/WD.md was not applied to that card's module: apply it (it is one line) and say so. " + TERMS + " ORDER: last of the WD cards.",
  read=[PLAN, "tests/fakeapp.js (WD05: `makeApp(state)` has `app.view`), src/sim/newgame.js (`startGame(3)`), tests/fakectx.js", "src/ui/screenfx.js (GU14), src/ui/daychange.js (GU19), src/art/roomfx_light.js (GE14), src/ui/transitions2.js (GU16)", FK],
  steps=[
   "`tests/viewaudit.test.mjs`, Part A. Import `makeApp`, `startGame` and the scenes `titleScene, officeScene, garageScene, auctionScene, tvshopScene, bookingsScene, ledgerScene, advertsScene, settingsScene, endgameScene, newsScene` from their `src/ui/scenes/<name>.js` files (the export names are `<name>Scene`). Helper `seams(ctx)`: walk `ctx.calls`; remember the current `set:fillStyle` and `set:globalAlpha` values (default alpha 1) and keep a stack so `save` pushes both and `restore` pops them; for each `fillRect [x,y,w,h]` with `x <= 0 && x + w >= 1280 && h >= 100` compute the alpha (parse `rgba(r,g,b,a)` strings with a regex; any other fillStyle counts as alpha 1); it is a seam when (alpha < 1 or globalAlpha < 1) and NOT (x <= -140 and x + w >= 1420); return the list. For each scene: `const app = makeApp(startGame(3)); app.view = {...app.view, left: -140, right: 1420, stageX: 140, dx: 140, fullW: 1560, wide: true}; if (scene.enter) scene.enter(app, {}); const ctx = makeCtx(); scene.draw(ctx, app, 0);` inside try/catch (a scene that throws counts as `skipped`). Print `AUDIT scenes=11 ok=<n> skipped=<n> seams=<n>` and `test` requires skipped 0 (all eleven scenes draw with this setup today), seams 0, and prints the offending [scene id, rect, fillStyle] for any seam.",
   "Part B (same file, separate tests; the wide numbers are 1560 wide): (1) flash: `const fx = makeScreenFx(); fxFlash(fx, '#D9483B', 180, 0, 0.8); const c = makeCtx(); fxBegin(c, fx, 0); fxEnd(c, fx, 0);` one `fillRect` with a fillStyle starting 'rgba(217,72,59,' has x <= -140 and x + w >= 1420. (2) day change: `drawDayChange(c, dayTimeline({day:1,cash:1000,rep:40,buzz:0},{day:2,cash:2400,rep:41,buzz:3}), 650, null)`: the first `fillRect` (fillStyle 'rgba(20,16,42,0.550)') has x <= -140 and x + w >= 1420. (3) vignette: `vignette(c, 1280, 720, 0.3)` fills a rect with x <= -140 and x + w >= 1420. (4) static wipe: `drawStaticWipe(c, {kind:'static', start:0, dur:400}, 200, function(){}, function(){}, 1560, 720)` makes exactly 49 * 23 = 1127 `fillRect` calls of size [32,32] (u 0.5 is full coverage) and the largest `x + 32` is at least 1560.",
   "Every imported name is from the cards named in `needs`; if an import fails because a module is missing, finish with `STATUS: BLOCKED` naming it. Do not weaken a threshold. Part A must keep passing when later scenes are added: it only reads scenes through the `draw` function.",
  ],
  accept=["`make test 2>&1 | grep 'PASS tests/viewaudit.test.mjs'` prints one line.", "`$JSC -m tests/viewaudit.test.mjs 2>&1 | grep 'AUDIT scenes=11 ok=11 skipped=0 seams=0'` prints one line (JSC as in `make test`; `make test` itself hides the output of passing files).", "`make test 2>&1 | grep -c '^FAIL'` prints 0."],
  oos=["Every file except the new test: a failing check is reported, and fixed by the one-line edits in docs/art/WD.md, not by editing scenes here."]),
]
