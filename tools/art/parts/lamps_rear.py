# CA10: the rear lamps. Registers the 'taillamp' kind with six shapes: rect,
# round, vertical, cat_eye, fin and wrap. Car coordinates (see _common.py): x runs
# -50 (tail) to +50 (nose), y is height, lat is sideways. Tail lamps are not scaled
# by the caricature factor. Blender only: this module imports bpy through _common.
import math

from mathutils import Matrix

from . import _common
from . import register

FRAME_DEPTH = 0.7   # chrome frame box, along the car
LENS_DEPTH = 0.8    # red lens box, along the car
ROUND_DEPTH = 0.4   # round lens sphere, full depth
RING_TUBE = 0.3     # tube radius of the round lamp ring
RIM_TUBE = 0.25     # tube radius of the cat-eye rim
CAT_TILT = 25.0     # cat-eye tilt, degrees, up and outward
FIN_HEIGHT = 1.8    # fin lamp total height, times h
FIN_AMBER = 0.35    # fin amber top segment, times h
FLANK_LEN = 0.6     # wrap flank piece, times w


def _rect(name, x, y, lat, w, h, s, ctx):
    mats = ctx['mats']
    _common.box(name, x, y, lat, FRAME_DEPTH, h + 0.5, w + 0.5, mats['chrome'])
    _common.box(name + '_lens', x, y, lat, LENS_DEPTH, h, w, mats['lamp_red'])


def _round(name, x, y, lat, w, h, s, ctx):
    mats = ctx['mats']
    _common.torus(name, x, y, lat, w / 2.0, RING_TUBE, 'x', mats['chrome'])
    _common.sphere(name + '_lens', x, y, lat, ROUND_DEPTH / 2.0, w / 2.0,
                   w / 2.0, mats['lamp_red'])


def _vertical(name, x, y, lat, w, h, s, ctx):
    if w > h:
        w, h = h, w
    _rect(name, x, y, lat, w, h, s, ctx)


def _cat_eye(name, x, y, lat, w, h, s, ctx):
    mats = ctx['mats']
    # Tilt up and outward: the outer end of the lens rises. The near side (s = -1)
    # is at -Y, so its outer end rises with a negative rotation about X.
    tilt = math.radians(CAT_TILT * s)
    lens = _common.sphere(name + '_lens', x, y, lat, LENS_DEPTH / 2.0, h / 2.0,
                          w / 2.0, mats['lamp_red'])
    lens.rotation_euler = (tilt, 0.0, 0.0)
    # Chrome rim: a unit ring scaled to the lens ellipse, then tilted the same way.
    # The ring lies in the lat-height plane (axis along x), so local X is height
    # and local Y is sideways.
    rim = _common.torus(name, x, y, lat, 1.0, RIM_TUBE, 'x', mats['chrome'])
    rim.scale = (h / 2.0, w / 2.0, 1.0)
    rot = Matrix.Rotation(tilt, 4, 'X') @ Matrix.Rotation(math.pi / 2.0, 4, 'Y')
    rim.rotation_euler = rot.to_euler('XYZ')


def _fin(name, x, y, lat, w, h, s, ctx):
    mats = ctx['mats']
    total = h * FIN_HEIGHT
    amber_h = h * FIN_AMBER
    # y is the centre of the whole fin lamp: red lens below, amber segment on top.
    red_centre = y - amber_h / 2.0
    amber_centre = y + total / 2.0 - amber_h / 2.0
    _common.box(name + '_lens', x, red_centre, lat, LENS_DEPTH, total - amber_h,
                w, mats['lamp_red'])
    _common.box(name + '_amber', x, amber_centre, lat, LENS_DEPTH, amber_h, w,
                mats['lamp_amber'])


def _wrap(name, x, y, lat, w, h, s, ctx):
    mats = ctx['mats']
    _common.box(name + '_lens', x, y, lat, LENS_DEPTH, h, w, mats['lamp_red'])
    if s != 0:
        # The flank piece sits on the body side, so the lamp turns the rear corner.
        hw = ctx['surf'].half_width(x, y)
        _common.box(name + '_flank', x, y, s * hw, FLANK_LEN * w, h, LENS_DEPTH,
                    mats['lamp_red'])


_SHAPES = {
    'rect': _rect,
    'round': _round,
    'vertical': _vertical,
    'cat_eye': _cat_eye,
    'fin': _fin,
    'wrap': _wrap,
}


@register('taillamp')
def build_taillamp(part, ctx, i):
    shape = part.get('shape', 'rect')
    if shape not in _SHAPES:
        raise ValueError('taillamp shape %r not one of %s'
                         % (shape, ', '.join(sorted(_SHAPES))))
    lat = part['lat']
    if part.get('side', 'both') == 'both' and lat == 0:
        print('WARN taillamp centre')
        sides = [0]
    else:
        sides = _common.side_list(part)
    w = float(part.get('w', 3))
    h = float(part.get('h', 2))
    # The lamp stays on the body: never further back than the tail end plus 0.2.
    x = max(float(part['x']), ctx['surf'].xmin + 0.2)
    y = float(part['y'])
    for s in sides:
        slat = 0.0 if s == 0 else s * abs(float(lat))
        name = _common.part_name('taillamp', i, s)
        _SHAPES[shape](name, x, y, slat, w, h, s, ctx)
