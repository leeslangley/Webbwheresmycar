# CA12: grilles per marque. The grille is the mouth of the car's face: a recessed
# dark opening (the recess), a surround frame round it, and the bars or mesh inside
# at the open front of the recess. Registers kind 'grille'. Blender only: this
# module imports bpy and bmesh through _common.
import math

import bmesh

from . import _common as c
from . import register

U = c.U
BEVEL = 0.15     # frame bevel, car units
FRAME_T = 0.5    # frame member thickness, car units
STYLES = ('oval_mesh', 'vertical_bars', 'horizontal_bars', 'egg_crate', 'kidney',
          'shield', 'slat_panel', 'none')
SURROUND_MAT = {'chrome': 'chrome', 'black': 'black', 'paint': 'paint'}


class _Namer(object):
    """Hands out grillebar_<i>_<k> names for one grille, k counting up from 0."""

    def __init__(self, i):
        self.i = i
        self.k = 0

    def __call__(self):
        name = 'grillebar_%d_%d' % (self.i, self.k)
        self.k += 1
        return name


def _bevelled_box(name, x, y, lat, dx, dh, dl, mat):
    """A box as _common.box, with every edge bevelled by BEVEL car units. The
    scale is baked into the mesh first, so the bevel is the true size."""
    obj = c.box(name, x, y, lat, dx, dh, dl, mat)
    sx, sy, sz = obj.scale
    me = obj.data
    for v in me.vertices:
        v.co = (v.co.x * sx, v.co.y * sy, v.co.z * sz)
    obj.scale = (1.0, 1.0, 1.0)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=BEVEL * U,
                    offset_type='OFFSET', segments=2, affect='EDGES')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return obj


def _frame(i, xc, y, w, h, mat):
    """The surround: four members round the recess, outside its edges. The top and
    bottom members run the full frame width so the corners are closed."""
    t = FRAME_T
    fw = w + 2.0 * t
    base = 'grillefr_%d' % i
    _bevelled_box(base + '_t', xc, y + h / 2.0 + t / 2.0, 0, 1.0, t, fw, mat)
    _bevelled_box(base + '_b', xc, y - h / 2.0 - t / 2.0, 0, 1.0, t, fw, mat)
    _bevelled_box(base + '_l', xc, y, -(w / 2.0 + t / 2.0), 1.0, h, t, mat)
    _bevelled_box(base + '_r', xc, y, w / 2.0 + t / 2.0, 1.0, h, t, mat)


def _horizontal(nm, cx, y, w, h, n, mat):
    """n bars across the grille, evenly spaced up its height."""
    for j in range(n):
        yy = y - h / 2.0 + h * (j + 1) / (n + 1.0)
        c.box(nm(), cx, yy, 0, 0.6, 0.35, w, mat)


def _vertical(nm, cx, y, w, h, n, mat):
    """n bars up the grille, evenly spaced across its width."""
    for j in range(n):
        lat = -w / 2.0 + w * (j + 1) / (n + 1.0)
        c.box(nm(), cx, y, lat, 0.6, h, 0.35, mat)


def _oval_frame(name, cx, y, lat, W, H, mat):
    """An ellipse W wide and H high, as a torus with its ring in the grille plane.
    The unit torus is scaled to the size: local X is height, local Y is sideways."""
    t = c.torus(name, cx, y, lat, 1.0, 0.3, 'x', mat)
    t.scale = (H / 2.0 - 0.3, W / 2.0 - 0.3, 1.0)
    return t


def _seg(name, cx, a, b, mat):
    """A bar from a to b, each (lat, height): one box, turned to lie along a-b."""
    dl = b[0] - a[0]
    dy = b[1] - a[1]
    s = c.box(name, cx, (a[1] + b[1]) / 2.0, (a[0] + b[0]) / 2.0, 0.6, 0.35,
              math.hypot(dl, dy), mat)
    s.rotation_euler = (math.atan2(dy, dl), 0.0, 0.0)


def _egg_crate(nm, cx, y, w, h, mat):
    _horizontal(nm, cx, y, w, h, 6, mat)
    _vertical(nm, cx, y, w, h, 4, mat)


def _slat_panel(nm, cx, y, w, h, mat):
    """Nine thin slats, each tilted 30 degrees about the sideways axis."""
    for j in range(9):
        yy = y - h / 2.0 + h * (j + 1) / 10.0
        s = c.box(nm(), cx, yy, 0, 0.6, 0.3, w, mat)
        s.rotation_euler = (0.0, math.radians(30.0), 0.0)


