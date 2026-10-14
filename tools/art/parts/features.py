# CA16: the silhouette-defining extras of classic cars. One builder each for the
# kinds fin (tail fin, blade or rocket), running_board, vent (side louvres and gills,
# bonnet, boot or engine lid louvres, scoops, bulges and grilles) and rack (roof or
# boot rack). Coordinates are car units (see _common.py): x -50 tail to +50 nose,
# y height above ground, lat sideways from the centre line. Blender only: this
# module imports bpy and bmesh through _common.
import bmesh
import bpy

from parts import register
from parts import _common as pc

U = pc.U
LOUVRE_T = 0.3       # louvre and cross-bar thickness, car units
GRILLE_BARS = 4      # chrome bars in a grille_rect vent
RAIL_H = 1.2         # roof rack rails stand this far above the roof
BULGE_H = 1.2        # a bonnet bulge rises this far above the lid


def _sides(part):
    """The sides a part with no lat of its own is built on. A fin, a running board
    or a side vent comes in pairs, so with no 'side' given it is both flanks (the
    spec's centre default would put it on the centre line)."""
    if 'side' in part:
        return pc.side_list(part)
    return [-1, 1]


def _prism(name, pts, lat0, lat1, mat):
    """A straight prism: the closed polygon pts ([x, y] in car units) extruded
    sideways from lat0 to lat1 (lat0 < lat1). Built as a bmesh, then linked into
    the scene the same way as the _common helpers."""
    bm = bmesh.new()
    lo = [bm.verts.new((x * U, lat0 * U, y * U)) for x, y in pts]
    hi = [bm.verts.new((x * U, lat1 * U, y * U)) for x, y in pts]
    n = len(pts)
    bm.faces.new(hi)
    bm.faces.new(list(reversed(lo)))
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new([hi[k], hi[j], lo[j], lo[k]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return pc._finish(obj, name, mat)


def _blade(x, x2, y, h, style):
    """The outline of a fin in the side plane. x runs to x2 (the tip end) and y is
    the height above ground. blade and rocket: a triangle rising to the tip at x2.
    fin: a quad, its rear edge swept back to a point 30 per cent of the run past x2."""
    if style == 'fin':
        return [(x, y), (x2, y), (x2 + 0.3 * (x2 - x), y + h), (x, y + h)]
    return [(x, y), (x2, y), (x2, y + h)]


@register('fin')
def build_fin(part, ctx, i):
    surf = ctx['surf']
    mats = ctx['mats']
    x, x2, y, h = part['x'], part['x2'], part['y'], part['h']
    thick = part.get('thick', 0.8)
    style = part.get('style', 'fin')
    pts = _blade(x, x2, y, h, style)
    hw = surf.half_width(x, y)
    for s in _sides(part):
        name = pc.part_name('fin', i, s)
        # The blade lies between the wing edge and thick inboard of it.
        if s:
            lat0, lat1 = sorted((s * (hw - thick), s * hw))
        else:
            lat0, lat1 = -thick / 2.0, thick / 2.0
        _prism(name, pts, lat0, lat1, mats['paint'])
        if style == 'rocket':
            # The red lamp: a cone of radius 1.2 centred on the tip.
            pc.lathe(name + '_lamp', [(0.0, -0.6), (1.2, -0.6), (0.0, 0.6)],
                     x2, y + h, (lat0 + lat1) / 2.0, 'h', mats['tail'])


@register('running_board')
def build_running_board(part, ctx, i):
    surf = ctx['surf']
    mats = ctx['mats']
    x, x2, y = part['x'], part['x2'], part['y']
    w = part.get('w', 3)
    colour = part.get('colour', 'black')
    mat = {'black': mats['black'], 'chrome': mats['chrome'],
           'paint': mats['paint']}[colour]
    xm = (x + x2) / 2.0
    length = abs(x2 - x)
    # The flank the board sits against. At the board's own height the body can be
    # below its sill (half width 0), so measure just above the sill instead.
    hw = surf.half_width(x, max(y, surf.bottom(x) + 2.0))
    for s in _sides(part):
        name = pc.part_name('running_board', i, s)
        pc.box(name, xm, y, s * (hw + w / 2.0 - 0.3), length, 0.6, w, mat)
        # A chrome strip along the outer edge of the board.
        pc.box(name + '_edge', xm, y, s * (hw + w - 0.5), length, 0.6, 0.4,
               mats['chrome'])


def _side_louvres(i, s, ctx, xc, y, w, h, n):
    """n thin dark louvres stacked up the flank, spaced h/n apart from y. Each is w
    long along the car, 0.3 high, and sits flush with the flank."""
    surf = ctx['surf']
    stem = pc.part_name('vent', i, s)
    for k in range(n):
        yk = y + (k + 0.5) * h / n
        lat = s * (surf.half_width(xc, yk) - 0.15)
        pc.box('%s_%d' % (stem, k), xc, yk, lat, w, LOUVRE_T, 0.3, ctx['mats']['black'])


def _gills(i, s, ctx, xa, xb, y, h, n):
    """n chrome slits up the flank, spread from xa to xb, each leaning back."""
    surf = ctx['surf']
    stem = pc.part_name('vent', i, s)
    span = xb - xa
    xc = (xa + xb) / 2.0
    for k in range(n):
        xk = xa + (k + 0.5) * span / n
        obj = pc.box('%s_%d' % (stem, k), xk, y + h / 2.0,
                     s * (surf.half_width(xc, y + h / 2.0) - 0.15),
                     0.5, h, 0.3, ctx['mats']['chrome'])
        obj.rotation_euler.y = 0.35


def _top_vent(i, ctx, style, xa, xb, w, h, n):
    """A vent on the bonnet, boot or engine lid. Everything sits on the lid surface
    (surf.top along x); the part's y is not used for these."""
    surf = ctx['surf']
    mats = ctx['mats']
    stem = pc.part_name('vent', i, 0)
    span = xb - xa
    xc = (xa + xb) / 2.0
    if style == 'louvre':
        # Slats lying across the lid, spaced evenly from xa to xb.
        for k in range(n):
            xk = xa + (k + 0.5) * span / n
            pc.box('%s_%d' % (stem, k), xk, surf.top(xk) + LOUVRE_T / 2.0, 0.0,
                   LOUVRE_T, LOUVRE_T, w, mats['black'])
    elif style == 'scoop':
        # A wedge that rises from the lid to a raised end at xb, open at that end.
        base = min(surf.top(xa), surf.top(xb))
        peak = surf.top(xb) + h
        _prism(stem, [(xa, base), (xb, base), (xb, peak)], -w / 2.0, w / 2.0,
               mats['paint'])
        pc.box(stem + '_face', xb, (base + peak) / 2.0, 0.0, 0.4, peak - base,
               w * 0.8, mats['black'])
    elif style == 'bulge':
        # An ellipsoid standing BULGE_H proud of the lid.
        pc.sphere(stem, xc, surf.top(xc), 0.0, span / 2.0, BULGE_H, w / 2.0,
                  mats['paint'])
    elif style == 'grille_rect':
        # A dark panel with chrome bars across it.
        pc.box(stem, xc, surf.top(xc) + 0.3, 0.0, span, 0.6, w, mats['black'])
        for k in range(GRILLE_BARS):
            xk = xa + (k + 0.5) * span / GRILLE_BARS
            pc.box('%s_%d' % (stem, k), xk, surf.top(xk) + 0.6, 0.0, 0.4, 0.6,
                   w * 0.9, mats['chrome'])


@register('vent')
def build_vent(part, ctx, i):
    where = part['where']
    style = part.get('style', 'louvre')
    x, x2, y, w, h = part['x'], part['x2'], part['y'], part['w'], part['h']
    n = part.get('n', 5)
    xa, xb = min(x, x2), max(x, x2)
    if where == 'side':
        if style not in ('louvre', 'gill'):
            raise ValueError('side vent style %r: want louvre or gill' % (style,))
        xc = (xa + xb) / 2.0
        for s in _sides(part):
            if style == 'gill':
                _gills(i, s, ctx, xa, xb, y, h, n)
            else:
                _side_louvres(i, s, ctx, xc, y, w, h, n)
        return
    if where not in ('bonnet', 'boot', 'engine_lid'):
        raise ValueError('bad vent where %r' % (where,))
    if style not in ('louvre', 'scoop', 'bulge', 'grille_rect'):
        raise ValueError('%s vent style %r: want louvre, scoop, bulge or grille_rect'
                         % (where, style))
    _top_vent(i, ctx, style, xa, xb, w, h, n)


@register('rack')
def build_rack(part, ctx, i):
    surf = ctx['surf']
    mats = ctx['mats']
    where = part['where']
    if where not in ('roof', 'boot'):
        raise ValueError('bad rack where %r' % (where,))
    x, x2, w = part['x'], part['x2'], part['w']
    bars = part.get('bars', 4)
    xa, xb = min(x, x2), max(x, x2)
    span = xb - xa
    xc = (xa + xb) / 2.0
    stem = 'rack_%d_c' % i
    rail_y = surf.top(xc) + RAIL_H
    chrome = mats['chrome']
    for k, lat in enumerate((-w / 2.0, w / 2.0)):
        pc.box('%s_rail_%d' % (stem, k), xc, rail_y, lat, span, 0.4, 0.6, chrome)
        # A post at each end of the rail, reaching down to the lid.
        for j, xe in enumerate((xa, xb)):
            top_e = surf.top(xe)
            if rail_y > top_e:
                pc.box('%s_post_%d_%d' % (stem, k, j), xe, (top_e + rail_y) / 2.0,
                       lat, 0.6, rail_y - top_e, 0.6, chrome)
    # Cross bars lying across the two rails.
    for j in range(bars):
        xk = xa + (j + 0.5) * span / bars
        pc.box('%s_bar_%d' % (stem, j), xk, rail_y + 0.2, 0.0, 0.6, 0.4, w, chrome)
