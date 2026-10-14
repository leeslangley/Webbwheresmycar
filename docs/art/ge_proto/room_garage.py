# GE reference prototype: garage plate. blender --background --python room_garage.py -- /tmp/garage.png [samples]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roomlib import *
from roomkit import *
from roomkit2 import *
args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]; SAMPLES = int(args[1]) if len(args) > 1 and args[1].isdigit() else 48
sc = reset(); setup_camera(sc); setup_render(sc, OUT, SAMPLES, transparent=False)
world(sc, '#2a3038', 0.5)
M = make_materials(); M.update(make_materials2()); M['wall'] = M['block']; M['floor'] = M['conc']
wall_with_openings(M, [])
floor_and_skirting(M)
pegboard(M, (40, 30, 1200, 64), 14)
for x in (200, 550, 900):
    strip_light(M, (x, 12, 180, 12))
roller_door(M, (60, 150, 300, 300), 10)
filing_cabinet(M, (1150, 300, 90, 190))
oil_drum(M, 1090, 0.6); oil_drum(M, 1030, 0.8)
tyre_stack(M, 470, 0.9, 4)
bay_marks(M, [(120, 420), (480, 780), (840, 1140)], 1.2, 3.2)
for x in (300, 650, 1000):
    light('AREA', 'strip', (x / 100.0, -0.6, 4.4), 260, '#dff1ff', 1.8, (0, 0, 0))
light('AREA', 'fill', (6.4, -8, 6), 300, '#ffe6c8', 12.0, (math.radians(55), 0, 0))
bpy.ops.render.render(write_still=True); print('RENDERED', OUT)
