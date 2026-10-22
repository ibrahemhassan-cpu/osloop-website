import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { setCursorLabel } from '../../components/Cursor'
import { reach } from '../../lib/content'
import { prefersReducedMotion } from '../../lib/gsap'
import { GLOBE_FOV, ORBITS, type GlobeBridge } from './globe'
import { LAND_COUNTRIES, LAND_IDS, LAND_MASK, LAND_STEP } from './globeLand'

type Bridge = MutableRefObject<GlobeBridge>
type Theme = 'light' | 'dark'

const D2R = Math.PI / 180
/** frame-rate independent easing towards a target: the share of the way to go this frame */
const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)
const smoothstep = THREE.MathUtils.smoothstep

/** the globe turns on its own axis this fast (radians a second) */
const SPIN = 0.05
/** everything is seen a little from above, so the rings read as ellipses */
const PITCH = 0.3
/** how long the globe stays where the visitor left it before it eases back (ms) */
const REST = 3200
/** how long the globe takes to turn a clicked market to the front (s) */
const FOCUS = 2.4
const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
/** the canvas overhangs its box by this much top and bottom (CSS: inset -16% 0), so tilted rings aren't cut */
const OVERHANG = 1.32
const MARKETS = reach.markets
const RMAX = Math.max(...ORBITS.map((o) => o.r))
const UP = new THREE.Vector3(0, 1, 0)

/** latitude/longitude (degrees) → a point on the globe; lat 0, lon 0 faces the camera */
function toVec(lat: number, lon: number, r = 1, out = new THREE.Vector3()) {
  const a = lat * D2R
  const b = lon * D2R
  return out.set(Math.cos(a) * Math.sin(b) * r, Math.sin(a) * r, Math.cos(a) * Math.cos(b) * r)
}

/** a small seeded random, so the lights are the same on every visit */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

/** every land cell of globeLand.ts (one per LAND_STEP degrees) with the id of the country it's in */
function landCells() {
  const mask = bytes(LAND_MASK)
  const runs = bytes(LAND_IDS)
  const ids: number[] = []
  for (let i = 0; i < runs.length; ) {
    const id = runs[i++]
    let len = 0
    for (let shift = 0; ; shift += 7) {
      const b = runs[i++]
      len |= (b & 127) << shift
      if (b < 128) break
    }
    for (let k = 0; k < len; k++) ids.push(id)
  }
  const cells: { lat: number; lon: number; width: number; id: number }[] = []
  let bit = 0
  for (let r = 0; r < Math.round(180 / LAND_STEP); r++) {
    const lat = -90 + (r + 0.5) * LAND_STEP
    const count = Math.max(1, Math.round((360 * Math.cos(lat * D2R)) / LAND_STEP))
    for (let j = 0; j < count; j++, bit++) {
      if ((mask[bit >> 3] >> (bit & 7)) & 1) cells.push({ lat, lon: -180 + ((j + 0.5) * 360) / count, width: 360 / count, id: ids[cells.length] })
    }
  }
  return cells
}

/** City lights: fine specks all over the land, brighter where they gather round a few hundred "cities". */
function createLights(cells: ReturnType<typeof landCells>, count: number) {
  const rand = random(7)
  const inhabited = cells.filter((c) => Math.abs(c.lat) < 62)
  const cities = Array.from({ length: 480 }, () => inhabited[Math.floor(rand() * inhabited.length)])
  const position = new Float32Array(count * 3)
  const glow = new Float32Array(count)
  const v = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    if (rand() < 0.4) {
      const c = cities[Math.floor(rand() * cities.length)]
      const r = rand() ** 2 * 0.9
      const a = rand() * Math.PI * 2
      const lat = c.lat + Math.sin(a) * r
      toVec(lat, c.lon + (Math.cos(a) * r) / Math.max(0.25, Math.cos(lat * D2R)), 1.002, v)
      glow[i] = (1 - r / 0.9) ** 1.5 * (0.55 + rand() * 0.45)
    } else {
      const c = cells[Math.floor(rand() * cells.length)]
      toVec(c.lat + (rand() - 0.5) * LAND_STEP, c.lon + (rand() - 0.5) * c.width, 1.002, v)
      glow[i] = rand() ** 2.5 * 0.55
    }
    v.toArray(position, i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(position, 3))
  g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1))
  return g
}

