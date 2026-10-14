import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { setCursorLabel } from '../../components/Cursor'
import { brand } from '../../lib/content'
import { prefersReducedMotion } from '../../lib/gsap'
import { Environment, Float, Lightformer, MeshTransmissionMaterial, PerformanceMonitor, Sparkles } from '@react-three/drei'
import {
  ARROW_HOME,
  ARROW_POINTING,
  BAND_FLIGHT_OFFSET,
  BAND_SECTION,
  ICON_SCALE,
  bandFrame,
  createArrowGeometry,
  createBandPath,
  createFlightPath,
  createLoopGeometry,
  toScene,
  type LoopBand,
} from './loopIcon'

type Theme = 'light' | 'dark'

const PALETTE = {
  dark: { bg: '#050b24', word: '#e9eeff', attenuation: '#b9c9ff', glass: '#f2f5ff', sparkle: '#9db7ff' },
  light: { bg: '#f4f5fa', word: '#ffffff', attenuation: '#c9d6ff', glass: '#ffffff', sparkle: '#2c5bff' },
}

type Refs = {
  /** 0 → 1 while the hero scrolls away */
  progress: MutableRefObject<number>
  /** 0 → 1 intro tween (driven by GSAP) */
  intro: MutableRefObject<number>
}

const damp = THREE.MathUtils.damp
const TAU = Math.PI * 2
const clamp = THREE.MathUtils.clamp
const smoothstep = THREE.MathUtils.smoothstep
const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

/* ------------------------------------------------------------------ the arrow draws the ∞ */

const DRAW = 3 // the arrow rides the ∞ and the glass band comes out behind it
const HOLD = 2.4 // the whole logo
const ABSORB = 3.2 // the band's first end gathers and runs round the ∞ into the arrow
const EMPTY = 0.4 // just the arrow, in its slot
const CYCLE = DRAW + HOLD + ABSORB + EMPTY
const HEADINGS = 720
/** the band ends this far behind the arrow's centre, its rounded head hidden inside the arrow (icon units) */
const LAG = 16
/** length of the band's rounded ends while it's drawn or absorbed (icon units) */
const NOSE = BAND_SECTION.width * 0.9
/** the arrow rides just in front of the band's centre line (icon units) */
const RIDE_Z = 4
/** while it absorbs the band, the arrow steps back along the ∞ to take the band's last end in (icon units) */
const TAKE = 11

/** what the arrow needs to draw the glass band: the shader's uniforms, the mesh and the band's path */
type BandDraw = {
  uniforms: Record<string, THREE.IUniform>
  mesh: MutableRefObject<THREE.Mesh | null>
  path: ReturnType<typeof createBandPath>
  band: LoopBand
}

/**
 * Vertex-shader patch for the glass. The band is only shown from its tail (`uTail`) to its head
 * (`uHead`), positions along the band path. While it's drawn, past the head it folds into a rounded
 * nose that leads into the arrow. While it's taken back, its first end rounds off *inside* the band (a
 * dome `uTailLen` long ending at the tail) and runs round the ∞ — nothing ever sticks out. The upper
 * cut face (`aPath.x < 0`, tagged -(1 + u)) grows with the band when it's born. The glass material
 * itself is untouched.
 */
