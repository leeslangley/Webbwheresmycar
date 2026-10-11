# A02: build a 3D toy-style car from an outline (profiles.json) and render it.
# Run headless:
#   blender --background --python tools/art/blender_car.py --python-exit-code 1 -- <args>
# Args after --: --archetype <name>  --color <#rrggbb>  --out <png path>
#                --w <int> (default 1024)  --h <int> (default 512)
import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector


def parse_args(argv):
    args = {'archetype': 'roadster', 'color': '#b02a2a', 'out': None,
            'w': 1024, 'h': 512}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--archetype':
            args['archetype'] = argv[i + 1]
            i += 2
        elif a == '--color':
            args['color'] = argv[i + 1]
            i += 2
        elif a == '--out':
            args['out'] = argv[i + 1]
            i += 2
        elif a in ('--w', '--h'):
            try:
                args[a[2:]] = int(argv[i + 1])
            except (ValueError, IndexError):
                print('Bad value for %s: %r, expected an integer' %
                      (a, argv[i + 1] if i + 1 < len(argv) else None))
                sys.exit(2)
            i += 2
        else:
            print('Unknown argument: %s' % a)
            sys.exit(2)
    if not args['out']:
        print('Missing required --out <png path>')
        sys.exit(2)
    return args


def hex_to_rgb(s):
    s = s.strip().lstrip('#')
    if len(s) != 6:
        print('Bad colour %r, expected #rrggbb' % s)
        sys.exit(2)
    try:
        return tuple(int(s[j:j + 2], 16) / 255.0 for j in (0, 2, 4))
    except ValueError:
        print('Bad colour %r, expected #rrggbb' % s)
        sys.exit(2)


def set_socket(node, name, value):
    sock = node.inputs.get(name)
    if sock is not None:
        sock.default_value = value


def make_mat(name, color, metallic=0.0, roughness=0.5, alpha=1.0,
             coat=0.0, coat_rough=0.05, emission=None, emission_strength=0.0,
             transmission=0.0, ior=1.45, blend=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    set_socket(node, 'Base Color', (*color, 1.0))
    set_socket(node, 'Metallic', metallic)
    set_socket(node, 'Roughness', roughness)
    set_socket(node, 'Alpha', alpha)
    set_socket(node, 'Coat Weight', coat)
    set_socket(node, 'Coat Roughness', coat_rough)
    set_socket(node, 'Transmission Weight', transmission)
    set_socket(node, 'IOR', ior)
    if emission is not None:
        set_socket(node, 'Emission Color', (*emission, 1.0))
        set_socket(node, 'Emission Strength', emission_strength)
    if blend is not None and hasattr(mat, 'blend_method'):
        mat.blend_method = blend
    return mat


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


# 1 car unit = 0.1 blender metre. Car faces +X, profile y becomes Z, width on Y.
U = 0.1


def extrude_part(pts, width, mat, name):
    bm = bmesh.new()
    half = -width / 2.0 * U
    verts = [bm.verts.new((x * U, half, y * U)) for x, y in pts]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    new_verts = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0.0, width * U, 0.0), verts=new_verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    me.materials.append(mat)
    bevel = obj.modifiers.new('Bevel', 'BEVEL')
    bevel.width = 0.9 * U
    bevel.segments = 3
    sub = obj.modifiers.new('Subsurf', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    for p in me.polygons:
        p.use_smooth = True
    return obj


def build_car(profile, mats):
    width = 30 if ARGS['archetype'] == 'trike' else 36
    widths = {'body': width, 'glass': width - 4, 'dark': width - 6,
              'chrome': width}
    for part in profile.get('parts', []):
        kind = part.get('k')
        if kind == 'line' or kind not in widths:
            continue
        extrude_part(part['pts'], widths[kind], mats[kind], kind)
    # Wheels: two tyres (left and right) per wheel, plus rim and hub.
    y_wheel = (width / 2.0 - 3) * U
    for w in profile.get('wheels', []):
        r = w['r'] * U
        for side in (1, -1):
            loc = (w['x'] * U, side * y_wheel, w['r'] * U)
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=48, radius=r, depth=7 * U, location=loc,
                rotation=(math.pi / 2, 0, 0))
            tyre = bpy.context.active_object
            tyre.name = 'tyre'
            tyre.data.materials.append(mats['tyre'])
            bpy.ops.object.shade_smooth()
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=32, radius=0.62 * r, depth=7.4 * U, location=loc,
                rotation=(math.pi / 2, 0, 0))
            rim = bpy.context.active_object
            rim.name = 'rim'
            rim.data.materials.append(mats['chrome'])
            bpy.ops.object.shade_smooth()
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=24, radius=0.28 * r, depth=7.8 * U, location=loc,
                rotation=(math.pi / 2, 0, 0))
            hub = bpy.context.active_object
            hub.name = 'hub'
            hub.data.materials.append(mats['chrome'])
    # Bumpers: chrome boxes at nose and tail, z 6..10, full width.
    for x in (50, -50):
        bpy.ops.mesh.primitive_cube_add(
            location=(x * U, 0, 8 * U))
        b = bpy.context.active_object
        b.name = 'bumper'
        b.scale = (1.5 * U, width / 2.0 * U, 2.0 * U)
        b.data.materials.append(mats['chrome'])
    # Headlights: emissive spheres each side. Tail lights: red boxes.
    y_light = (width / 2.0 - 7) * U
    head = profile.get('head')
    if head:
        for side in (1, -1):
            bpy.ops.mesh.primitive_uv_sphere_add(
                segments=24, ring_count=16, radius=head['r'] * U,
                location=(head['x'] * U, side * y_light, head['y'] * U))
            h = bpy.context.active_object
            h.name = 'headlight'
            h.data.materials.append(mats['light'])
            bpy.ops.object.shade_smooth()
    tail = profile.get('tail')
    if tail:
        for side in (1, -1):
            bpy.ops.mesh.primitive_cube_add(
                location=(tail['x'] * U, side * y_light,
                          (tail['y'] + tail['h'] / 2.0) * U))
            t = bpy.context.active_object
            t.name = 'taillight'
            t.scale = (tail['w'] / 2.0 * U, 1.0 * U, tail['h'] / 2.0 * U)
            t.data.materials.append(mats['taillight'])


