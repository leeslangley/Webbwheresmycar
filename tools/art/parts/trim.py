# CA13: trim strips, body creases and shut lines that follow the body. Three kinds
# of thin ribbon hugging the curved flank of the car:
#   'strip'    chrome (or black / paint2) trim along the sill, waist or sweep, or a
#              window surround (role window takes the top-level window_frame colour)
#   'crease'   a raised body crease line between two x positions
#   'shutline' a dark panel gap line along a path (door, bonnet, boot), with an
#              optional line across the top at across_x (a bonnet or boot lid edge)
# Coordinates are car units (see _common.py): x -50 tail to +50 nose, y height,
# lat sideways. Points are (x, y, lat) tuples. Blender only: imports bmesh and bpy.
import math

import bmesh
import bpy

from parts import register
from parts import _common as pc

STRIP_THICK = 0.35     # chrome strip standing off the flank
CREASE_DEPTH_PAD = 0.05
CREASE_HEIGHT = 0.3
SHUT_THICK = 0.1
SHUT_HEIGHT = 0.28
STRIP_STEP = 2.0       # points at most this far apart along a strip
SHUT_STEP = 1.5        # shut line points along each path segment
SHUT_TOP_STEP = 2.0    # points across the top line
FLANK_OFFSET = 0.05    # a strip or crease sits this far off the flank
SHUT_OFFSET = 0.03     # a shut line sits this far off the flank


def _bl(v):
    """A car (x, y, lat) vector or point as Blender (X, Y, Z) in metres."""
    return (v[0] * pc.U, v[2] * pc.U, v[1] * pc.U)


def _unit(v):
    length = math.sqrt(sum(c * c for c in v))
    if length < 1e-9:
        raise ValueError('zero-length direction')
    return [c / length for c in v]


def _cross(a, b):
    return [a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]]


def _tangents(pts):
    """Unit tangent at each point of a polyline (central difference inside)."""
    last = len(pts) - 1
    out = []
    for i in range(len(pts)):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, last)]
        out.append(_unit([b[k] - a[k] for k in range(3)]))
    return out


def ribbon(name, pts, thick, height, mat, out):
    """A closed band along the polyline pts. At each point the cross-section is a
    rectangle: height across the path (in the plane through the path and the out
    direction), and thick pushed out along out, a fixed car-space direction such as
    (0, 0, s) for a flank ribbon on side s, or (0, 1, 0) for a line across the top.
    A path running along the car gives the vertical quad of the card; a path running
    up the flank (a door edge) gets its quads turned across the path. Returns the
    object, linked into the scene."""
    clean = []
    for p in pts:
        p = tuple(float(c) for c in p)
        if not clean or max(abs(p[k] - clean[-1][k]) for k in range(3)) > 1e-6:
            clean.append(p)
    if len(clean) < 2:
        raise ValueError('%s needs at least 2 distinct points' % name)
    tans = _tangents(clean)
    bm = bmesh.new()
    rings = []
    for p, t in zip(clean, tans):
        # out made perpendicular to the path, then n across the path in its plane.
        dot = sum(out[k] * t[k] for k in range(3))
        o = _unit([out[k] - dot * t[k] for k in range(3)])
        n = _unit(_cross(o, t))
        p0 = [p[k] - 0.5 * height * n[k] for k in range(3)]
        p1 = [p[k] + 0.5 * height * n[k] for k in range(3)]
        p2 = [p1[k] + thick * o[k] for k in range(3)]
        p3 = [p0[k] + thick * o[k] for k in range(3)]
        rings.append([bm.verts.new(_bl(v)) for v in (p0, p1, p2, p3)])
    for a, b in zip(rings, rings[1:]):
        for j in range(4):
            k = (j + 1) % 4
            bm.faces.new((a[j], a[k], b[k], b[j]))
    bm.faces.new(rings[0][::-1])   # start cap
    bm.faces.new(rings[-1])        # end cap
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def flank_points(surf, x0, x1, y, s, step=2.0):
    """Points (x, y, s * (half_width + 0.05)) from x0 to x1, at most step apart,
    standing just off the flank on side s (-1 near, +1 far, 0 centre)."""
    n = max(1, int(math.ceil(abs(x1 - x0) / step - 1e-9)))
    pts = []
    for k in range(n + 1):
        x = x0 + (x1 - x0) * k / float(n)
        pts.append((x, y, s * (surf.half_width(x, y) + FLANK_OFFSET)))
    return pts


