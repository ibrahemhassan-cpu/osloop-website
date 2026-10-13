import * as THREE from 'three'
import {
  A,
  ARROW_CENTRE_PDF,
  ARROW_D,
  ARROW_SCALE,
  ARTWORK_CROSSING,
  CUT_END_DEG,
  CUT_START_DEG,
  K,
  RHO,
  RT,
  SLOT_DEG,
} from '../../lib/loopShape'

/*
 * The OsLoop "Media logo icon" in 3D: the glass ∞ and its orange play arrow.
 *
 * Everything is measured from the official artwork (see lib/loopShape.ts) and kept in its own units
 * (y up, origin at the crossing of the ∞). Two round lobes joined by S-shaped strands; the "/" strand
 * passes over the "\" one. The band is open on the upper-left of the left lobe — that gap is where the
 * arrow sits — and both ends are cut straight, exactly like the logo.
 */

const RZ = RT * 0.82 // half the tube thickness in depth — a slightly flattened, pebble-like section
/** half the band's width and half its depth (icon units) */
export const BAND_SECTION = { width: RT, depth: RZ }
const LIFT = 12 // how far the strands part in depth where they cross
const DEG = Math.PI / 180

/** where the band starts (upper cut) and ends (lower cut) on the left lobe */
const CUT_START = CUT_START_DEG * DEG
const CUT_END = CUT_END_DEG * DEG
/** the arrow sits on the band's circle, in the gap */
const SLOT = SLOT_DEG * DEG

/** the whole icon (arrow + ∞) is centred on the origin */
export const ICON_OFFSET = new THREE.Vector2(3.8, -1.4)
/** logo units → world units, so the ∞ keeps the footprint of the previous glass loop */
export const ICON_SCALE = 5.3 / 156.1

type Seg = (t: number, out: THREE.Vector3) => THREE.Vector3

const arc = (cx: number, from: number, to: number): Seg => (t, out) => {
  const a = from + (to - from) * t
  return out.set(cx + RHO * Math.cos(a), RHO * Math.sin(a), 0)
}
const strand = (x0: number, y0: number, x1: number, y1: number): Seg => {
  const dir = Math.sign(x1 - x0)
  const curve = new THREE.CubicBezierCurve(
    new THREE.Vector2(x0, y0),
    new THREE.Vector2(x0 + dir * K, y0),
    new THREE.Vector2(x1 - dir * K, y1),
    new THREE.Vector2(x1, y1),
  )
  const p = new THREE.Vector2()
  return (t, out) => {
    curve.getPoint(t, p)
    return out.set(p.x, p.y, 0)
  }
}

/** S1 = "\" strand (goes under), S2 = "/" strand (goes over) */
const S1 = strand(-A, RHO, A, -RHO)
const S2 = strand(A, RHO, -A, -RHO)
const RIGHT = arc(A, -90 * DEG, 90 * DEG)

/** A path made of segments, sampled by arc length. `lift` gives each segment its depth profile. */
class IconPath {
  private readonly pts: THREE.Vector3[] = []
  private readonly len: number[] = [0]
  readonly length: number
  constructor(segs: { seg: Seg; depth: number }[], samples = 4000) {
    const per = Math.ceil(samples / segs.length)
    const v = new THREE.Vector3()
    segs.forEach(({ seg, depth }, si) => {
      for (let i = si === 0 ? 0 : 1; i <= per; i++) {
        const t = i / per
        seg(t, v)
        // smooth bump: zero (and flat) at both ends of the segment, `depth` in the middle
        v.z = depth * Math.sin(Math.PI * t) ** 2
        this.pts.push(v.clone())
      }
    })
    for (let i = 1; i < this.pts.length; i++) this.len.push(this.len[i - 1] + this.pts[i].distanceTo(this.pts[i - 1]))
    this.length = this.len[this.len.length - 1]
  }
  /** point at normalised arc length u ∈ [0, 1] */
  at(u: number, out = new THREE.Vector3()) {
    const d = THREE.MathUtils.clamp(u, 0, 1) * this.length
    let lo = 0
    let hi = this.len.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (this.len[mid] < d) lo = mid
      else hi = mid
    }
    const span = this.len[hi] - this.len[lo] || 1
    return out.lerpVectors(this.pts[lo], this.pts[hi], (d - this.len[lo]) / span)
  }
  tangent(u: number, out = new THREE.Vector3()) {
    const e = 0.5 / this.length
    const a = this.at(Math.max(0, u - e))
    const b = this.at(Math.min(1, u + e))
    return out.subVectors(b, a).normalize()
  }
}

