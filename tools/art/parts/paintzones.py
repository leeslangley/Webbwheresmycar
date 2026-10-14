# CA17: two-tone paint, stripes and vinyl roofs. The 'paint' stage gives body faces
# a second material from details['paint']['zones']: a zone's faces take the paint2
# slot (paint.colour2, the one second paint colour) or the vinyl slot (the trim
# black). Zones are read in order and the later zone wins a face. The faces are
# classified on the body's base mesh (before its Subsurf and Bevel modifiers).
# Blender only: this module imports bpy through parts.
from parts import stage

_ZONE_USES = ('paint2', 'vinyl')
_DEFAULT_W = 4.0    # stripe width, car units, when a zone has no w
_DEFAULT_X0 = -50.0  # whole car length when a zone has no x0 / x1
_DEFAULT_X1 = 50.0
_DEFAULT_Y2 = 100.0  # band top when a zone has no y2


def _num(zone, key, default):
    v = zone.get(key, default)
    return float(v) if isinstance(v, (int, float)) else float(default)


def _in_zone(zone, region, x, y, lat, nz, belt):
    """True when a face centre (car units x, y, lat) with normal z nz is in the
    zone's region. Later zones win, so the caller tries the zones last-first."""
    if region == 'roof':
        # Centre above the belt with an upward-leaning normal, or simply above
        # the belt (the card's rule as written; the second clause covers the first).
        return (y > belt + 0.5 and nz > 0.2) or y > belt
    if region == 'above_y':
        return y > _num(zone, 'y', 0.0)
    if region == 'below_y':
        return y < _num(zone, 'y', 0.0)
    if region == 'band':
        return _num(zone, 'y', 0.0) <= y <= _num(zone, 'y2', _DEFAULT_Y2)
    if region in ('bonnet_stripe', 'centre_stripe'):
        half = _num(zone, 'w', _DEFAULT_W) / 2.0
        x0 = _num(zone, 'x0', _DEFAULT_X0)
        x1 = _num(zone, 'x1', _DEFAULT_X1)
        return abs(lat) < half and nz > 0.5 and x0 <= x <= x1
    return False


def _slot_for(mesh, mat):
    """The material index of mat in the body mesh, appending it once if absent."""
    for i, m in enumerate(mesh.materials):
        if m == mat:
            return i
    mesh.materials.append(mat)
    return len(mesh.materials) - 1


@stage('paint')
def build_paint_zones(ctx):
    details = ctx.get('details') or {}
    paint = details.get('paint') or {}
    zones = [z for z in (paint.get('zones') or []) if isinstance(z, dict)]
    if not zones:
        return
    body = ctx.get('body')
    if body is None:
        print('WARN paint: no body mesh, zones skipped')
        return

    colour2 = paint.get('colour2')
    uses = []
    for zone in zones:
        use = zone.get('use')
        if use == 'paint2' and not colour2:
            print('WARN paint2 colour missing')
            use = 'vinyl'
        if use not in _ZONE_USES:
            print('WARN paint zone use %r skipped' % (use,))
            use = None
        uses.append(use)

    mesh = body.data
    slots = {}
    for use in _ZONE_USES:
        if use not in uses:
            continue
        mat = ctx['mats'].get(use)
        if mat is None:
            print('WARN paint material %s missing, zones using it skipped' % use)
            uses = [None if u == use else u for u in uses]
            continue
        slots[use] = _slot_for(mesh, mat)

    belt = float(ctx['surf'].belt) if ctx.get('surf') is not None else 0.0
    for p in mesh.polygons:
        # Base mesh coordinates: the body object has no transform, so local is
        # Blender world. Car units: x along the car, y height, lat sideways.
        cx, cy, cz = p.center
        x, y, lat = cx * 10.0, cz * 10.0, cy * 10.0
        nz = p.normal.z
        for i in reversed(range(len(zones))):
            use = uses[i]
            if use is None:
                continue
            if _in_zone(zones[i], zones[i].get('region'), x, y, lat, nz, belt):
                p.material_index = slots[use]
                break

    faces = sum(1 for p in mesh.polygons if p.material_index != 0)
    print('PAINT zones=%d faces=%d' % (len(zones), faces))
    print('PAINT slots=%d' % len(mesh.materials))
