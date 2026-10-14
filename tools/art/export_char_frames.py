#!/usr/bin/env python3
"""Export Blender character sprites into the Godot project (python3 standard library only).

python3 tools/art/export_char_frames.py [--src assets/art/characters] [--out godot/art/chars]
                                        [--char mark|dave|all] [--selftest]

Reads <src>/manifest.json (written by tools/art/build_manifest.py), copies the PNGs the manifest
lists into <out>/<char>/ and writes <out>/<char>.json for Godot's CharFrames. Ids whose PNG is
missing are dropped with a WARN line. Customers (when the manifest has any) go to
<out>/customers.json and <out>/customers/.
"""
import argparse
import json
import os
import shutil
import struct
import sys
import tempfile
import zlib

CHARS = ['mark', 'dave']
NO_SOURCE = 'NO SOURCE: run sh tools/art/render_chars.sh all first'


def load_manifest(src):
    path = os.path.join(src, 'manifest.json')
    if not os.path.isfile(path):
        return None
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def size_pair(value):
    """Accept {"w": w, "h": h} or [w, h] and return [w, h]; anything else gives [0, 0]."""
    if isinstance(value, dict):
        return [int(value.get('w', 0)), int(value.get('h', 0))]
    if isinstance(value, (list, tuple)) and len(value) == 2:
        return [int(value[0]), int(value[1])]
    return [0, 0]


class Source:
    """Checks PNG existence in the source folder and warns once per missing id."""

    def __init__(self, src):
        self.src = src
        self.copy_ids = set()
        self.warned = set()

    def keep(self, pid):
        if pid and os.path.isfile(os.path.join(self.src, pid + '.png')):
            self.copy_ids.add(pid)
            return True
        if pid not in self.warned:
            self.warned.add(pid)
            print(f'WARN missing {pid}')
        return False

    def copy_to(self, dest_dir):
        os.makedirs(dest_dir, exist_ok=True)
        for pid in sorted(self.copy_ids):
            shutil.copyfile(os.path.join(self.src, pid + '.png'), os.path.join(dest_dir, pid + '.png'))


def export_char(name, char, scale, src, out):
    """Build the Godot doc for one character, copy its PNGs and write <out>/<name>.json."""
    source = Source(src)
    head = char.get('head') or {}
    doc_clips = {}
    for clip_name in sorted(char.get('clips') or {}):
        clip = char['clips'][clip_name]
        frames = []
        for fr in clip.get('frames') or []:
            pid = fr.get('id')
            if source.keep(pid):
                frames.append({'id': pid, 'neck': list(fr.get('neck', [0, 0])), 'angle': fr.get('angle', 'fwd')})
        if not frames:
            continue  # a clip with no surviving frames is removed
        doc_clips[clip_name] = {
            'view': clip.get('view', 'front'),
            'fps': clip.get('fps', 1),
            'loop': bool(clip.get('loop', False)),
            'hold': clip.get('hold', 0),
            'frames': frames,
        }

    doc_heads = {}
    for face in sorted(char.get('heads') or {}):
        kept = {}
        for angle in sorted(char['heads'][face]):
            pid = char['heads'][face][angle]
            if source.keep(pid):
                kept[angle] = pid
        if kept:
            doc_heads[face] = kept

    head_back = char.get('head_back') or ''
    if head_back and not source.keep(head_back):
        head_back = ''

    doc_busts = {}
    for face in sorted(char.get('busts') or {}):
        pid = char['busts'][face]
        if source.keep(pid):
            doc_busts[face] = pid

    doc = {
        'version': 1,
        'char': name,
        'scale': scale,
        'frame': size_pair(char.get('frame')),
        'head': {'size': size_pair(head), 'pivot': list(head.get('pivot', [0, 0]))},
        'bust': size_pair(char.get('bust')),
        'clips': doc_clips,
        'heads': doc_heads,
        'head_back': head_back,
        'busts': doc_busts,
    }

    source.copy_to(os.path.join(out, name))
    with open(os.path.join(out, name + '.json'), 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=1, sort_keys=True)
        f.write('\n')
    frames_total = sum(len(c['frames']) for c in doc_clips.values())
    print(f'EXPORTED {name} clips={len(doc_clips)} frames={frames_total} heads={len(doc_heads)} busts={len(doc_busts)}')


def export_customers(customers, source, out):
    """Write <out>/customers.json (only ids whose PNG exists) and copy those PNGs."""
    doc = {}
    for job in sorted(customers):
        entry = customers[job] or {}
        ids = [pid for pid in sorted(entry.get('ids') or []) if source.keep(pid)]
        doc[job] = {'variants': len(ids), 'w': entry.get('w'), 'h': entry.get('h'), 'ids': ids}
    source.copy_to(os.path.join(out, 'customers'))
    with open(os.path.join(out, 'customers.json'), 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=1, sort_keys=True)
        f.write('\n')
    files = sum(len(v['ids']) for v in doc.values())
    print(f'EXPORTED customers jobs={len(doc)} files={files}')


def run_export(src, out, which):
    manifest = load_manifest(src)
    if manifest is None:
        print(NO_SOURCE)
        return 3
    chars = manifest.get('characters') or {}
    scale = (manifest.get('scale') or {}).get('world', 1)
    names = CHARS if which == 'all' else [which]
    os.makedirs(out, exist_ok=True)
    for name in names:
        if name not in chars:
            if which != 'all':
                print(f'NO MANIFEST ENTRY: {name}')
                return 2
            print(f'WARN no manifest entry for {name}')
            continue
        export_char(name, chars[name], scale, src, out)
    customers = manifest.get('customers') or {}
    if customers:
        export_customers(customers, Source(src), out)
    return 0


