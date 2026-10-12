import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ARROW_CENTRE_PDF, ARROW_D } from '../lib/loopShape'
import { ARROW_HOME, ARROW_POINTING, ICON_OFFSET, ICON_SCALE, createFlightPath, createLoopGeometry } from '../pages/home/loopIcon'
import { WORD } from './wordmark'
import type { WordLayout, WordState } from './Word3D'

/*
 * The 3D half of the "Take Shape" loading screen: the letters of "osloop" extruded from the official
 * artwork, the ∞ of the hero (same geometry, solid instead of glass) and the orange play arrow.
 * World units are icon units, centred on the word, y up. The DOM half drives everything through `st`.
 */

type Theme = 'light' | 'dark'
type P = [number, number]

const INK: Record<Theme, string> = { light: '#0b3cb7', dark: '#ffffff' }
/** letters: flat faces with rounded edges, as deep as the ∞ tube (2 × RT × 0.82) */
const DEPTH = 7.4
const BEVEL_T = 6.2
const BEVEL_S = 4
/** the p's stem lies over its bowl, like the "/" strand of the ∞ */
const STEM_LIFT = 3
/** the p's bowl as a full ring (icon units, y down) */
const P_BOWL = { x: 129.66, y: 0.87, R: 41.32, r: 16.77 }
/** how far the arrow rises off the ∞ while it rides it */
const RIDE_LIFT = 34
const HEADINGS = 720
const TAU = Math.PI * 2
const smoothstep = THREE.MathUtils.smoothstep
const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

/** SVG path (absolute M/L/C/Z) → closed polylines, Béziers sampled about every `step` units */
function polylines(d: string, step: number): P[][] {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g)!
  const out: P[][] = []
  let cur: P[] = []
  let last: P = [0, 0]
  let i = 0
  const num = () => parseFloat(tok[i++])
  const push = (p: P) => {
    const q = cur[cur.length - 1]
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.2) cur.push(p)
  }
  while (i < tok.length) {
    const c = tok[i++]
    if (c === 'M') {
      if (cur.length) out.push(cur)
      last = [num(), num()]
      cur = [last]
    } else if (c === 'L') {
      last = [num(), num()]
      push(last)
    } else if (c === 'C') {
      const p0 = last
      const p1: P = [num(), num()]
      const p2: P = [num(), num()]
      const p3: P = [num(), num()]
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1])
      const n = Math.max(2, Math.ceil(len / step))
      for (let k = 1; k <= n; k++) {
        const t = k / n
        const u = 1 - t
        const a = u * u * u
        const b = 3 * u * u * t
        const e = 3 * u * t * t
        const f = t * t * t
        push([a * p0[0] + b * p1[0] + e * p2[0] + f * p3[0], a * p0[1] + b * p1[1] + e * p2[1] + f * p3[1]])
      }
      last = p3
    }
  }
  if (cur.length) out.push(cur)
  for (const poly of out) {
    const a = poly[0]
    const b = poly[poly.length - 1]
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.2) poly.pop()
  }
  return out
}

const area = (poly: P[]) => poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0) / 2

/**
 * Rounds the needle-sharp tips (the foot of the L, the ends of the p's stem) with a small fillet: a
 * rounded bevel can only follow a corner whose radius is at least the bevel's own.
 */