/* ------------------------------------------------------------------ glass band */

/** the centre line runs a little past each cut, so every line of the surface can be trimmed exactly on it */
const OVERRUN = 22 * DEG
/** radius and resolution of the rounded edge around each cut face */
const FILLET = 2.2
const FILLET_STEPS = 6

/** the band's centre line, from just past its upper cut to just past its lower cut, with its depth profile */
export function createBandPath() {
  return new IconPath([
    { seg: arc(-A, CUT_START + OVERRUN, 90 * DEG), depth: 0 },
    { seg: S1, depth: -LIFT },
    { seg: RIGHT, depth: 0 },
    { seg: S2, depth: LIFT },
    { seg: arc(-A, 270 * DEG, CUT_END - OVERRUN), depth: 0 },
  ])
}
export type BandPath = ReturnType<typeof createBandPath>
/** distance along the arrow's flight (from its slot) to the start of the band path */
export const BAND_FLIGHT_OFFSET = RHO * (SLOT - CUT_START - OVERRUN)
/** where the visible band starts and ends on its path, and the centre of its upper cut face (icon units) */
export type LoopBand = { start: number; end: number; tail: [number, number, number] }

/** the frame the band's section is swept with at `u`: point P, tangent T, normal N (in plane), binormal B */
export function bandFrame(path: BandPath, u: number, P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3()) {
  path.at(u, P)
  path.tangent(u, T)
  N.set(-T.y, T.x, 0).normalize() // Z × T
  B.crossVectors(T, N)
  return { P, T, N, B }
}

/**
 * The glass ∞: an elliptical section swept along the band path, trimmed exactly on the two cut planes,
 * with flat ends and a small rounded edge. Each vertex carries `aPath` = (position along the path,
 * angle round the section) so a shader can draw the band progressively (see the hero).
 * `userData.band` holds where the band starts and ends on the path.
 */
