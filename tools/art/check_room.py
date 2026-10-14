# Numeric checker for a room plate (card GE03). Lets cards test pictures without seeing them.
# blender --background --python-exit-code 1 --python tools/art/check_room.py -- <png> [--size 640x360] [--max-colors 128]
#     [--hole x,y,w,h] [--solid x,y,w,h] [--dark x,y,w,h,maxlum] [--bright x,y,w,h,minlum] [--calm x,y,w,h,maxstd]
#     [--warm x,y,w,h,min] [--cold x,y,w,h,min]
# Rectangles are SCREEN px (1280x720) and are scaled to the PNG size. luma is 0..255. warm = mean R - mean B, cold = mean B - mean R.
# Prints 'ROOM OK ...' (exit 0) or 'ROOM FAIL ...' plus 'ROOM REASONS ...' (exit 2).
# Bad or missing arguments print 'check_room: <reason>' and exit 2.
import os
import sys
import bpy
import numpy as np

CHECK_KINDS = ('--hole', '--solid', '--dark', '--bright', '--calm', '--warm', '--cold')
LIMIT_KINDS = ('--dark', '--bright', '--calm', '--warm', '--cold')
OPTION_KINDS = ('--size', '--max-colors')


def bad(reason):
    print('check_room: %s' % reason)
    sys.exit(2)


a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if not a or a[0].startswith('--'):
    bad('usage: check_room.py <png> [options]')
path = a[0]
if not os.path.isfile(path):
    bad('no such image: %s' % path)
opts = {'--size': '640x360', '--max-colors': '128'}
checks = []
i = 1
while i < len(a):
    k = a[i]
    if i + 1 >= len(a):
        bad('%s needs a value' % k)
    v = a[i + 1]
    if k in CHECK_KINDS:
        try:
            values = [float(t) for t in v.split(',')]
        except ValueError:
            bad('%s wants numbers, got %r' % (k, v))
        need = 5 if k in LIMIT_KINDS else 4
        if len(values) != need:
            bad('%s wants %d numbers, got %r' % (k, need, v))
        checks.append((k[2:], values))
    elif k in OPTION_KINDS:
        opts[k] = v
    else:
        bad('unknown argument %s' % k)
    i += 2

im = bpy.data.images.load(path)
im.colorspace_settings.name = 'Non-Color'
w, h = im.size
px = np.array(im.pixels[:], dtype=np.float64).reshape(h, w, 4)[::-1]
rgb = np.clip(px[:, :, :3], 0, 1) * 255.0
al = px[:, :, 3]
fail = []
ew, eh = [int(t) for t in opts['--size'].split('x')]
if (w, h) != (ew, eh):
    fail.append('size %dx%d want %dx%d' % (w, h, ew, eh))
op = al >= 0.5
if not np.all((al < 0.01) | (al > 0.99)):
    fail.append('alpha not 0/1')
ncol = len(np.unique((rgb[op] / 4).astype(np.int64), axis=0)) if op.any() else 0   # quantised, tolerant of float rounding
if ncol > int(opts['--max-colors']):
    fail.append('colors %d > %s' % (ncol, opts['--max-colors']))
sx, sy = w / 1280.0, h / 720.0
luma = rgb @ np.array([0.2126, 0.7152, 0.0722])
out = []
for kind, v in checks:
    x0, y0, rw, rh = int(v[0] * sx), int(v[1] * sy), max(1, int(v[2] * sx)), max(1, int(v[3] * sy))
    sl = (slice(y0, y0 + rh), slice(x0, x0 + rw))
    if al[sl].size == 0:
        bad('region %s is outside the %dx%d image' % (v[:4], w, h))
    if kind == 'solid':
        m = float(al[sl].min())
        out.append('solid=%.2f' % m)
        if m < 0.99:
            fail.append('solid region has holes %s' % v)
        continue
    if kind == 'hole':
        m = float(al[sl].max())
        out.append('hole=%.2f' % m)
        if m > 0.01:
            fail.append('hole not transparent %s' % v)
        continue
    lm, rr, bb = float(luma[sl].mean()), float(rgb[sl][..., 0].mean()), float(rgb[sl][..., 2].mean())
    sd = float(luma[sl].std())
    lim = v[4]
    out.append('%s lum=%.0f std=%.1f r-b=%.0f' % (kind, lm, sd, rr - bb))
    if kind == 'dark' and lm > lim: fail.append('dark region lum %.0f > %.0f' % (lm, lim))
    if kind == 'bright' and lm < lim: fail.append('bright region lum %.0f < %.0f' % (lm, lim))
    if kind == 'calm' and sd > lim: fail.append('calm region std %.1f > %.1f' % (sd, lim))
    if kind == 'warm' and rr - bb < lim: fail.append('warm region r-b %.0f < %.0f' % (rr - bb, lim))
    if kind == 'cold' and bb - rr < lim: fail.append('cold region b-r %.0f < %.0f' % (bb - rr, lim))
print('ROOM %s size=%dx%d colors=%d %s' % ('FAIL' if fail else 'OK', w, h, ncol, ' | '.join(out)))
if fail:
    print('ROOM REASONS ' + '; '.join(fail))
    sys.exit(2)