function roundTips(poly: P[], radius: number, maxDeg = 75): P[] {
  let pts = poly
  const sign = Math.sign(area(poly))
  for (let pass = 0; pass < 6; pass++) {
    const n = pts.length
    let best = -1
    let angle = (maxDeg * Math.PI) / 180
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n]
      const p = pts[i]
      const b = pts[(i + 1) % n]
      const turn = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])
      if (Math.sign(turn) !== sign) continue // inner corner
      const ux = a[0] - p[0]
      const uy = a[1] - p[1]
      const vx = b[0] - p[0]
      const vy = b[1] - p[1]
      const t = Math.acos(THREE.MathUtils.clamp((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy)), -1, 1))
      if (t < angle) {
        angle = t
        best = i
      }
    }
    if (best < 0) return pts
    // walk `d` along the outline both ways from the tip: that's where the fillet touches it
    const d = radius / Math.tan(angle / 2)
    const tip = pts[best]
    const walk = (dir: number) => {
      let left = d
      let cur = tip
      for (let j = best, steps = 0; steps < n; steps++) {
        const k = (j + dir + n) % n
        const q = pts[k]
        const seg = Math.hypot(q[0] - cur[0], q[1] - cur[1])
        if (seg >= left) return { k, p: [cur[0] + ((q[0] - cur[0]) * left) / seg, cur[1] + ((q[1] - cur[1]) * left) / seg] as P }
        left -= seg
        cur = q
        j = k
      }
      return null
    }
    const A = walk(-1)
    const B = walk(1)
    if (!A || !B) return pts
    const u = new THREE.Vector2(A.p[0] - tip[0], A.p[1] - tip[1]).normalize()
    const v = new THREE.Vector2(B.p[0] - tip[0], B.p[1] - tip[1]).normalize()
    const c = u.clone().add(v).normalize().multiplyScalar(radius / Math.sin(angle / 2)).add(new THREE.Vector2(tip[0], tip[1]))
    const a0 = Math.atan2(A.p[1] - c.y, A.p[0] - c.x)
    let da = Math.atan2(B.p[1] - c.y, B.p[0] - c.x) - a0
    while (da > Math.PI) da -= Math.PI * 2
    while (da < -Math.PI) da += Math.PI * 2
    const m = Math.max(4, Math.ceil((Math.abs(da) * radius) / 0.6))
    const arc = Array.from({ length: m + 1 }, (_, s): P => [c.x + radius * Math.cos(a0 + (da * s) / m), c.y + radius * Math.sin(a0 + (da * s) / m)])
    const kept: P[] = []
    for (let k = B.k; ; k = (k + 1) % n) {
      kept.push(pts[k])
      if (k === A.k) break
    }
    pts = [...kept, ...arc]
  }
  return pts
}

/** a full ring (outer + hole) as polylines */
function ring(x: number, y: number, R: number, r: number, step: number): P[][] {
  const circle = (rad: number) => {
    const n = Math.ceil((Math.PI * 2 * rad) / step)
    return Array.from({ length: n }, (_, i): P => [x + rad * Math.cos((i / n) * Math.PI * 2), y + rad * Math.sin((i / n) * Math.PI * 2)])
  }
  return [circle(R), circle(r)]
}

/** one piece of a letter (an SVG path, or ready-made polylines) → a solid with rounded edges, centred in depth */
function extrude(d: string | P[][], cx: number, cy: number, step: number) {
  const polys = typeof d === 'string' ? polylines(d, step) : d
  const toWorld = (p: P) => new THREE.Vector2(p[0] - cx, -(p[1] - cy))
  const order = polys.map((p, i) => ({ i, a: Math.abs(area(p)) })).sort((a, b) => b.a - a.a)
  const shape = new THREE.Shape(roundTips(polys[order[0].i], BEVEL_S + 0.2).map(toWorld))
  shape.holes = order.slice(1).map(({ i }) => new THREE.Path(polys[i].map(toWorld)))
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_T,
    bevelSize: BEVEL_S,
    bevelOffset: -BEVEL_S,
    bevelSegments: 5,
    steps: 1,
  })
  geo.translate(0, 0, -DEPTH / 2)
  const smooth = toCreasedNormals(geo, 0.6)
  geo.dispose()
  return smooth
}

/** the play arrow at the wordmark's size (the icon draws it 0.942×), centred on itself */
function arrowGeometry() {
  const shape = new THREE.Shape()
  const tok = ARROW_D.match(/[MLCZ]|-?\d*\.?\d+/g)!
  const map = (x: number, y: number) => new THREE.Vector2(x - ARROW_CENTRE_PDF.x, -(y - ARROW_CENTRE_PDF.y))
  let i = 0
  const num = () => parseFloat(tok[i++])
  while (i < tok.length) {
    const c = tok[i++]
    if (c === 'M') {
      const p = map(num(), num())
      shape.moveTo(p.x, p.y)
    } else if (c === 'L') {
      const p = map(num(), num())
      shape.lineTo(p.x, p.y)
    } else if (c === 'C') {
      const a = map(num(), num())
      const b = map(num(), num())
      const e = map(num(), num())
      shape.bezierCurveTo(a.x, a.y, b.x, b.y, e.x, e.y)
    }
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 9,
    bevelEnabled: true,
    bevelThickness: 2.6,
    bevelSize: 2.6,
    bevelOffset: -2.6,
    bevelSegments: 6,
    curveSegments: 28,
  })
  geo.translate(0, 0, -4.5)
  const smooth = toCreasedNormals(geo, 0.6)
  geo.dispose()
  return smooth
}

