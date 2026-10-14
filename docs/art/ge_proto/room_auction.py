# GE reference prototype: auction hall plate. blender --background --python room_auction.py -- /tmp/auction.png [samples]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roomlib import *
from roomkit import *
from roomkit2 import *
args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]; SAMPLES = int(args[1]) if len(args) > 1 and args[1].isdigit() else 48
sc = reset(); setup_camera(sc); setup_render(sc, OUT, SAMPLES, transparent=False)
world(sc, '#1a1424', 0.35)
M = make_materials(); M.update(make_materials2()); M['wall'] = M['panel']; M['floor'] = M['hall']
wall_with_openings(M, [])
floor_and_skirting(M)
cornice(M, 40)
curtain(M, 0, 150, 40, 480); curtain(M, 1130, 1280, 40, 480)
wbox('valance', 0, 36, 1280, 26, 0.3, M['velvet'], 0.1, 0.02)
stage(M, 100, 1180, 0.0, 2.2, 0.35)
podium(M, 1040, 0.9)
lot_board(M, (120, 100, 1040, 260))           # dark wood board: the game paints the car over this
bunting(M, 70, 20, 62, 20, 12, ('red', 'cream', 'green'))
for row in range(2):
    for i in range(10):
        dining_chair(M, 130 + i * 110 + (row * 55), 3.6 + row * 1.2)
dd = Vector((0.0, 2.8, -5.0)); dd.normalize()
light('SPOT', 'spot', (6.4, -4.0, 5.5), 3500, '#ffe2a0', 0.4, dd.to_track_quat('-Z', 'Y').to_euler())
for sx in (2.2, 10.6):
    light('POINT', 'sconce', (sx, -0.6, 3.0), 90, '#ffb070', 0.3)
bpy.data.lights['spot'].spot_size = math.radians(60); bpy.data.lights['spot'].spot_blend = 0.6
light('AREA', 'fill', (6.4, -8, 6), 700, '#8a7ab8', 12.0, (math.radians(55), 0, 0))
bpy.ops.render.render(write_still=True); print('RENDERED', OUT)
