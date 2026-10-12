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

/** extra length past each cut, folded back onto the cut plane so the ends come out perfectly flat */
const OVERRUN = 22 * DEG
/** radius and resolution of the rounded edge around each cut face */
const FILLET = 2.4
const FILLET_STEPS = 5

type Rim = { p: THREE.Vector3; n: THREE.Vector3 }

export function createLoopGeometry(tubular = 600, radial = 64) {
  const path = new IconPath([
    { seg: arc(-A, CUT_START + OVERRUN, 90 * DEG), depth: 0 },
    { seg: S1, depth: -LIFT },
    { seg: RIGHT, depth: 0 },
    { seg: S2, depth: LIFT },
    { seg: arc(-A, 270 * DEG, CUT_END - OVERRUN), depth: 0 },
  ])

  // the two cut planes (vertical, through the band's centre line) with their outward normals
  const cutA = { p: new THREE.Vector3(-A + RHO * Math.cos(CUT_START), RHO * Math.sin(CUT_START), 0), n: new THREE.Vector3(-1, -1, 0).normalize() }
  const endDir = new THREE.Vector2(-21.59, -7.42).normalize() // the artwork's lower cut is ~5° off radial
  const cutB = { p: new THREE.Vector3(-A + RHO * Math.cos(CUT_END), RHO * Math.sin(CUT_END), 0), n: new THREE.Vector3(-endDir.y, endDir.x, 0) }
  if (cutB.n.dot(path.tangent(1)) < 0) cutB.n.negate()
  // the upper cut is oblique: on the inner edge it reaches a little into the "\" strand
  const startZone = (RHO * OVERRUN + 18) / path.length
  const endZone = 1 - startZone

  const rows = tubular + 1
  const cols = radial + 1
  const pos = new Float32Array(rows * cols * 3)
  const nor = new Float32Array(rows * cols * 3)
  const uv = new Float32Array(rows * cols * 2)
  const P = new THREE.Vector3()
  const T = new THREE.Vector3()
  const N = new THREE.Vector3()
  const B = new THREE.Vector3()
  const Z = new THREE.Vector3(0, 0, 1)
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  const ringStart: Rim[] = []
  const ringEnd: Rim[] = []

  for (let i = 0; i < rows; i++) {
    const u = i / tubular
    path.at(u, P)
    path.tangent(u, T)
    N.crossVectors(Z, T).normalize()
    B.crossVectors(T, N)
    for (let j = 0; j < cols; j++) {
      const a = (j / radial) * Math.PI * 2
      const c = Math.cos(a)
      const s = Math.sin(a)
      v.copy(P).addScaledVector(N, RT * c).addScaledVector(B, RZ * s)
      n.copy(N).multiplyScalar(c / RT).addScaledVector(B, s / RZ).normalize()
      // fold anything past a cut back onto the cut plane (along the path)
      if (u < startZone) {
        const d = v.clone().sub(cutA.p).dot(cutA.n)
        if (d > 0) v.addScaledVector(T, -d / T.dot(cutA.n))
      } else if (u > endZone) {
        const d = v.clone().sub(cutB.p).dot(cutB.n)
        if (d > 0) v.addScaledVector(T, -d / T.dot(cutB.n))
      }
      const k = (i * cols + j) * 3
      pos[k] = v.x
      pos[k + 1] = v.y
      pos[k + 2] = v.z
      nor[k] = n.x
      nor[k + 1] = n.y
      nor[k + 2] = n.z
      uv[(i * cols + j) * 2] = u
      uv[(i * cols + j) * 2 + 1] = j / radial
      if (i === 0 && j < radial) ringStart.push({ p: v.clone(), n: n.clone() })
      if (i === rows - 1 && j < radial) ringEnd.push({ p: v.clone(), n: n.clone() })
    }
  }

  const index: number[] = []
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * cols + j
      const b = i * cols + j + 1
      const c = (i + 1) * cols + j
      const d = (i + 1) * cols + j + 1
      index.push(a, b, c, b, d, c)
    }
  }

  // Flat ends on the cut planes, with a small rounded fillet so the edge reads as polished glass.
  const capPos: number[] = []
  const capNor: number[] = []
  const capIndex: number[] = []
  const base = rows * cols
  const cap = (ring: Rim[], normal: THREE.Vector3) => {
    const first = base + capPos.length / 3
    const m = ring.length
    const centre = ring.reduce((acc, r) => acc.add(r.p), new THREE.Vector3()).divideScalar(m)
    const inward = new THREE.Vector3()
    const q = new THREE.Vector3()
    const qn = new THREE.Vector3()
    for (let k = 0; k <= FILLET_STEPS; k++) {
      const a = (k / FILLET_STEPS) * (Math.PI / 2)
      for (const r of ring) {
        inward.subVectors(centre, r.p)
        inward.addScaledVector(normal, -inward.dot(normal)).normalize()
        q.copy(r.p)
          .addScaledVector(inward, FILLET * (1 - Math.cos(a)))
          .addScaledVector(normal, FILLET * Math.sin(a))
        qn.copy(r.n).multiplyScalar(Math.cos(a)).addScaledVector(normal, Math.sin(a)).normalize()
        capPos.push(q.x, q.y, q.z)
        capNor.push(qn.x, qn.y, qn.z)
      }
    }
    const tip = centre.clone().addScaledVector(normal, FILLET)
    const centreIndex = first + (FILLET_STEPS + 1) * m
    capPos.push(tip.x, tip.y, tip.z)
    capNor.push(normal.x, normal.y, normal.z)
    // pick the winding that faces outwards
    const at = (k: number, j: number) => first + k * m + (j % m)
    const P = (i: number) => new THREE.Vector3(capPos[(i - base) * 3], capPos[(i - base) * 3 + 1], capPos[(i - base) * 3 + 2])
    const e1 = P(at(0, 1)).sub(P(at(0, 0)))
    const e2 = P(at(1, 0)).sub(P(at(0, 0)))
    const flip = e1.cross(e2).dot(ring[0].n) < 0
    const tri = (a: number, b: number, c: number) => (flip ? capIndex.push(a, c, b) : capIndex.push(a, b, c))
    for (let k = 0; k < FILLET_STEPS; k++) {
      for (let j = 0; j < m; j++) {
        tri(at(k, j), at(k, j + 1), at(k + 1, j))
        tri(at(k, j + 1), at(k + 1, j + 1), at(k + 1, j))
      }
    }
    for (let j = 0; j < m; j++) tri(at(FILLET_STEPS, j), at(FILLET_STEPS, j + 1), centreIndex)
  }
  cap(ringStart, cutA.n)
  cap(ringEnd, cutB.n)

  const total = base + capPos.length / 3
  const outPos = new Float32Array(total * 3)
  const outNor = new Float32Array(total * 3)
  const outUv = new Float32Array(total * 2)
  outPos.set(pos)
  outPos.set(capPos, pos.length)
  outNor.set(nor)
  outNor.set(capNor, nor.length)
  outUv.set(uv)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(outPos, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(outNor, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(outUv, 2))
  geo.setIndex([...index, ...capIndex])
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