type Group = { pieces: THREE.BufferGeometry[]; lift?: number[]; centre: THREE.Vector3 }

/** builds the five groups (o, s, L, ∞ + arrow, p) a little at a time, so the 2D intro stays smooth */
function useWordGeometry(layout: WordLayout, mobile: boolean) {
  const [groups, setGroups] = useState<Group[] | null>(null)
  useEffect(() => {
    const { cx, cy } = layout
    const step = mobile ? 1.8 : 1.2
    const centred = (pieces: THREE.BufferGeometry[]) => {
      const box = new THREE.Box3()
      for (const g of pieces) {
        g.computeBoundingBox()
        box.union(g.boundingBox!)
      }
      const c = box.getCenter(new THREE.Vector3()).setZ(0)
      for (const g of pieces) g.translate(-c.x, -c.y, 0)
      return c
    }
    const letter = (paths: readonly (string | P[][])[], lift?: number[]): Group => {
      const pieces = paths.map((d) => extrude(d, cx, cy, step))
      return { pieces, lift, centre: centred(pieces) }
    }
    const jobs: (() => Group)[] = [
      () => letter(WORD.o),
      () => letter(WORD.s),
      () => letter(WORD.L),
      () => {
        // the hero's ∞, back in icon units, then placed in the word
        const loop = createLoopGeometry(mobile ? 300 : 520, mobile ? 32 : 56)
        loop.scale(1 / ICON_SCALE, 1 / ICON_SCALE, 1 / ICON_SCALE)
        loop.translate(-ICON_OFFSET.x - cx, -ICON_OFFSET.y + cy, 0)
        loop.computeBoundingBox()
        const centre = loop.boundingBox!.getCenter(new THREE.Vector3()).setZ(0)
        loop.translate(-centre.x, -centre.y, 0)
        return { pieces: [loop, arrowGeometry()], centre }
      },
      // the artwork cuts the bowl along the stem, which leaves it paper-thin beside the hole; in 3D the
      // whole ring passes under the stem instead (same silhouette from the front)
      () => letter([ring(P_BOWL.x, P_BOWL.y, P_BOWL.R, P_BOWL.r, step), WORD.p[1]], [0, STEM_LIFT]),
    ]
    const out: Group[] = []
    let alive = true
    let raf = 0
    const next = () => {
      if (!alive) return
      out.push(jobs[out.length]())
      if (out.length < jobs.length) raf = requestAnimationFrame(next)
      else setGroups(out)
    }
    raf = requestAnimationFrame(next)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      for (const g of out) for (const p of g.pieces) p.dispose()
    }
  }, [layout, mobile])
  return groups
}