def write_png(path, w, h, rgba):
    """Write a solid-colour RGBA PNG using only zlib and struct."""
    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF))
    pixel = bytes(rgba)
    raw = b''.join(b'\x00' + pixel * w for _ in range(h))
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)


def selftest():
    tmp = tempfile.mkdtemp(prefix='char_export_')
    try:
        src = os.path.join(tmp, 'src')
        out1 = os.path.join(tmp, 'out1')
        out2 = os.path.join(tmp, 'out2')
        os.makedirs(src)
        # talk_01 is deliberately NOT written: it must be dropped from the talk clip.
        present = ['mark_idle_00', 'mark_idle_01', 'mark_talk_00', 'mark_talk_02',
                   'mark_head_neutral_fwd', 'mark_head_talk_A_fwd', 'mark_head_blink_fwd',
                   'mark_head_back', 'mark_bust_neutral']
        for i, pid in enumerate(present):
            write_png(os.path.join(src, pid + '.png'), 4, 4, (i * 20, 100, 200, 255))

        manifest = {
            'version': 1,
            'scale': {'world': 2, 'bust': 2},
            'characters': {
                'mark': {
                    'frame': {'w': 144, 'h': 144},
                    'head': {'w': 80, 'h': 80, 'pivot': [40, 66]},
                    'clips': {
                        'idle': {'view': 'front', 'fps': 3, 'loop': True, 'hold': 0, 'frames': [
                            {'id': 'mark_idle_00', 'neck': [72, 75], 'angle': 'fwd'},
                            {'id': 'mark_idle_01', 'neck': [72, 76], 'angle': 'fwd'},
                        ]},
                        'talk': {'view': 'front', 'fps': 6, 'loop': True, 'hold': 2, 'frames': [
                            {'id': 'mark_talk_00', 'neck': [72, 75], 'angle': 'fwd'},
                            {'id': 'mark_talk_01', 'neck': [72, 75], 'angle': 'fwd'},
                            {'id': 'mark_talk_02', 'neck': [72, 75], 'angle': 'fwd'},
                        ]},
                    },
                    'heads': {
                        'neutral': {'fwd': 'mark_head_neutral_fwd'},
                        'talk_A': {'fwd': 'mark_head_talk_A_fwd'},
                        'blink': {'fwd': 'mark_head_blink_fwd'},
                    },
                    'head_back': 'mark_head_back',
                    'bust': {'w': 96, 'h': 96},
                    'busts': {'neutral': 'mark_bust_neutral'},
                },
            },
            'customers': {},
        }
        with open(os.path.join(src, 'manifest.json'), 'w', encoding='utf-8') as f:
            json.dump(manifest, f)

        failures = []

        def check(cond, msg):
            if not cond:
                failures.append(msg)

        run_export(src, out1, 'mark')
        mark_json = os.path.join(out1, 'mark.json')
        with open(mark_json, encoding='utf-8') as f:
            doc = json.load(f)
        check(len(doc['clips']['idle']['frames']) == 2, 'idle should keep 2 frames')
        check(len(doc['clips']['talk']['frames']) == 2, 'talk should keep 2 frames (one dropped)')
        check([fr['id'] for fr in doc['clips']['talk']['frames']] == ['mark_talk_00', 'mark_talk_02'],
              'talk should drop mark_talk_01 only')
        check(doc['frame'] == [144, 144], 'frame should be [144, 144]')
        check(doc['scale'] == 2, 'scale should be 2')
        check(doc['head']['pivot'] == [40, 66], 'head pivot should be [40, 66]')
        check(doc['heads']['neutral']['fwd'] == 'mark_head_neutral_fwd', 'heads.neutral.fwd missing')
        check(doc['head_back'] == 'mark_head_back', 'head_back missing')
        check(doc['busts'] == {'neutral': 'mark_bust_neutral'}, 'busts wrong')
        for pid in present:
            check(os.path.isfile(os.path.join(out1, 'mark', pid + '.png')), f'{pid}.png not copied')
        check(not os.path.exists(os.path.join(out1, 'mark', 'mark_talk_01.png')), 'missing png copied')
        check(not os.path.exists(os.path.join(out1, 'customers.json')), 'customers.json written without customers')

        with open(mark_json, 'rb') as f:
            first = f.read()
        run_export(src, out2, 'mark')
        with open(os.path.join(out2, 'mark.json'), 'rb') as f:
            second = f.read()
        check(first == second, 'second run is not byte-identical')

        for msg in failures:
            print(f'SELFTEST FAIL: {msg}')
        if failures:
            return 1
        print('CHAR EXPORT SELFTEST OK')
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main(argv):
    parser = argparse.ArgumentParser(description='Export character sprites and JSON to the Godot project.')
    parser.add_argument('--src', default='assets/art/characters')
    parser.add_argument('--out', default='godot/art/chars')
    parser.add_argument('--char', default='all', choices=['mark', 'dave', 'all'])
    parser.add_argument('--selftest', action='store_true')
    args = parser.parse_args(argv)
    if args.selftest:
        return selftest()
    return run_export(args.src, args.out, args.char)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
