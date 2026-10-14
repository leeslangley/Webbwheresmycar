# CA08: wheels v2, the classic styles that wheels_a leaves to this module: wire,
# knockoff and alloy. wheels_a's 'wheels' stage calls wheel_parts_extra(ctx, w, s,
# cfg, index) for each wheel on each side when the style is one of these. Any
# other style goes to wheels_a.wheel_parts, as steel.
# Positions follow wheels_a: lat is the wheel centre and the rim plane sits 0.4d
# outward of it, where d is the tyre depth.
# Blender only: this module imports bpy and mathutils through _common.
import math

from mathutils import Vector

from ._common import box, cyl, part_name, torus
from .wheels_a import wheel_parts

_SPOKES = 36  # wire spokes: two interleaved sets of 18
_TILT = math.radians(8.0)  # the two sets lean +8 and -8 degrees toward lat


def _k(lat_sign):
    """Along-axis sign of 'outward' for this side: +1 near and centre, -1 far."""
    return -1.0 if lat_sign > 0 else 1.0


def _at(lat, k, dist):
    """Sideways position of a point dist car units outward of lat (wheels_a's
    convention: outward is lat - k * dist)."""
    return lat - k * dist


def _geom(ctx, w, s):
    """(r, x, y, plane, k) for this wheel on side s: the radius, the hub position
    (x, y), the rim plane's lat and wheels_a's along-axis sign k."""
    r = float(w['r']) * float(ctx['mult']('wheels'))
    x = float(w['x'])
    y = r
    d = max(2.2, 0.8 * r)
    width = float(ctx['dossier']['plan']['width_units'])
    lat = s * (width / 2.0 - d / 2.0 - 0.4)
    k = _k(s)
    return r, x, y, _at(lat, k, 0.4 * d), k


def _orient(obj, direction):
    """Turn a cylinder, whose own axis is Blender Z, to point along direction, a
    car-coordinate (x, height, lat) vector."""
    bdir = Vector((direction[0], direction[2], direction[1])).normalized()
    obj.rotation_euler = Vector((0.0, 0.0, 1.0)).rotation_difference(bdir).to_euler()
    return obj


def _radial_box(name, x, y, lat, a, reach, length, width, thick, mat):
    """A flat box lying in the wheel plane, its long axis pointing out from the
    hub at angle a (in the car's x-height plane), its centre reach out from it."""
    obj = box(name, x + reach * math.cos(a), y + reach * math.sin(a), lat,
              length, width, thick, mat)
    obj.rotation_euler = (0.0, -a, 0.0)
    return obj


def _wire(ctx, w, s, index, mats):
    """The wire wheel: chrome rim, hub and 36 cross-laced spokes. Returns the
    objects and the geometry the knockoff spinner needs."""
    r, x, y, plane, k = _geom(ctx, w, s)
    chrome = mats['chrome']
    objs = []

    objs.append(torus(part_name('wirerim', index, s), x, y, plane,
                      0.62 * r, 0.07 * r, 'lat', chrome))
    hub_depth = 0.25 * r
    objs.append(cyl(part_name('wirehub', index, s), x, y, plane,
                    0.16 * r, hub_depth, 'lat', chrome))

    # Spoke k leaves the hub (radius 0.16r) at angle a and runs to the rim
    # (radius 0.62r), leaning sideways by tilt t. Its length is chosen so the
    # radial run is exactly 0.46r.
    length = (0.62 - 0.16) * r / math.cos(_TILT)
    for n in range(_SPOKES):
        a = n * 2.0 * math.pi / _SPOKES
        tilt = _TILT if n % 2 == 0 else -_TILT
        v = (math.cos(tilt) * math.cos(a), math.cos(tilt) * math.sin(a),
             math.sin(tilt))  # (x, height, lat), unit length
        p0 = (x + 0.16 * r * math.cos(a), y + 0.16 * r * math.sin(a), plane)
        mid = (p0[0] + v[0] * length / 2.0, p0[1] + v[1] * length / 2.0,
               p0[2] + v[2] * length / 2.0)
        spoke = cyl('%s_%d' % (part_name('spoke', index, s), n),
                    mid[0], mid[1], mid[2], 0.025 * r, length, 'h', chrome, seg=8)
        objs.append(_orient(spoke, v))
    return objs, r, x, y, plane, k


def _knockoff(ctx, w, s, index, mats):
    """A wire wheel with a chrome three-ear spinner on the hub."""
    objs, r, x, y, plane, k = _wire(ctx, w, s, index, mats)
    chrome = mats['chrome']
    # The hub ends 0.125r outward of the rim plane; the spinner (depth 0.1r)
    # sits on it.
    spin_depth = 0.1 * r
    spinner = cyl(part_name('spinner', index, s), x, y,
                  _at(plane, k, 0.125 * r + spin_depth / 2.0),
                  0.2 * r, spin_depth, 'lat', chrome)
    objs.append(spinner)
    ear_lat = _at(plane, k, 0.125 * r + spin_depth + 0.02 * r)
    for j in range(3):
        a = math.pi / 2.0 + j * 2.0 * math.pi / 3.0
        objs.append(_radial_box(
            '%s_%d' % (part_name('spinnerblade', index, s), j),
            x, y, ear_lat, a, 0.3 * r, 0.5 * r, 0.14 * r, 0.04 * r, chrome))
    return objs


def _alloy(ctx, w, s, index, mats):
    """A five-spoke alloy: an alloy disc of radius 0.62r with five radial spokes
    on its face, over a dark disc behind it, and a chrome hub cap."""
    r, x, y, plane, k = _geom(ctx, w, s)
    objs = []

    objs.append(cyl(part_name('alloyback', index, s), x, y,
                    _at(plane, k, -0.2), 0.62 * r, 0.2, 'lat', mats['black']))
    objs.append(cyl(part_name('alloydisc', index, s), x, y, plane,
                    0.62 * r, 0.2, 'lat', mats['alloy']))
    face_lat = _at(plane, k, 0.1 + 0.05 * r)  # spokes and cap sit on the disc
    for j in range(5):
        a = math.pi / 2.0 + j * 2.0 * math.pi / 5.0
        objs.append(_radial_box(
            '%s_%d' % (part_name('alloyspoke', index, s), j),
            x, y, face_lat, a, 0.33 * r, 0.5 * r, 0.14 * r, 0.1 * r,
            mats['alloy']))
    objs.append(cyl(part_name('alloycap', index, s), x, y, face_lat,
                    0.2 * r, 0.1 * r, 'lat', mats['chrome']))
    return objs


def wheel_parts_extra(ctx, w, s, cfg, index=0):
    """One wheel of the dossier (w has x and r) on side s, in the style cfg names.
    index is the wheel's place in the dossier list (for object names), as passed
    by wheels_a. Returns the objects built."""
    style = cfg.get('style')
    mats = ctx['mats']
    if style == 'wire':
        return _wire(ctx, w, s, index, mats)[0]
    if style == 'knockoff':
        return _knockoff(ctx, w, s, index, mats)
    if style == 'alloy':
        return _alloy(ctx, w, s, index, mats)
    return wheel_parts(ctx, w, s, cfg, index)
