import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { setCursorLabel } from '../../components/Cursor'
import { reach } from '../../lib/content'
import { prefersReducedMotion } from '../../lib/gsap'
import { GLOBE_FOV, random, type GlobeBridge } from './globe'
import { LAND_COUNTRIES, LAND_IDS, LAND_MASK, LAND_STEP } from './globeLand'

type Bridge = MutableRefObject<GlobeBridge>

const D2R = Math.PI / 180
/** frame-rate independent easing towards a target: the share of the way to go this frame */
const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)
const smoothstep = THREE.MathUtils.smoothstep

/** the globe turns on its own axis this fast (radians a second), except while a market is picked */
const SPIN = 0.05
/** at rest the globe is seen a little from above */
const PITCH = 0.3
/** how long the globe stays where the visitor left it before it eases back (ms) */
const REST = 3200
/** how long the globe takes to turn and zoom to a picked market (s) */
const FOCUS = 2.4
const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
/** the canvas overhangs its box by this much top and bottom (CSS: inset -16% 0), so flags over the globe aren't cut */
const OVERHANG = 1.32
/** how close the camera comes to a picked market (× the whole-globe view): small countries closer, never past the most */
const ZOOM_MIN = 1.4
const ZOOM_MAX = 2.6
/** a pin's flag stands this high over its country before flags make room for each other (px) */
const PIN_LIFT = 14
/** a country's grey on the country map: (its index in LAND_COUNTRIES + 1) × ID_STEP (scripts/globe-land.mjs) */
const ID_STEP = 12
const MARKETS = reach.markets
const UP = new THREE.Vector3(0, 1, 0)
const X = new THREE.Vector3(1, 0, 0)
const HOME = new THREE.Quaternion().setFromAxisAngle(X, PITCH)

