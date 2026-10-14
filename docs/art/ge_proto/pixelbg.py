# GE reference prototype: pixel stage for room plates (becomes tools/art/pixelbg.py). Reuses tools/art/pixelate.py helpers.
# blender --background --python pixelbg.py -- <in.png> <out.png> <width> <colors> <dither>
import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), 'tools', 'art'))
import numpy as np, pixelate as P
a = sys.argv[sys.argv.index('--') + 1:]
src, out, width, colors, dither = a[0], a[1], int(a[2]), int(a[3]), float(a[4])
im = P.load_rgba(src); h, w = im.shape[:2]
oh = int(round(h * width / w))
rgb, alpha = P.downscale(im, width, oh)
op = alpha >= 0.5
cent = P.kmeans(rgb[op], colors, 16)
lab = P.nearest(P.apply_dither(rgb, dither)[op], cent)
res = np.zeros_like(rgb); res[op] = cent[lab]
al = np.where(op, 1.0, 0.0)
P.save_rgba(out, np.dstack((res, al[:, :, None])))
big = np.repeat(np.repeat(res, 2, 0), 2, 1); ba = np.repeat(np.repeat(al, 2, 0), 2, 1)
P.save_rgba(out[:-4] + '_x2.png', np.dstack((big, ba[:, :, None])))
print('PIXBG', res.shape[1], res.shape[0], len(np.unique((res[op]*1e4).round().astype(np.int64), axis=0)))
