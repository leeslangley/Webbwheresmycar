# CA14: small fittings. Door and boot handles ('handle'), wing and door mirrors
# ('mirror'), badges and emblems ('badge'), windscreen wipers ('wiper'), radio
# aerials ('aerial') and fuel filler caps ('fuelcap'). Each kind has one builder,
# registered with @register. Coordinates are car units (see _common.py): x -50 tail
# to +50 nose, y height above ground, lat sideways from the centre line. Blender
# only: this module imports bpy through _common and carlib.
import math

import carlib
from . import register
from ._common import box, cyl, part_name, side_list, sphere

BADGE_DEPTH = 0.3    # a badge plate or disc is this thick (along its normal)
BADGE_HEX = {'red': '#c8201e', 'blue': '#1e4fa0', 'gold': '#d9a520'}
HANDLE_STYLES = ('flap', 'push', 'bar', 'lever', 'boot', 'knob')
LEVER_DEG = 20.0     # a lever handle stands up at this angle
MIRROR_STYLES = ('round', 'rect', 'door', 'wing')
WING_DEG = 25.0      # the outer ends of a wing badge slope up by this much
BADGE_SHAPES = ('disc', 'bar', 'shield', 'wings', 'script')
BADGE_ENDS = ('front', 'rear', 'side')
BADGE_COLOURS = ('chrome', 'red', 'blue', 'gold', 'black')


def _sub(prefix, name, k=None):
    """Name for a sub-object of a part object: prefix plus the part's own tag (its
    index and side, the part of the name after the kind). Such names never start
    with the kind's own prefix, so only the main object reports as the kind."""
    tag = name.split('_', 1)[1]
    if k is None:
        return '%s_%s' % (prefix, tag)
    return '%s_%s_%d' % (prefix, tag, k)


def _at(normal, x, y, L, u, v):
    """The point u across a face and v up from (x, y, L). A face whose normal is
    'x' (nose or tail) runs across the car sideways; one whose normal is 'lat'
    (the flank) runs along the car."""
    if normal == 'x':
        return (x, y + v, L + u)
    return (x + u, y + v, L)


def _stretch(normal, width, height):
    """Scale factors (kx, ky) for a disc of radius size, so that it is width across
    the face and height up it. A disc's local X is up on a nose face and along the
    car on a flank; its local Y is sideways on a nose face and up on a flank."""
    if normal == 'x':
        return (height, width)
    return (width, height)


def _disc(name, x, y, L, normal, r, depth, mat, kx=1.0, ky=1.0):
    """A flat disc of radius r and thickness depth, its face along normal ('x' or
    'lat'). kx and ky stretch it in the two face directions (see _stretch)."""
    obj = cyl(name, x, y, L, r, depth, normal, mat)
    obj.scale = (kx, ky, 1.0)
    return obj


def _plate(name, x, y, L, normal, w, h, mat, tilt=0.0):
    """A flat box w wide and h high, BADGE_DEPTH thick, face along normal. tilt
    (radians) turns it about the normal, in its own plane."""
    if normal == 'x':
        dx, dh, dl = BADGE_DEPTH, h, w
    else:
        dx, dh, dl = w, h, BADGE_DEPTH
    obj = box(name, x, y, L, dx, dh, dl, mat)
    if tilt:
        obj.rotation_euler = (tilt, 0.0, 0.0) if normal == 'x' else (0.0, tilt, 0.0)
    return obj


def _stalk(name, x, y, L, h, mat):
    """A round stalk h high from (x, y, L) up to (x, y + h, L), radius 0.3."""
    return cyl(name, x, y + h / 2.0, L, 0.3, h, 'h', mat)


# ---------------------------------------------------------------- handles

def _handle_flap(name, x, y, L, s, ln, mats):
    box(name, x, y, L, ln, 0.5, 0.6, mats['chrome'])
    cyl(_sub('handle-keyhole', name), x, y, L + s * 0.32, 0.25, 0.1, 'lat',
        mats['black'])


def _handle_push(name, x, y, L, s, ln, mats):
    sphere(name, x, y, L, 1.2, 0.9, 0.5, mats['chrome'])
    sphere(_sub('handle-button', name), x, y, L + s * 0.5, 0.6, 0.4, 0.2,
           mats['black'])


def _handle_bar(name, x, y, L, s, ln, mats):
    box(name, x, y, L + s * 0.8, ln, 0.5, 0.5, mats['chrome'])
    for k, dx in enumerate((-0.35 * ln, 0.35 * ln)):
        cyl(_sub('handle-stub', name, k), x + dx, y, L + s * 0.4, 0.2, 0.8, 'lat',
            mats['chrome'])


def _handle_lever(name, x, y, L, s, ln, mats):
    # The lever runs out sideways from its root and is tipped up by LEVER_DEG.
    span = 0.4 * ln
    ang = math.radians(LEVER_DEG)
    lever = box(name, x, y + 0.5 * span * math.sin(ang),
                L + s * 0.5 * span * math.cos(ang), 0.6, 0.5, span, mats['chrome'])
    lever.rotation_euler = (s * ang, 0.0, 0.0)