/** The land of our markets, as fine dots that light up when the market is pointed at. */
function createMarketLand(cells: ReturnType<typeof landCells>) {
  const ours = cells.filter((c) => c.id > 0)
  const position = new Float32Array(ours.length * 3)
  const id = new Float32Array(ours.length)
  const v = new THREE.Vector3()
  ours.forEach((c, i) => {
    toVec(c.lat, c.lon, 1.003, v).toArray(position, i * 3)
    id[i] = c.id
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(position, 3))
  g.setAttribute('aId', new THREE.BufferAttribute(id, 1))
  return g
}

/** Glowing points over the land, brighter than the city lights. */
function createHubs(cells: ReturnType<typeof landCells>, count: number) {
  const rand = random(11)
  const inhabited = cells.filter((c) => Math.abs(c.lat) < 62)
  const position = new Float32Array(count * 3)
  const glow = new Float32Array(count)
  const v = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    const c = inhabited[Math.floor(rand() * inhabited.length)]
    toVec(c.lat + (rand() - 0.5) * LAND_STEP, c.lon + (rand() - 0.5) * c.width, 1.005, v).toArray(position, i * 3)
    glow[i] = 0.5 + rand() * 0.5
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(position, 3))
  g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1))
  return g
}

/** each ring's turn: a flat ring (in x/z) tilted about x and z */
const ringTurns = ORBITS.map((o) => new THREE.Quaternion().setFromEuler(new THREE.Euler(o.x * D2R, 0, o.z * D2R)))

const X = new THREE.Vector3(1, 0, 0)
const HOME = new THREE.Quaternion().setFromAxisAngle(X, PITCH)

/**
 * Where round its ring each market sits, so every name is readable: beside the globe (never over or
 * behind it), on screen, and as far from the other names as the rings allow. Names read outwards from
 * their satellite. `k` is pixels per unit (the globe's radius), `width` the canvas's width in pixels.
 */
function placeMarkets(k: number, width: number, orbitScale: number, mobile: boolean) {
  const char = (mobile ? 6.4 : 7.6) / k
  const flagW = (mobile ? 30 : 38) / k
  const half = (mobile ? 12 : 16) / k
  const gap = (mobile ? 8 : 14) / k
  const edge = width / 2 / k - 6 / k
  const v = new THREE.Vector3()
  const N = MARKETS.length
  const rings = ORBITS.length
  /** a market's satellite at angle `a` round its ring, on screen (units, y down) */
  const at = (i: number, a: number) => {
    const o = ORBITS[i % rings]
    v.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(o.r * orbitScale).applyQuaternion(ringTurns[i % rings]).applyQuaternion(HOME)
    return [v.x, -v.y] as const
  }
  /** its name's box: x0, y0, x1, y1 */
  const box = (i: number, x: number, y: number) => {
    const w = flagW + MARKETS[i].name.length * char
    const x0 = x < 0 ? x - gap - w : x + gap
    return [x0, y - half, x0 + w, y + half]
  }
  const apart = (a: number[], b: number[]) => Math.max(b[0] - a[2], a[0] - b[2], b[1] - a[3], a[1] - b[3])
  const offGlobe = (b: number[]) => {
    const dx = b[0] > 0 ? b[0] : b[2] < 0 ? -b[2] : 0
    const dy = b[1] > 0 ? b[1] : b[3] < 0 ? -b[3] : 0
    return Math.hypot(dx, dy) - 1.16
  }
  const angle = MARKETS.map((_, i) => Math.floor(i / rings) * ((Math.PI * 2) / Math.ceil(N / rings)) + (i % rings) * 0.9)
  const boxes = angle.map((a, i) => box(i, ...at(i, a)))
  const STEPS = 240
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < N; i++) {
      let best = angle[i]
      let bestScore = -Infinity
      for (let step = 0; step < STEPS; step++) {
        const a = (step / STEPS) * Math.PI * 2
        const [x, y] = at(i, a)
        // the satellite itself stays clear of the globe's disc
        if (Math.hypot(x, y) < 1.16) continue
        const b = box(i, x, y)
        let score = offGlobe(b)
        for (let j = 0; j < N; j++) if (j !== i) score = Math.min(score, apart(b, boxes[j]))
        if (b[0] < -edge || b[2] > edge) score -= 10
        if (score > bestScore) {
          bestScore = score
          best = a
        }
      }
      angle[i] = best
      boxes[i] = box(i, ...at(i, best))
    }
  }
  return angle
}