export function createLoopGeometry(tubular = 600, radial = 64) {
  const path = createBandPath()
  const len = path.length

  // the two cut planes (vertical) with their outward normals
  const cutA = { p: new THREE.Vector3(-A + RHO * Math.cos(CUT_START), RHO * Math.sin(CUT_START), 0), n: new THREE.Vector3(-1, -1, 0).normalize() }
  const endDir = new THREE.Vector2(-21.59, -7.42).normalize() // the artwork's lower cut is ~5° off radial
  const cutB = { p: new THREE.Vector3(-A + RHO * Math.cos(CUT_END), RHO * Math.sin(CUT_END), 0), n: new THREE.Vector3(-endDir.y, endDir.x, 0) }
  if (cutB.n.dot(path.tangent(1)) < 0) cutB.n.negate()
  // the upper cut is oblique: on the inner edge it reaches a little into the "\" strand
  const zone = (RHO * OVERRUN + 26) / len

  const F = bandFrame(path, 0)
  const tmp = new THREE.Vector3()
  /** a line of the surface: the point at angle (c, s) round the section, `inset` inside the surface */
  const point = (u: number, c: number, s: number, inset: number, out: THREE.Vector3) => {
    bandFrame(path, u, F.P, F.T, F.N, F.B)
    return out.copy(F.P).addScaledVector(F.N, (RT - inset) * c).addScaledVector(F.B, (RZ - inset) * s)
  }
  /** where that line meets a cut plane, searching from `from` (past the cut) towards `to` */
  const meet = (cut: { p: THREE.Vector3; n: THREE.Vector3 }, c: number, s: number, inset: number, from: number, to: number) => {
    const f = (u: number) => point(u, c, s, inset, tmp).sub(cut.p).dot(cut.n)
    let a = from
    let fa = f(a)
    for (let k = 1; k <= 64; k++) {
      const b = from + ((to - from) * k) / 64
      const fb = f(b)
      if (fa > 0 !== fb > 0) {
        let lo = a
        let hi = b
        for (let it = 0; it < 32; it++) {
          const mid = (lo + hi) / 2
          if (f(mid) > 0 === fa > 0) lo = mid
          else hi = mid
        }
        return (lo + hi) / 2
      }
      a = b
      fa = fb
    }
    return to
  }

  const cols = radial + 1
  const angles = Array.from({ length: cols }, (_, j) => (j / radial) * Math.PI * 2)
  const startU = angles.map((a) => meet(cutA, Math.cos(a), Math.sin(a), 0, 0, zone))
  const endU = angles.map((a) => meet(cutB, Math.cos(a), Math.sin(a), 0, 1, 1 - zone))
  const bandStart = Math.min(...startU)
  const bandEnd = Math.max(...endU)

  const pos: number[] = []
  const nor: number[] = []
  const tag: number[] = []
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  const put = (p: THREE.Vector3, nn: THREE.Vector3, u: number, j: number) => {
    pos.push(p.x, p.y, p.z)
    nor.push(nn.x, nn.y, nn.z)
    tag.push(u, j / radial)
  }
  /** the surface normal at angle (c, s) in the current frame */
  const sideNormal = (c: number, s: number, out: THREE.Vector3) => out.copy(F.N).multiplyScalar(c / RT).addScaledVector(F.B, s / RZ).normalize()

  // rounded edge at a cut: θ = 0 on the side, θ = π/2 on the flat face. The upper end is tagged
  // negative, -(1 + u): it's where the band is born when it's drawn, so a shader can grow it from its
  // centre, and still knows where each point sits along the band.
  const filletRow = (cut: typeof cutA, k: number, end: boolean) => {
    const th = (k / FILLET_STEPS) * (Math.PI / 2)
    const inset = FILLET * (1 - Math.cos(th))
    const along = (FILLET * (1 - Math.sin(th))) / len
    angles.forEach((a, j) => {
      const c = Math.cos(a)
      const s = Math.sin(a)
      const u0 = end ? meet(cut, c, s, inset, 1, 1 - zone) : meet(cut, c, s, inset, 0, zone)
      const u = end ? u0 - along : u0 + along
      point(u, c, s, inset, v)
      sideNormal(c, s, n).multiplyScalar(Math.cos(th)).addScaledVector(cut.n, Math.sin(th)).normalize()
      put(v, n, end ? bandEnd : -1 - u, j)
    })
  }

  let rows = 0
  for (let k = FILLET_STEPS; k >= 1; k--, rows++) filletRow(cutA, k, false)
  for (let i = 0; i <= tubular; i++, rows++) {
    angles.forEach((a, j) => {
      const c = Math.cos(a)
      const s = Math.sin(a)
      const u = THREE.MathUtils.lerp(startU[j] + FILLET / len, endU[j] - FILLET / len, i / tubular)
      point(u, c, s, 0, v)
      put(v, sideNormal(c, s, n), u, j)
    })
  }
  for (let k = 1; k <= FILLET_STEPS; k++, rows++) filletRow(cutB, k, true)

  const index: number[] = []
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * cols + j
      const b = i * cols + j + 1
      const c = (i + 1) * cols + j
      const d = (i + 1) * cols + j + 1
      index.push(a, b, c, b, d, c)
    }
  }

  // the flat faces: a fan from the cut point on the centre line to the first / last ring (the centre is
  // tagged with angle -1, so a shader folding the end into a nose sends it to the tip)
  const face = (cut: typeof cutA, ringRow: number, u: number) => {
    const centre = pos.length / 3
    put(cut.p, cut.n, u, -radial)
    const ring = (j: number) => ringRow * cols + j
    const p = (i: number) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
    const flip = p(ring(0)).sub(p(centre)).cross(p(ring(1)).sub(p(centre))).dot(cut.n) < 0
    for (let j = 0; j < radial; j++) {
      if (flip) index.push(centre, ring(j + 1), ring(j))
      else index.push(centre, ring(j), ring(j + 1))
    }
  }
  face(cutA, 0, -1 - meet(cutA, 0, 0, 0, 0, zone))
  face(cutB, rows - 1, bandEnd)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(tag, 2))
  geo.setAttribute('aPath', new THREE.Float32BufferAttribute(tag, 2))
  geo.setIndex(index)
  const band: LoopBand = { start: bandStart, end: bandEnd, tail: [cutA.p.x, cutA.p.y, cutA.p.z] }
  geo.userData.band = band
  placeInScene(geo)
  return geo
}

