# CA09: the front lamps. 'headlamp' is the lamp that makes a classic's face:
# round, square, oval, slanted, popup or quad. 'lamp' is a small auxiliary lamp:
# sidelamp, indicator, foglamp, driving, reverse or reflector. Every object is
# built with the CA03 helpers in _common, so the units and axes are the car's
# (x -50 tail to +50 nose, y height, lat sideways). Blender only: imports bpy.
import math

import carlib
from parts import register
from parts import _common as C

SLANT_DEG = 20.0      # a slanted lamp leans back: its outer end is higher
POPUP_LID_DEG = 60.0  # an open pop-up lid rises to this angle
BEZEL_KEYS = ('chrome', 'paint', 'black')  # 'black' is the trim alias in _mats


def _bezel(mats, part):
    key = part.get('bezel', 'chrome')
    if key not in BEZEL_KEYS:
        key = 'chrome'
    return mats[key]


def _round_lamp(name, x, y, L, r, bez, lens):
    """A chrome (or painted) ring of radius r with a lens inside it. The ring's
    axis runs along the car, so the lamp faces the nose. Returns [ring, lens]."""
    ring = C.torus(name, x, y, L, r, 0.2 * r, 'x', bez)
    glass = C.sphere(name + '_lens', x, y, L, 0.45 * r, 0.92 * r, 0.92 * r, lens)
    return [ring, glass]


def _square_lamp(name, x, y, L, r, bez, lens):
    """A chrome housing 2r high and 1.6r wide, with a lens box set into its front."""
    housing = C.box(name, x, y, L, 0.6 * r, 2.0 * r, 1.6 * r, bez)
    glass = C.box(name + '_lens', x + 0.12 * r, y, L, 0.3 * r, 1.6 * r, 1.2 * r, lens)
    return [housing, glass]


def _oval_lamp(name, x, y, L, r, bez, lens, tilt=0.0):
    """An ellipsoid bezel (rh 0.75r, rl 1.1r) with an ellipsoid lens inside.
    tilt (radians) turns both about the x axis; the slanted lamp uses it."""
    housing = C.sphere(name, x, y, L, 0.5 * r, 0.75 * r, 1.1 * r, bez)
    glass = C.sphere(name + '_lens', x + 0.1 * r, y, L, 0.35 * r, 0.6 * r, 0.92 * r, lens)
    if tilt:
        housing.rotation_euler = (tilt, 0.0, 0.0)
        glass.rotation_euler = (tilt, 0.0, 0.0)
    return [housing, glass]


def _popup_lamp(name, part, x, y, L, r, mats):
    """A pop-up lamp. Closed: a flat body-coloured box flush with the deck, with
    the lens sunk inside it (hidden). Open: the lid hinged at its rear edge and
    lifted to POPUP_LID_DEG, with a round lamp under it."""
    paint = mats['paint']
    if not part.get('open', False):
        body = C.box(name, x, y - 0.25 * r, L, 2.0 * r, 0.5 * r, 1.4 * r, paint)
        hidden = C.sphere(name + '_lens', x, y - 0.25 * r, L,
                          0.4 * r, 0.2 * r, 0.5 * r, mats['lamp_white'])
        return [body, hidden]
    lid_len = 2.0 * r
    # The lid is 2r long, its rear edge at x - r. Pivot at that rear edge, so the
    # centre sits half a lid along from the pivot at the lid's tilt.
    angle = math.radians(POPUP_LID_DEG)
    cx = (x - r) + 0.5 * lid_len * math.cos(angle)
    cy = y + 0.5 * lid_len * math.sin(angle)
    lid = C.box(name + '_lid', cx, cy, L, lid_len, 0.5 * r, 1.4 * r, paint)
    # Blender: a negative turn about Y lifts the +X (nose) end of the lid.
    lid.rotation_euler = (0.0, -angle, 0.0)
    lamp = _round_lamp(name, x - 0.5 * r, y - 0.2 * r, L, 0.9 * r,
                       _bezel(mats, part), mats['lamp_white'])
    return [lid] + lamp


