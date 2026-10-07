import * as THREE from 'three'

/**
 * Particle formations for the story. Every generator returns `count` xyz triplets,
 * so any shape can morph into any other on the GPU.
 */

export type ShapeName =
  | 'spark'
  | 'galaxy'
  | 'page'
  | 'storyboard'
  | 'wave'
  | 'loop'
  | 'crystal'
  | 'globe'
  | 'ripples'
  | 'logo'
  | 'field'
  | 'brush'
  | 'burst'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(20261007)
const gauss = () => {
  const u = 1 - rnd()
  const v = rnd()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const onSphere = (out: THREE.Vector3) => {
  const u = rnd() * 2 - 1
  const a = rnd() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  return out.set(s * Math.cos(a), u, s * Math.sin(a))
}

type Seg = [number, number, number, number, number, number] // x1 y1 z1 x2 y2 z2

/** Picks points along line segments, weighted by length. */
function segmentSampler(segs: Seg[]) {
  const lens = segs.map(([a, b, c, d, e, f]) => Math.hypot(d - a, e - b, f - c))
  const total = lens.reduce((s, l) => s + l, 0)
  const cum: number[] = []
  lens.reduce((s, l, i) => ((cum[i] = s + l), s + l), 0)
  return (out: number[], jitter = 0.012) => {
    const r = rnd() * total
    let i = cum.findIndex((c) => c >= r)
    if (i < 0) i = segs.length - 1
    const [a, b, c, d, e, f] = segs[i]
    const t = rnd()
    out[0] = a + (d - a) * t + gauss() * jitter
    out[1] = b + (e - b) * t + gauss() * jitter
    out[2] = c + (f - c) * t + gauss() * jitter
    return out
  }
}

function circleSegs(cx: number, cy: number, r: number, n = 40, z = 0): Seg[] {
  const segs: Seg[] = []
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2
    const a2 = ((i + 1) / n) * Math.PI * 2
    segs.push([cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, z])
  }
  return segs
}

function rectSegs(cx: number, cy: number, w: number, h: number, z = 0): Seg[] {
  const x0 = cx - w / 2
  const x1 = cx + w / 2
  const y0 = cy - h / 2
  const y1 = cy + h / 2
  return [
    [x0, y0, z, x1, y0, z],
    [x1, y0, z, x1, y1, z],
    [x1, y1, z, x0, y1, z],
    [x0, y1, z, x0, y0, z],
  ]
}

