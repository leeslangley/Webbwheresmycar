# GE reference prototype: title street plate (night). Sky stays TRANSPARENT (stars are drawn by the game).
# blender --background --python room_title.py -- /tmp/title.png [samples]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roomlib import *
from roomkit import *
from roomkit2 import *
args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]; SAMPLES = int(args[1]) if len(args) > 1 and args[1].isdigit() else 48
set_view(8.0, 640.0)
sc = reset(); setup_camera(sc); setup_render(sc, OUT, SAMPLES, transparent=True)
world(sc, '#1b1a3a', 0.6)
M = make_materials(); M.update(make_materials2())
box('road', -1, 14, -9, 1.0, -0.3, 0.0, M['road'], 0)
box('pave', -1, 14, -2.6, -0.6, 0.0, 0.12, M['pave'], 0.01)
shop_front(M, 0, 330, 2.4); shop_front(M, 330, 760, 2.0); shop_front(M, 760, 1100, 2.6); shop_front(M, 1100, 1400, 2.2)
lamps = [lamppost(M, 250, 1.6), lamppost(M, 700, 1.6), lamppost(M, 1180, 1.6)]
for i, p in enumerate(lamps):
    print('PROJ lamp%d %.0f %.0f' % (i, *project(sc, p)))
    light('POINT', 'lamp%d' % i, p, 900, '#ffb15c', 0.2)
d = Vector((-0.3, -0.5, -0.8)); d.normalize()
light('SUN', 'moon', (0, 5, 8), 1.6, '#9db4ff', 2.0, d.to_track_quat('-Z', 'Y').to_euler())
bpy.ops.render.render(write_still=True); print('RENDERED', OUT)
