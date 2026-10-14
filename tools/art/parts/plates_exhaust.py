# CA15: number plates ('plate') and exhaust pipes ('exhaust'). Each kind has one
# builder, registered with @register. Coordinates are car units (see _common.py):
# x -50 tail to +50 nose, y height above ground, lat sideways from the centre line.
# Blender only: this module imports bpy through _common.
from . import register
from ._common import box, cyl, side_list, torus

PIPE_LEN = 4.0       # length of a tailpipe (car units)
PIPE_BACK = 0.8      # the pipe mouths sit this far behind the tail (surf.xmin)
PLATE_DEPTH = 0.4    # the plate is a thin box this deep (along x)
TRIM_DEPTH = 0.5     # border and letter bars stand just proud of the plate face
TRIM_THICK = 0.25    # thickness of the border bars and of the letter spacing
LETTERS = 6          # black letter bars on a plate
LETTER_SPAN = 0.7    # the letter bars spread over this fraction of the plate width


def _sides(part):
    """Sides for a part whose default is near (exhaust): near when no side is given,
    else side_list(part) with the given side."""
    if 'side' not in part:
        return [-1]
    return side_list(part)


@register('plate')
def build_plate(part, ctx, i):
    """A number plate at the front or rear: a white (front) or yellow (rear) face
    with a thin black border and six black letter bars."""
    surf = ctx['surf']
    mats = ctx['mats']
    end = part.get('end')
    if end not in ('front', 'rear'):
        raise ValueError('plate end must be front or rear, found %r' % (end,))
    colour = part.get('colour', 'white' if end == 'front' else 'yellow')
    if colour not in ('white', 'yellow'):
        raise ValueError('plate colour must be white or yellow, found %r' % (colour,))
    w = float(part.get('w', 12))
    h = float(part.get('h', 3))
    y = float(part.get('y', 8))
    lat = float(part.get('lat', 0))
    x = surf.xmax - 0.2 if end == 'front' else surf.xmin + 0.2
    black = mats['black']
    # The plate face. Its name carries the index and the end: the REPORT line.
    box('plate_%d_%s' % (i, end), x, y, lat, PLATE_DEPTH, h, w,
        mats['plate_' + colour])
    # Border: four thin black bars inside the outline. Names avoid the plate_ prefix
    # so only the face reports as a plate.
    tag = '%d_%s' % (i, end)
    box('plate-border_%s_top' % tag, x, y + h / 2.0 - TRIM_THICK / 2.0, lat,
        TRIM_DEPTH, TRIM_THICK, w, black)
    box('plate-border_%s_bottom' % tag, x, y - h / 2.0 + TRIM_THICK / 2.0, lat,
        TRIM_DEPTH, TRIM_THICK, w, black)
    box('plate-border_%s_left' % tag, x, y, lat - w / 2.0 + TRIM_THICK / 2.0,
        TRIM_DEPTH, h, TRIM_THICK, black)
    box('plate-border_%s_right' % tag, x, y, lat + w / 2.0 - TRIM_THICK / 2.0,
        TRIM_DEPTH, h, TRIM_THICK, black)
    # Six letter bars, evenly spaced across 70% of the width and centred on the
    # plate, so the plate reads as lettering from far away.
    spread = LETTER_SPAN * w
    for k in range(LETTERS):
        off = -spread / 2.0 + k * spread / (LETTERS - 1)
        box('plate-letter_%s_%d' % (tag, k), x, y, lat + off, TRIM_DEPTH,
            0.45 * h, 0.5, black)


def _pipe(name, disc_name, x, y, lat, r, wide, mats):
    """One tailpipe: a chrome cylinder along x, its mouth at x - PIPE_LEN / 2, with a
    dark disc in the mouth. wide scales the pipe sideways (1.5 makes an oval pipe)."""
    pipe = cyl(name, x, y, lat, r, PIPE_LEN, 'x', mats['chrome'])
    disc = cyl(disc_name, x - PIPE_LEN / 2.0, y, lat, r * 0.7, 0.2, 'x', mats['black'])
    if wide != 1.0:
        pipe.scale = (1.0, wide, 1.0)
        disc.scale = (1.0, wide, 1.0)
    return pipe


@register('exhaust')
def build_exhaust(part, ctx, i):
    """Exhaust tailpipes at the tail: round, oval, twin, quad or sidepipe."""
    surf = ctx['surf']
    mats = ctx['mats']
    style = part.get('style', 'round')
    r = float(part.get('r', 1.0))
    y = float(part.get('y', 6))
    xc = surf.xmin - PIPE_BACK
    if style in ('round', 'oval'):
        wide = 1.5 if style == 'oval' else 1.0
        lat = float(part.get('lat', 6))
        pipes = [(s * lat, y, wide) for s in _sides(part)]
    elif style == 'twin':
        pipes = [(-3.5, y, 1.0), (3.5, y, 1.0)]
    elif style == 'quad':
        # Two pairs: the inner pair at y, the outer pair 1 unit higher.
        pipes = [(-2.5, y, 1.0), (2.5, y, 1.0), (-6.0, y + 1.0, 1.0), (6.0, y + 1.0, 1.0)]
    elif style == 'sidepipe':
        return _build_sidepipe(part, i, ctx, r)
    else:
        raise ValueError('exhaust style must be round, oval, twin, quad or sidepipe, '
                         'found %r' % (style,))
    for k, (lat, py, wide) in enumerate(pipes):
        _pipe('exhaust_%d_%d' % (i, k), 'exhaust-disc_%d_%d' % (i, k),
              xc, py, lat, r, wide, mats)


def _build_sidepipe(part, i, ctx, r):
    """A long chrome pipe along the sill with three small chrome clamps. The pipe
    runs from x -22 to 20 at y 4.5, just outside the body side."""
    surf = ctx['surf']
    mats = ctx['mats']
    y = 4.5
    x0, x1 = -22.0, 20.0
    xc = (x0 + x1) / 2.0
    length = x1 - x0
    offset = surf.half_width(0, 5) + 1.2
    for k, s in enumerate(_sides(part)):
        lat = s * offset
        cyl('exhaust_%d_%d' % (i, k), xc, y, lat, r, length, 'x', mats['chrome'])
        for j, cx in enumerate((-15.0, -1.0, 13.0)):
            torus('exhaust-clamp_%d_%d_%d' % (i, k, j), cx, y, lat, r + 0.3, 0.25,
                  'x', mats['chrome'])
