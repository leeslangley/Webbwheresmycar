#!/usr/bin/env python3
"""Pose library for the GC characters (python3 standard library only, no bpy).

Usage:
  python3 tools/art/poselib.py check <poses.json>
  python3 tools/art/poselib.py selftest

Joint conventions (docs/art/GC.md):
- root is [dx, dy, dz] in units; every other joint is [rx, ry, rz] in degrees.
- L is the -X side of the world, R the +X side (front view: L is screen-left).
- chest and head: positive rx leans or nods FORWARD (toward -Y, the front camera).
- shoulder, elbow, wrist, hip, knee (limbs hanging down): negative rx swings forward.
- shoulder ry positive swings the arm toward -X (outward for L, inward for R).
- head ry positive tilts the top toward +X.
- head rz positive turns the nose toward +X.
"""
import json
import math
import os
import sys

JOINTS = ['root', 'tilt', 'chest', 'head',
          'shoulder_L', 'shoulder_R', 'elbow_L', 'elbow_R',
          'wrist_L', 'wrist_R', 'hip_L', 'hip_R', 'knee_L', 'knee_R']
HANDS = ['relaxed', 'open', 'fist', 'point', 'thumbs', 'flat', 'phone', 'spread', 'grip']
PROPS = ['none', 'mug', 'phone', 'paper', 'spanner']
NAME_FIELDS = ['hand_L', 'hand_R', 'prop_L', 'prop_R', 'face']
VIEWS = ('front', 'back')

HEAD_ANGLES = {
    'fwd': [0, 0, 0],
    'tilt_l': [0, -10, 0],
    'tilt_r': [0, 10, 0],
    'down': [20, 0, 0],
    'up': [-14, 0, 0],
    'turn_l': [0, 0, -30],
    'turn_r': [0, 0, 30],
}


def _axes(lo, hi):
    return [[lo, hi], [lo, hi], [lo, hi]]


LIMITS = {
    'root': _axes(-0.3, 0.3),
    'tilt': _axes(-15, 15),
    'chest': _axes(-35, 35),
    'head': _axes(-40, 40),
    'shoulder_L': [[-180, 180], [-180, 180], [-90, 90]],
    'shoulder_R': [[-180, 180], [-180, 180], [-90, 90]],
    'elbow_L': [[-150, 5], [-20, 20], [-20, 20]],
    'elbow_R': [[-150, 5], [-20, 20], [-20, 20]],
    'wrist_L': _axes(-70, 70),
    'wrist_R': _axes(-70, 70),
    'hip_L': [[-120, 30], [-40, 40], [-30, 30]],
    'hip_R': [[-120, 30], [-40, 40], [-30, 30]],
    'knee_L': [[-5, 150], [-10, 10], [-10, 10]],
    'knee_R': [[-5, 150], [-10, 10], [-10, 10]],
}

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXPRESSIONS_PATH = os.path.join(_ROOT, 'docs', 'characters', 'expressions.json')


def _is_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def merge_defaults(defaults, frame):
    """Return a new full frame: frame values override defaults; missing joints
    take the default value or [0,0,0]; name fields are copied when present."""
    out = {}
    for j in JOINTS:
        if j in frame:
            out[j] = list(frame[j])
        elif j in defaults:
            out[j] = list(defaults[j])
        else:
            out[j] = [0, 0, 0]
    for n in NAME_FIELDS:
        if n in frame:
            out[n] = frame[n]
        elif n in defaults:
            out[n] = defaults[n]
    return out


def smooth(u):
    return u * u * (3 - 2 * u)


def _copy_frame(frame):
    out = {j: list(frame[j]) for j in JOINTS}
    for n in NAME_FIELDS:
        if n in frame:
            out[n] = frame[n]
    return out


def _blend(a, b, t):
    """Numeric joints interpolate with weight t; name fields take the earlier key a."""
    out = {j: [a[j][c] + (b[j][c] - a[j][c]) * t for c in range(3)] for j in JOINTS}
    for n in NAME_FIELDS:
        if n in a:
            out[n] = a[n]
    return out