def _handle_knob(name, x, y, L, s, ln, mats):
    sphere(name, x, y, L + s * 0.3, 0.5, 0.5, 0.5, mats['chrome'])


_HANDLE_BUILDERS = {
    'flap': _handle_flap,
    'push': _handle_push,
    'bar': _handle_bar,
    'lever': _handle_lever,
    'knob': _handle_knob,
}


@register('handle')
def build_handle(part, ctx, i):
    """A door handle on each side the part names (default both), or a boot flap on
    the rear face. Objects: handle_<i>_<s> (the handle itself) and its sub-parts."""
    surf = ctx['surf']
    mats = ctx['mats']
    style = part.get('style', 'flap')
    if style not in HANDLE_STYLES:
        raise ValueError('handle style must be one of %s, found %r'
                         % (', '.join(HANDLE_STYLES), style))
    ln = float(part.get('len', 2.5))
    x = float(part['x'])
    y = float(part['y'])
    if style == 'boot':
        # A boot flap sits on the rear face, on the centre line.
        box(part_name('handle', i, 0), surf.xmin + 0.4, y, 0.0, 0.4, 0.5, ln,
            mats['chrome'])
        return
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for handle
    for s in side_list(p):
        name = part_name('handle', i, s)
        L = s * (surf.half_width(x, y) + 0.1)  # the handle root, just off the body
        _HANDLE_BUILDERS[style](name, x, y, L, s, ln, mats)


# ---------------------------------------------------------------- mirrors

@register('mirror')
def build_mirror(part, ctx, i):
    """A wing or door mirror on each side the part names (default both). Objects:
    mirror_<i>_<s> (the head) and its stalk or arm. A door mirror's lat is worked
    out from the body (half width plus 2.5), so the given lat only has to be valid."""
    surf = ctx['surf']
    mats = ctx['mats']
    style = part.get('style', 'door')
    if style not in MIRROR_STYLES:
        raise ValueError('mirror style must be one of %s, found %r'
                         % (', '.join(MIRROR_STYLES), style))
    size = float(part.get('size', 2))
    x = float(part['x'])
    y = float(part['y'])
    lat = abs(float(part['lat']))
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for mirror
    for s in side_list(p):
        name = part_name('mirror', i, s)
        if style == 'door':
            hw = surf.half_width(x, y)
            # A short chrome arm from the body to the mirror head.
            box(_sub('mirror-arm', name), x, y, s * (hw + 1.25), 0.6, 0.6, 2.5,
                mats['chrome'])
            box(name, x, y, s * (hw + 2.5), 1.5 * size, size, 0.5, mats['chrome'])
            continue
        L = s * lat
        if style == 'rect':
            _stalk(_sub('mirror-stalk', name), x, y, L, 3.0, mats['black'])
            box(name, x, y + 3.0, L, 1.6 * size, size, 0.4, mats['black'])
        elif style == 'round':
            _stalk(_sub('mirror-stalk', name), x, y, L, 3.0, mats['chrome'])
            _disc(name, x, y + 3.0, L, 'lat', size, 0.4, mats['chrome'])
        else:  # wing: a round head on a 4 unit stalk, on the front wing
            _stalk(_sub('mirror-stalk', name), x, y, L, 4.0, mats['chrome'])
            _disc(name, x, y + 4.0, L, 'lat', size, 0.4, mats['chrome'])


# ---------------------------------------------------------------- badges

def _badge_mat(mats, colour):
    """The material for a badge colour. chrome and black are the set's own; red,
    blue and gold are made on first use and kept in mats."""
    if colour == 'chrome':
        return mats['chrome']
    if colour == 'black':
        return mats['black']
    if colour not in BADGE_HEX:
        raise ValueError('badge colour must be one of %s, found %r'
                         % (', '.join(BADGE_COLOURS), colour))
    key = 'badge_' + colour
    if key not in mats:
        mats[key] = carlib.make_mat(key, carlib.hex_to_rgb(BADGE_HEX[colour]),
                                    metallic=1.0 if colour == 'gold' else 0.0,
                                    roughness=0.3 if colour == 'gold' else 0.4)
    return mats[key]


def _badge_disc(name, x, y, L, normal, size, mat):
    _disc(name, x, y, L, normal, size, BADGE_DEPTH, mat)


def _badge_bar(name, x, y, L, normal, size, mat):
    _plate(name, x, y, L, normal, 3.0 * size, 0.8 * size, mat)


def _badge_shield(name, x, y, L, normal, size, mat):
    kx, ky = _stretch(normal, 0.8, 1.1)
    _disc(name, x, y, L, normal, size, BADGE_DEPTH, mat, kx, ky)


def _badge_wings(name, x, y, L, normal, size, mat):
    _plate(name, x, y, L, normal, 4.0 * size, 0.5 * size, mat)
    # Two sloped end plates, outer ends raised by WING_DEG.
    for k, sgn in ((0, -1.0), (1, 1.0)):
        cx, cy, cl = _at(normal, x, y, L, sgn * 2.0 * size, 0.0)
        tilt = math.radians(WING_DEG) * sgn * (1.0 if normal == 'x' else -1.0)
        _plate(_sub('badge-wing', name, k), cx, cy, cl, normal,
               1.2 * size, 0.5 * size, mat, tilt)


