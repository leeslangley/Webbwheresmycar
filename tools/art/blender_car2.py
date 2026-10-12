# V01: build the painted body shell of a car from one dossier JSON and render it.
# Run headless:
#   /opt/homebrew/bin/blender --background --python-exit-code 1 \
#     --python tools/art/blender_car2.py -- <args>
# Args after --: --dossier <json>  --out <png path>  --color <#rrggbb>
#                --w <int> (default 1024)  --h <int> (default 512)  --report
import bpy
import os
import sys

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import carlib  # noqa: E402  (path must be set up first)


def parse_args(argv):
    args = {'dossier': None, 'out': None, 'color': None,
            'w': 1024, 'h': 512, 'report': False}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--dossier', '--out', '--color'):
            if i + 1 >= len(argv):
                print('Missing value after %s' % a)
                sys.exit(2)
            args[a[2:]] = argv[i + 1]
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


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    args = parse_args(argv)

    d = carlib.load_dossier(args['dossier'])
    if args['color']:
        color = carlib.hex_to_rgb(args['color'])
    else:
        paints = d.get('typical_paint') or []
        if not paints:
            print('Dossier %s has no typical_paint entry and no --color was given'
                  % args['dossier'])
            sys.exit(2)
        color = carlib.hex_to_rgb(paints[0])

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    paint = carlib.make_mat('paint', color, metallic=0.0, roughness=0.25,
                            coat=1.0, coat_rough=0.05)
    carlib.extrude_polygon(d['side_profile'], d['plan']['width_units'],
                           paint, 'body')

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
