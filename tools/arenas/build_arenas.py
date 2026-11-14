"""Build Deadbrawl's knock-into arenas in Blender and export them as .glb.

    python3 tools/arenas/build_arenas.py          (uses the bpy module = headless Blender)

Coordinates (Blender): X = along the fight line, Y = depth (+ is away from the camera), Z = up.
Fighters stand on Z=0 along Y=0 between X=-8.2 and 8.2; the camera sits around Y=-10, Z=2.
glTF converts this to the game's Y-up space (game z = -Y).

Everything is plain boxes/cylinders with per-vertex colours, merged into a few meshes:
  SOLID  -> toon shaded with outlines in the game (like the colosseum)
  GLOW   -> unlit, full brightness (lamps, neon, lit windows, fire)
  BEAM   -> unlit, additive and see-through (spotlight shafts)
Colours are written as the exact display colour (the game renders in linear space with hex colours).
"""
import bpy, bmesh, math, random, os, sys
from mathutils import Matrix, Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets')

def hexc(h, j=0.0):
    r, g, b = ((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255
    if j:
        k = 1 + (random.random() - 0.5) * 2 * j
        r, g, b = min(1, r * k), min(1, g * k), min(1, b * k)
    return (r, g, b, 1.0)

class Scene:
    def __init__(self):
        self.bm = {k: bmesh.new() for k in ('SOLID', 'GLOW', 'BEAM')}
        self.col = {k: v.loops.layers.float_color.new('Col') for k, v in self.bm.items()}

    def _paint(self, kind, res, col, top=None):
        """colour exactly the faces of the shape just created (res = the bmesh op result)"""
        lay = self.col[kind]
        faces = {f for v in res['verts'] for f in v.link_faces}
        for f in faces:
            for l in f.loops:
                c = col
                if top is not None and l.vert.co.z > top[0]:
                    c = top[1]
                l[lay] = c

    def box(self, c, x0, x1, y0, y1, z0, z1, kind='SOLID', j=0.04, rz=0.0, top=None):
        bm = self.bm[kind]
        cx, cy, cz = (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2
        M = Matrix.Translation((cx, cy, cz)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Diagonal((x1 - x0, y1 - y0, z1 - z0, 1))
        res = bmesh.ops.create_cube(bm, size=1.0, matrix=M)
        self._paint(kind, res, hexc(c, j), (cz + (z1 - z0) / 2 - 1e-4, hexc(top, j)) if top else None)

    def obox(self, c, cx, cy, cz, sx, sy, sz, rot=(0, 0, 0), kind='SOLID', j=0.04):
        """box by centre/size with an arbitrary rotation (radians, XYZ)"""
        bm = self.bm[kind]
        R = Matrix.Rotation(rot[2], 4, 'Z') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[0], 4, 'X')
        M = Matrix.Translation((cx, cy, cz)) @ R @ Matrix.Diagonal((sx, sy, sz, 1))
        res = bmesh.ops.create_cube(bm, size=1.0, matrix=M)
        self._paint(kind, res, hexc(c, j))

    def cyl(self, c, x, y, z0, z1, r0, r1=None, seg=10, kind='SOLID', j=0.03):
        """vertical cylinder / cone from z0 to z1"""
        bm = self.bm[kind]
        h = z1 - z0
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r0 if r1 is None else r1, depth=h,
                              matrix=Matrix.Translation((x, y, z0 + h / 2)))
        self._paint(kind, res, hexc(c, j))

    def rod(self, c, a, b, r, seg=6, kind='SOLID', j=0.02):
        """cylinder between two points"""
        bm = self.bm[kind]
        a, b = Vector(a), Vector(b); d = b - a; L = d.length
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=L, matrix=M)
        self._paint(kind, res, hexc(c, j))

    def quad(self, cols, p00, p10, p11, p01, kind='SOLID'):
        """single quad with a colour per corner (for gradients like skies)"""
        bm = self.bm[kind]; lay = self.col[kind]
        vs = [bm.verts.new(p) for p in (p00, p10, p11, p01)]
        f = bm.faces.new(vs)
        for l, c in zip(f.loops, cols):
            l[lay] = hexc(c)

    def export(self, name):
        for o in list(bpy.data.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        for kind, bm in self.bm.items():
            if not bm.faces:
                continue
            me = bpy.data.meshes.new(kind)
            bm.to_mesh(me); bm.free()
            mat = bpy.data.materials.new(kind)
            me.materials.append(mat)
            ob = bpy.data.objects.new(kind, me)
            bpy.context.scene.collection.objects.link(ob)
            me.color_attributes.active_color = me.color_attributes['Col']
        path = os.path.abspath(os.path.join(OUT, name))
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_vertex_color='ACTIVE',
                                  export_normals=True, export_texcoords=False, export_materials='EXPORT', export_yup=True)
        print('wrote', path, os.path.getsize(path))
        pack(path)

def pack(glb):
    """also write the .glb as base64 in js/data/ (the published game page can't serve .glb files)"""
    import base64
    key = os.path.basename(glb)[len('arena_'):-len('.glb')]
    js = os.path.abspath(os.path.join(OUT, '..', 'js', 'data', 'arena_' + key + '.js'))
    with open(glb, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    with open(js, 'w') as f:
        f.write('window.ARENA_GLB=window.ARENA_GLB||{};ARENA_GLB.%s="%s";\n' % (key, b64))
    print('wrote', js, os.path.getsize(js))

# ------------------------------------------------------------------ THE RING
def build_ring():
    random.seed(7); S = Scene()
    # arena floor, below the raised ring
    S.box(0x22121a, -34, 34, -16, 44, -1.4, -1.2, j=0)
    for i in range(-3, 4):  # aisles of red carpet toward the ring
        S.box(0x5a141c, i * 9 - 1.2, i * 9 + 1.2, 5, 30, -1.2, -1.19, j=0.02)
    # ring platform: canvas top brighter in the middle (spotlight pool), red skirt, gold trim
    N = 12
    for ix in range(N):
        for iy in range(5):
            x0 = -10.8 + 21.6 * ix / N; x1 = -10.8 + 21.6 * (ix + 1) / N
            y0 = -4.2 + 7.6 * iy / 5; y1 = -4.2 + 7.6 * (iy + 1) / 5
            dx = ((x0 + x1) / 2) / 10.8; dy = ((y0 + y1) / 2 + 0.4) / 3.8
            k = max(0, 1 - (dx * dx + dy * dy) * 0.55)
            c = int(0x6a + 0x30 * k) << 16 | int(0x5a + 0x26 * k) << 8 | int(0x48 + 0x1c * k)
            S.box(c, x0, x1, y0, y1, -0.05, 0.0, j=0.0)
    S.box(0x8a1820, -10.8, 10.8, -4.2, 3.4, -1.2, -0.05, j=0.01)
    S.box(0xc8962e, -10.85, 10.85, -4.25, 3.45, -0.32, -0.12, j=0.0)
    S.cyl(0x6a1418, 0, -0.4, 0.0, 0.012, 2.6, seg=32, j=0)   # centre logo
    S.cyl(0xc8962e, 0, -0.4, 0.012, 0.02, 2.0, seg=32, j=0)
    S.cyl(0x8a1820, 0, -0.4, 0.02, 0.025, 1.5, seg=32, j=0)
    # posts, pads, ropes (no ropes on the camera side so they never cover the fighters)
    posts = [(-10.6, -4.0), (10.6, -4.0), (-10.6, 3.2), (10.6, 3.2)]
    for i, (x, y) in enumerate(posts):
        S.cyl(0x2e2228, x, y, -1.2, 2.0, 0.17, seg=10)
        S.box(0xb02028 if i % 3 == 0 else 0x2a3a8a, x - 0.25, x + 0.25, y - 0.25, y + 0.25, 0.3, 1.75, j=0.02)
    for k, z in enumerate((0.55, 1.05, 1.55)):
        rc = 0xd8d0c0 if k == 1 else 0xb01c26
        S.rod(rc, (-10.6, 3.2, z), (10.6, 3.2, z), 0.055)
        for sx in (-10.6, 10.6):
            S.rod(rc, (sx, -4.0, z), (sx, 3.2, z), 0.055)
    # ring steps and stools in the corners
    for sx in (-1, 1):
        for st in range(3):
            S.box(0x3a2a2e, sx * 11.0 - 0.6, sx * 11.0 + 0.6, 3.6 + st * 0.5, 4.1 + st * 0.5, -1.2, -0.3 - st * 0.3)
        S.cyl(0x3a2a2e, sx * 12.2, -3.6, -1.2, -0.6, 0.35, seg=10)
    # barrier with glowing ad boards
    S.box(0x3a1a20, -30, 30, 6.4, 6.8, -1.2, 0.1, top=0xc8962e)
    for i in range(-6, 6):
        S.box(0xff9a3a if i % 2 else 0xd8323a, i * 5 + 0.3, i * 5 + 4.7, 6.35, 6.4, -1.0, -0.15, kind='GLOW', j=0.05)
    # tiered stands full of crowd silhouettes, behind and to the sides
    for k in range(9):
        y0 = 7.5 + k * 1.7; zt = -1.2 + 0.7 + k * 0.95
        S.box(0x2a161c, -32, 32, y0, y0 + 1.7, -1.2, zt, j=0.02)
        x = -31.0
        while x < 31:
            x += 0.55 + random.random() * 0.35
            if random.random() < 0.12:
                continue
            sh = random.choice([0x4a2a30, 0x5a3036, 0x3a2430, 0x6a3a2e, 0x7a2a2a, 0x8a5a3a, 0x3a3044])
            hgt = 0.75 + random.random() * 0.2
            S.box(sh, x - 0.2, x + 0.2, y0 + 0.5, y0 + 0.9, zt, zt + hgt, j=0.1)
            S.box(0x6a4a3a, x - 0.13, x + 0.13, y0 + 0.55, y0 + 0.85, zt + hgt, zt + hgt + 0.3, j=0.12)
            if random.random() < 0.05:   # camera flashes / phone screens in the crowd
                S.box(0xfff0c0, x - 0.06, x + 0.06, y0 + 0.45, y0 + 0.5, zt + hgt + 0.1, zt + hgt + 0.22, kind='GLOW', j=0)
    for sx in (-1, 1):  # side stands
        for k in range(7):
            x0 = sx * (17 + k * 1.7); zt = -1.2 + 0.7 + k * 0.95
            S.box(0x2a161c, min(x0, x0 + sx * 1.7), max(x0, x0 + sx * 1.7), -14, 7.5, -1.2, zt)
            y = -14.0
            while y < 7:
                y += 0.6 + random.random() * 0.4
                if random.random() < 0.15:
                    continue
                xc = x0 + sx * 0.85
                sh = random.choice([0x4a2a30, 0x5a3036, 0x3a2430, 0x6a3a2e, 0x7a2a2a])
                S.box(sh, xc - 0.2, xc + 0.2, y - 0.2, y + 0.2, zt, zt + 0.8, j=0.1)
                S.box(0x6a4a3a, xc - 0.13, xc + 0.13, y - 0.13, y + 0.13, zt + 0.8, zt + 1.1, j=0.12)
    # back wall + hanging banners
    S.box(0x1a0c10, -40, 40, 24, 25, -1.2, 22, j=0)
    for i in range(-5, 6):
        S.box(0x8a1820 if i % 2 else 0xb08a3a, i * 6 - 1, i * 6 + 1, 23.8, 24, 10, 17, j=0.03)
    # lighting rig over the ring: truss, lamps, light shafts
    tz = 8.6
    for (a, b) in [((-11, -4.4), (11, -4.4)), ((-11, 3.6), (11, 3.6)), ((-11, -4.4), (-11, 3.6)), ((11, -4.4), (11, 3.6))]:
        S.rod(0x3a3036, (a[0], a[1], tz), (b[0], b[1], tz), 0.16, seg=6)
        S.rod(0x3a3036, (a[0], a[1], tz + 0.7), (b[0], b[1], tz + 0.7), 0.12, seg=6)
    for x in (-7.5, -2.5, 2.5, 7.5):
        for y in (-4.4, 3.6):
            S.cyl(0x2a2226, x, y, tz - 0.7, tz, 0.35, 0.25, seg=10)
            S.cyl(0xffe2a0, x, y, tz - 0.75, tz - 0.68, 0.32, seg=12, kind='GLOW', j=0)
            S.cyl(0x40301a, x, y * 0.4, 0.0, tz - 0.75, 2.2, 0.32, seg=16, kind='BEAM', j=0)
    for x in (-9, 9):  # cables up into the dark
        S.rod(0x221a1e, (x, 0, tz + 0.7), (x * 0.6, 2, 26), 0.05)
    # scoreboard
    S.box(0x1a1216, -4, 4, 9.5, 10.2, 10.5, 14.2, j=0)
    S.box(0xff6a2a, -3.6, 3.6, 9.45, 9.5, 10.9, 13.8, kind='GLOW', j=0)
    S.box(0x2a0a0a, -3.2, -0.3, 9.4, 9.45, 11.4, 13.3, kind='GLOW', j=0)
    S.box(0x2a0a0a, 0.3, 3.2, 9.4, 9.45, 11.4, 13.3, kind='GLOW', j=0)
    S.export('arena_ring.glb')

# ------------------------------------------------------------------ BACK ALLEY
def build_alley():
    random.seed(11); S = Scene()
    for ix in range(-17, 17):  # asphalt, slightly patchy
        for iy in range(-8, 16):
            S.box(random.choice([0x3e3648, 0x443a4e, 0x3a3244, 0x483e56]), ix * 2, ix * 2 + 2, iy * 2, iy * 2 + 2, -0.3, 0.0, j=0.03)
    for (x, y, r) in [(-5, -1.5, 1.4), (3.5, 1.5, 1.0), (9, -2.5, 1.6), (-12, 2, 1.2), (14, 0.5, 0.9)]:  # puddles catching the neon
        S.cyl(0x5a3a7a, x, y, 0.0, 0.01, r, seg=20, j=0.05)
        S.cyl(0x8a4aa0, x + 0.2, y, 0.01, 0.015, r * 0.5, seg=16, j=0.05)
    # building facades across the back, with lit / dark windows
    x = -34.0
    while x < 34:
        w = 6 + random.random() * 5; h = 9 + random.random() * 13; y0 = 8 + random.random() * 2
        if -4 < x + w / 2 < 4:     # leave a gap down the middle: the street continues
            x += w; continue
        col = random.choice([0x4a2a2e, 0x3e2630, 0x3a2a40, 0x52302c])
        S.box(col, x, x + w, y0, y0 + 7, 0, h, j=0.03)
        S.box(0x2a1c24, x - 0.1, x + w + 0.1, y0 - 0.15, y0 + 0.2, h - 0.5, h, j=0)   # roof ledge
        for fz in range(1, int(h / 2.6)):
            for fx in range(int(w / 1.8)):
                wx = x + 0.7 + fx * 1.8; wz = 1.2 + fz * 2.6
                if wx + 0.9 > x + w:
                    continue
                if random.random() < 0.3:
                    c = random.choice([0xff3aa0, 0xffa050, 0xb060ff, 0xffd080])
                    S.box(c, wx, wx + 0.9, y0 - 0.06, y0, wz, wz + 1.3, kind='GLOW', j=0.08)
                else:
                    S.box(0x1a1420, wx, wx + 0.9, y0 - 0.06, y0, wz, wz + 1.3, j=0.05)
        if random.random() < 0.6:  # fire escape
            fx0 = x + 1; fx1 = x + min(w - 1, 4.5)
            for fz in (3.6, 6.2, 8.8):
                if fz > h - 1:
                    break
                S.box(0x2a2228, fx0, fx1, y0 - 1.3, y0, fz, fz + 0.1, j=0)
                S.rod(0x2a2228, (fx0, y0 - 1.3, fz + 0.9), (fx1, y0 - 1.3, fz + 0.9), 0.04)
                for bx in range(int((fx1 - fx0) / 0.5) + 1):
                    S.rod(0x2a2228, (fx0 + bx * 0.5, y0 - 1.3, fz), (fx0 + bx * 0.5, y0 - 1.3, fz + 0.9), 0.025)
                S.obox(0x2a2228, (fx0 + fx1) / 2, y0 - 0.7, fz - 1.3, 0.8, 0.9, 0.08, rot=(0, 0.75, 0))
        if random.random() < 0.5:  # drain pipe
            px = x + w - 0.4
            S.cyl(0x3a3036, px, y0 - 0.2, 0, h, 0.12, seg=8)
        x += w
    # the street continuing through the gap, lit at the far end
    S.box(0x26202c, -4, 4, 8, 40, -0.3, 0.0, j=0.02)
    for sx in (-1, 1):
        for k in range(4):
            yy = 16 + k * 6
            S.box(random.choice([0x3a2a40, 0x4a2a2e]), sx * 4, sx * 9, yy, yy + 5, 0, 10 + random.random() * 10, j=0.04)
            for fz in range(1, 6):
                if random.random() < 0.4:
                    S.box(random.choice([0xff3aa0, 0xb060ff, 0xffa050]), sx * 4 - sx * 0.05, sx * 4, yy + 1, yy + 2.2, fz * 2, fz * 2 + 1.2, kind='GLOW')
    S.quad([0x8a2a6a, 0x8a2a6a, 0x1a0a24, 0x1a0a24], (-40, 46, -1), (40, 46, -1), (40, 46, 40), (-40, 46, 40), kind='GLOW')
    # side walls receding toward the camera
    for sx in (-1, 1):
        S.box(0x3a2430, sx * 19, sx * 26, -16, 8, 0, 16, j=0.03)
        for k in range(3):
            wy = -1 + k * 3.4
            lit = random.random() < 0.35
            S.box(random.choice([0xff3aa0, 0xffa050]) if lit else 0x1a1420, sx * 19 - sx * 0.06, sx * 19, wy, wy + 1.2, 3, 4.6, kind='GLOW' if lit else 'SOLID')
    # chain-link fence across the street gap
    for xx in (-4, -1.3, 1.3, 4):
        S.cyl(0x3a3640, xx, 9, 0, 3.4, 0.07, seg=6)
    S.rod(0x3a3640, (-4, 9, 3.4), (4, 9, 3.4), 0.05)
    for k in range(17):
        a = -4 + k * 0.5
        S.rod(0x4a4652, (a, 9, 0), (min(4, a + 3.4), 9, min(3.4, (4 - a))), 0.012, seg=4)
        S.rod(0x4a4652, (a, 9, 0), (max(-4, a - 3.4), 9, min(3.4, a + 4)), 0.012, seg=4)
    # dumpster, trash, boxes
    # left limit: a big dumpster parked across the alley, bags piled against it
    S.box(0x3a7a5a, -15.2, -12.2, -2.4, 2.6, 0.25, 2.3, top=0x2a5a44)
    S.box(0x1c3026, -15.3, -12.1, -2.5, 2.7, 2.3, 2.42, j=0)
    S.obox(0x24402f, -13.9, 0.1, 2.75, 3.0, 5.0, 0.1, rot=(0, 0.32, 0), j=0)      # lid propped open
    for wy in (-2.0, 2.2):
        S.cyl(0x111111, -14.6, wy, 0, 0.28, 0.2, seg=8); S.cyl(0x111111, -12.8, wy, 0, 0.28, 0.2, seg=8)
    for (gx, gy, gr) in [(-11.9, 1.9, 0.5), (-11.7, -1.8, 0.45), (-12.0, 2.9, 0.4)]:
        S.cyl(0x1a1a22, gx, gy, 0, gr * 1.3, gr, gr * 0.5, seg=8, j=0.1)
    # right limit: a tall chain-link fence right across the alley
    for fy in (-3.5, -0.9, 1.7, 4.3, 6.9):
        S.cyl(0x4a4652, 13.0, fy, 0, 5.6, 0.09, seg=6)
    for fz in (0.15, 2.9, 5.6):
        S.rod(0x4a4652, (13.0, -3.5, fz), (13.0, 6.9, fz), 0.05, seg=5)
    k = -3.5 - 5.6
    while k < 6.9:
        a0, a1 = max(-3.5, k), min(6.9, k + 5.6)
        if a1 > a0:
            S.rod(0x9a96a8, (13.0, a0, a0 - k), (13.0, a1, a1 - k), 0.022, seg=4)
            S.rod(0x9a96a8, (13.0, -3.5 + 6.9 - a0, a0 - k), (13.0, -3.5 + 6.9 - a1, a1 - k), 0.022, seg=4)
        k += 0.42
    S.box(0xd8b030, 12.95, 13.0, 0.6, 1.7, 2.2, 2.9, j=0)                             # warning sign on the fence
    S.box(0x1a1a22, 12.93, 12.95, 0.75, 1.55, 2.42, 2.52, j=0)
    for (tx, ty) in [(-9.4, 6.2), (-8.6, 6.8), (13, 6.4)]:
        S.cyl(0x4a4a52, tx, ty, 0, 1.0, 0.4, 0.45, seg=12)
        S.cyl(0x5a5a62, tx, ty, 1.0, 1.08, 0.48, seg=12)
    for (bx, by, bz) in [(15, 5.5, 0), (15.6, 6.4, 0), (15.2, 5.9, 0.8)]:
        S.box(0x6a4a30, bx - 0.4, bx + 0.4, by - 0.4, by + 0.4, bz, bz + 0.8, j=0.08)
    # burning barrel
    S.cyl(0x6a3420, 10.5, 5.2, 0, 1.25, 0.5, seg=12)
    S.cyl(0x4a2416, 10.5, 5.2, 0.4, 0.5, 0.52, seg=12)
    S.cyl(0xff7a2a, 10.5, 5.2, 1.2, 2.3, 0.42, 0.05, seg=8, kind='GLOW', j=0)
    S.cyl(0xffc04a, 10.4, 5.1, 1.2, 1.9, 0.26, 0.03, seg=8, kind='GLOW', j=0)
    S.cyl(0x40180a, 10.5, 5.2, 0.0, 3.6, 1.6, 0.4, seg=16, kind='BEAM', j=0)   # warm glow around the fire
    # neon signs
    def neon(c, pts, y):
        for a, b in zip(pts, pts[1:]):
            S.rod(c, (a[0], y, a[1]), (b[0], y, b[1]), 0.07, seg=6, kind='GLOW')
    neon(0xff3aa0, [(-9, 6.5), (-5, 6.5), (-5, 9.0), (-9, 9.0), (-9, 6.5)], 7.85)
    neon(0xff7ad0, [(-8.4, 7.1), (-7.6, 8.4), (-6.8, 7.1), (-6.0, 8.4), (-5.6, 7.4)], 7.85)
    neon(0xa060ff, [(6, 5), (6, 10), (7.2, 10), (7.2, 5), (6, 5)], 7.85)
    for k in range(4):
        neon(0xc890ff, [(6.25, 5.6 + k * 1.15), (6.95, 5.6 + k * 1.15)], 7.85)
    # street lamps
    for lx in (-9.5, -2.5, 4.5, 10.5):
        S.cyl(0x2a2830, lx, 5, 0, 5.4, 0.08, seg=8)
        S.rod(0x2a2830, (lx, 5, 5.4), (lx + 0.9, 4.6, 5.6), 0.06)
        S.cyl(0xffd8a0, lx + 0.9, 4.6, 5.2, 5.5, 0.22, seg=10, kind='GLOW', j=0)
        S.cyl(0x2a1c30, lx + 0.9, 4.6, 0.0, 5.2, 1.8, 0.2, seg=14, kind='BEAM', j=0)
    # wires strung between the buildings
    for (xa, xb, zz) in [(-20, 0, 13), (-6, 18, 12), (2, 22, 15)]:
        n = 8; prev = None
        for k in range(n + 1):
            t = k / n; px = xa + (xb - xa) * t; pz = zz - math.sin(t * math.pi) * 1.2
            if prev:
                S.rod(0x141018, prev, (px, 8.2, pz), 0.025, seg=4)
            prev = (px, 8.2, pz)
    S.export('arena_alley.glb')

# ------------------------------------------------------------------ THE SALOON
def build_saloon():
    random.seed(23); S = Scene()
    # floorboards, warmer under the lamps
    y = -16.0
    while y < 13:
        x = -34.0
        while x < 12:
            L = 3 + random.random() * 4
            d = min(abs(x + L / 2 - (-6)), abs(x + L / 2), abs(x + L / 2 - 6))
            k = max(0, 1 - d / 9) * max(0, 1 - abs(y - 1) / 12)
            base = random.choice([0x5e361f, 0x6a3e24, 0x74442a, 0x583220])
            r = min(255, ((base >> 16) & 255) + int(40 * k)); g = min(255, ((base >> 8) & 255) + int(24 * k)); b = (base & 255) + int(8 * k)
            S.box(r << 16 | g << 8 | b, x, min(12, x + L - 0.04), y, y + 0.86, -0.3, 0.0, j=0.03)
            x += L
        y += 0.9
    # back wall: dark wainscot, plank panelling, picture rail
    S.box(0x3a2014, -34, 12, 11, 12, 0, 1.6, j=0)
    xx = -34.0
    while xx < 11.9:
        S.box(random.choice([0x4a2a1a, 0x52301c, 0x46261a]), xx, xx + 0.75, 11.05, 12, 1.6, 12, j=0.03)
        xx += 0.75
    S.box(0x2a160e, -34, 12, 10.9, 11.0, 1.55, 1.75, j=0)
    # bar counter with brass rail and stools
    S.box(0x5a3018, -11, 5, 6.0, 7.6, 0, 1.15, j=0.02)
    S.box(0x7a4428, -11.2, 5.2, 5.85, 7.7, 1.15, 1.3, j=0.0)
    for k in range(8):
        S.box(0x4a2814, -10.6 + k * 2, -9.2 + k * 2, 5.95, 6.0, 0.2, 0.95, j=0.02)
    S.rod(0xd8a03a, (-11, 5.6, 0.25), (5, 5.6, 0.25), 0.05)
    for k in range(6):
        sx = -9.5 + k * 2.6
        S.cyl(0x3a2014, sx, 4.9, 0, 0.75, 0.06, seg=6)
        S.cyl(0x7a2a1e, sx, 4.9, 0.75, 0.88, 0.32, seg=12)
    # back bar: shelves of bottles, mirror with a gold frame
    S.box(0x3a2014, -11, 5, 10.2, 11.0, 0, 1.4, j=0)
    S.box(0xc8902a, -6.2, 0.2, 10.85, 10.95, 2.0, 5.8, j=0)
    S.box(0x2a3440, -5.9, -0.1, 10.8, 10.85, 2.3, 5.5, j=0.02)
    for k in range(3):  # streaks of reflected lamp light in the mirror
        S.obox(0x8a6a4a, -4.6 + k * 1.6, 10.79, 3.9, 0.12, 0.01, 2.2, rot=(0, 0.5, 0), kind='GLOW', j=0.05)
    for sx0, sx1 in ((-11, -6.6), (0.6, 5)):
        for sz in (2.2, 3.4, 4.6):
            S.box(0x4a2814, sx0, sx1, 10.4, 11.0, sz, sz + 0.08, j=0)
            bx = sx0 + 0.2
            while bx < sx1 - 0.2:
                c = random.choice([0x2a5a2a, 0x7a4a14, 0x5a2a14, 0x8a6a2a, 0x2a3a5a])
                hh = 0.5 + random.random() * 0.35
                glow = random.random() < 0.18
                S.cyl(0xffb050 if glow else c, bx, 10.7, sz + 0.08, sz + 0.08 + hh, 0.1, seg=8, kind='GLOW' if glow else 'SOLID')
                S.cyl(c, bx, 10.7, sz + 0.08 + hh, sz + 0.28 + hh, 0.04, seg=6)
                bx += 0.26 + random.random() * 0.12
    # balcony above the bar with balusters
    S.box(0x4a2814, -16, 12, 8.8, 11, 6.2, 6.6, j=0.02)
    S.box(0x5a3018, -16, 12, 8.75, 8.9, 7.7, 7.85, j=0)
    xx = -16.0
    while xx <= 12:
        S.cyl(0x5a3018, xx, 8.82, 6.6, 7.7, 0.06, seg=6); xx += 0.55
    for px in (-16, -8, 8):
        S.box(0x3a2014, px - 0.25, px + 0.25, 8.6, 9.1, 0, 6.2, j=0)
    # ceiling beams and ceiling
    S.box(0x24120a, -34, 12.2, -16, 12, 11.8, 12.2, j=0)
    for k in range(-5, 6):
        S.box(0x3a2014, -34, 12, k * 2.4 - 0.25, k * 2.4 + 0.25, 11.2, 11.8, j=0.03)
    # hanging oil lamps
    for lx in (-6, 0, 6):
        S.rod(0x1a120e, (lx, 1.5, 11.2), (lx, 1.5, 7.6), 0.03)
        S.cyl(0x3a2a1a, lx, 1.5, 7.2, 7.6, 0.5, 0.15, seg=10)
        S.cyl(0xffc060, lx, 1.5, 6.8, 7.25, 0.2, seg=10, kind='GLOW', j=0)
        S.cyl(0x2a1608, lx, 1.5, 0.0, 6.8, 2.6, 0.2, seg=16, kind='BEAM', j=0)
    # wall sconces, wanted posters, a sunset window each side
    for wx in (-14, -2, 10):
        S.box(0xc8902a, wx - 0.1, wx + 0.1, 10.7, 10.95, 3.6, 4.0)
        S.cyl(0xffb050, wx, 10.75, 4.0, 4.4, 0.12, seg=8, kind='GLOW', j=0)
    for (wx, wz) in [(-20, 3.4), (-18.4, 3.0), (8.6, 8.8), (9.9, 9.2), (11.0, 8.9)]:
        S.box(0xc8b080, wx - 0.55, wx + 0.55, 10.9, 10.95, wz, wz + 1.4, j=0.06)
        S.box(0x4a3020, wx - 0.35, wx + 0.35, 10.86, 10.9, wz + 0.4, wz + 1.1, j=0.05)
    for sx in (-1,):
        S.box(0x4a2a1a, sx * 22, sx * 23, -16, 12, 0, 12, j=0.02)
        S.box(0xff9a4a, sx * 22 - sx * 0.05, sx * 22, -6, -2, 3, 6.5, kind='GLOW', j=0)
        S.box(0x2a160e, sx * 22 - sx * 0.1, sx * 22, -4.05, -3.95, 3, 6.5, j=0)
        S.box(0x2a160e, sx * 22 - sx * 0.1, sx * 22, -6, -2, 4.7, 4.8, j=0)
    # tables and chairs at the sides, a piano, barrels
    for (tx, ty) in [(-16, 4.0), (-18.5, -1.0), (7.5, 3.6)]:
        S.cyl(0x3a2014, tx, ty, 0, 0.8, 0.12, seg=8)
        S.cyl(0x6a3a20, tx, ty, 0.8, 0.9, 1.0, seg=16)
        S.cyl(0xd8c8a0, tx + 0.2, ty, 0.9, 1.15, 0.07, seg=6)
        for a in range(3):
            ang = a * 2.1 + 0.4; cx = tx + math.cos(ang) * 1.4; cy = ty + math.sin(ang) * 1.4
            S.box(0x4a2814, cx - 0.3, cx + 0.3, cy - 0.3, cy + 0.3, 0.5, 0.58)
            S.box(0x4a2814, cx - 0.3, cx + 0.3, cy + 0.22, cy + 0.3, 0.58, 1.3)
            for (lx, ly) in ((-0.25, -0.25), (0.25, -0.25), (-0.25, 0.25), (0.25, 0.25)):
                S.cyl(0x3a2014, cx + lx, cy + ly, 0, 0.5, 0.04, seg=4)
    S.box(0x2a1410, 8, 11.6, 8.4, 10.2, 0.3, 2.6, j=0.0)
    S.box(0xe8e0d0, 8.1, 11.5, 8.25, 8.4, 1.3, 1.45, j=0)
    for k in range(18):
        S.box(0x111111, 8.2 + k * 0.19, 8.28 + k * 0.19, 8.24, 8.3, 1.4, 1.46, j=0)
    for lx in (8.3, 11.3):
        S.box(0x2a1410, lx - 0.1, lx + 0.1, 8.5, 8.7, 0, 0.3)
    for (bx, by, bz) in [(-20, 7, 0), (-18.6, 7.4, 0), (-19.3, 7.2, 1.3), (10.6, 4.6, 0)]:
        S.cyl(0x6a3a1c, bx, by, bz, bz + 1.3, 0.55, 0.6, seg=12)
        S.cyl(0x3a3036, bx, by, bz + 0.25, bz + 0.33, 0.58, seg=12, j=0)
        S.cyl(0x3a3036, bx, by, bz + 0.97, bz + 1.05, 0.58, seg=12, j=0)
    # left limit: a card table kicked over as a barricade, chairs and barrels piled behind it
    S.obox(0x6a3a20, -12.2, 0.0, 1.15, 0.16, 3.0, 2.3, rot=(0, 0.12, 0))
    S.obox(0x3a2014, -12.75, 0.0, 1.0, 1.1, 0.16, 0.16, rot=(0, 0.12, 0))
    S.box(0x1e4a2a, -12.12, -12.08, -1.2, 1.2, 0.35, 1.95, j=0)                    # green felt top facing the fight
    for (bx, by) in [(-13.6, 1.4), (-13.8, -1.2), (-14.9, 0.2)]:
        S.cyl(0x6a3a1c, bx, by, 0, 1.3, 0.55, 0.6, seg=12); S.cyl(0x3a3036, bx, by, 0.25, 0.33, 0.58, seg=12, j=0); S.cyl(0x3a3036, bx, by, 0.97, 1.05, 0.58, seg=12, j=0)
    S.cyl(0x6a3a1c, -14.1, 0.2, 1.3, 2.6, 0.55, 0.6, seg=12)
    S.obox(0x4a2814, -13.0, -2.4, 0.5, 0.7, 0.7, 1.0, rot=(0.5, 0.3, 0.4))
    # right wall with the way out: batwing doors on the fight line (the wall is cut away toward the camera)
    S.box(0x4a2a1a, 11.85, 12.15, 1.35, 12, 0, 12, j=0.02)
    S.box(0x3a2014, 11.8, 12.2, 1.2, 1.5, 0, 3.7, j=0)                           # far door post
    S.box(0x3a2014, 11.8, 12.2, -1.5, -1.2, 0, 3.7, j=0)                         # near door post
    S.box(0x3a2014, 11.8, 12.2, -1.5, 1.5, 3.5, 3.85, j=0)                       # lintel
    S.box(0xc8902a, 11.78, 12.22, -1.1, 1.1, 3.9, 4.6, j=0)                      # sign board over the door
    S.box(0x5a1a14, 11.76, 12.24, -0.9, 0.9, 4.05, 4.45, j=0)
    for (hy, sg) in ((1.2, -1), (-1.2, 1)):                                      # two swing doors, pushed open toward the street
        dx_, dy_ = math.sin(0.7), sg * math.cos(0.7)
        cx, cy = 12 + dx_ * 0.55, hy + dy_ * 0.55
        S.obox(0x8a5a30, cx, cy, 1.65, 1.1, 0.07, 1.5, rot=(0, 0, math.atan2(dy_, dx_)), j=0.03)
        for k in range(4):
            S.obox(0x5a3418, cx, cy, 1.15 + k * 0.3, 0.9, 0.09, 0.08, rot=(0, 0, math.atan2(dy_, dx_)), j=0)
    # ---------------- MAIN STREET, outside through the doors ----------------
    S.box(0x7a5a3e, 12, 60, -16, 44, -0.3, -0.01, j=0)                             # dusty road
    for _ in range(70):
        rx, ry = 13 + random.random() * 44, -14 + random.random() * 30
        S.box(random.choice([0x846244, 0x70523a, 0x8a6848]), rx, rx + 1.5 + random.random() * 3, ry, ry + 0.25, -0.01, 0.0, j=0.04)   # wheel ruts
    S.box(0x6a4428, 12.15, 15.5, 1.5, 12, 0, 0.3, j=0.03)                         # saloon porch + roof on posts
    S.obox(0x4a2a1a, 13.9, 6.7, 4.55, 3.9, 10.6, 0.14, rot=(0, 0.22, 0))
    for py in (2.0, 6.5, 11.5):
        S.box(0x3a2014, 15.2, 15.45, py - 0.12, py + 0.12, 0.3, 4.15)
    # the far side of the street: a row of false-front buildings
    bx = 16.5; names = 0
    for (w, h, col) in [(7.5, 6.0, 0x7a4a34), (6.0, 7.2, 0x6a5040), (8.0, 5.4, 0x8a5a3a), (6.5, 6.6, 0x5e4034), (7.0, 5.8, 0x74503a), (7.5, 6.4, 0x6a5040)]:
        y0 = 23.0
        S.box(col, bx, bx + w, y0, y0 + 8, 0, h - 1.6, j=0.03)
        S.box(col, bx - 0.15, bx + w + 0.15, y0 - 0.1, y0 + 0.3, h - 1.6, h, j=0.03)                 # false front
        S.box(0x3a2418, bx - 0.25, bx + w + 0.25, y0 - 0.2, y0 + 0.35, h - 0.25, h, j=0)
        S.box(0xd8c090, bx + 1.0, bx + w - 1.0, y0 - 0.16, y0 - 0.1, h - 1.4, h - 0.55, j=0.03)     # painted sign
        S.box(0x3a2418, bx + 1.5, bx + w - 1.5, y0 - 0.2, y0 - 0.16, h - 1.1, h - 0.85, j=0)
        S.box(0x5a3a26, bx - 0.2, bx + w + 0.2, y0 - 2.4, y0, 3.3, 3.45, j=0.02)                     # porch roof
        S.box(0x6a4428, bx, bx + w, y0 - 2.2, y0, 0, 0.25, j=0.03)
        for k in range(3):
            pxx = bx + 0.2 + k * (w - 0.4) / 2
            S.box(0x3a2418, pxx - 0.09, pxx + 0.09, y0 - 2.3, y0 - 2.1, 0.25, 3.3, j=0)
        S.box(0x2a1810, bx + w / 2 - 0.6, bx + w / 2 + 0.6, y0 - 0.06, y0, 0.25, 2.6, j=0)           # door
        for wx_ in (bx + 0.9, bx + w - 2.1):
            lit = random.random() < 0.7
            S.box(0xffb050 if lit else 0x2a1c18, wx_, wx_ + 1.2, y0 - 0.06, y0, 1.1, 2.5, kind='GLOW' if lit else 'SOLID', j=0.05)
            S.box(0x3a2418, wx_ + 0.56, wx_ + 0.64, y0 - 0.08, y0 - 0.06, 1.1, 2.5, j=0)
        bx += w + 0.5
    # hitching rail, water trough, barrels, crates along the far boardwalk
    S.rod(0x5a3a26, (19, 19, 1.0), (23, 19, 1.0), 0.07); S.cyl(0x5a3a26, 19, 19, 0, 1.0, 0.08, seg=6); S.cyl(0x5a3a26, 23, 19, 0, 1.0, 0.08, seg=6)
    S.box(0x5a3a26, 25, 27.6, 18.5, 19.4, 0, 0.7, top=0x3a6a8a)
    for (qx, qy) in [(17.2, 19.6), (29.0, 19.4), (29.9, 19.8), (18.5, 6.0), (19.4, 6.5)]:
        S.cyl(0x6a3a1c, qx, qy, 0, 1.2, 0.5, 0.55, seg=12); S.cyl(0x3a3036, qx, qy, 0.3, 0.38, 0.54, seg=12, j=0)
    # water tower and a windmill against the sky
    for (lx_, ly_) in ((39, 34), (42, 34), (39, 37), (42, 37)):
        S.rod(0x3a2418, (lx_, ly_, 0), (40.5 + (lx_ - 40.5) * 0.7, 35.5 + (ly_ - 35.5) * 0.7, 9), 0.12, seg=5)
    S.cyl(0x5a3a26, 40.5, 35.5, 9, 13, 2.2, seg=14); S.cyl(0x3a2418, 40.5, 35.5, 13, 14.6, 2.5, 0.2, seg=14)
    S.rod(0x3a2418, (24, 36, 0), (24, 36, 11), 0.1, seg=5)
    for k in range(8):
        a = k * math.pi / 4
        S.rod(0x4a3020, (24, 35.8, 11), (24 + math.cos(a) * 1.8, 35.8, 11 + math.sin(a) * 1.8), 0.06, seg=4)
    # right limit: a covered wagon parked across the road
    S.box(0x5a3a26, 32.0, 35.4, -1.6, 1.8, 1.0, 1.9, j=0.03)
    for (wx_, wy_) in ((32.6, -1.75), (34.8, -1.75), (32.6, 1.95), (34.8, 1.95)):
        S.rod(0x2a1810, (wx_, wy_ - 0.08, 0.75), (wx_, wy_ + 0.08, 0.75), 0.75, seg=14)
        S.rod(0x8a6a4a, (wx_, wy_ - 0.1, 0.75), (wx_, wy_ + 0.1, 0.75), 0.55, seg=14)
    for k in range(5):
        hx = 32.2 + k * 0.75
        for a in range(6):
            a0, a1 = math.pi * a / 6, math.pi * (a + 1) / 6
            S.obox(0xd8c8a8, hx, -math.cos((a0 + a1) / 2) * 1.6 + 0.1, 1.9 + math.sin((a0 + a1) / 2) * 1.7, 0.78, 0.9, 0.08, rot=((a0 + a1) / 2 - math.pi / 2, 0, 0), j=0.03)
    S.box(0x6a4a30, 31.2, 32.0, -0.5, 0.5, 0, 0.8, j=0.08); S.box(0x6a4a30, 31.3, 31.9, 0.7, 1.4, 0, 0.6, j=0.08)
    # sunset sky, sun, distant mesas
    S.quad([0xff9a4a, 0xff9a4a, 0x3a1a3a, 0x3a1a3a], (6, 60, -2), (110, 60, -2), (110, 60, 46), (6, 60, 46), kind='GLOW')
    S.quad([0xffc060, 0xffc060, 0xff9a4a, 0xff9a4a], (6, 59.9, -2), (110, 59.9, -2), (110, 59.9, 9), (6, 59.9, 9), kind='GLOW')
    S.obox(0xffe0a0, 33, 59.5, 9.5, 7, 0.1, 7, rot=(0, 0.785, 0), kind='GLOW', j=0)
    S.cyl(0xffe0a0, 33, 59.4, 6.0, 13.0, 3.5, seg=4, kind='GLOW', j=0)
    for (mx, mw, mh) in [(14, 16, 9), (38, 12, 13), (58, 20, 8), (84, 14, 11)]:
        S.box(0x5a2a2a, mx, mx + mw, 52, 56, 0, mh, kind='GLOW', j=0.04)
        S.box(0x5a2a2a, mx - 3, mx + mw + 3, 52, 56, 0, mh * 0.55, kind='GLOW', j=0.04)
    S.box(0x4a2420, 6, 110, 50, 52, -1, 2.2, kind='GLOW', j=0)
    S.export('arena_saloon.glb')

# ------------------------------------------------------------------ THE COLOSSEUM
def build_colosseum():
    """Curved two-arcade amphitheatre around a sand floor, low enough that the game's sunset sky shows above it."""
    random.seed(31); S = Scene()
    STONE, STONE_D, STONE_L = 0x8e6a5e, 0x6a4e48, 0xa8826e
    SHADOW, RED, GOLD = 0x24121c, 0x861a22, 0xb08430
    # sand floor: concentric rings, a little darker toward the walls
    S.box(0x6e4e3e, -37, 37, -16, 34, -0.4, -0.02, j=0)
    for k, (r, c) in enumerate([(30, 0x765442), (22, 0x7e5a46), (15, 0x86604a), (9.6, 0x8c644c)]):
        S.cyl(c, 0, 1, -0.02 + k * 0.004, -0.018 + k * 0.004, r, seg=72, j=0)
    S.cyl(0x4a2a1e, 0, 0, -0.002, 0.0, 12.7, seg=96, j=0)     # the fighting circle: its edge is the limit
    S.cyl(0x8c644c, 0, 0, 0.0, 0.002, 12.25, seg=96, j=0)
    for a8 in range(8):
        ang = a8 * math.pi / 4
        S.obox(0x5a3828, math.cos(ang) * 13.8, math.sin(ang) * 13.8, 0.001, 1.3, 0.18, 0.004, rot=(0, 0, ang), j=0)
    A, B, CY = 40.0, 20.0, 7.0
    NA = 30
    def bays(off):
        out = []
        for i in range(NA):
            t = math.pi * (i + 0.5) / NA
            x, y = (A + off) * math.cos(t), CY + (B + off) * math.sin(t)
            tx, ty = -(A + off) * math.sin(t), (B + off) * math.cos(t)     # tangent
            L = math.hypot(tx, ty); rot = math.atan2(ty, tx) + math.pi
            dt = math.pi / NA / 2   # real width of this bay along the ellipse, plus overlap so no sky shows through the joints
            w = math.hypot((A + off) * (math.cos(t + dt) - math.cos(t - dt)), (B + off) * (math.sin(t + dt) - math.sin(t - dt))) + 0.25
            nx, ny = -ty / L, tx / L                                         # normal pointing into the arena
            if nx * (0 - x) + ny * (0 - y) < 0: nx, ny = -nx, -ny
            out.append((i, x, y, rot, w, nx, ny, t))
        return out
    def P(x, y, nx, ny, d):   # point pushed d toward the arena
        return x + nx * d, y + ny * d
    def arcade(off, z0, z1, lower):
        h = z1 - z0
        for (i, x, y, rot, w, nx, ny, t) in bays(off):
            if abs(x) < 4.6 and y > CY + B - 2 and lower:
                continue                                                      # leave room for the gate
            S.obox(STONE_D, x, y, (z0 + z1) / 2, w, 0.8, h, rot=(0, 0, rot))   # wall slab
            ow = w * 0.62; ar = ow / 2; zs = z1 - 0.8 - ar                    # opening width / arch spring height
            cx, cy = P(x, y, nx, ny, 0.42)
            S.obox(SHADOW, cx, cy, (z0 + 0.45 + zs) / 2, ow, 0.04, zs - z0 - 0.45, rot=(0, 0, rot), j=0.04)
            for k in range(6):                                                # stepped semicircle = arched top
                a = math.pi / 2 * (k + 0.5) / 6
                S.obox(SHADOW, cx, cy, zs + ar * math.sin(a) - ar / 12 + ar / 12, ow * math.cos(a), 0.04, ar / 6 + 0.02, rot=(0, 0, rot), j=0.04)
            if lower and i % 5 == 2:                                          # torch-lit doorway
                gx, gy_ = P(x, y, nx, ny, 0.3)
                S.obox(0x9a4a1e, gx, gy_, z0 + 0.95, ow * 0.5, 0.03, 1.0, rot=(0, 0, rot), kind='GLOW', j=0.05)
                S.obox(0xc8702a, gx, gy_, z0 + 0.75, ow * 0.22, 0.04, 0.5, rot=(0, 0, rot), kind='GLOW', j=0.05)
            vx, vy = P(x, y, nx, ny, 0.46)
            for v in range(9):                                                # light stone ring around the arch
                a0 = math.pi * (v + 0.5) / 9
                ox = math.cos(a0) * (ar + 0.14)
                S.obox(STONE_L, vx + math.cos(rot) * ox, vy + math.sin(rot) * ox, zs + math.sin(a0) * (ar + 0.14), ar * 0.36, 0.08, 0.26, rot=(0, -(a0 - math.pi / 2), rot), j=0.03)
            for side in (-1, 1):                                              # half-columns between bays
                ox = side * w / 2
                S.obox(STONE, vx + math.cos(rot) * ox, vy + math.sin(rot) * ox, (z0 + z1) / 2 - 0.2, 0.42, 0.12, h - 0.6, rot=(0, 0, rot), j=0.02)
            S.obox(STONE_L, vx, vy, z1 - 0.3, w + 0.02, 0.16, 0.36, rot=(0, 0, rot), j=0.02)   # cornice
            S.obox(STONE, vx, vy, z0 + 0.22, w + 0.02, 0.12, 0.44, rot=(0, 0, rot), j=0.02)    # base band
            if not lower and i % 3 == 1:                                      # banners on the upper arcade
                bx, by = P(x, y, nx, ny, 0.5)
                ox = w / 2
                S.obox(RED, bx + math.cos(rot) * ox, by + math.sin(rot) * ox, z0 + 2.0, 0.55, 0.04, 2.8, rot=(0, 0, rot), j=0.03)
                S.obox(GOLD, bx + math.cos(rot) * ox, by + math.sin(rot) * ox, z0 + 0.65, 0.55, 0.05, 0.1, rot=(0, 0, rot), j=0)
    # podium wall (with a painted band), two arcades, attic with crowd and masts
    for (i, x, y, rot, w, nx, ny, t) in bays(0.0):
        if abs(x) < 4.6 and y > CY + B - 2:
            continue
        S.obox(STONE_D, x, y, 1.1, w, 1.0, 2.2, rot=(0, 0, rot))
        bx, by = P(x, y, nx, ny, 0.52)
        S.obox(RED, bx, by, 1.75, w + 0.02, 0.04, 0.42, rot=(0, 0, rot), j=0.02)
        S.obox(GOLD, bx, by, 1.5, w + 0.02, 0.05, 0.06, rot=(0, 0, rot), j=0)
        S.obox(STONE_L, bx, by, 2.15, w + 0.02, 0.2, 0.14, rot=(0, 0, rot), j=0)
    arcade(0.6, 2.2, 6.6, True)
    arcade(1.2, 6.6, 10.4, False)
    for (i, x, y, rot, w, nx, ny, t) in bays(1.8):
        S.obox(STONE_D, x, y, 11.1, w, 0.9, 1.4, rot=(0, 0, rot))
        wx, wy = P(x, y, nx, ny, 0.47)
        S.obox(SHADOW, wx, wy, 11.1, w * 0.28, 0.04, 0.6, rot=(0, 0, rot), j=0)
        if i % 2 == 0:
            S.obox(0x4a3026, x, y, 13.3, 0.18, 0.18, 3.0, rot=(0, 0, rot))
            mx, my = P(x, y, nx, ny, 3.2)
            S.rod(0x9a2a22, (x, y, 14.6), (mx, my, 13.6), 0.04, seg=4)
        for c in range(3):
            if random.random() < 0.75:
                ox = (c - 1) * w * 0.3; cx, cy = x + math.cos(rot) * ox, y + math.sin(rot) * ox
                cx, cy = P(cx, cy, nx, ny, 0.25)
                S.obox(random.choice([0x3a2228, 0x4a2a26, 0x5a2222, 0x2e2838, 0x5a3a2a]), cx, cy, 12.2, 0.36, 0.36, 0.75, rot=(0, 0, rot), j=0.1)
                S.obox(0x6a4232, cx, cy, 12.72, 0.25, 0.25, 0.28, rot=(0, 0, rot), j=0.1)
    # grand gate at the back centre with a portcullis, flanked by statues on plinths
    gy = CY + B + 0.2
    S.box(STONE_L, -4.6, 4.6, gy - 1.0, gy + 0.8, 0, 10.4)
    S.box(SHADOW, -2.4, 2.4, gy - 1.06, gy - 1.0, 0, 5.4, j=0)
    for k in range(6):
        a = math.pi / 2 * (k + 0.5) / 6
        S.box(SHADOW, -2.4 * math.cos(a), 2.4 * math.cos(a), gy - 1.06, gy - 1.0, 5.4 + 2.4 * math.sin(a) - 0.2, 5.4 + 2.4 * math.sin(a) + 0.2, j=0)
    for v in range(11):
        a0 = math.pi * (v + 0.5) / 11
        S.obox(STONE, math.cos(a0) * 2.7, gy - 1.12, 5.4 + math.sin(a0) * 2.7, 0.75, 0.14, 0.42, rot=(0, -(a0 - math.pi / 2), 0))
    for k in range(8):
        S.box(0x1e1216, -2.2 + k * 0.6, -2.08 + k * 0.6, gy - 1.12, gy - 1.08, 0, 6.6, j=0)
    for k in range(5):
        S.box(0x1e1216, -2.4, 2.4, gy - 1.14, gy - 1.1, 0.5 + k * 1.15, 0.62 + k * 1.15, j=0)
    S.box(RED, -1.4, 1.4, gy - 1.08, gy - 1.04, 8.6, 10.0, j=0)
    S.box(GOLD, -0.8, 0.8, gy - 1.12, gy - 1.08, 9.0, 9.6, j=0)
    for sx in (-1, 1):
        bx, by = sx * 6.6, gy - 2.0
        S.box(STONE_D, bx - 1.1, bx + 1.1, by - 1.0, by + 1.0, 0, 2.6)
        S.box(STONE_L, bx - 1.25, bx + 1.25, by - 1.15, by + 1.15, 2.6, 2.9, j=0)
        S.cyl(STONE_L, bx, by, 2.9, 4.5, 0.48, 0.4, seg=10)              # robed statue with a spear
        S.cyl(STONE_L, bx, by, 4.5, 5.7, 0.42, 0.3, seg=10)
        S.cyl(STONE_L, bx, by, 5.7, 6.3, 0.25, 0.21, seg=10)
        S.rod(STONE_L, (bx + sx * 0.3, by, 5.5), (bx + sx * 0.7, by, 7.2), 0.09, seg=6)
        S.rod(0x6a5e56, (bx + sx * 0.7, by, 3.0), (bx + sx * 0.7, by, 8.4), 0.05, seg=6)
        S.cyl(0x6a5e56, bx + sx * 0.7, by, 8.4, 8.9, 0.12, 0.0, seg=6)
    # braziers either side of the fight, and a pair further back
    for (bx, by, sc) in [(-14.5, 4.5, 1.0), (14.5, 4.5, 1.0), (-22, 12, 0.85), (22, 12, 0.85)]:
        S.cyl(STONE_D, bx, by, 0, 0.5 * sc, 0.9 * sc, seg=12)
        S.cyl(STONE, bx, by, 0.5 * sc, 2.4 * sc, 0.35 * sc, 0.28 * sc, seg=12)
        S.cyl(0x4a3020, bx, by, 2.4 * sc, 3.0 * sc, 0.45 * sc, 0.85 * sc, seg=14)
        S.cyl(GOLD, bx, by, 2.95 * sc, 3.05 * sc, 0.88 * sc, seg=14, j=0)
        S.cyl(0xff7a2a, bx, by, 3.0 * sc, 4.6 * sc, 0.7 * sc, 0.05, seg=8, kind='GLOW', j=0)
        S.cyl(0xffc04a, bx + 0.1, by, 3.0 * sc, 4.0 * sc, 0.42 * sc, 0.03, seg=8, kind='GLOW', j=0)
        S.cyl(0x40200a, bx, by, 0.0, 5.5 * sc, 2.4 * sc, 0.5 * sc, seg=16, kind='BEAM', j=0)
    for (rx, ry) in [(-17, 9.5), (16.5, 9.0)]:                            # weapon racks by the wall
        S.box(0x4a3020, rx - 1.2, rx + 1.2, ry - 0.15, ry + 0.15, 1.6, 1.75)
        for k in range(4):
            S.rod(0x6a5e56, (rx - 0.9 + k * 0.6, ry, 0), (rx - 0.9 + k * 0.6 + 0.2, ry, 2.6), 0.05, seg=5)
    for (sx_, sy_) in [(-9, 8.5), (10.5, 10), (-26, 4)]:                  # dropped shields
        S.cyl(0x6a2a22, sx_, sy_, 0, 0.12, 0.6, seg=14)
        S.cyl(GOLD, sx_, sy_, 0.12, 0.16, 0.18, seg=10, j=0)
    S.export('arena_colosseum.glb')

if __name__ == '__main__':
    if sys.argv[1:2] == ['pack']:
        import glob
        for g in sorted(glob.glob(os.path.join(OUT, 'arena_*.glb'))): pack(g)
        sys.exit()
    which = sys.argv[1:] or ['colosseum', 'ring', 'alley', 'saloon']
    for w in which:
        {'colosseum': build_colosseum, 'ring': build_ring, 'alley': build_alley, 'saloon': build_saloon}[w]()