/* ------------------------------------------------------------------ orange arrow */

/** rest position of the arrow centre, logo units */
export const ARROW_HOME = new THREE.Vector2(ARROW_CENTRE_PDF.x - ARTWORK_CROSSING.x, -(ARROW_CENTRE_PDF.y - ARTWORK_CROSSING.y))
/** direction the play arrow points at rest (radians, logo plane) */
export const ARROW_POINTING = Math.atan2(-5.3, 29.3)

export function createArrowGeometry() {
  const shape = new THREE.Shape()
  const tokens = ARROW_D.match(/[MLCZ]|-?\d*\.?\d+/g)!
  const map = (x: number, y: number) => new THREE.Vector2((x - ARROW_CENTRE_PDF.x) * ARROW_SCALE, -(y - ARROW_CENTRE_PDF.y) * ARROW_SCALE)
  let i = 0
  const num = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'M') {
      const p = map(num(), num())
      shape.moveTo(p.x, p.y)
    } else if (cmd === 'L') {
      const p = map(num(), num())
      shape.lineTo(p.x, p.y)
    } else if (cmd === 'C') {
      const a = map(num(), num())
      const b = map(num(), num())
      const c = map(num(), num())
      shape.bezierCurveTo(a.x, a.y, b.x, b.y, c.x, c.y)
    }
  }
  const depth = 9
  const bevel = 2.6
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 6,
    curveSegments: 28,
  })
  geo.translate(0, 0, -depth / 2)
  geo.scale(ICON_SCALE, ICON_SCALE, ICON_SCALE)
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ arrow flight */

/**
 * The arrow's round trip: it leaves its slot, rides the whole ∞ once — over the glass — and lands
 * back in the gap it came from.
 */
export function createFlightPath() {
  return new IconPath(
    [
      { seg: arc(-A, SLOT, 90 * DEG), depth: 0 },
      { seg: S1, depth: -LIFT },
      { seg: RIGHT, depth: 0 },
      { seg: S2, depth: LIFT },
      { seg: arc(-A, 270 * DEG, SLOT), depth: 0 },
    ],
    3000,
  )
}
export type FlightPath = ReturnType<typeof createFlightPath>

/** logo units → scene units (centred icon, y up) */
export function toScene(x: number, y: number, z: number, out = new THREE.Vector3()) {
  return out.set((x + ICON_OFFSET.x) * ICON_SCALE, (y + ICON_OFFSET.y) * ICON_SCALE, z * ICON_SCALE)
}

function placeInScene(geo: THREE.BufferGeometry) {
  geo.translate(ICON_OFFSET.x, ICON_OFFSET.y, 0)
  geo.scale(ICON_SCALE, ICON_SCALE, ICON_SCALE)
  geo.computeBoundingSphere()
}
