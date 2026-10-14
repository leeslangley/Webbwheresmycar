# V01: build the painted body shell of a car from one dossier JSON and render it.
# Run headless:
#   /opt/homebrew/bin/blender --background --python-exit-code 1 \
#     --python tools/art/blender_car2.py -- <args>
# Args after --: --dossier <json>  --out <png path>  --color <#rrggbb>
#                --w <int> (default 1024)  --h <int> (default 512)  --report
#                --details <json|auto|none> (default auto)
#                --body slab|loft (default slab)
import bpy
import os
import sys

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carlib  # noqa: E402  (path must be set up first)
import details as detlib  # noqa: E402
import parts  # noqa: E402
import surface  # noqa: E402
from parts import _mats  # noqa: E402


def parse_args(argv):
    args = {'dossier': None, 'out': None, 'color': None,
            'w': 1024, 'h': 512, 'report': False,
            'details': 'auto', 'body': 'slab'}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--dossier', '--out', '--color'):
            if i + 1 >= len(argv):
                print('Missing value after %s' % a)
                sys.exit(2)
            args[a[2:]] = argv[i + 1]
            i += 2
        elif a == '--details':
            if i + 1 >= len(argv):
                print('Missing value after %s' % a)
                sys.exit(2)
            args['details'] = argv[i + 1]
            i += 2
        elif a == '--body':
            if i + 1 >= len(argv):
                print('Missing value after %s' % a)
                sys.exit(2)
            if argv[i + 1] not in ('slab', 'loft'):
                print('Bad value for %s: %r, expected slab or loft'
                      % (a, argv[i + 1]))
                sys.exit(2)
            args['body'] = argv[i + 1]
            i += 2
        elif a in ('--w', '--h'):
            if i + 1 >= len(argv):
                print('Missing value after %s' % a)
                sys.exit(2)
            try:
                args[a[2:]] = int(argv[i + 1])
            except ValueError:
                print('Bad value for %s: %r, expected an integer' % (a, argv[i + 1]))
                sys.exit(2)
            i += 2
        elif a == '--report':
            args['report'] = True
            i += 1
        else:
            print('Unknown argument: %s' % a)
            sys.exit(2)
    if not args['dossier']:
        print('Missing required --dossier <json path>')
        sys.exit(2)
    if not args['out']:
        print('Missing required --out <png path>')
        sys.exit(2)
    if args['w'] < 1 or args['h'] < 1:
        print('Bad size %dx%d, expected positive integers' % (args['w'], args['h']))
        sys.exit(2)
    return args


def load_details(args, d):
    """The details dict for this car, or None for --details none. 'auto' reads
    <dossier dir>/details/<dossier id>.json when it exists, else builds one from
    the dossier (surface.default_details). Problems are printed and the render
    goes on; a file that cannot be read exits 2."""
    choice = args['details']
    if choice == 'none':
        return None
    if choice == 'auto':
        dossier_dir = os.path.dirname(os.path.abspath(args['dossier']))
        path = os.path.join(dossier_dir, 'details', '%s.json' % d['id'])
        if not os.path.isfile(path):
            return surface.default_details(d)
    else:
        path = choice
        if not os.path.isfile(path):
            print('Cannot read details %s: no such file' % path)
            sys.exit(2)
    try:
        details = detlib.load(path)
    except ValueError as e:
        print('Cannot read details %s: %s' % (path, e))
        sys.exit(2)
    for problem in detlib.validate(details, dossier=d):
        print('DETAILS PROBLEM %s: %s' % (path, problem))
    return details


def build_slab(d, paint):
    """V01/V02: the painted body shell, shaped and finished."""
    body = carlib.extrude_polygon(d['side_profile'], d['plan']['width_units'],
                                  paint, 'body')
    # Shape the raw mesh, then finish it (bevel, subsurf, smooth shading).
    carlib.shape_body(body, d['plan'])
    carlib.finish_mesh(body)
    return body


