# GDA01: export ONE car from its dossier as a binary glTF (.glb) for Godot.
# Usage (Blender, headless, nothing on screen):
#   /opt/homebrew/bin/blender --background --python-exit-code 1 \
#     --python tools/art/export_glb.py -- --id t1_chimp [--out PATH] \
#     [--color #rrggbb] [--dossier-dir docs/cars]
# List the dossiers (plain python3, no Blender):
#   python3 tools/art/export_glb.py --list [--dossier-dir docs/cars]
#
# The car is built exactly as tools/art/blender_car2.py builds it (same dossier,
# same parts; blender_car2.py is run unchanged, its render is skipped). Then the
# scene is cleaned to meshes only, one mesh per part, one material per class, and
# every part is named <class>_<NN>. Godot colours and weathers by class at run time.
# Defaults: --dossier-dir and --out are taken from the repo root; --color is the
# dossier's typical_paint[0]. Paths you pass are used as given.
import json
import os
import re
import runpy
import sys

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(TOOLS_DIR, '..', '..'))
DEFAULT_DOSSIER_DIR = os.path.join(REPO_ROOT, 'docs', 'cars')
DEFAULT_OUT_DIR = os.path.join(REPO_ROOT, 'godot', 'art', 'cars')
ID_RE = re.compile(r'^[A-Za-z0-9_]+$')
HEX_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
CLASSES = ('paint', 'paint2', 'chrome', 'glass', 'lamp', 'tail', 'trim', 'tyre', 'wall')
# Material names that blender_car2.py uses but cbmat.MASK_CLASS does not know.
CLASS_EXTRA = {'lens': 'lamp', 'plate': 'wall', 'fabric': 'trim'}
# class -> (colour hex, metallic, roughness, emission hex or None, emission strength)
CANON = {
    'chrome': ('#f2f2f4', 1.0, 0.05, None, 0.0),
    'glass': ('#1b2830', 0.0, 0.02, None, 0.0),
    'lamp': ('#fff1c0', 0.0, 0.1, '#ffe9a8', 2.0),
    'tail': ('#c01818', 0.0, 0.2, '#ff2010', 1.0),
    'trim': ('#0e0e10', 0.0, 0.55, None, 0.0),
    'tyre': ('#16161a', 0.0, 0.85, None, 0.0),
    'wall': ('#e8e2d0', 0.0, 0.7, None, 0.0),
}
USAGE = ('usage: blender --background --python-exit-code 1 --python '
         'tools/art/export_glb.py -- --id <car id> [--out PATH] [--color #rrggbb] '
         '[--dossier-dir DIR]   |   python3 tools/art/export_glb.py --list [--dossier-dir DIR]')


def fail(msg, code=2):
    print('ERROR: %s' % msg)
    sys.exit(code)


def parse_args(argv):
    opts = {'id': None, 'out': None, 'color': None,
            'dossier_dir': DEFAULT_DOSSIER_DIR, 'list': False}
    names = {'--id': 'id', '--out': 'out', '--color': 'color', '--dossier-dir': 'dossier_dir'}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--list':
            opts['list'] = True
            i += 1
        elif a in names:
            if i + 1 >= len(argv) or argv[i + 1].startswith('--'):
                fail('missing value after %s. %s' % (a, USAGE))
            opts[names[a]] = argv[i + 1]
            i += 2
        else:
            fail('unknown argument %r. %s' % (a, USAGE))
    return opts


def read_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def list_dossiers(dossier_dir):
    if not os.path.isdir(dossier_dir):
        fail('no dossier folder %s' % dossier_dir)
    rows = []
    for name in os.listdir(dossier_dir):
        path = os.path.join(dossier_dir, name)
        if not name.endswith('.json') or not os.path.isfile(path):
            continue
        try:
            d = read_json(path)
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict) or 'id' not in d or 'side_profile' not in d:
            continue
        rows.append((str(d['id']), str(d.get('game_name', ''))))
    for car_id, game_name in sorted(rows):
        print('%s\t%s' % (car_id, game_name))
    return 0