const DRAW_HEAD = /* glsl */ `
  attribute vec2 aPath;
  uniform float uHead;
  uniform float uTail;
  uniform float uTailLen;
  uniform float uLen;
  uniform float uNose;
  uniform float uGrow;
  uniform vec3 uHeadP;
  uniform vec3 uHeadT;
  uniform vec3 uHeadN;
  uniform vec3 uHeadB;
  uniform vec3 uTailP;
  uniform vec3 uTailT;
  uniform vec3 uTailN;
  uniform vec3 uTailB;
  uniform vec2 uSection;
  uniform vec3 uCut;

  // a rounded nose, len long from its base P, pointing along dir; s = 0 at its base, 1 at its tip
  vec3 nosePoint(vec3 P, vec3 dir, vec3 N, vec3 B, float s, float a, float k, float len, out vec3 n) {
    float r = sqrt(max(1.0 - s * s, 0.0)) * k;
    vec2 cs = vec2(cos(a), sin(a));
    n = normalize((N * cs.x / uSection.x + B * cs.y / uSection.y) * r + dir * (s / max(len, 1e-4) + 1e-4));
    return P + dir * (len * s * k) + (N * cs.x * uSection.x + B * cs.y * uSection.y) * r;
  }
`
const DRAW_BODY = /* glsl */ `
  vec3 drawPos = position;
  float a = aPath.y * 6.28318530718;
  bool cap = aPath.x < 0.0;
  bool centre = aPath.y < 0.0; // the middle of a cut face: it folds to the very tip
  float u = cap ? -aPath.x - 1.0 : aPath.x;
  if (uTail >= 0.0) {
    // taken back: everything before the tail folds into the dome that ends there
    float ahead = (u - uTail) * uLen;
    if (ahead < uTailLen) {
      float s = centre ? 1.0 : clamp(1.0 - ahead / max(uTailLen, 1e-4), 0.0, 1.0);
      drawPos = nosePoint(uTailP, -uTailT, uTailN, uTailB, s, a, 1.0, uTailLen, objectNormal);
    }
  } else if (cap) {
    drawPos = mix(uCut, position, uGrow);
  } else {
    float past = (u - uHead) * uLen;
    if (past > 0.0) drawPos = nosePoint(uHeadP, uHeadT, uHeadN, uHeadB, centre ? 1.0 : min(past / uNose, 1.0), a, uGrow, uNose, objectNormal);
  }
`
function drawable(material: THREE.Material, uniforms: Record<string, THREE.IUniform>) {
  // once per material instance; the uniforms object never changes (only its values do)
  if (material.userData.drawable) return
  material.userData.drawable = true
  const base = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    base.call(material, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${DRAW_HEAD}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${DRAW_BODY}`)
      .replace('#include <begin_vertex>', 'vec3 transformed = drawPos;')
  }
  material.customProgramCacheKey = () => 'osloop-band-draw'
  material.needsUpdate = true
}

/**
 * The orange play arrow of the logo, and the glass ∞ it draws. The hero opens on the arrow alone; it
 * rides the ∞ — always pointing the way it draws — and the band comes out behind it, until it's back in
 * its slot with the logo complete. Then the band's first end gathers and runs round the ∞ into the
 * arrow, and it all starts again.
 */
function LoopArrow({ intro, mobile, draw }: Pick<Refs, 'intro'> & { mobile: boolean; draw: BandDraw }) {
  const ref = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => createArrowGeometry(), [])
  const path = useMemo(() => createFlightPath(), [])
  const start = useMemo(() => path.at(0), [path])
  const home = useMemo(() => toScene(ARROW_HOME.x, ARROW_HOME.y, 0), [])
  const frame = useMemo(() => ({ P: new THREE.Vector3(), T: new THREE.Vector3(), N: new THREE.Vector3(), B: new THREE.Vector3() }), [])
  // heading along the path, unwrapped — the ∞ turns both ways, so it ends where it began
  const headings = useMemo(() => {
    const out = new Float32Array(HEADINGS + 1)
    const t = new THREE.Vector3()
    let prev = 0
    for (let i = 0; i <= HEADINGS; i++) {
      path.tangent(i / HEADINGS, t)
      let a = Math.atan2(t.y, t.x)
      if (i) {
        while (a - prev > Math.PI) a -= TAU
        while (a - prev < -Math.PI) a += TAU
      }
      out[i] = a
      prev = a
    }
    return out
  }, [path])
  const clock = useRef(-1)
  const still = useMemo(() => prefersReducedMotion(), [])
  const p = useMemo(() => new THREE.Vector3(), [])

  /** one end of the band (its position along the band path) → the shader's frame for that end */
  const setEnd = (u: number, P: THREE.IUniform<THREE.Vector3>, T: THREE.IUniform<THREE.Vector3>, N: THREE.IUniform<THREE.Vector3>, B: THREE.IUniform<THREE.Vector3>) => {
    const f = bandFrame(draw.path, THREE.MathUtils.clamp(u, 0, 1), frame.P, frame.T, frame.N, frame.B)
    toScene(f.P.x, f.P.y, f.P.z, P.value)
    T.value.copy(f.T)
    N.value.copy(f.N)
    B.value.copy(f.B)
  }
  /**
   * shows the band from `tail` to `head` (positions along the band path; null = that end is complete);
   * `round` (0–1) is how far the first end has rounded off into its dome while it's taken back
   */
  const showBand = (tail: number | null, head: number | null, round = 0) => {
    const { uniforms: un, mesh, path: bandPath, band } = draw
    const material = mesh.current?.material
    if (material && !Array.isArray(material)) drawable(material, un)
    const h = head ?? 2
    const t = tail ?? -1
    // while it's being born the band and its nose grow from the upper cut
    const grow = head === null ? 1 : THREE.MathUtils.clamp(((h - band.start) * bandPath.length) / (NOSE * 1.2), 0, 1)
    const dome = NOSE * round // icon units
    un.uHead.value = h
    un.uTail.value = t
    un.uTailLen.value = dome * ICON_SCALE
    un.uGrow.value = grow
    if (mesh.current) mesh.current.visible = grow > 0 && (tail === null || t < band.end)
    if (head !== null) setEnd(h, un.uHeadP, un.uHeadT, un.uHeadN, un.uHeadB)
    // the dome's base sits `dome` ahead of the tail
    if (tail !== null) setEnd(t + dome / bandPath.length, un.uTailP, un.uTailT, un.uTailN, un.uTailB)
  }

  /** the arrow `u` of the way round its flight (0 and 1 are both its slot); w = 0 rest pose … 1 riding */
  const pose = (m: THREE.Mesh, u: number, w: number, tilt: number) => {
    if (w <= 0) {
      m.position.copy(home)
      m.rotation.set(0, 0, 0)
      m.scale.setScalar(1)
      return
    }
    path.at(u, p)
    toScene(ARROW_HOME.x + p.x - start.x, ARROW_HOME.y + p.y - start.y, (p.z + RIDE_Z) * w, m.position)
    const f = u * HEADINGS
    const i0 = Math.min(HEADINGS - 1, Math.floor(f))
    const heading = THREE.MathUtils.lerp(headings[i0], headings[i0 + 1], f - i0)
    m.rotation.set(tilt * w, 0, (heading - ARROW_POINTING) * w)
    m.scale.setScalar(1 + (mobile ? 0.02 : 0.06) * w)
  }

  useFrame((state) => {
    const m = ref.current
    if (!m) return
    if (still) {
      showBand(null, null)
      pose(m, 1, 0, 0)
      return
    }
    // it opens on the arrow alone; the cycle starts as the intro lands
    if (clock.current < 0) {
      showBand(null, -1)
      if (intro.current < 0.75) return pose(m, 1, 0, 0)
      clock.current = state.clock.elapsedTime
    }
    const t = (state.clock.elapsedTime - clock.current) % CYCLE
    const L = path.length
    const bandLen = draw.path.length
    if (t < DRAW) {
      // the arrow rides the ∞ and the band comes out behind it
      const x = t / DRAW
      const u = smootherstep(x)
      showBand(null, (u * L - BAND_FLIGHT_OFFSET - LAG) / bandLen)
      pose(m, u, smoothstep(x, 0, 0.12) * smoothstep(1 - x, 0, 0.12), 0.15 * Math.sin(Math.PI * x))
    } else if (t < DRAW + HOLD) {
      showBand(null, null)
      pose(m, 1, 0, 0)
    } else if (t < DRAW + HOLD + ABSORB) {
      // the first end rounds off, then runs round the ∞ into the arrow, which steps back to take it
      const x = (t - DRAW - HOLD) / ABSORB
      const { start: s0, end: s1 } = draw.band
      const round = smoothstep(x, 0, 0.14)
      const k = smootherstep(THREE.MathUtils.clamp((x - 0.08) / 0.78, 0, 1))
      showBand(s0 + (s1 + 0.004 - s0) * k, null, round)
      const back = smoothstep(x, 0, 0.16) * (1 - smoothstep(x, 0.84, 1))
      pose(m, 1 - (TAKE * back) / L, back, 0)
    } else {
      showBand(null, -1)
      pose(m, 1, 0, 0)
    }
  })

  return (
    <mesh ref={ref} geometry={geometry} position={home}>
      {/* not tone-mapped, so it stays the logo's own orange (#FFAE23) */}
      <meshPhysicalMaterial
        color="#ffae23"
        roughness={0.24}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.05}
        emissive="#ffa21a"
        emissiveIntensity={0.62}
        envMapIntensity={0.7}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ glass ∞ */

/**
 * The glass ∞ of the OsLoop icon, with its orange arrow. Grab it and spin it: it keeps the momentum,
 * then springs back to rest (settling on the nearest full turn so it always lands in its original pose).
 */
function GlassLoop({ progress, intro, mobile, theme }: Refs & { mobile: boolean; theme: Theme }) {
  const c = PALETTE[theme]
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const geometry = useMemo(() => createLoopGeometry(mobile ? 320 : 640, mobile ? 32 : 64), [mobile])
  const loopMesh = useRef<THREE.Mesh>(null)
  // the band is drawn by the arrow: the shader's uniforms are made once, their values change every frame
  const bandPath = useMemo(() => createBandPath(), [])
  const uniforms = useMemo(() => {
    const tail = (geometry.userData.band as LoopBand).tail
    return {
      uHead: { value: 2 },
      uTail: { value: -1 },
      uTailLen: { value: 0 },
      uLen: { value: bandPath.length * ICON_SCALE },
      uNose: { value: NOSE * ICON_SCALE },
      uGrow: { value: 1 },
      uHeadP: { value: new THREE.Vector3() },
      uHeadT: { value: new THREE.Vector3(1, 0, 0) },
      uHeadN: { value: new THREE.Vector3(0, 1, 0) },
      uHeadB: { value: new THREE.Vector3(0, 0, 1) },
      uTailP: { value: new THREE.Vector3() },
      uTailT: { value: new THREE.Vector3(1, 0, 0) },
      uTailN: { value: new THREE.Vector3(0, 1, 0) },
      uTailB: { value: new THREE.Vector3(0, 0, 1) },
      uSection: { value: new THREE.Vector2(BAND_SECTION.width, BAND_SECTION.depth).multiplyScalar(ICON_SCALE) },
      uCut: { value: toScene(tail[0], tail[1], tail[2]) },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandPath])
  const draw = useMemo<BandDraw>(() => ({ uniforms, mesh: loopMesh, path: bandPath, band: geometry.userData.band as LoopBand }), [uniforms, bandPath, geometry])
  const { viewport } = useThree()
  const fit = mobile ? (viewport.width / 5.6) * 0.8 : Math.min(1, viewport.width / 7.2) * 0.8
  const baseY = mobile ? 0.55 : 0
  const drag = useRef({ active: false, hover: false, ry: 0, rx: 0, vy: 0, vx: 0, lx: 0, ly: 0, lt: 0, lift: 0 })

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const d = drag.current
    d.active = true
    d.lx = e.clientX
    d.ly = e.clientY
    d.lt = performance.now()
    d.vx = 0
    d.vy = 0
    setCursorLabel('Spin')
    document.documentElement.classList.add('is-grabbing')
    window.dispatchEvent(new Event('loop:grab'))
    const move = (ev: PointerEvent) => {
      const now = performance.now()
      const sec = Math.max(8, now - d.lt) / 1000
      const ry = (ev.clientX - d.lx) * 0.011
      const rx = (ev.clientY - d.ly) * 0.008
      d.ry += ry
      d.rx = clamp(d.rx + rx, -1.2, 1.2)
      d.vy = THREE.MathUtils.lerp(d.vy, ry / sec, 0.5)
      d.vx = THREE.MathUtils.lerp(d.vx, rx / sec, 0.5)
      d.lx = ev.clientX
      d.ly = ev.clientY
      d.lt = now
    }
    const up = () => {
      d.active = false
      d.vy = clamp(d.vy, -22, 22)
      d.vx = clamp(d.vx, -10, 10)
      document.documentElement.classList.remove('is-grabbing')
      setCursorLabel(d.hover ? 'Drag' : null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  useFrame((state, delta) => {
    const g = group.current
    const sp = spin.current
    if (!g || !sp) return
    const dt = Math.min(delta, 1 / 30)
    const t = state.clock.elapsedTime
    const p = progress.current
    const i = intro.current
    const d = drag.current
    const follow = d.active ? 0.15 : 1
    const { x: mx, y: my } = state.pointer
    g.rotation.y = damp(g.rotation.y, (mx * 0.45 + Math.sin(t * 0.22) * 0.3) * follow + p * 2.2 + (1 - i) * -2.4, 2.6, dt)
    g.rotation.x = damp(g.rotation.x, (-my * 0.3 + Math.cos(t * 0.18) * 0.18) * follow + p * 0.9, 2.6, dt)
    g.rotation.z = damp(g.rotation.z, Math.sin(t * 0.12) * 0.12 - p * 0.4, 2.6, dt)
    g.position.y = damp(g.position.y, baseY + p * 1.6, 3, dt)
    const s = fit * (0.55 + 0.45 * i) * (1 - p * 0.25)
    g.scale.setScalar(damp(g.scale.x, s, 3, dt))

    // Spring back home once released (medium pace, a little wobble).
    if (!d.active) {
      const K = 14
      const C = 4.2
      const homeY = Math.round(d.ry / TAU) * TAU
      d.vy += (-K * (d.ry - homeY) - C * d.vy) * dt
      d.vx += (-K * d.rx - C * d.vx) * dt
      d.ry += d.vy * dt
      d.rx += d.vx * dt
    }
    sp.rotation.set(d.rx, d.ry, 0)
    d.lift = damp(d.lift, d.active ? 1 : d.hover ? 0.6 : 0, 6, dt)
    sp.scale.setScalar(1 + d.lift * 0.06)
  })

  return (
    <group ref={group} scale={0.4}>
      <group
        ref={spin}
        onPointerDown={onDown}
        onPointerOver={() => {
          drag.current.hover = true
          if (!drag.current.active) setCursorLabel('Drag')
        }}
        onPointerOut={() => {
          drag.current.hover = false
          if (!drag.current.active) setCursorLabel(null)
        }}
      >
        <mesh ref={loopMesh} geometry={geometry}>
          <MeshTransmissionMaterial
            ref={(m) => void (m && drawable(m as unknown as THREE.Material, uniforms))}
            backside={!mobile}
            backsideThickness={0.35}
            samples={mobile ? 4 : 8}
            resolution={mobile ? 384 : 1024}
            transmission={1}
            thickness={0.55}
            roughness={0.04}
            ior={1.32}
            chromaticAberration={0.4}
            anisotropicBlur={0.15}
            distortion={0.35}
            distortionScale={0.35}
            temporalDistortion={0.08}
            clearcoat={1}
            clearcoatRoughness={0.1}
            attenuationDistance={2.2}
            attenuationColor={c.attenuation}
            color={c.glass}
            background={new THREE.Color(c.bg)}
          />
        </mesh>
        <LoopArrow intro={intro} mobile={mobile} draw={draw} />
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ logo behind the glass */

/** The general OsLoop logo files (white for the dark theme, blue for the light one). */
function useLogoTextures() {
  const [tex, setTex] = useState<Record<Theme, THREE.Texture> | null>(null)
  useEffect(() => {
    let alive = true
    const loader = new THREE.TextureLoader()
    Promise.all([loader.loadAsync(brand.logoWhite), loader.loadAsync(brand.logoBlue)])
      .then(([white, blue]) => {
        for (const t of [white, blue]) {
          t.colorSpace = THREE.SRGBColorSpace
          t.anisotropy = 8
        }
        if (alive) setTex({ dark: white, light: blue })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return tex
}

function BackdropLogo({ progress, intro, mobile, theme }: Refs & { mobile: boolean; theme: Theme }) {
  const ref = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const { viewport, camera } = useThree()
  const vp = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, -2.6))
  const textures = useLogoTextures()
  const map = textures?.[theme]
  const image = map?.image as { width: number; height: number } | undefined
  const aspect = image ? image.width / image.height : 3.25
  // same footprint as the old word: ~86% of the visible width, never taller than ~42% of the height
  const w = Math.min(vp.width * 0.86, vp.height * 0.42 * aspect)

  useFrame((state, dt) => {
    if (!ref.current) return
    const p = progress.current
    const i = intro.current
    ref.current.position.y = damp(ref.current.position.y, (mobile ? 0.75 : 0) - p * 1.2 + (1 - i) * -0.6, 3, dt)
    ref.current.position.x = damp(ref.current.position.x, -state.pointer.x * 0.25, 2, dt)
    if (mat.current) mat.current.opacity = i
  })

  return (
    <group ref={ref} position={[0, 0, -2.6]}>
      {map && (
        <mesh>
          <planeGeometry args={[w, w / aspect]} />
          <meshBasicMaterial ref={mat} map={map} color={PALETTE[theme].word} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ atmosphere */

/** Soft radial glow behind everything — gives the glass something rich to refract. */
function Glow({ theme }: { theme: Theme }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uLight: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv; uniform float uTime; uniform float uLight;
          void main(){
            vec2 p = vUv - 0.5;
            vec2 a = vec2(sin(uTime*0.21)*0.12, cos(uTime*0.17)*0.08);
            float g1 = smoothstep(0.42, 0.0, length(p - a - vec2(-0.12, 0.05)));
            float g2 = smoothstep(0.36, 0.0, length(p + a - vec2(0.18, -0.06)));
            float g3 = smoothstep(0.22, 0.0, length(p - vec2(0.28, 0.2) + a*0.5));
            vec3 c = vec3(0.10,0.25,0.71)*g1*0.9 + vec3(0.17,0.36,1.0)*g2*0.7 + vec3(1.0,0.71,0.28)*g3*0.18;
            float alpha = max(max(g1,g2),g3);
            // Light theme: soft pastel washes instead of glowing light.
            vec3 cl = (vec3(0.55,0.65,1.0)*g1 + vec3(0.62,0.74,1.0)*g2 + vec3(1.0,0.8,0.55)*g3*0.7) / max(g1+g2+g3*0.7, 0.001);
            gl_FragColor = vec4(mix(c, cl, uLight), alpha * mix(1.0, 0.55, uLight));
          }
        `,
      }),
    [],
  )
  useFrame((s, dt) => {
    material.uniforms.uTime.value = s.clock.elapsedTime
    material.uniforms.uLight.value = THREE.MathUtils.damp(material.uniforms.uLight.value, theme === 'light' ? 1 : 0, 6, dt)
  })
  return (
    <mesh position={[0, 0, -6]} material={material}>
      <planeGeometry args={[26, 16]} />
    </mesh>
  )
}