/** The rings, as thin tubes in one mesh; `uv.x` runs round each ring, `aRing` says which. */
function createOrbits(scale: number) {
  const parts = ORBITS.map((o, k) => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(o.r * scale).applyQuaternion(ringTurns[k]))
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 320, 0.0036, 5, true)
    g.setAttribute('aRing', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(k), 1))
    g.deleteAttribute('normal')
    return g
  })
  return mergeGeometries(parts)!
}

const COLOR_OUT = /* glsl */ `#include <colorspace_fragment>`
const VIEW = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec2 vUv;
  varying vec3 vP;
  void main() {
    vP = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }`

/** the globe: deep ocean, glowing blue land with bright coasts, and a bright atmosphere at its edge */
const BODY = /* glsl */ `
  uniform sampler2D uLand;
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vV;
  varying vec2 vUv;
  varying vec3 vP;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  void main() {
    // SphereGeometry's u starts at longitude -90°; the texture starts at -180°
    vec2 uv = vec2(vUv.x + 0.25, vUv.y);
    float land = texture2D(uLand, uv).r;
    // a soft copy of the land, for the glow along the coasts
    vec2 px = vec2(1.0 / 4096.0, 1.0 / 2048.0) * 7.0;
    float soft = 0.0;
    soft += texture2D(uLand, uv + vec2(px.x, 0.0)).r;
    soft += texture2D(uLand, uv - vec2(px.x, 0.0)).r;
    soft += texture2D(uLand, uv + vec2(0.0, px.y)).r;
    soft += texture2D(uLand, uv - vec2(0.0, px.y)).r;
    soft += texture2D(uLand, uv + px * 0.7).r;
    soft += texture2D(uLand, uv - px * 0.7).r;
    soft += texture2D(uLand, uv + vec2(px.x, -px.y) * 0.7).r;
    soft += texture2D(uLand, uv + vec2(-px.x, px.y) * 0.7).r;
    soft /= 8.0;
    float coast = clamp(abs(land - soft) * 2.6, 0.0, 1.0);

    float facing = clamp(dot(vN, vV), 0.0, 1.0);
    float light = clamp(dot(vN, normalize(vec3(-0.3, 0.4, 0.86))), 0.0, 1.0);
    vec3 ocean = mix(vec3(0.0005, 0.002, 0.012), vec3(0.002, 0.012, 0.07), light);
    vec3 ground = mix(vec3(0.004, 0.03, 0.2), vec3(0.016, 0.14, 0.8), light);
    // the land's own texture: patches of light and shade, and a fine digital grid of dots
    float patches = noise(vP * 9.0) * 0.6 + noise(vP * 26.0) * 0.4;
    ground *= 0.4 + patches * 0.85;
    vec2 g = vec2(uv.x * 1440.0, uv.y * 720.0);
    float dots = smoothstep(0.3, 0.1, length(fract(g) - 0.5));
    float fine = 1.0 - smoothstep(0.3, 0.7, fwidth(g.x));
    ground += vec3(0.05, 0.25, 1.0) * dots * fine * 0.3;
    vec3 col = mix(ocean, ground, land);
    col += vec3(0.15, 0.45, 1.0) * coast * (0.45 + 0.55 * light);
    // the atmosphere, brightest at the very edge
    col += vec3(0.05, 0.28, 1.0) * pow(1.0 - facing, 3.0) * 1.3;
    col += vec3(0.55, 0.82, 1.0) * pow(1.0 - facing, 9.0) * 0.9;
    gl_FragColor = vec4(col, uFade);
    ${COLOR_OUT}
  }`

/** the glow round the globe: the far side of a bigger sphere, brightest where it meets the globe */
const HALO = /* glsl */ `
  uniform float uAmt;
  uniform float uLight;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = clamp(-dot(vN, vV) / 0.55, 0.0, 1.0);
    // a bright glow on the dark ground; a soft blue haze on the light one
    float a = mix(pow(f, 3.2), pow(f, 2.4) * 0.5, uLight) * uAmt;
    gl_FragColor = vec4(mix(vec3(0.08, 0.35, 1.0), vec3(0.05, 0.22, 1.0), uLight), a);
    ${COLOR_OUT}
  }`

/** round glowing specks; the far side of the globe drops out */
const SPECKS = {
  vertex: /* glsl */ `
    attribute float aGlow;
    uniform float uSize;
    uniform float uTime;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float face = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
      float twinkle = 0.75 + 0.25 * sin(uTime * 1.6 + aGlow * 40.0);
      vAlpha = smoothstep(0.0, 0.35, face) * (0.25 + aGlow * 0.75) * twinkle;
      gl_PointSize = uSize * (0.6 + aGlow * 0.9);
      gl_Position = face < 0.0 ? vec4(0.0, 0.0, 2.0, 1.0) : projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    uniform vec3 uColor;
    uniform float uFade;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float a = (smoothstep(1.0, 0.0, d) * 0.5 + smoothstep(0.45, 0.0, d)) * vAlpha * uFade;
      if (a < 0.01) discard;
      gl_FragColor = vec4(uColor, a);
      ${COLOR_OUT}
    }`,
}

/** the pointed-at market's land: the rest of the dots stay out of the way */
const MARKET_LAND = {
  vertex: /* glsl */ `
    attribute float aId;
    uniform float uActive;
    uniform float uSize;
    varying float vFace;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFace = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
      gl_PointSize = uSize;
      gl_Position = abs(aId - uActive) < 0.5 && vFace > 0.0 ? projectionMatrix * mv : vec4(0.0, 0.0, 2.0, 1.0);
    }`,
  fragment: /* glsl */ `
    uniform float uOn;
    varying float vFace;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float a = smoothstep(1.0, 0.2, d) * smoothstep(0.0, 0.3, vFace) * uOn;
      if (a < 0.01) discard;
      gl_FragColor = vec4(0.75, 0.9, 1.0, a);
      ${COLOR_OUT}
    }`,
}

/** the rings: they draw in round their length, and the far half is dimmer */
const RINGS = {
  vertex: /* glsl */ `
    attribute float aRing;
    varying float vT;
    varying float vRing;
    varying float vDepth;
    void main() {
      vT = uv.x;
      vRing = aRing;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vDepth = mv.z - centre.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    uniform float uReveal;
    uniform float uActive;
    uniform float uCount;
    uniform float uLight;
    varying float vT;
    varying float vRing;
    varying float vDepth;
    void main() {
      float grow = clamp((uReveal - 0.15 - vRing / uCount * 0.3) / 0.5, 0.0, 1.0);
      if (vT > grow) discard;
      float on = 1.0 - step(0.5, abs(vRing - uActive));
      float a = mix(mix(0.16, 0.3, uLight), mix(0.5, 0.62, uLight), smoothstep(-1.2, 0.8, vDepth));
      a = mix(a, 0.95, on);
      // dark: light blue, the lit one paler; light: brand blue, the lit one ink
      vec3 line = mix(vec3(0.2, 0.45, 1.0), vec3(0.03, 0.12, 1.0), uLight);
      vec3 hot = mix(vec3(0.6, 0.82, 1.0), vec3(0.002, 0.006, 0.03), uLight);
      gl_FragColor = vec4(mix(line, hot, on), a);
      ${COLOR_OUT}
    }`,
}

/** the markets' satellites: a white core in a blue glow */
const SATS = {
  vertex: /* glsl */ `
    attribute float aIdx;
    attribute float aShow;
    uniform float uSize;
    uniform float uActive;
    varying float vOn;
    varying float vShow;
    void main() {
      vOn = 1.0 - step(0.5, abs(aIdx - uActive));
      vShow = aShow;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * (1.0 + vOn * 0.6);
      gl_Position = projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    uniform float uLight;
    varying float vOn;
    varying float vShow;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float glow = smoothstep(1.0, 0.0, d);
      float core = smoothstep(0.42, 0.28, d);
      // dark: a white core in a blue glow; light: a blue core in a pale blue glow
      vec3 col = mix(mix(vec3(0.25, 0.55, 1.0), vec3(1.0), core), mix(vec3(0.15, 0.35, 1.0), vec3(0.025, 0.1, 1.0), core), uLight);
      float a = (glow * glow * (0.55 + vOn * 0.4) * (1.0 - uLight * 0.45) + core) * vShow;
      if (a < 0.01) discard;
      gl_FragColor = vec4(col, a);
      ${COLOR_OUT}
    }`,
}

/** the line from a pointed-at satellite down to its country, with a light running along it */
const BEAM = {
  vertex: /* glsl */ `
    attribute float aT;
    varying float vT;
    void main() {
      vT = aT;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform float uOn;
    uniform float uLight;
    varying float vT;
    void main() {
      float run = fract(uTime * 0.6);
      float d = run - vT;
      float light = d < 0.0 ? 0.0 : exp(-d * 10.0);
      float a = (0.45 + light) * uOn;
      vec3 col = mix(mix(vec3(0.45, 0.72, 1.0), vec3(1.0), light), mix(vec3(0.03, 0.12, 1.0), vec3(0.002, 0.006, 0.03), light), uLight);
      gl_FragColor = vec4(col, min(a, 1.0));
      ${COLOR_OUT}
    }`,
}
const BEAM_POINTS = 48

function System({ bridge, mobile, theme }: { bridge: Bridge; mobile: boolean; theme: Theme }) {
  const system = useRef<THREE.Group>(null)
  const globe = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)
  const { camera, size, viewport } = useThree()
  const still = useMemo(() => prefersReducedMotion(), [])
  const land = useLoader(THREE.TextureLoader, '/globe/land.webp')
  useMemo(() => {
    land.colorSpace = THREE.NoColorSpace
    land.wrapS = THREE.RepeatWrapping
    land.anisotropy = 4
    land.needsUpdate = true
  }, [land])

  /* ------------------------------------------------------------------ geometry */
  const orbitScale = mobile ? 0.84 : 1
  const cells = useMemo(landCells, [])
  const lights = useMemo(() => createLights(cells, mobile ? 20000 : 40000), [cells, mobile])
  const marketLand = useMemo(() => createMarketLand(cells), [cells])
  const hubs = useMemo(() => createHubs(cells, mobile ? 100 : 150), [cells, mobile])
  const orbits = useMemo(() => createOrbits(orbitScale), [orbitScale])
  const sats = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MARKETS.length * 3), 3))
    g.setAttribute('aIdx', new THREE.BufferAttribute(new Float32Array(MARKETS.map((_, i) => i)), 1))
    g.setAttribute('aShow', new THREE.BufferAttribute(new Float32Array(MARKETS.length), 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), RMAX * 1.1)
    return g
  }, [])
  const beam = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BEAM_POINTS * 3), 3))
    g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(Array.from({ length: BEAM_POINTS }, (_, i) => i / (BEAM_POINTS - 1))), 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), RMAX * 1.1)
    return g
  }, [])
  useEffect(
    () => () => [lights, marketLand, hubs, orbits, sats, beam].forEach((g) => g.dispose()),
    [lights, marketLand, hubs, orbits, sats, beam],
  )

  /* ------------------------------------------------------------------ materials */
  // Built here, not as JSX: <shaderMaterial uniforms> copies each uniform, and the per-frame values
  // written to `u` would never reach it.
  const u = useMemo(
    () => ({
      body: { uLand: { value: land }, uFade: { value: 0 } },
      halo: { uAmt: { value: 0 }, uLight: { value: 0 } },
      lights: { uSize: { value: 2 }, uTime: { value: 0 }, uFade: { value: 0 }, uColor: { value: new THREE.Color('#9fd2ff') } },
      nodes: { uSize: { value: 5 }, uTime: { value: 0 }, uFade: { value: 0 }, uColor: { value: new THREE.Color('#d6ecff') } },
      market: { uActive: { value: -1 }, uSize: { value: 3 }, uOn: { value: 0 } },
      rings: { uReveal: { value: 0 }, uActive: { value: -1 }, uCount: { value: ORBITS.length }, uLight: { value: 0 } },
      sats: { uSize: { value: 12 }, uActive: { value: -1 }, uLight: { value: 0 } },
      beam: { uTime: { value: 0 }, uOn: { value: 0 }, uLight: { value: 0 } },
    }),
    [land],
  )
  const mat = useMemo(() => {
    const add = THREE.AdditiveBlending
    const make = (uniforms: Record<string, THREE.IUniform>, vertexShader: string, fragmentShader: string, extra: THREE.ShaderMaterialParameters = {}) =>
      new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: add, ...extra })
    return {
      halo: make(u.halo, VIEW, HALO, { side: THREE.BackSide }),
      body: make(u.body, VIEW, BODY, { depthWrite: true, blending: THREE.NormalBlending }),
      lights: make(u.lights, SPECKS.vertex, SPECKS.fragment),
      nodes: make(u.nodes, SPECKS.vertex, SPECKS.fragment),
      market: make(u.market, MARKET_LAND.vertex, MARKET_LAND.fragment),
      rings: make(u.rings, RINGS.vertex, RINGS.fragment),
      sats: make(u.sats, SATS.vertex, SATS.fragment),
      beam: make(u.beam, BEAM.vertex, BEAM.fragment),
    }
  }, [u])
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat])
  const beamLine = useMemo(() => new THREE.Line(beam, mat.beam), [beam, mat])

  // The globe itself is the same in both themes; what floats round it changes: additive glow on the
  // dark ground, plain blending (glow would vanish into white) on the light one.
  useEffect(() => {
    const light = theme === 'light' ? 1 : 0
    for (const [m, uni] of [
      [mat.halo, u.halo],
      [mat.rings, u.rings],
      [mat.sats, u.sats],
      [mat.beam, u.beam],
    ] as const) {
      uni.uLight.value = light
      m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending
      m.needsUpdate = true
    }
  }, [theme, mat, u])

  /* ------------------------------------------------------------------ fit the camera to the box */
  /** pixels per unit (the globe's radius on screen) */
  const unit = useRef(200)
  /** where round its ring each market sits (placeMarkets) */
  const angles = useRef<number[]>(MARKETS.map(() => 0))
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const boxH = size.height / OVERHANG
    // room beside the outer ring for the names (on phones they turn inwards instead)
    const margin = mobile ? 14 : THREE.MathUtils.clamp(size.width * 0.11, 110, 170)
    const k = Math.max(40, Math.min((size.width / 2 - margin) / (RMAX * orbitScale), boxH / 2 / 1.34))
    const D = size.height / 2 / (k * Math.tan((GLOBE_FOV * D2R) / 2))
    cam.position.set(0, 0, D)
    cam.near = Math.max(0.1, D - 5)
    cam.far = D + 5
    cam.updateProjectionMatrix()
    unit.current = k
    angles.current = placeMarkets(k, size.width, orbitScale, mobile)
    bridge.current.surface?.style.setProperty('--globe', `${k.toFixed(1)}px`)
    const px = viewport.dpr * Math.max(0.75, k / 260)
    u.lights.uSize.value = 1.9 * px
    u.nodes.uSize.value = 10 * px
    u.market.uSize.value = 3.4 * px
    u.sats.uSize.value = 15 * px
  }, [size.width, size.height, viewport.dpr, mobile, orbitScale, camera, bridge, u])

  /* ------------------------------------------------------------------ turning the globe */
  const home = HOME
  const q = useMemo(() => home.clone(), [home])
  /** where the globe settles when left alone: upright at first, then facing the last market clicked */
  const rest = useMemo(() => home.clone(), [home])
  /** the turn to a clicked market: from, to, and how far along (null when there's none) */
  const focus = useRef<{ from: THREE.Quaternion; to: THREE.Quaternion; p: number; n: number } | null>(null)
  const focused = useRef(0)
  const drag = useRef({ active: false, hover: false, id: -1, lx: 0, ly: 0, lt: 0, wx: 0, wy: 0, last: 0 })
  const turn = useMemo(() => {
    const d = new THREE.Quaternion()
    const Y = new THREE.Vector3(0, 1, 0)
    return (ax: number, ay: number) => {
      q.premultiply(d.setFromAxisAngle(Y, ay)).premultiply(d.setFromAxisAngle(X, ax)).normalize()
    }
  }, [q])

  useEffect(() => {
    const el = bridge.current.surface
    if (!el) return
    const d = drag.current
    let label: string | null = null
    const cursor = (next: string | null) => {
      if (next !== label) setCursorLabel((label = next))
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== d.id) return
      const now = performance.now()
      const sec = Math.max(8, now - d.lt) / 1000
      const ay = (e.clientX - d.lx) / unit.current
      const ax = (e.clientY - d.ly) / unit.current
      turn(ax, ay)
      d.wy = THREE.MathUtils.lerp(d.wy, ay / sec, 0.5)
      d.wx = THREE.MathUtils.lerp(d.wx, ax / sec, 0.5)
      d.lx = e.clientX
      d.ly = e.clientY
      d.lt = now
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== d.id) return
      d.active = false
      d.last = performance.now()
      // let go after holding still: no throw
      const k = d.last - d.lt > 90 ? 0 : 1
      const w = Math.hypot(d.wx, d.wy)
      const cap = w > 6 ? 6 / w : 1
      d.wx *= k * cap
      d.wy *= k * cap
      document.documentElement.classList.remove('is-grabbing')
      cursor(d.hover ? 'Drag' : null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || d.active) return
      d.active = true
      d.id = e.pointerId
      d.lx = e.clientX
      d.ly = e.clientY
      d.lt = performance.now()
      d.wx = 0
      d.wy = 0
      // the visitor takes over from any turn to a market
      if (focus.current) focus.current = null
      bridge.current.onGrab()
      cursor('Spin')
      document.documentElement.classList.add('is-grabbing')
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      d.hover = true
      if (!d.active) cursor('Drag')
    }
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      d.hover = false
      if (!d.active) cursor(null)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      document.documentElement.classList.remove('is-grabbing')
      if (label) setCursorLabel(null)
    }
  }, [bridge, turn])

  /* ------------------------------------------------------------------ every frame */
  const clock = useRef({ spin: 0, on: 0 })
  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), w: new THREE.Vector3(), c: new THREE.Vector3(), s: new THREE.Vector3(), ctrl: new THREE.Vector3(), cam: new THREE.Vector3() }),
    [],
  )
  const sides = useRef<(boolean | null)[]>(MARKETS.map(() => null))
  const spin = useMemo(() => new THREE.Quaternion(), [])
  const widths = useRef<number[]>([])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const b = bridge.current
    const d = drag.current
    const t = clock.current
    const now = performance.now()

    // 1. the globe's turn: to a clicked market, or the visitor's, then it coasts, then it settles
    const ask = b.focus
    if (ask && ask.n !== focused.current) {
      focused.current = ask.n
      const m = MARKETS[ask.i]
      // aim for where its spin will have carried the globe by the time the turn ends, so the market
      // arrives right in front and then drifts on with the spin
      const end = t.spin + (still ? 0 : SPIN * FOCUS)
      const to = new THREE.Quaternion()
        .setFromAxisAngle(UP, -m.lon * D2R - end)
        .premultiply(new THREE.Quaternion().setFromAxisAngle(X, m.lat * D2R))
      focus.current = { from: q.clone(), to, p: still ? 1 : 0, n: ask.n }
      d.wx = d.wy = 0
    }
    const f = focus.current
    if (f && !d.active) {
      f.p = Math.min(1, f.p + dt / FOCUS)
      q.slerpQuaternions(f.from, f.to, inOut(f.p))
      if (f.p >= 1) {
        rest.copy(f.to)
        focus.current = null
      }
      d.last = now
    } else if (!d.active && (d.wx || d.wy)) {
      turn(d.wx * dt, d.wy * dt)
      const f = Math.exp(-2.4 * dt)
      d.wx *= f
      d.wy *= f
      if (Math.hypot(d.wx, d.wy) < 0.02) d.wx = d.wy = 0
      d.last = now
    } else if (!d.active && !still && now - d.last > REST) {
      q.slerp(rest, ease(0.9, dt))
    }
    const reveal = b.reveal
    const shown = 1 - (1 - reveal) ** 3
    const scale = 0.9 + 0.1 * shown
    const sys = system.current!
    sys.quaternion.copy(home)
    sys.scale.setScalar(scale)

    // 2. the globe also turns slowly on its own axis; the rings and the markets hold still
    const active = b.active ?? -1
    if (!still) t.spin += SPIN * dt
    const g = globe.current!
    g.quaternion.copy(q).multiply(spin.setFromAxisAngle(UP, t.spin))
    g.scale.setScalar(scale)
    halo.current!.scale.setScalar(scale)
    t.on = THREE.MathUtils.lerp(t.on, active >= 0 ? 1 : 0, ease(6, dt))

    const time = state.clock.elapsedTime
    const fade = Math.min(1, reveal * 2)
    u.body.uFade.value = fade
    u.halo.uAmt.value = 0.85 * fade
    u.lights.uFade.value = fade
    u.lights.uTime.value = time
    u.nodes.uFade.value = fade
    u.nodes.uTime.value = time
    u.rings.uReveal.value = reveal
    u.rings.uActive.value = active >= 0 ? active % ORBITS.length : -1
    u.sats.uActive.value = active
    u.beam.uTime.value = time
    u.beam.uOn.value = t.on
    if (active >= 0) u.market.uActive.value = LAND_COUNTRIES.indexOf(MARKETS[active].code) + 1
    u.market.uOn.value = t.on

    // 3. satellites, and their name tags beside them
    const pos = sats.attributes.position as THREE.BufferAttribute
    const show = sats.attributes.aShow as THREE.BufferAttribute
    const cam = tmp.cam.copy(camera.position)
    const w = size.width
    const h = size.height
    MARKETS.forEach((_, i) => {
      const k = i % ORBITS.length
      const o = ORBITS[k]
      const a = angles.current[i]
      tmp.p.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(o.r * orbitScale).applyQuaternion(ringTurns[k])
      pos.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z)
      const appear = smoothstep(reveal, 0.4 + i * 0.015, 0.7 + i * 0.015)
      show.setX(i, appear)

      const el = b.labels[i]
      if (!el) return
      // where it is on screen, and whether the globe hides it
      tmp.w.copy(tmp.p).applyQuaternion(home).multiplyScalar(scale)
      tmp.s.copy(tmp.w).sub(cam)
      const along = THREE.MathUtils.clamp(-cam.dot(tmp.s) / tmp.s.lengthSq(), 0, 1)
      const miss = tmp.c.copy(cam).addScaledVector(tmp.s, along).length()
      const hidden = along < 0.999 ? 1 - smoothstep(miss, scale * 0.92, scale * 1.06) : 0
      const depth = smoothstep(tmp.w.z, -1.2, 0.6)
      tmp.w.project(camera)
      const x = ((tmp.w.x + 1) / 2) * w
      const y = ((1 - tmp.w.y) / 2) * h
      // the name goes outwards, unless that runs off the edge
      const width = (widths.current[i] ||= el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth : 0)
      let left = x < w / 2
      if (left && x - 20 - width < 4) left = false
      else if (!left && x + 20 + width > w - 4) left = true
      if (sides.current[i] !== left) {
        sides.current[i] = left
        el.classList.toggle('is-left', left)
      }
      const on = i === active
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.style.opacity = String(appear * (on ? 1 : (1 - hidden * 0.92) * (0.7 + depth * 0.3)))
      el.style.zIndex = on ? '3' : depth > 0.5 ? '2' : '1'
    })
    pos.needsUpdate = true
    show.needsUpdate = true

    // 4. the pointed-at market: a line from its satellite down to its country
    if (active >= 0) {
      const m = MARKETS[active]
      // in world space: the country turns with the globe, the satellite holds still
      const ground = toVec(m.lat, m.lon, 1.006, tmp.c).applyQuaternion(g.quaternion).multiplyScalar(scale)
      const sat = tmp.s.fromBufferAttribute(pos, active).applyQuaternion(home).multiplyScalar(scale)
      tmp.ctrl.addVectors(sat, ground).multiplyScalar(0.5)
      tmp.ctrl.setLength(Math.max(sat.length(), 1.25 * scale) * 1.08)
      const bp = beam.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < BEAM_POINTS; i++) {
        const s = i / (BEAM_POINTS - 1)
        // from the satellite (s = 0) down to the ground (s = 1)
        tmp.p
          .copy(sat)
          .multiplyScalar((1 - s) ** 2)
          .addScaledVector(tmp.ctrl, 2 * s * (1 - s))
          .addScaledVector(ground, s * s)
        bp.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z)
      }
      bp.needsUpdate = true
    }
    beamLine.visible = t.on > 0.01
  })

  // the name tags change width with the fonts and the screen
  useEffect(() => {
    widths.current = []
    document.fonts?.ready.then(() => (widths.current = []))
  }, [size.width, mobile])

  return (
    <>
      <mesh ref={halo} material={mat.halo} renderOrder={0}>
        <sphereGeometry args={[1.2, 64, 48]} />
      </mesh>
      <group ref={globe}>
        <mesh material={mat.body} renderOrder={1}>
          <sphereGeometry args={[1, 96, 64]} />
        </mesh>
        <points geometry={lights} material={mat.lights} renderOrder={2} />
        <points geometry={hubs} material={mat.nodes} renderOrder={3} />
        <points geometry={marketLand} material={mat.market} renderOrder={3} />
      </group>
      <group ref={system}>
        <mesh geometry={orbits} material={mat.rings} renderOrder={4} />
        <points geometry={sats} material={mat.sats} renderOrder={6} frustumCulled={false} />
      </group>
      <primitive object={beamLine} renderOrder={5} frustumCulled={false} />
    </>
  )
}

/** The "Our reach" globe and the rings its markets ride on: drawn only while it's on screen. */
export default function ReachScene({ bridge, active, mobile, theme }: { bridge: Bridge; active: boolean; mobile: boolean; theme: Theme }) {
  const top = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
  const [dpr, setDpr] = useState(top)
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      flat
      camera={{ position: [0, 0, 6], fov: GLOBE_FOV, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(top)} />
      <System bridge={bridge} mobile={mobile} theme={theme} />
    </Canvas>
  )
}