def cls_of(material_name):
    """Class of a material name: the CLASS_EXTRA names first, then cbmat.class_of."""
    import cbmat  # imported after sys.path is set up (needs bpy, so only in the build)
    base = re.sub(r'\.\d{3}$', '', str(material_name))
    if base in CLASS_EXTRA:
        return CLASS_EXTRA[base]
    return cbmat.class_of(base)


def object_class(obj):
    """Class of a single-material mesh: the material its faces use (no material: trim)."""
    used = sorted({p.material_index for p in obj.data.polygons})
    if not used:
        return 'trim'
    if len(used) > 1:
        print('WARNING %s still uses %d materials after separation; using the first' % (obj.name, len(used)))
    slot = obj.material_slots[used[0]] if used[0] < len(obj.material_slots) else None
    if slot is None or slot.material is None:
        return 'trim'
    return cls_of(slot.material.name)


def build_and_export(opts, car_id, dossier_path, details_path, dossier, color):
    try:
        import bpy
    except ImportError:
        fail('this export needs Blender (bpy). Run it with /opt/homebrew/bin/blender '
             '--background --python tools/art/export_glb.py -- --id %s' % car_id)
    sys.path.insert(0, TOOLS_DIR)
    import carlib
    import cbmat
    from mathutils import Vector

    # Same car as blender_car2.py. Its render is replaced by a no-op: no image is made.
    carlib.render = lambda *a, **k: None
    with open(os.path.join(TOOLS_DIR, 'blender_car2.py'), encoding='utf-8') as f:
        builder_text = f.read()
    car_argv = ['blender_car2.py', '--', '--dossier', dossier_path,
                '--out', '/tmp/export_glb_unused.png', '--color', color, '--w', '16', '--h', '8']
    for flag, extra in (('--details', ['--details', 'auto']),
                        ('--body', ['--body', 'loft']),
                        ('--samples', ['--samples', '1'])):
        if flag in builder_text:
            car_argv += extra
    sys.argv = car_argv
    runpy.run_path(os.path.join(TOOLS_DIR, 'blender_car2.py'), run_name='__main__')

    # Clean: meshes only, no shadow catcher.
    for obj in list(bpy.data.objects):
        if obj.type != 'MESH' or obj.name == 'shadow_catcher' or obj.is_shadow_catcher:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Split every mesh that has more than one material into one mesh per material.
    for obj in [o for o in bpy.data.objects if o.type == 'MESH' and len(o.material_slots) > 1]:
        if bpy.context.object and bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.separate(type='MATERIAL')
        bpy.ops.object.mode_set(mode='OBJECT')

    meshes = sorted([o for o in bpy.data.objects if o.type == 'MESH'], key=lambda o: o.name)
    pairs = []
    for obj in meshes:
        if len(obj.data.polygons) == 0:
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        pairs.append((obj, object_class(obj)))

    # One canonical material per class in use, the same on every part of that class.
    paint2_hex = '#c8c8c8'
    finish = 'solid'
    if details_path and os.path.isfile(details_path):
        details = read_json(details_path)
        paint = details.get('paint') or {}
        paint2_hex = paint.get('colour2') or paint2_hex
        finish = paint.get('finish') or finish
    used = {cls for _, cls in pairs}
    for obj, _ in pairs:
        obj.data.materials.clear()
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    canon = {}
    for cls in CLASSES:
        if cls not in used:
            continue
        if cls == 'paint':
            canon[cls] = carlib.make_mat('paint', cbmat.hex_lin(color), metallic=0.0, roughness=0.32)
        elif cls == 'paint2':
            canon[cls] = carlib.make_mat('paint2', cbmat.hex_lin(paint2_hex), metallic=0.0, roughness=0.32)
        else:
            col, metallic, rough, emis, strength = CANON[cls]
            emission = cbmat.hex_lin(emis) if emis else None
            canon[cls] = carlib.make_mat(cls, cbmat.hex_lin(col), metallic=metallic, roughness=rough,
                                         emission=emission, emission_strength=strength)
    for obj, cls in pairs:
        obj.data.materials.append(canon[cls])
        for poly in obj.data.polygons:
            poly.material_index = 0

    # Rename: two passes so no name clashes, then <class>_<NN> counting from 00 per class.
    for k, (obj, _) in enumerate(pairs):
        obj.name = '_tmp_%03d' % k
        obj.data.name = '_tmp_%03d' % k
    counter = {cls: 0 for cls in CLASSES}
    for obj, cls in pairs:
        if counter[cls] >= 100:
            fail('more than 99 %s parts' % cls)
        final = '%s_%02d' % (cls, counter[cls])
        counter[cls] += 1
        obj.name = final
        obj.data.name = final

    # Export the remaining meshes as one binary glTF.
    out = opts['out'] or os.path.join(DEFAULT_OUT_DIR, car_id + '.glb')
    out = os.path.abspath(out)
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kw = {'export_format': 'GLB', 'use_selection': True, 'export_apply': True,
          'export_yup': True, 'export_cameras': False, 'export_lights': False,
          'export_extras': False}
    missing = sorted(k for k in kw if k not in props)
    if missing:
        print('WARNING glTF exporter has no option(s): %s' % ', '.join(missing))
    kw = {k: v for k, v in kw.items() if k in props}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, **kw)
    print('EXPORTED %s %s bytes=%d' % (car_id, out, os.path.getsize(out)))

    # Meta: bounding box in Godot axes (Blender x, y, z -> Godot x, z, -y).
    depsgraph = bpy.context.evaluated_depsgraph_get()
    lo = [1e9, 1e9, 1e9]
    hi = [-1e9, -1e9, -1e9]
    for obj, _ in pairs:
        ev = obj.evaluated_get(depsgraph)
        for corner in ev.bound_box:
            wx, wy, wz = obj.matrix_world @ Vector(corner)
            for axis, val in enumerate((wx, wz, -wy)):
                lo[axis] = min(lo[axis], val)
                hi[axis] = max(hi[axis], val)
    wheels = dossier.get('wheels') or []
    xs = [float(w['x']) for w in wheels if 'x' in w]
    wheelbase = round(max(xs) - min(xs), 2) if xs else 0.0
    counts = {cls: sum(1 for _, c in pairs if c == cls) for cls in CLASSES if cls in used}
    meta = {
        'id': car_id,
        'game_name': dossier.get('game_name', ''),
        'len_mm': (dossier.get('dims_mm') or {}).get('length'),
        'bbox_min': [round(v, 4) for v in lo],
        'bbox_max': [round(v, 4) for v in hi],
        'wheelbase_units': wheelbase,
        'wheels': len(wheels),
        'classes': counts,
        'paints': dossier.get('typical_paint') or [],
        'paint2': paint2_hex if 'paint2' in used else '',
        'finish': finish,
    }
    print('META ' + json.dumps(meta, sort_keys=True))
    return 0


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    opts = parse_args(argv)
    if opts['list']:
        return list_dossiers(opts['dossier_dir'])
    if not opts['id']:
        fail('missing --id <car id>. %s' % USAGE)
    car_id = opts['id']
    if not ID_RE.match(car_id):
        fail('bad --id %r: letters, digits and underscores only' % car_id)
    dossier_path = os.path.join(opts['dossier_dir'], car_id + '.json')
    if not os.path.isfile(dossier_path):
        fail('no dossier for --id %s: %s not found' % (car_id, dossier_path))
    try:
        dossier = read_json(dossier_path)
    except (OSError, ValueError) as e:
        fail('cannot read dossier %s: %s' % (dossier_path, e))
    if not isinstance(dossier, dict) or 'side_profile' not in dossier:
        fail('dossier %s has no side_profile' % dossier_path)
    color = opts['color']
    if color is None:
        paints = dossier.get('typical_paint') or []
        if not paints:
            fail('dossier %s has no typical_paint and no --color was given' % dossier_path)
        color = paints[0]
    if not HEX_RE.match(str(color)):
        fail('bad --color %r, expected #rrggbb' % color)
    details_path = os.path.join(opts['dossier_dir'], 'details', car_id + '.json')
    return build_and_export(opts, car_id, dossier_path, details_path, dossier, color)


if __name__ == '__main__':
    sys.exit(main())
