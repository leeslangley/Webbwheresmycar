# CA11: chrome bumpers, the most classic detail on British cars. One builder
# for kind 'bumper': a blade across the nose or tail, plus optional wrap-round
# corners, overriders, US-style bumper guards and end guard bars. Coordinates
# are car units (see _common.py): x -50 tail to +50 nose, y height, lat sideways.
from parts import register
from parts import _common as pc

_SIDES = (-1, 1)


def _bevel(obj, width):
    """Round the box edges a little (width in car units)."""
    mod = obj.modifiers.new('bevel', 'BEVEL')
    mod.width = width * pc.U
    mod.segments = 2
    return obj


def _bar(name, x, y, lat, thick, h, w, mat, bevel=0.0):
    """One box: thick along the car, h high, w wide (sideways)."""
    obj = pc.box(name, x, y, lat, thick, h, w, mat)
    if bevel:
        _bevel(obj, bevel)
    return obj


@register('bumper')
def build_bumper(part, ctx, i):
    surf = ctx['surf']
    front = part.get('end') == 'front'
    d = 1.0 if front else -1.0
    x_end = surf.xmax if front else surf.xmin
    tag = 'front' if front else 'rear'
    y = part.get('y', 8)
    h = part.get('h', 2) * ctx['mult']('bumper')
    # Full width follows the body: the half width a little inside the tip,
    # tucked in 2% each side so the bar ends touch the flank.
    w = part.get('w', 0) or 2.0 * surf.half_width(x_end - 1.5, y) * 0.98
    style = part.get('style', 'blade')
    thick = 2.2 if style == 'chunky' else part.get('thick', 1.2)
    # Slightly inside the tip so the bar touches the body.
    x = x_end + d * 0.5 * thick - d * 0.4
    mats = ctx['mats']
    chrome = mats['chrome']
    mat = mats['black'] if style == 'chunky' else chrome
    if style == 'chunky':
        h *= 1.6
    elif style == 'us':
        h *= 1.8

    if style == 'quarter':
        # Two short blades, one per side, no centre bar.
        for k, lat in enumerate(_SIDES):
            _bar('bumper_%d_%s_bar_%d' % (i, tag, k + 1), x, y,
                 lat * w * 0.32, thick, h, 0.28 * w, mat)
    else:
        bevel = 0.3 if style in ('blade', 'wrap') else 0.0
        _bar('bumper_%d_%s_bar' % (i, tag), x, y, 0.0, thick, h, w, mat,
             bevel=bevel)

    if style == 'wrap':
        # Corner boxes turning back 4 units along each flank, at the bar ends.
        cx = x - d * (0.5 * thick + 2.0)
        for k, lat in enumerate(_SIDES):
            _bar('bumper_%d_%s_wrap_%d' % (i, tag, k + 1), cx, y,
                 lat * 0.5 * w, 4.0, h, thick, chrome)

    if style == 'us':
        # US bumper guards: chrome blocks standing 2.4 units forward of the bar.
        gx = x + d * (0.5 * thick + 1.2)
        for k, lat in enumerate(_SIDES):
            _bar('bumper_%d_%s_guard_%d' % (i, tag, k + 1), gx, y,
                 lat * w * 0.3, 2.4, h, 1.6, chrome)

    n = part.get('overriders', 0) or 0
    if n:
        # Upright chrome bullets standing proud of the bar face, 1 unit
        # clear of it, their bases half a unit below the bar centre.
        lats = {1: [0.0], 2: [-0.3 * w, 0.3 * w],
                4: [-0.34 * w, -0.18 * w, 0.18 * w, 0.34 * w]}[n]
        ox = x + d * (0.5 * thick + 0.2)
        profile = [(0.0, 0.0), (0.8, 0.0), (0.8, 2.5), (0.0, 3.5)]
        for k, lat in enumerate(lats):
            pc.lathe('overrider_%d_%d' % (i, k), profile, ox, y - 0.5, lat,
                     'h', chrome)

    if part.get('guards', False):
        # A vertical chrome bar 0.6 wide and 5 high at each end of the bumper.
        for k, lat in enumerate(_SIDES):
            _bar('guard_%d_%d' % (i, k), x, y, lat * (0.5 * w - 0.3),
                 thick, 5.0, 0.6, chrome)