function Word({ st, layout, theme, mobile, onReady }: SceneProps) {
  const groups = useWordGeometry(layout, mobile)
  const word = useRef<THREE.Group>(null)
  const nodes = useRef<(THREE.Group | null)[]>([])
  const scalers = useRef<(THREE.Object3D | null)[][]>([[], [], [], [], []])
  const arrow = useRef<THREE.Mesh>(null)
  const frames = useRef(0)

  // the arrow's ride around the ∞ — the same flight as in the hero
  const flight = useMemo(() => {
    const path = createFlightPath()
    const start = path.at(0)
    const headings = new Float32Array(HEADINGS + 1)
    const t = new THREE.Vector3()
    let prev = 0
    for (let i = 0; i <= HEADINGS; i++) {
      path.tangent(i / HEADINGS, t)
      let a = Math.atan2(t.y, t.x)
      if (i) {
        while (a - prev > Math.PI) a -= TAU
        while (a - prev < -Math.PI) a += TAU
      }
      headings[i] = a
      prev = a
    }
    return { path, start, headings, p: new THREE.Vector3() }
  }, [])
  // the arrow's rest position inside the ∞ group
  const home = useMemo(() => {
    if (!groups) return new THREE.Vector3()
    const c = groups[3].centre
    return new THREE.Vector3(ARROW_HOME.x - layout.cx - c.x, ARROW_HOME.y + layout.cy - c.y, 0)
  }, [groups, layout])

  useFrame(() => {
    if (!groups || !word.current) return
    if (frames.current < 3 && ++frames.current === 3) onReady()
    const s = st.current
    word.current.rotation.set(s.rx, s.ry, 0)
    word.current.scale.setScalar(s.zoom)
    groups.forEach((g, i) => {
      const n = nodes.current[i]
      if (!n) return
      // exit: the letters burst towards the camera and spread off the screen
      const e = s.exit[i]
      const side = Math.sign(g.centre.x) || 1
      n.position.set(g.centre.x * (1 + e * 1.4) + side * e * 60, g.centre.y * (1 + e) - e * 20, e * layout.dist * 0.72)
      n.rotation.set(e * 0.35, side * e * 0.85, side * e * 0.18)
      for (const m of scalers.current[i]) if (m) m.scale.z = Math.max(0.012, s.depth[i])
    })

    // the ride: lift off, once around the ∞, land back in the slot
    const a = arrow.current
    if (!a) return
    const x = s.ride
    if (x <= 0 || x >= 1) {
      a.position.copy(home)
      a.rotation.set(0, 0, 0)
      a.scale.set(1, 1, Math.max(0.012, s.depth[3]))
      return
    }
    const { path, start, headings, p } = flight
    const u = smootherstep(x)
    const w = smoothstep(x, 0, 0.16) * smoothstep(1 - x, 0, 0.16)
    path.at(u, p)
    a.position.set(home.x + p.x - start.x, home.y + p.y - start.y, RIDE_LIFT * w)
    const f = u * HEADINGS
    const i0 = Math.min(HEADINGS - 1, Math.floor(f))
    const heading = THREE.MathUtils.lerp(headings[i0], headings[i0 + 1], f - i0)
    a.rotation.set(0.35 * Math.sin(Math.PI * x) * w, 0, (heading - ARROW_POINTING) * w)
    a.scale.setScalar(1 + 0.12 * w)
  })

  if (!groups) return null
  return (
    <group ref={word}>
      {groups.map((g, i) => (
        <group key={i} ref={(n) => void (nodes.current[i] = n)} position={g.centre}>
          {g.pieces.map((geo, k) =>
            i === 3 && k === 1 ? (
              <mesh key={k} ref={arrow} geometry={geo} position={home}>
                {/* not tone-mapped, so it stays the logo's own orange */}
                <meshPhysicalMaterial color="#ffae23" roughness={0.26} clearcoat={1} clearcoatRoughness={0.06} emissive="#ffa21a" emissiveIntensity={0.55} envMapIntensity={0.7} toneMapped={false} />
              </mesh>
            ) : (
              <mesh key={k} ref={(m) => void (scalers.current[i][k] = m)} geometry={geo} position={[0, 0, g.lift?.[k] ?? 0]}>
                <meshPhysicalMaterial
                  color={INK[theme]}
                  roughness={0.36}
                  metalness={0.04}
                  clearcoat={1}
                  clearcoatRoughness={0.28}
                  envMapIntensity={theme === 'dark' ? 1.5 : 1.35}
                  emissive={theme === 'dark' ? '#9fb0e6' : '#000000'}
                  emissiveIntensity={theme === 'dark' ? 0.16 : 0}
                />
              </mesh>
            ),
          )}
        </group>
      ))}
    </group>
  )
}

type SceneProps = {
  st: MutableRefObject<WordState>
  layout: WordLayout
  theme: Theme
  mobile: boolean
  onReady: () => void
}

export default function WordScene(props: SceneProps) {
  const { layout, mobile } = props
  return (
    <Canvas
      dpr={[1, mobile ? 1.6 : 2]}
      camera={{ fov: layout.fov, position: [0, 0, layout.dist], near: layout.dist * 0.05, far: layout.dist * 4 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        // keeps the brand blue and orange true to the logo
        gl.toneMapping = THREE.NeutralToneMapping
      }}
    >
      <Word {...props} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-0.5, 0.9, 1.3]} intensity={1.7} />
      <Environment resolution={256} frames={1}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color="#2c5bff" intensity={40} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
          <Lightformer form="rect" color="#ffb547" intensity={1.6} position={[-10, -4, 4]} scale={[8, 2, 1]} />
        </group>
      </Environment>
    </Canvas>
  )
}