def main():
    global ARGS
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ARGS = parse_args(argv)
    color = hex_to_rgb(ARGS['color'])

    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, 'profiles.json')) as f:
        profiles = json.load(f)
    if ARGS['archetype'] not in profiles:
        print('Unknown archetype %r, have: %s' %
              (ARGS['archetype'], ', '.join(sorted(profiles))))
        sys.exit(2)
    profile = profiles[ARGS['archetype']]

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    mats = {
        'body': make_mat('paint', color, metallic=0.0, roughness=0.25,
                         coat=1.0, coat_rough=0.05),
        'glass': make_mat('glass', hex_to_rgb('#9fc5d6'), roughness=0.05,
                          alpha=0.45, transmission=0.0, ior=1.45,
                          blend='BLEND'),
        'dark': make_mat('dark', hex_to_rgb('#1a1a22'), roughness=0.5),
        'chrome': make_mat('chrome', hex_to_rgb('#e8e8ee'), metallic=1.0,
                           roughness=0.08),
        'tyre': make_mat('tyre', hex_to_rgb('#101014'), roughness=0.9),
        'light': make_mat('headlight', hex_to_rgb('#fff6c0'), roughness=0.3,
                          emission=hex_to_rgb('#fff6c0'), emission_strength=6.0),
        'taillight': make_mat('taillight', hex_to_rgb('#d82020'),
                              roughness=0.25),
    }
    build_car(profile, mats)

    # Shadow catcher plane under the car (renders only the shadow).
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    catcher = bpy.context.active_object
    catcher.name = 'shadow_catcher'
    catcher.is_shadow_catcher = True

    # World: dark purple to feed the reflections, film stays transparent.
    world = bpy.data.worlds.new('world')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = (*hex_to_rgb('#2a2150'), 1.0)
    bg.inputs[1].default_value = 0.6
    scene.world = world
    scene.render.film_transparent = True

    # Lights: warm key upper-left-front, cool rim behind and above, fill right.
    lights = [
        ('key', '#fff0d8', 3000, 6.0, (-9, -11, 10)),
        ('rim', '#a8c4ff', 1200, 4.0, (10, 9, 9)),
        ('fill', '#ffffff', 300, 5.0, (11, -7, 3)),
    ]
    for name, col, energy, size, loc in lights:
        ld = bpy.data.lights.new(name, type='AREA')
        ld.color = hex_to_rgb(col)
        ld.energy = energy
        ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        scene.collection.objects.link(lo)
        look_at(lo, (0, 0, 1.5))

    # Camera: orthographic from the right-hand side, car facing image right.
    xmin = ymin = zmin = 1e9
    xmax = ymax = zmax = -1e9
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.name == 'shadow_catcher':
            continue
        for corner in obj.bound_box:
            wx, wy, wz = obj.matrix_world @ Vector(corner)
            xmin, xmax = min(xmin, wx), max(xmax, wx)
            ymin, ymax = min(ymin, wy), max(ymax, wy)
            zmin, zmax = min(zmin, wz), max(zmax, wz)
    zmin = min(zmin, -0.2)  # leave a little room below for the shadow
    zc = (zmin + zmax) / 2.0
    cam_data = bpy.data.cameras.new('camera')
    cam_data.type = 'ORTHO'
    need_w = (xmax - xmin) * 1.12
    need_h = (zmax - zmin) * 1.15
    cam_data.ortho_scale = max(11.0, need_w, need_h * ARGS['w'] / ARGS['h'])
    cam = bpy.data.objects.new('camera', cam_data)
    # Ortho + 6 degree pitch: the frame centre is where the view axis meets the
    # car plane, so lift the camera by 20*tan(6) to keep that point at zc.
    pitch_drop = 20.0 * math.tan(math.radians(6.0))
    cam.location = (0, -20, zc + pitch_drop)
    scene.collection.objects.link(cam)
    look_at(cam, (0, 0, zc))
    scene.camera = cam

    # Render: Cycles on CPU, 64 samples, denoised, transparent PNG.
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = ARGS['w']
    scene.render.resolution_y = ARGS['h']
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.filepath = ARGS['out']
    bpy.ops.render.render(write_still=True)
    print('RENDERED %s' % ARGS['out'])


main()
