# usage: python3 tools/sprites/add_anim.py <hd_name.json> [anim_name] [--flip]
# Merges a cut animation (from strip.py or grid.py) into js/data/sprites_<fighter>.js.
# anim_name defaults to the file name without "hd_" and ".json" (hd_rift_run.json -> rift_run).
# Replaces the animation if it already exists. Run from the repo root.
import sys, os, json, io, base64
import numpy as np
from PIL import Image

args = [a for a in sys.argv[1:] if not a.startswith('--')]
flip = '--flip' in sys.argv
src = args[0]
name = args[1] if len(args) > 1 else os.path.basename(src)[:-5].removeprefix('hd_')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'js', 'data')
# sprite data is split per fighter: rift_* -> sprites_rift.js, jacob_* -> sprites_jacob.js, everything else -> sprites_vish.js
group = 'rift' if name.startswith('rift_') else 'jacob' if name.startswith('jacob_') else 'vish'
DATA = os.path.join(DATA_DIR, f'sprites_{group}.js')
text = open(DATA).read()
pre, post = 'Object.assign(SPR,', ');\n'
assert text.startswith(pre), 'unexpected sprites file format'
spr = json.loads(text[len(pre):].rstrip().rstrip(';').rstrip(')'))

frames = json.load(open(src))
for f in frames:
    if flip: f['flip'] = 1
    # head/neck point, used by throat grabs to line up the held fighter
    a = np.array(Image.open(io.BytesIO(base64.b64decode(f['src'].split(',')[1]))).convert('RGBA'))[..., 3] > 100
    ys, xs = np.where(a)
    if not len(ys): continue
    K = f.get('k', 0.0188); y0 = ys.min()
    band = a[y0:y0 + max(4, int(0.3 / K))]
    f['hx'] = round(float(np.where(band.any(0))[0].mean()), 1)
    f['hy'] = round(float(y0 + 0.33 / K), 1)

existed = name in spr
spr[name] = frames
open(DATA, 'w').write(pre + json.dumps(spr, separators=(',', ':')) + post)
print(('replaced' if existed else 'added'), name, len(frames), 'frames')