def expand_clip(clip, defaults):
    """Expand a clip of key poses into clip['frames'] full per-frame poses.

    Key i sits at i*(N-1)/(K-1) for a non-looping clip and at i*N/K for a
    looping clip, where the last frames interpolate back toward key 0.
    K == 1 repeats the key N times.
    """
    n = int(clip['frames'])
    keys = [merge_defaults(defaults, k) for k in clip['keys']]
    count = len(keys)
    if n < 1:
        return []
    if count == 1:
        return [_copy_frame(keys[0]) for _ in range(n)]
    if clip.get('loop'):
        seg_keys = keys + [keys[0]]
        seg_pos = [i * n / count for i in range(count)] + [float(n)]
    else:
        seg_keys = keys
        seg_pos = [i * (n - 1) / (count - 1) for i in range(count)]
    out = []
    for f in range(n):
        s = 0
        for i, p in enumerate(seg_pos):
            if p <= f:
                s = i
        if s >= len(seg_keys) - 1:
            out.append(_copy_frame(seg_keys[-1]))
            continue
        u = (f - seg_pos[s]) / (seg_pos[s + 1] - seg_pos[s])
        out.append(_blend(seg_keys[s], seg_keys[s + 1], smooth(u)))
    return out


def head_angle(rot, view):
    """Name of the HEAD_ANGLES entry nearest to a head rotation."""
    if view == 'back':
        return 'back'
    rx, ry, rz = rot
    if rz >= 20:
        return 'turn_r'
    if rz <= -20:
        return 'turn_l'
    if rx >= 12:
        return 'down'
    if rx <= -10:
        return 'up'
    if ry >= 5:
        return 'tilt_r'
    if ry <= -5:
        return 'tilt_l'
    return 'fwd'


def _check_frame(frame, face_names, where):
    errors = []
    for key, val in frame.items():
        here = '%s.%s' % (where, key)
        if key in LIMITS:
            if not isinstance(val, list) or len(val) != 3 or not all(_is_number(x) for x in val):
                errors.append('%s: needs 3 numbers' % here)
                continue
            for c, x in enumerate(val):
                lo, hi = LIMITS[key][c]
                if not lo <= x <= hi:
                    errors.append('%s[%d]=%s outside %s..%s' % (here, c, x, lo, hi))
        elif key in ('hand_L', 'hand_R'):
            if val not in HANDS:
                errors.append('%s: unknown hand %r' % (here, val))
        elif key in ('prop_L', 'prop_R'):
            if val not in PROPS:
                errors.append('%s: unknown prop %r' % (here, val))
        elif key == 'face':
            if val not in face_names:
                errors.append('%s: unknown face %r' % (here, val))
        else:
            errors.append('%s: unknown joint or field' % here)
    return errors


def _check_clip(clip, face_names, where):
    if not isinstance(clip, dict):
        return ['%s: must be an object' % where]
    errors = []
    fps = clip.get('fps')
    if not _is_int(fps) or not 1 <= fps <= 30:
        errors.append('%s.fps: must be an int 1..30' % where)
    if not isinstance(clip.get('loop'), bool):
        errors.append('%s.loop: must be true or false' % where)
    hold = clip.get('hold')
    if not _is_number(hold) or hold < 0:
        errors.append('%s.hold: must be a number >= 0' % where)
    frames = clip.get('frames')
    if not _is_int(frames) or not 1 <= frames <= 16:
        errors.append('%s.frames: must be an int 1..16' % where)
    keys = clip.get('keys')
    if not isinstance(keys, list) or not keys:
        errors.append('%s.keys: must be a non-empty list' % where)
    else:
        for i, key in enumerate(keys):
            kwhere = '%s.keys[%d]' % (where, i)
            if not isinstance(key, dict):
                errors.append('%s: must be an object' % kwhere)
            else:
                errors.extend(_check_frame(key, face_names, kwhere))
    return errors