def _oval_mesh(nm, cx, ox, y, w, h, mat):
    """An oval frame with a cross-hatch of five thin bars inside it. The bars
    alternate +35 and -35 degrees and are cut short to stay inside the frame."""
    _oval_frame(nm(), ox, y, 0.0, w, h, mat)
    a = w / 2.0 - 0.5          # half-width inside the frame
    b = h / 2.0 - 0.5          # half-height inside the frame
    for k in range(5):
        th = math.radians(35.0) if k % 2 == 0 else -math.radians(35.0)
        lat = (k - 2) * a * 0.4
        half = min((a - abs(lat)) / math.cos(th), b / abs(math.sin(th)))
        s = c.box(nm(), cx, y, lat, 0.6, 0.3, 2.0 * half, mat)
        s.rotation_euler = (th, 0.0, 0.0)


def _kidney(nm, cx, ox, y, w, h, mat):
    """Two small ovals side by side, each w/2.2 wide, with three vertical bars in
    each."""
    W = w / 2.2
    for side in (-1, 1):
        lat_c = side * (W / 2.0 + 0.2)
        _oval_frame(nm(), ox, y, lat_c, W, h, mat)
        for j in range(3):
            lat = lat_c + (j - 1) * W / 4.0
            c.box(nm(), cx, y, lat, 0.6, h - 0.6, 0.35, mat)


def _shield(nm, cx, y, w, h, mat):
    """A V-shaped frame: a top edge w wide, and two arms that taper to 0.4 * w
    at the bottom, each arm made of two rotated boxes. Five vertical bars inside,
    each shorter than the one before."""
    top = y + h / 2.0 - 0.2
    bot = y - h / 2.0 + 0.2
    c.box(nm(), cx, top, 0, 0.6, 0.35, w, mat)
    for side in (-1, 1):
        p0 = (side * w / 2.0, top)
        p2 = (side * 0.2 * w, bot)
        p1 = ((p0[0] + p2[0]) / 2.0, (p0[1] + p2[1]) / 2.0)
        _seg(nm(), cx, p0, p1, mat)
        _seg(nm(), cx, p1, p2, mat)
    for k in range(5):
        lat = (k - 2) * 0.2 * w
        c.box(nm(), cx, y, lat, 0.6, (h - 0.8) * (1.0 - 0.15 * k), 0.35, mat)


# Each builder takes (nm, cx, ox, y, w, h, bars, mat): cx is the bars' plane, ox the
# open face of the recess, where the oval frames sit so their tube stands proud.
_CONTENT = {
    'horizontal_bars': lambda nm, cx, ox, y, w, h, bars, mat: _horizontal(nm, cx, y, w, h, bars, mat),
    'vertical_bars': lambda nm, cx, ox, y, w, h, bars, mat: _vertical(nm, cx, y, w, h, bars, mat),
    'egg_crate': lambda nm, cx, ox, y, w, h, bars, mat: _egg_crate(nm, cx, y, w, h, mat),
    'slat_panel': lambda nm, cx, ox, y, w, h, bars, mat: _slat_panel(nm, cx, y, w, h, mat),
    'oval_mesh': lambda nm, cx, ox, y, w, h, bars, mat: _oval_mesh(nm, cx, ox, y, w, h, mat),
    'kidney': lambda nm, cx, ox, y, w, h, bars, mat: _kidney(nm, cx, ox, y, w, h, mat),
    'shield': lambda nm, cx, ox, y, w, h, bars, mat: _shield(nm, cx, y, w, h, mat),
}


@register('grille')
def build_grille(part, ctx, i):
    """One grille: the black recess, then (unless the style is none) the surround
    frame and the style's content, all at the open front of the recess."""
    style = part.get('style', 'horizontal_bars')
    if style not in STYLES:
        raise ValueError('grille style %r is not one of %s' % (style, STYLES))
    surround = part.get('surround', 'chrome')
    if surround not in SURROUND_MAT:
        raise ValueError('grille surround %r is not one of chrome, black, paint'
                         % (surround,))
    bars = int(part.get('bars', 7))
    mult = ctx['mult']('mouth')
    w = part['w'] * mult
    h = part['h'] * mult
    y = part['y']
    mats = ctx['mats']
    surf = ctx['surf']
    if part.get('end', 'front') == 'rear':
        sgn = -1.0
        xc = surf.xmin + 0.6
    else:
        sgn = 1.0
        xc = surf.xmax - 0.6
    # The recess is 0.8 deep, centred on xc: its open face is at xc + sgn * 0.4.
    # The bars sit inside the recess, flush with that face; the oval frames stand
    # on it so their tube is half proud.
    cx = xc + sgn * 0.1
    ox = xc + sgn * 0.4

    c.box(c.part_name('grille', i, 0), xc, y, 0, 0.8, h, w, mats['black'])
    if style == 'none':
        return
    _frame(i, xc, y, w, h, mats[SURROUND_MAT[surround]])
    nm = _Namer(i)
    _CONTENT[style](nm, cx, ox, y, w, h, bars, mats['chrome'])
