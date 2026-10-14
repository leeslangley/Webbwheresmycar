# GDA02: write or check godot/art/cars/manifest.json (python3 standard library only).
# Usage (from anywhere):
#   python3 tools/art/glb_manifest.py build   reads build/glb/*.meta.json and writes the manifest
#                                             (a car with no meta file keeps its old manifest entry)
#   python3 tools/art/glb_manifest.py check   checks every car in the manifest and its .glb file
import glob
import json
import os
import sys

sys.dont_write_bytecode = True  # keep tools/art clean of __pycache__

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(TOOLS_DIR, '..', '..'))
CARS_DIR = os.path.join(REPO_ROOT, 'godot', 'art', 'cars')
MANIFEST = os.path.join(CARS_DIR, 'manifest.json')
META_GLOB = os.path.join(REPO_ROOT, 'build', 'glb', '*.meta.json')
VERSION = 1
ENTRY_KEYS = ('game_name', 'len_mm', 'bbox_min', 'bbox_max', 'wheelbase_units', 'wheels',
              'classes', 'paints', 'paint2', 'finish')
USAGE = 'usage: python3 tools/art/glb_manifest.py build|check'


def fail(msg, code=1):
    print(msg)
    sys.exit(code)


def load_manifest_cars():
    """The cars dict of the existing manifest, or {} when there is no manifest yet."""
    if not os.path.isfile(MANIFEST):
        return {}
    with open(MANIFEST, encoding='utf-8') as f:
        data = json.load(f)
    cars = data.get('cars') if isinstance(data, dict) else None
    if not isinstance(cars, dict):
        fail('MANIFEST ERROR: %s has no cars object' % MANIFEST)
    return cars


def read_meta(path):
    with open(path, encoding='utf-8') as f:
        meta = json.load(f)
    if not isinstance(meta, dict) or not isinstance(meta.get('id'), str):
        fail('MANIFEST ERROR: %s has no id' % path)
    missing = [k for k in ENTRY_KEYS if k not in meta]
    if missing:
        fail('MANIFEST ERROR: %s is missing %s' % (path, ', '.join(missing)))
    entry = {'file': meta['id'] + '.glb'}
    for k in ENTRY_KEYS:
        entry[k] = meta[k]
    return meta['id'], entry


def build():
    cars = load_manifest_cars()
    for path in sorted(glob.glob(META_GLOB)):
        car_id, entry = read_meta(path)
        cars[car_id] = entry
    data = {'version': VERSION, 'cars': {k: cars[k] for k in sorted(cars)}}
    os.makedirs(CARS_DIR, exist_ok=True)
    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(data, f, sort_keys=True, indent=1)
        f.write('\n')
    print('MANIFEST %d cars' % len(cars))
    return 0


def check():
    if not os.path.isfile(MANIFEST):
        fail('MANIFEST CHECK FAIL: no manifest at %s' % MANIFEST)
    cars = load_manifest_cars()
    if not cars:
        fail('MANIFEST CHECK FAIL: no cars in the manifest')
    for car_id in sorted(cars):
        entry = cars[car_id]
        glb = os.path.join(CARS_DIR, str(entry.get('file', '')))
        if not os.path.isfile(glb):
            fail('MANIFEST CHECK FAIL %s: %s not found' % (car_id, glb))
        with open(glb, 'rb') as f:
            if f.read(4) != b'glTF':
                fail('MANIFEST CHECK FAIL %s: %s does not start with glTF' % (car_id, glb))
        len_mm = entry.get('len_mm')
        if not isinstance(len_mm, (int, float)) or len_mm <= 2500:
            fail('MANIFEST CHECK FAIL %s: len_mm %r is not over 2500' % (car_id, len_mm))
        wheels = entry.get('wheels')
        if not isinstance(wheels, int) or wheels < 2:
            fail('MANIFEST CHECK FAIL %s: wheels %r is under 2' % (car_id, wheels))
        classes = entry.get('classes')
        if not isinstance(classes, dict):
            fail('MANIFEST CHECK FAIL %s: classes is not an object' % car_id)
        for need in ('paint', 'tyre'):
            if need not in classes:
                fail('MANIFEST CHECK FAIL %s: classes has no %s' % (car_id, need))
    print('MANIFEST CHECK OK %d' % len(cars))
    return 0


def main(argv):
    if len(argv) != 1 or argv[0] not in ('build', 'check'):
        fail(USAGE, 2)
    return build() if argv[0] == 'build' else check()


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