def _quad_lamp(name, x, y, L, r, bez, lens):
    """Two round lamps (0.6r) stacked 1.3r apart inside one surround box."""
    lr = 0.6 * r
    half_gap = 0.65 * r
    half_h = half_gap + lr + 0.1 * r   # 1.5r: the box clears both rings
    half_w = lr + 0.2 * r
    objs = [C.box(name, x, y, L, 0.6 * r, 2.0 * half_h, 2.0 * half_w, bez)]
    for suffix, dy in (('_u', half_gap), ('_l', -half_gap)):
        objs += _round_lamp(name + suffix, x, y + dy, L, lr, bez, lens)
    return objs


_HEADLAMP_SHAPES = {
    'round': lambda name, part, x, y, L, r, mats: _round_lamp(
        name, x, y, L, r, _bezel(mats, part), mats['lamp_white']),
    'square': lambda name, part, x, y, L, r, mats: _square_lamp(
        name, x, y, L, r, _bezel(mats, part), mats['lamp_white']),
    'oval': lambda name, part, x, y, L, r, mats: _oval_lamp(
        name, x, y, L, r, _bezel(mats, part), mats['lamp_white']),
    'slanted': lambda name, part, x, y, L, r, mats: _oval_lamp(
        name, x, y, L, r, _bezel(mats, part), mats['lamp_white'],
        tilt=math.radians(SLANT_DEG) * (1.0 if L > 0 else -1.0)),
    'popup': lambda name, part, x, y, L, r, mats: _popup_lamp(
        name, part, x, y, L, r, mats),
    'quad': lambda name, part, x, y, L, r, mats: _quad_lamp(
        name, x, y, L, r, _bezel(mats, part), mats['lamp_white']),
}


@register('headlamp')
def build_headlamp(part, ctx, i):
    """One headlamp, on each side the part names. Objects: headlamp_<i>_<s>
    (the bezel or housing) and headlamp_<i>_<s>_lens (the lens)."""
    r = float(part['r']) * ctx['mult']('eyes')
    x = float(part['x'])
    y = float(part['y'])
    shape = part.get('shape', 'round')
    build = _HEADLAMP_SHAPES.get(shape, _HEADLAMP_SHAPES['round'])
    # The lamp sits on the nose: its outer edge stays inside the body.
    lat = min(abs(float(part['lat'])), ctx['surf'].half_width(x, y) - 0.6 * r)
    lat = max(lat, 0.0)
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for headlamp
    for s in C.side_list(p):
        name = C.part_name('headlamp', i, s)
        L = s * lat  # s: -1 near (-Y), +1 far (+Y), 0 centre (lat 0)
        build(name, part, x, y, L, r, ctx['mats'])


def _reflector_mat():
    """A red reflector: the tail red without emission (a reflector does not glow)."""
    return carlib.make_mat('tail', carlib.hex_to_rgb('#c01818'), roughness=0.2)


@register('lamp')
def build_lamp(part, ctx, i):
    """One auxiliary lamp, on each side the part names. Objects: lamp_<i>_<s>, plus
    lamp_<i>_<s>_lens where a rim is built too."""
    role = part['role']
    mats = ctx['mats']
    x = float(part['x'])
    y = float(part['y'])
    default_r = 1.6 if role == 'driving' else 1.2
    r = float(part.get('r', default_r))
    lat = abs(float(part.get('lat', 0)))
    # An indicator is a rect lens by default; everything else is round.
    shape = part.get('shape', 'rect' if role == 'indicator' else 'round')
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for lamp
    for s in C.side_list(p):
        name = C.part_name('lamp', i, s)
        L = s * lat
        lens = mats['lamp_amber'] if role == 'indicator' else mats['lamp_white']
        if role == 'reflector':
            # A red disc: no emission, so it shows only as a reflector.
            C.cyl(name, x, y, L, r, 0.4 * r, 'x', _reflector_mat())
        elif shape == 'rect':
            w = float(part.get('w') or 2.2)
            h = float(part.get('h') or 1.2)
            C.box(name, x, y, L, w, h, 0.6, lens)
        elif role in ('foglamp', 'driving'):
            # A chrome rim of radius r round a white lens.
            _round_lamp(name, x, y, L, r, mats['chrome'], lens)
        else:
            # A bare lens; a reverse lamp is smaller than the others.
            lens_r = 0.7 * r if role == 'reverse' else r
            C.sphere(name, x, y, L, 0.45 * lens_r, 0.92 * lens_r, 0.92 * lens_r, lens)