def validate_pose_file(doc, face_names):
    """Return a list of error strings; an empty list means the file is fine."""
    if not isinstance(doc, dict):
        return ['document: must be a JSON object']
    errors = []
    character = doc.get('character')
    if not isinstance(character, str) or not character:
        errors.append('character: must be a non-empty string')
    if doc.get('view') not in VIEWS:
        errors.append("view: must be 'front' or 'back'")
    defaults = doc.get('defaults')
    if not isinstance(defaults, dict):
        errors.append('defaults: must be a frame object')
    else:
        errors.extend(_check_frame(defaults, face_names, 'defaults'))
    clips = doc.get('clips')
    if not isinstance(clips, dict):
        errors.append('clips: must be an object')
        return errors
    for name, clip in clips.items():
        errors.extend(_check_clip(clip, face_names, 'clips.%s' % name))
    return errors


def _load_face_names():
    with open(EXPRESSIONS_PATH) as fh:
        return list(json.load(fh)['faces'].keys())


def cmd_check(path):
    try:
        with open(path) as fh:
            doc = json.load(fh)
    except (OSError, ValueError) as exc:
        print('cannot read %s: %s' % (path, exc))
        return 2
    try:
        face_names = _load_face_names()
    except (OSError, ValueError, KeyError) as exc:
        print('cannot load %s: %s' % (EXPRESSIONS_PATH, exc))
        return 2
    errors = validate_pose_file(doc, face_names)
    if errors:
        for err in errors:
            print(err)
        return 2
    clips = doc['clips']
    frames = sum(int(c['frames']) for c in clips.values())
    print('POSES OK clips=%d frames=%d' % (len(clips), frames))
    return 0


def _expect(cond, msg):
    if not cond:
        raise AssertionError(msg)


def selftest():
    # Looping clip: key 1 sits at position 2; frames 1 and 3 are halfway.
    loop_clip = {'fps': 8, 'loop': True, 'hold': 0, 'frames': 4,
                 'keys': [{'root': [0, 0, 0]}, {'root': [0, 0, 0.02]}]}
    dz = [round(f['root'][2], 6) for f in expand_clip(loop_clip, {})]
    _expect(dz == [0, 0.01, 0.02, 0.01], 'looping root dz %r' % dz)

    # Non-looping clip: frame 0 is key 0, frame 2 is key 1, frame 1 halfway.
    flat_clip = {'fps': 8, 'loop': False, 'hold': 0, 'frames': 3,
                 'keys': [{'root': [0, 0, 0]}, {'root': [0, 0, 0.02]}]}
    frames = expand_clip(flat_clip, {})
    _expect(frames[0]['root'] == [0, 0, 0], 'frame 0 is not key 0')
    _expect(frames[2]['root'] == [0, 0, 0.02], 'frame 2 is not key 1')
    _expect(round(frames[1]['root'][2], 6) == 0.01, 'middle frame not halfway')

    # Name fields step: they take the value of the earlier key.
    step_clip = {'fps': 8, 'loop': False, 'hold': 0, 'frames': 3,
                 'keys': [{'hand_L': 'relaxed'}, {'hand_L': 'fist'}]}
    names = [f['hand_L'] for f in expand_clip(step_clip, {})]
    _expect(names == ['relaxed', 'relaxed', 'fist'], 'hand_L steps %r' % names)

    _expect(head_angle([25, 0, 0], 'front') == 'down', 'head down')
    _expect(head_angle([0, 0, 25], 'front') == 'turn_r', 'head turn_r')
    _expect(head_angle([0, 0, 0], 'back') == 'back', 'head back')

    good = {'character': 'mark', 'view': 'front', 'defaults': {'root': [0, 0, 0]},
            'clips': {'idle': {'fps': 3, 'loop': True, 'hold': 0.5, 'frames': 6,
                               'keys': [{'head': [25, 0, 0], 'face': 'neutral', 'hand_L': 'relaxed'}]}}}
    _expect(validate_pose_file(good, ['neutral']) == [], 'good file rejected')
    bad = json.loads(json.dumps(good))
    bad['clips']['idle']['keys'][0]['elbow_L'] = [-200, 0, 0]
    _expect(validate_pose_file(bad, ['neutral']) != [], 'out-of-limit elbow accepted')

    print('POSELIB OK')
    return 0


def main(argv):
    if len(argv) == 2 and argv[1] == 'selftest':
        return selftest()
    if len(argv) == 3 and argv[1] == 'check':
        return cmd_check(argv[2])
    print('usage: poselib.py check <poses.json> | selftest', file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
