# CA08: the spare wheel, kind 'spare', in five mounts: boot (upright against the
# tail), rear_door (upright on the rear face), side_well (a recess-like wheel in
# the front wing), bonnet (lying flat on the bonnet) and rear_wing (on the rear
# wing). The wheel is a tyre lathe with wheels_a's profile; with cover: true a
# body-coloured disc sits over its face. Coordinates are car units (see _common.py).
# Blender only: this module imports bpy through _common.
from . import register
from ._common import cyl, lathe, part_name, side_list

_AXIS = {'boot': 'x', 'rear_door': 'x', 'side_well': 'lat', 'bonnet': 'h',
         'rear_wing': 'lat'}


def _tyre_profile(r, d):
    """wheels_a's tyre lathe profile (radius, along) for radius r and depth d."""
    return [(0.62 * r, -d / 2.0), (0.88 * r, -d / 2.0), (r, -d * 0.35),
            (r, d * 0.35), (0.88 * r, d / 2.0), (0.62 * r, d / 2.0)]


def _outward(axis, s):
    """Unit vector (x, height, lat) pointing away from the car from this wheel's
    face. Sideways, outward is -lat for the near side and the centre, as in
    wheels_a, and +lat for the far side."""
    if axis == 'x':
        return (-1.0, 0.0, 0.0)  # towards the tail
    if axis == 'h':
        return (0.0, 1.0, 0.0)  # up
    k = -1.0 if s > 0 else 1.0
    return (0.0, 0.0, -k)


def _place(mount, part, surf, s):
    """The wheel centre (x, y, lat) for this mount and side s. A sided wheel with
    no lat sits one unit inside the body's half width, as side_well does."""
    x = float(part['x'])
    y = float(part['y'])
    if mount == 'rear_door':
        x = surf.xmin + 1.5
    lat_part = abs(float(part.get('lat', 0) or 0))
    if mount == 'side_well' or (lat_part == 0 and s != 0):
        lat = s * (surf.half_width(x, y) - 1.0)
    else:
        lat = s * lat_part
    return x, y, lat


@register('spare')
def build_spare(part, ctx, i):
    mount = part.get('mount')
    if mount not in _AXIS:
        raise ValueError('bad spare mount %r' % (mount,))
    surf = ctx['surf']
    mats = ctx['mats']
    r = float(part['r']) * float(ctx['mult']('wheels'))
    d = max(2.2, 0.8 * r)  # tyre depth, as wheels_a
    axis = _AXIS[mount]
    default_side = 'both' if mount == 'side_well' else 'centre'
    for s in side_list(dict(part, side=part.get('side', default_side))):
        x, y, lat = _place(mount, part, surf, s)
        lathe(part_name('spare', i, s), _tyre_profile(r, d), x, y, lat, axis,
              mats['tyre'])
        if part.get('cover'):
            # A body-coloured disc, 0.2 thick, centred on the face (d/2 out).
            ox, oy, ol = _outward(axis, s)
            cyl(part_name('sparecover', i, s), x + ox * d / 2.0,
                y + oy * d / 2.0, lat + ol * d / 2.0, 0.62 * r, 0.2, axis,
                mats['paint'])