const gen: Record<Exclude<ShapeName, 'logo'>, (n: number) => Float32Array> = {
  spark(n) {
    const a = new Float32Array(n * 3)
    const v = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      onSphere(v)
      const core = i < n * 0.58
      const r = core ? 0.62 * Math.pow(rnd(), 1.6) : 0.75 + 2.6 * Math.pow(rnd(), 2.4)
      v.multiplyScalar(r)
      a.set([v.x, v.y, v.z], i * 3)
    }
    return a
  },

  galaxy(n) {
    const a = new Float32Array(n * 3)
    const arms = 3
    for (let i = 0; i < n; i++) {
      if (i < n * 0.12) {
        a.set([gauss() * 0.28, gauss() * 0.16, gauss() * 0.28], i * 3)
        continue
      }
      const r = Math.pow(rnd(), 1.25) * 3.4 + 0.15
      const branch = ((i % arms) / arms) * Math.PI * 2
      const spin = r * 1.15
      const spread = 0.45 * (0.3 + r * 0.25)
      const ox = Math.pow(rnd(), 3) * (rnd() < 0.5 ? 1 : -1) * spread
      const oy = Math.pow(rnd(), 3) * (rnd() < 0.5 ? 1 : -1) * spread * 0.45
      const oz = Math.pow(rnd(), 3) * (rnd() < 0.5 ? 1 : -1) * spread
      a.set([Math.cos(branch + spin) * r + ox, oy, Math.sin(branch + spin) * r + oz], i * 3)
    }
    return a
  },

  page(n) {
    const a = new Float32Array(n * 3)
    const W = 2.3
    const H = 3.0
    const border = segmentSampler(rectSegs(0, 0, W, H))
    // a folded corner hint
    const fold = segmentSampler([[W / 2 - 0.35, H / 2, 0, W / 2, H / 2 - 0.35, 0]])
    // text lines: title + paragraphs
    const lines: { y: number; x0: number; x1: number; thick: number }[] = []
    const left = -W / 2 + 0.28
    const right = W / 2 - 0.28
    lines.push({ y: H / 2 - 0.42, x0: left, x1: left + 1.2, thick: 0.05 })
    let y = H / 2 - 0.78
    for (let p = 0; p < 4; p++) {
      const rows = 3 + (p % 2)
      for (let r = 0; r < rows; r++) {
        const last = r === rows - 1
        lines.push({ y, x0: left, x1: last ? left + (right - left) * (0.35 + rnd() * 0.4) : right, thick: 0.018 })
        y -= 0.17
      }
      y -= 0.16
    }
    const lineWeights = lines.map((l) => (l.x1 - l.x0) * (l.thick > 0.03 ? 2 : 1))
    const lw = lineWeights.reduce((s, w) => s + w, 0)
    const tmp: number[] = [0, 0, 0]
    for (let i = 0; i < n; i++) {
      const k = rnd()
      if (k < 0.14) {
        border(tmp, 0.01)
        a.set(tmp, i * 3)
      } else if (k < 0.17) {
        fold(tmp, 0.01)
        a.set(tmp, i * 3)
      } else if (k < 0.9) {
        let r = rnd() * lw
        let li = 0
        while (r > lineWeights[li] && li < lines.length - 1) r -= lineWeights[li++]
        const l = lines[li]
        let x = l.x0 + rnd() * (l.x1 - l.x0)
        // carve word gaps
        for (let tries = 0; tries < 4 && Math.sin(x * 23 + li * 5.1) > 0.72; tries++) x = l.x0 + rnd() * (l.x1 - l.x0)
        a.set([x, l.y + gauss() * l.thick * 0.5, gauss() * 0.015], i * 3)
      } else {
        a.set([(rnd() - 0.5) * W, (rnd() - 0.5) * H, gauss() * 0.04], i * 3)
      }
    }
    return a
  },

  storyboard(n) {
    const a = new Float32Array(n * 3)
    const fw = 1.5
    const fh = 0.95
    const g = 0.24
    const frames: { cx: number; cy: number }[] = []
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) frames.push({ cx: (c - 1) * (fw + g), cy: (0.5 - r) * (fh + g) })
    const outlines = frames.map((f) => segmentSampler(rectSegs(f.cx, f.cy, fw, fh)))
    const sketches = frames.map((f, k) => {
      const { cx, cy } = f
      const s: Seg[] = []
      if (k === 0) {
        s.push(...circleSegs(cx + 0.38, cy + 0.18, 0.14, 24))
        s.push([cx - 0.65, cy - 0.2, 0, cx + 0.65, cy - 0.2, 0])
      } else if (k === 1) {
        s.push(...circleSegs(cx, cy + 0.22, 0.1, 20))
        s.push([cx, cy + 0.12, 0, cx, cy - 0.15, 0], [cx, cy - 0.15, 0, cx - 0.12, cy - 0.38, 0], [cx, cy - 0.15, 0, cx + 0.12, cy - 0.38, 0])
        s.push([cx - 0.18, cy + 0.02, 0, cx + 0.18, cy + 0.02, 0])
      } else if (k === 2) {
        s.push([cx - 0.65, cy - 0.35, 0, cx - 0.2, cy + 0.25, 0], [cx - 0.2, cy + 0.25, 0, cx + 0.1, cy - 0.1, 0])
        s.push([cx + 0.1, cy - 0.1, 0, cx + 0.35, cy + 0.15, 0], [cx + 0.35, cy + 0.15, 0, cx + 0.65, cy - 0.35, 0])
      } else if (k === 3) {
        for (let l = 0; l < 3; l++) s.push([cx - 0.55, cy + 0.2 - l * 0.2, 0, cx + 0.2 - l * 0.12, cy + 0.2 - l * 0.2, 0])
        s.push([cx + 0.3, cy + 0.25, 0, cx + 0.55, cy, 0], [cx + 0.55, cy, 0, cx + 0.3, cy - 0.25, 0])
      } else if (k === 4) {
        s.push(...circleSegs(cx - 0.25, cy + 0.15, 0.09, 18), ...circleSegs(cx + 0.25, cy + 0.15, 0.09, 18))
        s.push([cx - 0.25, cy + 0.06, 0, cx - 0.25, cy - 0.3, 0], [cx + 0.25, cy + 0.06, 0, cx + 0.25, cy - 0.3, 0])
        s.push(...circleSegs(cx, cy + 0.3, 0.06, 12))
      } else {
        s.push([cx - 0.15, cy - 0.25, 0, cx - 0.15, cy + 0.25, 0], [cx - 0.15, cy + 0.25, 0, cx + 0.25, cy, 0])
        s.push([cx + 0.25, cy, 0, cx - 0.15, cy - 0.25, 0])
      }
      return segmentSampler(s)
    })
    const tmp: number[] = [0, 0, 0]
    for (let i = 0; i < n; i++) {
      const k = i % 6
      if (rnd() < 0.5) outlines[k](tmp, 0.008)
      else sketches[k](tmp, 0.014)
      a.set(tmp, i * 3)
    }
    return a
  },

  wave(n) {
    const a = new Float32Array(n * 3)
    const bars = 84
    const width = 6.4
    const heights: number[] = []
    for (let b = 0; b < bars; b++) {
      const x = (b / (bars - 1) - 0.5) * width
      const env = Math.exp(-Math.pow(x / 2.1, 2))
      heights.push((0.12 + 1.25 * env) * (0.35 + 0.65 * Math.abs(Math.sin(b * 0.73) * Math.cos(b * 0.29 + 1.3))))
    }
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.1) {
        a.set([(rnd() - 0.5) * width * 1.05, gauss() * 0.01, gauss() * 0.02], i * 3)
        continue
      }
      const b = Math.floor(rnd() * bars)
      const x = (b / (bars - 1) - 0.5) * width + gauss() * 0.012
      const h = heights[b]
      a.set([x, (rnd() * 2 - 1) * h, gauss() * 0.05], i * 3)
    }
    return a
  },

  loop(n) {
    const a = new Float32Array(n * 3)
    const p = new THREE.Vector3()
    const q = new THREE.Vector3()
    const tan = new THREE.Vector3()
    const off = new THREE.Vector3()
    const curve = (t: number, out: THREE.Vector3) => {
      const ang = t * Math.PI * 2
      const s = Math.sin(ang)
      const c = Math.cos(ang)
      const d = 1 + s * s
      return out.set((2.8 * c) / d, (2.8 * s * c) / d, 0.7 * s)
    }
    for (let i = 0; i < n; i++) {
      const t = rnd()
      curve(t, p)
      curve(t + 0.001, q)
      tan.subVectors(q, p).normalize()
      onSphere(off)
      off.addScaledVector(tan, -off.dot(tan)).normalize()
      const k = rnd()
      const r = k < 0.72 ? 0.36 + gauss() * 0.015 : k < 0.9 ? 0.36 * Math.sqrt(rnd()) : 0.5 + rnd() * 0.5
      p.addScaledVector(off, r)
      a.set([p.x, p.y, p.z], i * 3)
    }
    return a
  },

  crystal(n) {
    const a = new Float32Array(n * 3)
    const toSegs = (geo: THREE.BufferGeometry): Seg[] => {
      const e = new THREE.EdgesGeometry(geo)
      const pos = e.attributes.position.array as Float32Array
      const s: Seg[] = []
      for (let i = 0; i < pos.length; i += 6) s.push([pos[i], pos[i + 1], pos[i + 2], pos[i + 3], pos[i + 4], pos[i + 5]])
      e.dispose()
      geo.dispose()
      return s
    }
    const outer = toSegs(new THREE.IcosahedronGeometry(2.05, 0))
    const inner = toSegs(new THREE.OctahedronGeometry(0.95, 0))
    const outerS = segmentSampler(outer)
    const innerS = segmentSampler(inner)
    const verts: number[][] = []
    outer.forEach((s) => verts.push([s[0], s[1], s[2]]))
    const tmp: number[] = [0, 0, 0]
    for (let i = 0; i < n; i++) {
      const k = rnd()
      if (k < 0.55) outerS(tmp, 0.012)
      else if (k < 0.8) innerS(tmp, 0.01)
      else if (k < 0.9) {
        const v = verts[Math.floor(rnd() * verts.length)]
        tmp[0] = v[0] + gauss() * 0.05
        tmp[1] = v[1] + gauss() * 0.05
        tmp[2] = v[2] + gauss() * 0.05
      } else {
        const v = onSphere(new THREE.Vector3()).multiplyScalar(Math.pow(rnd(), 0.6) * 1.5)
        tmp[0] = v.x
        tmp[1] = v.y
        tmp[2] = v.z
      }
      a.set(tmp, i * 3)
    }
    return a
  },

  globe(n) {
    const a = new Float32Array(n * 3)
    const R = 1.95
    const v = new THREE.Vector3()
    const tilt = new THREE.Matrix4().makeRotationX(0.42).multiply(new THREE.Matrix4().makeRotationZ(0.18))
    for (let i = 0; i < n; i++) {
      const k = rnd()
      if (k < 0.34) {
        const lat = ((Math.floor(rnd() * 9) - 4) * 20 * Math.PI) / 180
        const lon = rnd() * Math.PI * 2
        v.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).multiplyScalar(R)
      } else if (k < 0.6) {
        const lon = (Math.floor(rnd() * 12) / 12) * Math.PI * 2
        const lat = (rnd() - 0.5) * Math.PI
        v.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).multiplyScalar(R)
      } else if (k < 0.84) {
        onSphere(v).multiplyScalar(R + gauss() * 0.02)
      } else {
        const ang = rnd() * Math.PI * 2
        const r = 2.75 + gauss() * 0.06
        v.set(Math.cos(ang) * r, gauss() * 0.02, Math.sin(ang) * r).applyMatrix4(tilt)
      }
      a.set([v.x, v.y, v.z], i * 3)
    }
    return a
  },

  ripples(n) {
    const a = new Float32Array(n * 3)
    const rings = [0.35, 0.8, 1.3, 1.85, 2.4, 3.0, 3.6]
    const weights = rings.map((r) => r)
    const wsum = weights.reduce((s, w) => s + w, 0)
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.06) {
        a.set([gauss() * 0.12, gauss() * 0.12, gauss() * 0.12], i * 3)
        continue
      }
      let r = rnd() * wsum
      let k = 0
      while (r > weights[k] && k < rings.length - 1) r -= weights[k++]
      const rad = rings[k] + gauss() * 0.025
      const ang = rnd() * Math.PI * 2
      a.set([Math.cos(ang) * rad, Math.sin(rad * 2.2) * 0.12 + gauss() * 0.015, Math.sin(ang) * rad], i * 3)
    }
    return a
  },

  /** A hand-drawn brush stroke with pressure variation — "Illustrations" */
  brush(n) {
    const a = new Float32Array(n * 3)
    const stroke = (t: number) => {
      const x = (t - 0.5) * 5.4
      const y = Math.sin(t * Math.PI * 2.1 + 0.4) * 0.85 + Math.sin(t * 11) * 0.08
      return [x, y]
    }
    for (let i = 0; i < n; i++) {
      const k = rnd()
      if (k < 0.82) {
        const t = rnd()
        const [x, y] = stroke(t)
        const [x2, y2] = stroke(t + 0.002)
        const nx = -(y2 - y)
        const ny = x2 - x
        const nl = Math.hypot(nx, ny) || 1
        // pressure: thick in the middle, tapered ends
        const w = 0.05 + 0.32 * Math.sin(Math.PI * t) ** 0.8
        const o = (rnd() * 2 - 1) * w
        a.set([x + (nx / nl) * o, y + (ny / nl) * o, gauss() * 0.05], i * 3)
      } else if (k < 0.92) {
        // ink splatter
        const t = rnd()
        const [x, y] = stroke(t)
        a.set([x + gauss() * 0.5, y + gauss() * 0.5, gauss() * 0.1], i * 3)
      } else {
        // pencil tip
        const t = rnd()
        a.set([2.75 + t * 0.9, -0.15 - t * 0.9 + gauss() * 0.03 * (1 - t), gauss() * 0.03], i * 3)
      }
    }
    return a
  },

  /** Radial streaks — an explosion frozen in time — "VFX" */
  burst(n) {
    const a = new Float32Array(n * 3)
    const rays = 90
    const dirs: THREE.Vector3[] = []
    for (let i = 0; i < rays; i++) dirs.push(onSphere(new THREE.Vector3()))
    const v = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.18) {
        onSphere(v).multiplyScalar(Math.pow(rnd(), 2) * 0.45)
      } else {
        const d = dirs[Math.floor(rnd() * rays)]
        const len = 0.5 + Math.pow(rnd(), 0.7) * (1.6 + (d.x * 0.5 + 0.5) * 1.2)
        v.copy(d).multiplyScalar(len)
        v.x += gauss() * 0.02 * len
        v.y += gauss() * 0.02 * len
        v.z += gauss() * 0.02 * len
      }
      a.set([v.x, v.y, v.z], i * 3)
    }
    return a
  },

  field(n) {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) a.set([(rnd() - 0.5) * 18, (rnd() - 0.5) * 11, -9 + rnd() * 11], i * 3)
    return a
  },
}

