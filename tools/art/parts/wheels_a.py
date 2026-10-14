# CA07: wheels v2, the 'wheels' stage of the parts framework (used when the car
# has a details file). Each wheel is a tyre with rounded shoulders, a dished rim
# with a chrome hubcap, and optional whitewall and trim ring. Styles steel, disc
# and spoked are built here; wire, knockoff and alloy go to wheels_b (CA08) when
# that module is there, else they are built as steel.
# Blender only: this module imports bpy through _common.
#
# Sides: lat_sign -1 is the near side, 1 the far side, 0 the centre (a solo wheel
# of a three-wheel car). Along the lathe axis, the outward direction of a near
# wheel is +along, so a far wheel's profile is flipped (k = -1).
import math

from . import stage
from ._common import cyl, lathe, part_name, torus

_STYLES_HERE = ('steel', 'disc', 'spoked')


def _k(lat_sign):
    """Along-axis sign of 'outward' for this side: +1 near and centre, -1 far."""
    return -1.0 if lat_sign > 0 else 1.0


def _num(cfg, key, default):
    """cfg[key] when it is a finite positive number, else default."""
    v = cfg.get(key)
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v <= 0:
        return float(default)
    return float(v)


def wheel_parts(ctx, w, lat_sign, wheel_cfg, index=0):
    """One wheel of the dossier (w has x and r) on one side. Builds the tyre, the
    rim, the hubcap and the optional whitewall and trim ring, and returns them.
    index is the wheel's place in the dossier list (for object names)."""
    mats = ctx['mats']
    r = float(w['r']) * float(ctx['mult']('wheels'))
    x = float(w['x'])
    y = r
    d = max(2.2, 0.8 * r)  # tyre depth
    width = float(ctx['dossier']['plan']['width_units'])
    s = lat_sign
    k = _k(s)
    lat = s * (width / 2.0 - d / 2.0 - 0.4)  # wheel centre, sideways
    objs = []

    # Tyre: rounded shoulders, symmetric about the wheel plane.
    tyre_profile = [(0.62 * r, -d / 2.0), (0.88 * r, -d / 2.0), (r, -d * 0.35),
                    (r, d * 0.35), (0.88 * r, d / 2.0), (0.62 * r, d / 2.0)]
    objs.append(lathe(part_name('tyre', index, s), tyre_profile, x, y, lat,
                      'lat', mats['tyre']))

    # Dished steel rim: lip at 0.4d outward, floor at -0.15d, hub boss to 0.45d.
    style = wheel_cfg.get('style', 'steel')
    hub_mat = mats['chrome'] if wheel_cfg.get('hub') == 'chrome' else mats['paint']
    rim_profile = [(0.62 * r, k * d * 0.4), (0.6 * r, k * d * 0.2),
                   (0.45 * r, -k * d * 0.15), (0.2 * r, -k * d * 0.15),
                   (0.2 * r, k * d * 0.45)]
    objs.append(lathe(part_name('rim', index, s), rim_profile, x, y, lat,
                      'lat', hub_mat))

    if style == 'spoked':
        # 8 small dark holes on a circle of radius 0.4r, in the dish floor.
        floor_o = -0.15 * d + 0.15  # outward distance, just proud of the floor
        for j in range(8):
            a = j * 2.0 * math.pi / 8.0
            hx = x + 0.4 * r * math.cos(a)
            hy = y + 0.4 * r * math.sin(a)
            hl = lat - k * floor_o
            objs.append(cyl(part_name('hole', index * 8 + j, s), hx, hy, hl,
                            0.12 * r, 0.3, 'lat', mats['tyre']))

    # Chrome hubcap: a cup from the dish floor up over the hub boss, with a dome.
    hr = _num(wheel_cfg, 'hubcap_r', 0.45 * r)
    cap_profile = [(hr, k * -0.15 * d), (hr, k * 0.45 * d),
                   (hr * 0.85, k * (0.45 * d + 0.06 * r)),
                   (hr * 0.5, k * (0.45 * d + 0.14 * r)),
                   (0.0, k * (0.45 * d + 0.18 * r))]
    objs.append(lathe(part_name('hubcap', index, s), cap_profile, x, y, lat,
                      'lat', mats['chrome']))

    if wheel_cfg.get('whitewall'):
        # A flat band of whitewall on the sidewall, radii 0.7r..0.9r, standing
        # proud of the tyre face (the tyre is an open shell, so a band set inside
        # its face would not show).
        o_in = d / 2.0 - 0.1
        o_out = d / 2.0 + 0.2
        ww_profile = [(0.7 * r, k * o_in), (0.9 * r, k * o_in),
                      (0.9 * r, k * o_out), (0.7 * r, k * o_out)]
        objs.append(lathe(part_name('whitewall', index, s), ww_profile, x, y, lat,
                          'lat', mats['whitewall']))

    if wheel_cfg.get('trim_ring'):
        # A thin chrome ring at the rim lip, 0.4d outward of the wheel centre.
        objs.append(torus(part_name('trim_ring', index, s), x, y,
                          lat - k * 0.4 * d, 0.62 * r, 0.06 * r, 'lat',
                          mats['chrome']))
    return objs


def _solo_index(wheels):
    """With three wheels, the index of the one whose x is unique, else -1."""
    if len(wheels) != 3:
        return -1
    xs = [w.get('x', 0.0) for w in wheels]
    solo = -1
    for i, x in enumerate(xs):
        if xs.count(x) == 1:
            solo = i
    return solo


def _extra_builder():
    """wheels_b.wheel_parts_extra when CA08 is there, else None."""
    try:
        from . import wheels_b
    except ImportError:
        return None
    return getattr(wheels_b, 'wheel_parts_extra', None)


@stage('wheels')
def build_wheels_v2(ctx):
    """The wheels stage: every dossier wheel on each side, with the style from the
    details 'wheel' block (or the dossier's first wheel style when there is none)."""
    wheels = ctx['dossier'].get('wheels') or []
    cfg = dict((ctx['details'] or {}).get('wheel') or {})
    if not cfg.get('style'):
        cfg['style'] = wheels[0].get('style', 'steel') if wheels else 'steel'
    extra = None if cfg['style'] in _STYLES_HERE else _extra_builder()
    solo = _solo_index(wheels)
    n = 0
    for i, w in enumerate(wheels):
        for s in ([0] if i == solo else [-1, 1]):
            if extra is not None:
                extra(ctx, w, s, cfg, i)
            else:
                wheel_parts(ctx, w, s, cfg, i)
            n += 1
    print('WHEELS n=%d' % n)