def _badge_script(name, x, y, L, normal, size, mat):
    # A thin plate stands in for lettering.
    _plate(name, x, y, L, normal, 3.0 * size, 0.5 * size, mat)


_BADGE_SHAPES = {
    'disc': _badge_disc,
    'bar': _badge_bar,
    'shield': _badge_shield,
    'wings': _badge_wings,
    'script': _badge_script,
}


@register('badge')
def build_badge(part, ctx, i):
    """A badge: on the nose ('front'), the tail ('rear') or the flank ('side', on
    each side the part names, default both). Objects: badge_<i>_<s>, plus sub-parts
    for the wings."""
    surf = ctx['surf']
    mats = ctx['mats']
    shape = part.get('shape', 'disc')
    if shape not in BADGE_SHAPES:
        raise ValueError('badge shape must be one of %s, found %r'
                         % (', '.join(BADGE_SHAPES), shape))
    end = part.get('end', 'front')
    if end not in BADGE_ENDS:
        raise ValueError('badge end must be one of %s, found %r'
                         % (', '.join(BADGE_ENDS), end))
    colour = part.get('colour', 'chrome')
    size = float(part.get('size', 2))
    y = float(part['y'])
    mat = _badge_mat(mats, colour)
    if end == 'side':
        x = float(part['x'])
        p = dict(part)
        p.setdefault('side', 'both')
        jobs = [(s, s * (surf.half_width(x, y) + 0.1)) for s in side_list(p)]
        normal = 'lat'
    else:
        # A nose or tail badge is one, on the centre line, at the end of the body.
        x = surf.xmax - 0.2 if end == 'front' else surf.xmin + 0.2
        jobs = [(0, 0.0)]
        normal = 'x'
    for s, L in jobs:
        _BADGE_SHAPES[shape](part_name('badge', i, s), x, y, L, normal, size, mat)


# ---------------------------------------------------------------- wipers

@register('wiper')
def build_wiper(part, ctx, i):
    """n wiper arms at the windscreen base. Each is a black box len long, 0.3 thick,
    resting at -10 degrees, and the arms are spaced 0.28 of the body half width
    apart across the car. Objects: wiper_<i>_c, one per arm (Blender numbers the
    repeats)."""
    surf = ctx['surf']
    mats = ctx['mats']
    ln = float(part.get('len', 10))
    n = int(part.get('n', 2))
    if n < 1:
        raise ValueError('wiper n must be at least 1, found %d' % n)
    x = float(part['x'])
    y = float(part['y'])
    gap = 0.28 * surf.half_width(x, y)
    for k in range(n):
        lat = (k - (n - 1) / 2.0) * gap
        arm = box(part_name('wiper', i, 0), x, y, lat, ln, 0.3, 0.3, mats['black'])
        arm.rotation_euler = (0.0, math.radians(-10.0), 0.0)


# ---------------------------------------------------------------- aerials

@register('aerial')
def build_aerial(part, ctx, i):
    """A radio aerial: a thin black rod len high, tilted 12 degrees back, with a
    chrome tip. Sides follow the table rule (default both when lat is above 0).
    Objects: aerial_<i>_<s> (the rod) and aerial-tip_<i>_<s> (the tip)."""
    mats = ctx['mats']
    ln = float(part.get('len', 14))
    x = float(part['x'])
    y = float(part['y'])
    lat = abs(float(part['lat']))
    ang = math.radians(12.0)
    sin_a = math.sin(ang)
    cos_a = math.cos(ang)
    for s in side_list(part):
        name = part_name('aerial', i, s)
        L = s * lat
        # The rod's centre is half its length up and back from the base.
        rod = cyl(name, x - sin_a * ln / 2.0, y + cos_a * ln / 2.0, L, 0.3, ln, 'h',
                  mats['black'])
        rod.rotation_euler = (0.0, -ang, 0.0)  # a turn about Y leans the top back
        sphere(_sub('aerial-tip', name), x - sin_a * ln, y + cos_a * ln, L,
               0.5, 0.5, 0.5, mats['chrome'])


# ---------------------------------------------------------------- fuel caps

@register('fuelcap')
def build_fuelcap(part, ctx, i):
    """A chrome fuel filler cap, a disc on the flank. One side by default (near).
    Object: fuelcap_<i>_<s>."""
    surf = ctx['surf']
    mats = ctx['mats']
    r = float(part.get('r', 1.0))
    x = float(part['x'])
    y = float(part['y'])
    p = dict(part)
    p.setdefault('side', 'near')  # the table default for fuelcap
    for s in side_list(p):
        L = s * (surf.half_width(x, y) + 0.1)
        _disc(part_name('fuelcap', i, s), x, y, L, 'lat', r, 0.3, mats['chrome'])