/** latitude/longitude (degrees) → a point on the globe; lat 0, lon 0 faces the camera */
function toVec(lat: number, lon: number, r = 1, out = new THREE.Vector3()) {
  const a = lat * D2R
  const b = lon * D2R
  return out.set(Math.cos(a) * Math.sin(b) * r, Math.sin(a) * r, Math.cos(a) * Math.cos(b) * r)
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

/** how big each market is on the globe: the angle (degrees) from its middle to its edge, from its land cells */
function marketSizes(cells: ReturnType<typeof landCells>) {
  const counts = new Map<number, number>()
  for (const c of cells) if (c.id) counts.set(c.id, (counts.get(c.id) ?? 0) + 1)
  return MARKETS.map((m) => Math.max(0.6, Math.sqrt((counts.get(LAND_COUNTRIES.indexOf(m.code) + 1) ?? 0) / Math.PI)))
}
/** how close to come to a market of that size: near enough that it fills a good part of the view */
const zoomFor = (size: number) => THREE.MathUtils.clamp(0.52 / Math.sin(size * D2R), ZOOM_MIN, ZOOM_MAX)

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

/**
 * Whether a point is in the picked country, from the country map (exact ids, one per texel): enough
 * to brighten the specks in it. `uPicked` is its grey (or -1), `uFocus` goes 0 → 1 as it's picked.
 */
const PICKED = /* glsl */ `
  uniform sampler2D uCountries;
  uniform float uPicked;
  uniform float uFocus;
  float isPicked(vec2 uv) {
    return step(abs(texture2D(uCountries, uv).r - uPicked), 0.01);
  }
`

/** the globe: deep ocean, glowing blue land with bright coasts, and a thin atmosphere at its edge */
const BODY = /* glsl */ `
  uniform sampler2D uLand;
  uniform float uFade;
  uniform float uZoom;
  uniform float uFocus;
  // the picked country, drawn sharp for its zoom (see drawPick): red its shape, green its glow, blue
  // its border; uPickBox is the map's corners in degrees (west, south, east, north)
  uniform sampler2D uPick;
  uniform vec4 uPickBox;
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
    // SphereGeometry's u starts at longitude -90°; the maps start at -180°
    vec2 uv = vec2(vUv.x + 0.25, vUv.y);
    float raw = texture2D(uLand, uv).r;
    // up close the map is stretched: sharpen its edge back to a crisp coastline
    float aa = clamp(fwidth(raw), 0.02, 0.5);
    float land = smoothstep(0.5 - aa, 0.5 + aa, raw);
    // a soft copy of the land, for the glow along the coasts (as wide on screen at any zoom)
    vec2 px = vec2(1.0 / 4096.0, 1.0 / 2048.0) * max(2.0, 7.0 / uZoom);
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
    // only from afar: up close the grid would read as pixels
    float fine = (1.0 - smoothstep(0.3, 0.7, fwidth(g.x))) * (1.0 - smoothstep(1.1, 1.5, uZoom));
    ground += vec3(0.05, 0.25, 1.0) * dots * fine * 0.3;
    vec3 col = mix(ocean, ground, land);
    col += vec3(0.15, 0.45, 1.0) * coast * (0.45 + 0.55 * light);

    // a picked country lights up, edged with a fine line of light, while the rest of the globe steps back
    if (uFocus > 0.001) {
      // longitude, wrapped round the map's middle: the wrap's jump falls on the far side of the globe,
      // out of sight (a jump in view would upset the texture's mip level and draw a broken line)
      float middle = (uPickBox.x + uPickBox.z) * 0.5;
      vec2 deg = vec2(middle + mod(uv.x * 360.0 - 180.0 - middle + 180.0, 360.0) - 180.0, uv.y * 180.0 - 90.0);
      vec2 st = (deg - uPickBox.xy) / (uPickBox.zw - uPickBox.xy);
      // always read (a read inside a branch would upset the derivatives the line needs), then kept to the map's box
      float inBox = step(0.0, st.x) * step(st.x, 1.0) * step(0.0, st.y) * step(st.y, 1.0);
      vec3 pick = texture2D(uPick, clamp(st, 0.0, 1.0)).rgb * inBox;
      float inside = pick.r;
      float line = pick.b;
      float within = inside * (1.0 - pick.g);
      float without = pick.g * (1.0 - inside);
      col *= mix(1.0 - 0.65 * uFocus, 1.0, inside);
      vec3 lit = mix(vec3(0.04, 0.2, 0.75), vec3(0.15, 0.48, 1.0), light) * (0.85 + patches * 0.3);
      lit += vec3(0.35, 0.65, 1.0) * within * 0.9;
      col = mix(col, lit, inside * uFocus);
      col += vec3(0.2, 0.5, 1.0) * without * 0.55 * uFocus;
      col += vec3(0.75, 0.9, 1.0) * line * uFocus;
    }

    // the atmosphere: a thin haze that only shows near the edge, as on a photograph of the Earth
    col += vec3(0.05, 0.28, 1.0) * pow(1.0 - facing, 4.0) * 0.55;
    col += vec3(0.55, 0.82, 1.0) * pow(1.0 - facing, 12.0) * 0.4;
    gl_FragColor = vec4(col, uFade);
    ${COLOR_OUT}
  }`

/** the atmosphere round the globe: the far side of a slightly bigger sphere, fading fast off the edge */
const HALO = /* glsl */ `
  uniform float uAmt;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = clamp(-dot(vN, vV) / 0.38, 0.0, 1.0);
    gl_FragColor = vec4(vec3(0.08, 0.35, 1.0), pow(f, 3.2) * uAmt);
    ${COLOR_OUT}
  }`

/**
 * Round glowing specks; the far side of the globe drops out. While a country is picked, the specks
 * in it brighten and every other one dims.
 */
const SPECKS = {
  vertex: /* glsl */ `
    attribute float aGlow;
    uniform float uSize;
    uniform float uTime;
    varying float vAlpha;
    ${PICKED}
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float face = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
      float twinkle = 0.75 + 0.25 * sin(uTime * 1.6 + aGlow * 40.0);
      vAlpha = smoothstep(0.0, 0.35, face) * (0.25 + aGlow * 0.75) * twinkle;
      if (uFocus > 0.001) {
        vec3 n = normalize(position);
        vec2 uv = vec2(atan(n.x, n.z) / 6.28318530718 + 0.5, asin(n.y) / 3.14159265359 + 0.5);
        vAlpha *= mix(1.0 - 0.8 * uFocus, 1.0 + 0.2 * uFocus, isPicked(uv));
      }
      gl_PointSize = uSize * (0.6 + aGlow * 0.9);
      gl_Position = face < 0.0 ? vec4(0.0, 0.0, 2.0, 1.0) : projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    uniform vec3 uColor;
    uniform float uFade;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float a = min(1.0, (smoothstep(1.0, 0.0, d) * 0.5 + smoothstep(0.45, 0.0, d)) * vAlpha * uFade);
      if (a < 0.01) discard;
      gl_FragColor = vec4(uColor, a);
      ${COLOR_OUT}
    }`,
}

/**
 * A glowing point on each market's country, where its pin stands. The picked one grows and breathes;
 * while one is picked the others dim, so it stands out.
 */
const SPOTS = {
  vertex: /* glsl */ `
    attribute float aIdx;
    uniform float uSize;
    uniform float uActive;
    uniform float uTime;
    uniform float uFade;
    varying float vOn;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float face = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
      vOn = 1.0 - step(0.5, abs(aIdx - uActive));
      float picked = step(-0.5, uActive);
      vAlpha = smoothstep(0.0, 0.3, face) * uFade * mix(1.0, mix(0.25, 1.0, vOn), picked);
      gl_PointSize = uSize * (1.0 + vOn * (0.55 + 0.15 * sin(uTime * 2.6)));
      gl_Position = face < 0.0 ? vec4(0.0, 0.0, 2.0, 1.0) : projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    varying float vOn;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float glow = smoothstep(1.0, 0.0, d);
      float core = smoothstep(0.38, 0.24, d);
      float a = (glow * glow * (0.6 + vOn * 0.4) + core) * vAlpha;
      if (a < 0.01) discard;
      gl_FragColor = vec4(mix(vec3(0.25, 0.55, 1.0), vec3(1.0), core), a);
      ${COLOR_OUT}
    }`,
}

function Globe({ bridge, mobile }: { bridge: Bridge; mobile: boolean }) {
  const globe = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)
  const { camera, size, viewport } = useThree()
  const still = useMemo(() => prefersReducedMotion(), [])
  const [land, countries] = useLoader(THREE.TextureLoader, ['/globe/land.webp', '/globe/countries.png'])
  useMemo(() => {
    land.colorSpace = THREE.NoColorSpace
    land.wrapS = THREE.RepeatWrapping
    land.anisotropy = 4
    land.needsUpdate = true
    // exact ids: no smoothing between texels, no mipmaps
    countries.colorSpace = THREE.NoColorSpace
    countries.wrapS = THREE.RepeatWrapping
    countries.minFilter = THREE.NearestFilter
    countries.magFilter = THREE.NearestFilter
    countries.generateMipmaps = false
    countries.needsUpdate = true
  }, [land, countries])

  /* ------------------------------------------------------------------ geometry */
  const cells = useMemo(landCells, [])
  const sizes = useMemo(() => marketSizes(cells), [cells])
  const lights = useMemo(() => createLights(cells, mobile ? 20000 : 40000), [cells, mobile])
  const hubs = useMemo(() => createHubs(cells, mobile ? 100 : 150), [cells, mobile])
  const spots = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const v = new THREE.Vector3()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MARKETS.flatMap((m) => toVec(m.lat, m.lon, 1.004, v).toArray())), 3))
    g.setAttribute('aIdx', new THREE.BufferAttribute(new Float32Array(MARKETS.map((_, i) => i)), 1))
    return g
  }, [])
  useEffect(() => () => [lights, hubs, spots].forEach((g) => g.dispose()), [lights, hubs, spots])

  /* ------------------------------------------------------------------ materials */
  // Built here, not as JSX: <shaderMaterial uniforms> copies each uniform, and the per-frame values
  // written to `u` would never reach it.
  const u = useMemo(() => {
    // the picked country, shared by the globe and the specks on it
    const picked = { uCountries: { value: countries }, uPicked: { value: -1 }, uFocus: { value: 0 } }
    return {
      picked,
      body: {
        uLand: { value: land },
        uFade: { value: 0 },
        uZoom: { value: 1 },
        uFocus: picked.uFocus,
        uPick: { value: null as THREE.Texture | null },
        uPickBox: { value: new THREE.Vector4() },
      },
      halo: { uAmt: { value: 0 } },
      lights: { uSize: { value: 2 }, uTime: { value: 0 }, uFade: { value: 0 }, uColor: { value: new THREE.Color('#9fd2ff') }, ...picked },
      nodes: { uSize: { value: 5 }, uTime: { value: 0 }, uFade: { value: 0 }, uColor: { value: new THREE.Color('#d6ecff') }, ...picked },
      spots: { uSize: { value: 12 }, uActive: { value: -1 }, uTime: { value: 0 }, uFade: { value: 0 } },
    }
  }, [land, countries])
  const mat = useMemo(() => {
    const make = (uniforms: Record<string, THREE.IUniform>, vertexShader: string, fragmentShader: string, extra: THREE.ShaderMaterialParameters = {}) =>
      new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...extra })
    return {
      halo: make(u.halo, VIEW, HALO, { side: THREE.BackSide }),
      body: make(u.body, VIEW, BODY, { depthWrite: true, blending: THREE.NormalBlending }),
      lights: make(u.lights, SPECKS.vertex, SPECKS.fragment),
      nodes: make(u.nodes, SPECKS.vertex, SPECKS.fragment),
      spots: make(u.spots, SPOTS.vertex, SPOTS.fragment),
    }
  }, [u])
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat])

  /* ------------------------------------------------------------------ fit the camera to the box, and zoom */
  /** pixels per unit (the globe's radius on screen): now, for the whole globe, and the zoom between them */
  const fit = useRef({ k: 0, base: 200, zoom: 1 })
  /** the specks' and spots' sizes for the whole globe (px), grown a little as the camera comes in */
  const px = useRef({ lights: 2, nodes: 10, spots: 13 })
  const applyFit = (k: number) => {
    const cam = camera as THREE.PerspectiveCamera
    const D = size.height / 2 / (k * Math.tan((GLOBE_FOV * D2R) / 2))
    cam.position.set(0, 0, D)
    cam.near = Math.max(0.05, D - 5)
    cam.far = D + 5
    cam.updateProjectionMatrix()
    fit.current.k = k
    bridge.current.surface?.style.setProperty('--globe', `${k.toFixed(1)}px`)
  }
  useEffect(() => {
    // the whole globe in its box, with room above it for the flags
    const boxH = size.height / OVERHANG
    const k = Math.max(40, Math.min(size.width / 2 / 1.1, boxH / 2 / 1.18))
    fit.current.base = k
    applyFit(k * fit.current.zoom)
    const scale = viewport.dpr * Math.max(0.75, k / 260)
    px.current = { lights: 1.9 * scale, nodes: 10 * scale, spots: 13 * scale }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, viewport.dpr, camera, bridge])

  /* ------------------------------------------------------------------ the picked country, drawn sharp */
  /** each market's outline (public/globe/outlines.json: rings of lon, lat in hundredths of a degree) */
  const outlines = useRef<Record<string, number[][]> | null>(null)
  useEffect(() => {
    let live = true
    fetch('/globe/outlines.json')
      .then((r) => r.json())
      .then((data) => live && (outlines.current = data))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  /** the market whose map is drawn */
  const drawn = useRef(-1)
  useEffect(() => () => u.body.uPick.value?.dispose(), [u])

  /**
   * Draws a market's shape for the shader: red its shape, green a soft glow round it, blue its border,
   * on a map just big enough for the country and its glow. The map's detail matches the zoom it'll be seen at (about three
   * of its pixels to a pixel on screen), so the border stays sharp however small the country.
   */
  const drawPick = (i: number) => {
    const rings = outlines.current?.[MARKETS[i].code]
    if (!rings) return false
    let west = Infinity
    let east = -Infinity
    let south = Infinity
    let north = -Infinity
    for (const ring of rings) {
      for (let j = 0; j < ring.length; j += 2) {
        west = Math.min(west, ring[j] / 100)
        east = Math.max(east, ring[j] / 100)
        south = Math.min(south, ring[j + 1] / 100)
        north = Math.max(north, ring[j + 1] / 100)
      }
    }
    // a degree on screen at the zoom the country is seen at, and its glow's reach (about 14px)
    const onScreen = fit.current.base * zoomFor(sizes[i]) * D2R
    const glow = 14 / onScreen
    // a degree of longitude is shorter away from the equator: keep the map's pixels square on the globe
    const squeeze = Math.max(0.2, Math.cos(((south + north) / 2) * D2R))
    const pad = glow * 2.5
    west -= pad / squeeze
    east += pad / squeeze
    south = Math.max(-90, south - pad)
    north = Math.min(90, north + pad)
    const perDegree = Math.min(2048 / Math.max((east - west) * squeeze, north - south), 3 * onScreen)
    const w = Math.max(8, Math.round((east - west) * squeeze * perDegree))
    const h = Math.max(8, Math.round((north - south) * perDegree))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const g = canvas.getContext('2d')!
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    const shape = new Path2D()
    for (const ring of rings) {
      for (let j = 0; j < ring.length; j += 2) {
        const x = ((ring[j] / 100 - west) / (east - west)) * w
        const y = ((north - ring[j + 1] / 100) / (north - south)) * h
        if (j) shape.lineTo(x, y)
        else shape.moveTo(x, y)
      }
      shape.closePath()
    }
    // the glow: the shape's blurred shadow, cast onto the map from a copy drawn off it
    g.save()
    g.shadowColor = '#0f0'
    g.shadowBlur = glow * perDegree
    g.shadowOffsetX = w * 2
    g.translate(-w * 2, 0)
    g.fillStyle = '#0f0'
    g.fill(shape, 'evenodd')
    g.restore()
    // the shape itself, added in red, and its border, in blue: a smooth line about 1.6px wide on screen
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = '#f00'
    g.fill(shape, 'evenodd')
    g.strokeStyle = '#00f'
    g.lineWidth = (1.6 * perDegree) / onScreen
    g.lineJoin = 'round'
    g.stroke(shape)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.NoColorSpace
    texture.anisotropy = 4
    u.body.uPick.value?.dispose()
    u.body.uPick.value = texture
    u.body.uPickBox.value.set(west, south, east, north)
    return true
  }

  /* ------------------------------------------------------------------ turning the globe */
  const home = HOME
  const q = useMemo(() => home.clone(), [home])
  /** where the globe settles when left alone: upright at first, then facing the last market picked */
  const rest = useMemo(() => home.clone(), [home])
  /** the flight to a picked market: its turn, its zoom (from, to, and how far it pulls back on the way) and how far along */
  const focus = useRef<{ from: THREE.Quaternion; to: THREE.Quaternion; zFrom: number; zTo: number; dip: number; p: number; n: number } | null>(null)
  const focused = useRef(0)
  const drag = useRef({ active: false, hover: false, id: -1, lx: 0, ly: 0, lt: 0, wx: 0, wy: 0, last: 0 })
  const turn = useMemo(() => {
    const d = new THREE.Quaternion()
    return (ax: number, ay: number) => {
      q.premultiply(d.setFromAxisAngle(UP, ay)).premultiply(d.setFromAxisAngle(X, ax)).normalize()
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
      const ay = (e.clientX - d.lx) / fit.current.k
      const ax = (e.clientY - d.ly) / fit.current.k
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
      // the visitor takes over from any flight to a market (its zoom carries on easing in)
      if (focus.current) focus.current = null
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

  /* ------------------------------------------------------------------ the pins */
  const clock = useRef({ spin: 0, on: 0 })
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const spin = useMemo(() => new THREE.Quaternion(), [])
  /** how high each pin's flag stands over its country (px), eased as flags make room */
  const lifts = useMemo(() => MARKETS.map(() => PIN_LIFT), [])
  /** a flag's size on screen (px), measured from the page once per fit */
  const pinSize = useRef(0)
  useEffect(() => {
    pinSize.current = 0
  }, [size.width, mobile])

  /**
   * Each market's pin stands over its country. Pins past the globe's horizon are hidden, and flags that
   * would overlap are lifted one above the other on longer stems; the front ones (and the picked one)
   * keep their place.
   */
  const placePins = (dt: number, turnNow: THREE.Quaternion, scale: number, reveal: number, active: number) => {
    const pins = bridge.current.pins
    // the flag's size comes from the CSS
    const flagSize = (pinSize.current ||= pins.find(Boolean)?.querySelector('button')?.offsetHeight ?? 0) || 26
    // on small screens the flags stack less high, so a crowded corner never climbs off the globe
    const levels = mobile ? 3 : 5
    // the horizon: as the camera comes in, less of the globe faces it
    const horizon = (scale * scale) / camera.position.z
    const seen: { i: number; x: number; y: number; z: number }[] = []
    MARKETS.forEach((m, i) => {
      const el = pins[i]
      if (!el) return
      const p = toVec(m.lat, m.lon, 1.004, tmp).applyQuaternion(turnNow).multiplyScalar(scale)
      const z = p.z
      p.project(camera)
      const x = ((p.x + 1) / 2) * size.width
      const y = ((1 - p.y) / 2) * size.height
      // gone past the horizon, or (up close) out towards the canvas's faded edges (CSS mask)
      const edge =
        smoothstep(x, 0, size.width * 0.1) *
        (1 - smoothstep(x, size.width * 0.9, size.width)) *
        smoothstep(y, size.height * 0.12, size.height * 0.2) *
        (1 - smoothstep(y, size.height * 0.84, size.height))
      const vis = smoothstep(z, horizon + scale * 0.06, horizon + scale * 0.24) * edge * smoothstep(reveal, 0.45 + i * 0.012, 0.75 + i * 0.012)
      el.style.opacity = vis.toFixed(3)
      el.style.visibility = vis < 0.03 ? 'hidden' : ''
      if (vis < 0.03) return
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      seen.push({ i, x, y, z })
    })
    seen.sort((a, b) => (a.i === active ? -1 : b.i === active ? 1 : b.z - a.z))
    const placed: { x: number; y: number }[] = []
    seen.forEach((p, order) => {
      let lift = PIN_LIFT
      for (let step = 0; step < levels; step++) {
        const top = p.y - lift - flagSize / 2
        if (!placed.some((o) => Math.abs(o.x - p.x) < flagSize && Math.abs(o.y - top) < flagSize)) break
        lift += flagSize * 0.9
      }
      placed.push({ x: p.x, y: p.y - lift - flagSize / 2 })
      lifts[p.i] += (lift - lifts[p.i]) * ease(8, dt)
      const el = pins[p.i]!
      el.style.setProperty('--lift', lifts[p.i].toFixed(1))
      el.style.zIndex = String(seen.length - order)
    })
  }

  /* ------------------------------------------------------------------ every frame */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const b = bridge.current
    const d = drag.current
    const t = clock.current
    const f = fit.current
    const now = performance.now()
    const active = b.active ?? -1

    // 1. the globe's turn: a flight to a picked market, or the visitor's, then it coasts, then it settles
    const ask = b.focus
    if (ask && ask.n !== focused.current) {
      focused.current = ask.n
      const m = MARKETS[ask.i]
      // the spin waits while a market is picked, so it arrives right in front and stays there
      const to = new THREE.Quaternion()
        .setFromAxisAngle(UP, -m.lon * D2R - t.spin)
        .premultiply(new THREE.Quaternion().setFromAxisAngle(X, m.lat * D2R))
      // a long way round pulls the camera back mid-flight, as if rising to see where it's going
      const angle = 2 * Math.acos(Math.min(1, Math.abs(q.dot(to))))
      focus.current = { from: q.clone(), to, zFrom: f.zoom, zTo: zoomFor(sizes[ask.i]), dip: THREE.MathUtils.clamp(angle / 1.2, 0, 0.85), p: still ? 1 : 0, n: ask.n }
      d.wx = d.wy = 0
    }
    const fl = focus.current
    if (fl && !d.active) {
      fl.p = Math.min(1, fl.p + dt / FOCUS)
      const e = inOut(fl.p)
      q.slerpQuaternions(fl.from, fl.to, e)
      f.zoom = 1 + (THREE.MathUtils.lerp(fl.zFrom, fl.zTo, e) - 1) * (1 - fl.dip * Math.sin(Math.PI * fl.p))
      if (fl.p >= 1) {
        rest.copy(fl.to)
        focus.current = null
      }
      d.last = now
    } else {
      if (!d.active && (d.wx || d.wy)) {
        turn(d.wx * dt, d.wy * dt)
        const k = Math.exp(-2.4 * dt)
        d.wx *= k
        d.wy *= k
        if (Math.hypot(d.wx, d.wy) < 0.02) d.wx = d.wy = 0
        d.last = now
      } else if (!d.active && !still && now - d.last > REST) {
        q.slerp(rest, ease(0.9, dt))
      }
      // close to a picked market, back out to the whole globe when it's let go
      const zTarget = active >= 0 ? zoomFor(sizes[active]) : 1
      f.zoom = still ? zTarget : THREE.MathUtils.lerp(f.zoom, zTarget, ease(1.8, dt))
    }
    if (Math.abs(f.k - f.base * f.zoom) > 0.01) applyFit(f.base * f.zoom)

    // 2. the globe also turns slowly on its own axis, except while a market is picked
    if (!still && active < 0 && !focus.current) t.spin += SPIN * dt
    const reveal = b.reveal
    const scale = 0.9 + 0.1 * (1 - (1 - reveal) ** 3)
    const g = globe.current!
    g.quaternion.copy(q).multiply(spin.setFromAxisAngle(UP, t.spin))
    g.scale.setScalar(scale)
    halo.current!.scale.setScalar(scale)

    // 3. the picked country lights up while the rest steps back
    t.on = still ? (active >= 0 ? 1 : 0) : THREE.MathUtils.lerp(t.on, active >= 0 ? 1 : 0, ease(3, dt))
    if (active >= 0) u.picked.uPicked.value = ((LAND_COUNTRIES.indexOf(MARKETS[active].code) + 1) * ID_STEP) / 255
    // (as soon as the outlines are in; the last one stays drawn while it fades out)
    if (active >= 0 && drawn.current !== active && drawPick(active)) drawn.current = active
    u.picked.uFocus.value = drawn.current === active || active < 0 ? t.on : 0

    const time = state.clock.elapsedTime
    const fade = Math.min(1, reveal * 2)
    // the specks grow a little as the camera comes in, so the land doesn't empty out
    const grow = 1 + (f.zoom - 1) * 0.4
    u.body.uFade.value = fade
    u.body.uZoom.value = f.zoom
    u.halo.uAmt.value = 0.6 * fade
    u.lights.uFade.value = fade
    u.lights.uTime.value = time
    u.lights.uSize.value = px.current.lights * grow
    u.nodes.uFade.value = fade
    u.nodes.uTime.value = time
    u.nodes.uSize.value = px.current.nodes * grow
    u.spots.uActive.value = active
    u.spots.uTime.value = time
    u.spots.uFade.value = smoothstep(reveal, 0.35, 0.8)
    u.spots.uSize.value = px.current.spots

    // 4. the pins over their countries
    placePins(dt, g.quaternion, scale, reveal, active)
  })

  return (
    <>
      <mesh ref={halo} material={mat.halo} renderOrder={0}>
        <sphereGeometry args={[1.08, 64, 48]} />
      </mesh>
      <group ref={globe}>
        <mesh material={mat.body} renderOrder={1}>
          <sphereGeometry args={[1, 160, 112]} />
        </mesh>
        <points geometry={lights} material={mat.lights} renderOrder={2} />
        <points geometry={hubs} material={mat.nodes} renderOrder={3} />
        <points geometry={spots} material={mat.spots} renderOrder={4} />
      </group>
    </>
  )
}

/** The "Our reach" globe with its markets' pins: drawn only while it's on screen. */
export default function ReachScene({ bridge, active, mobile }: { bridge: Bridge; active: boolean; mobile: boolean }) {
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
      <Globe bridge={bridge} mobile={mobile} />
    </Canvas>
  )
}