function Orbs() {
  return (
    <>
      <Float speed={1.1} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh position={[-3.3, 1.5, -0.8]}>
          <sphereGeometry args={[0.28, 48, 48]} />
          <meshPhysicalMaterial color="#2c5bff" roughness={0.15} metalness={0.2} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={0.9} rotationIntensity={0.4} floatIntensity={1.4}>
        <mesh position={[3.7, 0.4, -0.9]}>
          <sphereGeometry args={[0.2, 48, 48]} />
          <meshPhysicalMaterial color="#ffb547" roughness={0.2} metalness={0.1} clearcoat={1} emissive="#ff8a00" emissiveIntensity={0.25} />
        </mesh>
      </Float>
      <Float speed={1.3} rotationIntensity={1} floatIntensity={0.8}>
        <mesh position={[2.6, 1.9, -1.6]}>
          <torusGeometry args={[0.22, 0.08, 24, 64]} />
          <meshPhysicalMaterial color="#e9eeff" roughness={0.05} metalness={0.9} />
        </mesh>
      </Float>
    </>
  )
}

function CameraRig() {
  useFrame((state, dt) => {
    const cam = state.camera
    cam.position.x = damp(cam.position.x, state.pointer.x * 0.35, 2, dt)
    cam.position.y = damp(cam.position.y, state.pointer.y * 0.25, 2, dt)
    cam.lookAt(0, 0, 0)
  })
  return null
}

export default function HeroScene({
  progress,
  intro,
  active,
  mobile,
  theme,
}: Refs & { active: boolean; mobile: boolean; theme: Theme }) {
  const c = PALETTE[theme]
  const [dpr, setDpr] = useState(mobile ? 1.25 : 1.6)
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ position: [0, 0, 7.5], fov: 38 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.25 : 1.6)} />
      <color attach="background" args={[c.bg]} key={c.bg} />
      <Glow theme={theme} />
      <BackdropLogo progress={progress} intro={intro} mobile={mobile} theme={theme} />
      <GlassLoop progress={progress} intro={intro} mobile={mobile} theme={theme} />
      <Orbs />
      <Sparkles count={mobile ? 40 : 90} scale={[12, 7, 5]} size={2.2} speed={0.25} color={c.sparkle} opacity={0.6} />
      <CameraRig />
      <Environment resolution={256} frames={1}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color="#2c5bff" intensity={60} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
          <Lightformer form="rect" color="#ffb547" intensity={3} position={[-10, -4, 4]} scale={[8, 2, 1]} />
        </group>
      </Environment>
    </Canvas>
  )
}