def _resample(path, step):
    """The polyline path (a list of (x, y)) with points at most step apart. The
    path's own vertices are kept; zero-length segments are skipped."""
    out = [path[0]]
    for (x0, y0), (x1, y1) in zip(path, path[1:]):
        length = math.hypot(x1 - x0, y1 - y0)
        if length < 1e-9:
            continue
        n = max(1, int(math.ceil(length / step - 1e-9)))
        for k in range(1, n + 1):
            f = k / float(n)
            out.append((x0 + (x1 - x0) * f, y0 + (y1 - y0) * f))
    return out


def _top_points(surf, across_x):
    """Points across the top at across_x, from lat -L to +L, just under the top
    line. L is 0.9 of the half width a unit below the top."""
    top = surf.top(across_x)
    half = 0.9 * surf.half_width(across_x, top - 1.0)
    n = max(1, int(math.ceil(2.0 * half / SHUT_TOP_STEP - 1e-9)))
    return [(across_x, top - 0.05, -half + 2.0 * half * k / float(n))
            for k in range(n + 1)]


def _strip_mat(mats, colour):
    """chrome (the default), black, paint, or paint2 (the paint when the car has no
    second paint colour)."""
    if colour == 'black':
        return mats['black']
    if colour == 'paint':
        return mats['paint']
    if colour == 'paint2':
        return mats.get('paint2', mats['paint'])
    return mats['chrome']


@register('strip')
def build_strip(part, ctx, i):
    surf = ctx['surf']
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for strip
    h = float(part.get('h', 0.5))
    if part.get('role') == 'window':
        colour = ctx['details'].get('window_frame', 'chrome')
    else:
        colour = part.get('colour', 'chrome')
    mat = _strip_mat(ctx['mats'], colour)
    for s in pc.side_list(p):
        pts = flank_points(surf, float(part['x']), float(part['x2']),
                           float(part['y']), s, step=STRIP_STEP)
        ribbon(pc.part_name('strip', i, s), pts, STRIP_THICK, h, mat,
               (0.0, 0.0, float(s) or 1.0))


@register('crease')
def build_crease(part, ctx, i):
    surf = ctx['surf']
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for crease
    depth = float(part.get('depth', 0.15))
    mat = ctx['mats']['paint']  # the body paint itself (the card allows it)
    for s in pc.side_list(p):
        pts = flank_points(surf, float(part['x']), float(part['x2']),
                           float(part['y']), s, step=STRIP_STEP)
        ribbon(pc.part_name('crease', i, s), pts, depth + CREASE_DEPTH_PAD,
               CREASE_HEIGHT, mat, (0.0, 0.0, float(s) or 1.0))


@register('shutline')
def build_shutline(part, ctx, i):
    surf = ctx['surf']
    p = dict(part)
    p.setdefault('side', 'both')  # the table default for shutline
    mat = ctx['mats']['dark']
    path = [(float(q[0]), float(q[1])) for q in part['path']]
    for s in pc.side_list(p):
        pts = [(x, y, s * (surf.half_width(x, y) + SHUT_OFFSET))
               for x, y in _resample(path, SHUT_STEP)]
        ribbon(pc.part_name('shutline', i, s), pts, SHUT_THICK, SHUT_HEIGHT, mat,
               (0.0, 0.0, float(s) or 1.0))
    across = part.get('across_x')
    if across is not None:
        ribbon('shutline_%d_top' % i, _top_points(surf, float(across)),
               SHUT_THICK, SHUT_HEIGHT, mat, (0.0, 1.0, 0.0))