def build_parts(args, d, details, scene, paint_hex):
    """CA03: build the car through the parts framework. The slab body is the
    fallback when no body stage is registered, then parts.build_all runs the
    stages and every part of the details file."""
    mats = _mats.make_all(paint_hex, 'solid',
                          (details.get('paint') or {}).get('colour2'))

    def mult(key):
        return (details.get('caricature') or {}).get(key, 1.0)

    ctx = {
        'scene': scene,
        'args': args,
        'dossier': d,
        'details': details,
        'mats': mats,
        'surf': surface.Surface(d, belt_y=details.get('belt_y')),
        'body': None,
        'mult': mult,
    }
    parts.load_all()
    if 'body' not in parts.STAGES:
        if args['body'] == 'loft':
            print('NOTE --body loft: no loft body stage yet, using the slab body')
        ctx['body'] = build_slab(d, mats['paint'])
    parts.build_all(ctx)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    args = parse_args(argv)

    d = carlib.load_dossier(args['dossier'])
    if args['color']:
        paint_hex = args['color']
    else:
        paints = d.get('typical_paint') or []
        if not paints:
            print('Dossier %s has no typical_paint entry and no --color was given'
                  % args['dossier'])
            sys.exit(2)
        paint_hex = paints[0]
    color = carlib.hex_to_rgb(paint_hex)
    details = load_details(args, d)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    if details is not None:
        build_parts(args, d, details, scene, paint_hex)
    else:
        mats = {
            'paint': carlib.make_mat('paint', color, metallic=0.0, roughness=0.25,
                                     coat=1.0, coat_rough=0.05),
            # V03: tinted greenhouse glass (and dark fabric for soft tops).
            'glass': carlib.make_mat('glass', carlib.hex_to_rgb('#a8d0e0'),
                                     roughness=0.03, alpha=0.32, blend='BLEND'),
            'fabric': carlib.make_mat('fabric', carlib.hex_to_rgb('#1c1c20'),
                                      roughness=0.9),
            # V04: tyres and chrome brightwork for the wheels.
            'tyre': carlib.make_mat('tyre', carlib.hex_to_rgb('#101014'),
                                    roughness=0.9),
            'chrome': carlib.make_mat('chrome', carlib.hex_to_rgb('#e8e8ee'),
                                      metallic=1.0, roughness=0.08),
            # V05: headlamp lenses, red tail lamps and white number plates.
            'lens': carlib.make_mat('lens', carlib.hex_to_rgb('#fff6c0'),
                                    roughness=0.05,
                                    emission=carlib.hex_to_rgb('#fff6c0'),
                                    emission_strength=1.0),
            'tail': carlib.make_mat('tail', carlib.hex_to_rgb('#d82020'),
                                    roughness=0.3,
                                    emission=carlib.hex_to_rgb('#d82020'),
                                    emission_strength=0.5),
            'plate': carlib.make_mat('plate', carlib.hex_to_rgb('#f4f4f0'),
                                     roughness=0.4),
        }
        body = build_slab(d, mats['paint'])
        # V03: the windows, extruded narrower so they sit inside the roof.
        carlib.build_glass(d, body, mats)
        # V04: the wheels, tyre and rim on each side of the car.
        carlib.build_wheels(d, mats)
        # V05: the headlamps, tail lamps and number plates.
        carlib.build_lamps(d, mats)

    # Shadow catcher plane under the car (renders only the shadow).
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    catcher = bpy.context.active_object
    catcher.name = 'shadow_catcher'
    catcher.is_shadow_catcher = True

    carlib.setup_world(scene)
    carlib.setup_lights(scene)
    carlib.setup_camera(scene, args['w'], args['h'])
    carlib.render(scene, args['out'], args['w'], args['h'])
    print('RENDERED %s' % args['out'])

    if args['report']:
        for obj in scene.objects:
            if obj.type != 'MESH' or obj.name == 'shadow_catcher':
                continue
            print('REPORT %s dx=%.2f dy=%.2f dz=%.2f' %
                  (obj.name, obj.dimensions.x * 10.0, obj.dimensions.y * 10.0,
                   obj.dimensions.z * 10.0))


if __name__ == '__main__':
    main()