/** "osloop" wordmark sampled from a canvas. Requires the display font to be loaded. */
export function logoShape(n: number, family = '"Inter Tight Variable", "Inter Tight", sans-serif') {
  const w = 1400
  const h = 420
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 330px ${family}`
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-20px'
  } catch {
    /* older browsers */
  }
  ctx.fillText('osloop', w / 2, h / 2 + 10)
  const data = ctx.getImageData(0, 0, w, h).data
  const pts: number[] = []
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 140) pts.push(x, y)
  const a = new Float32Array(n * 3)
  const W = 5.6
  const count = pts.length / 2
  for (let i = 0; i < n; i++) {
    if (count === 0 || rnd() < 0.05) {
      a.set([(rnd() - 0.5) * 7, (rnd() - 0.5) * 3, gauss() * 0.3], i * 3)
      continue
    }
    const k = Math.floor(rnd() * count) * 2
    const x = ((pts[k] + rnd() * 2 - w / 2) / w) * W
    const y = (-(pts[k + 1] + rnd() * 2 - h / 2) / w) * W
    a.set([x, y, gauss() * 0.06], i * 3)
  }
  return a
}

export function buildShape(name: ShapeName, n: number) {
  if (name === 'logo') return logoShape(n)
  return gen[name](n)
}

/** Per-particle randoms: x delay, y size, z phase, w colour. */
export function buildRandoms(n: number) {
  const a = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) a.set([rnd(), Math.pow(rnd(), 1.8), rnd(), rnd()], i * 4)
  return a
}
