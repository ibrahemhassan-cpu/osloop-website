import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { setCursorLabel } from '../../components/Cursor'
import { brand } from '../../lib/content'
import {
  Environment,
  Float,
  Lightformer,
  MeshTransmissionMaterial,
  PerformanceMonitor,
  Sparkles,
  Text,
} from '@react-three/drei'

type Theme = 'light' | 'dark'

const PALETTE = {
  dark: { bg: '#050b24', word: '#e9eeff', attenuation: '#b9c9ff', glass: '#f2f5ff', sparkle: '#9db7ff' },
  light: { bg: '#f4f5fa', word: '#1940b4', attenuation: '#c9d6ff', glass: '#ffffff', sparkle: '#2c5bff' },
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

/** Infinity curve (lemniscate of Bernoulli) lifted in Z so the tube never self-intersects. */
class Lemniscate extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2
    const s = Math.sin(a)
    const c = Math.cos(a)
    const d = 1 + s * s
    return target.set((2.25 * c) / d, (2.25 * s * c) / d, 0.55 * s)
  }
}

/**
 * The glass ∞. Grab it and spin it: it keeps the momentum, then springs back to rest
 * (settling on the nearest full turn so it always lands in its original pose).
 */
function GlassLoop({ progress, intro, mobile, theme }: Refs & { mobile: boolean; theme: Theme }) {
  const c = PALETTE[theme]
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const geometry = useMemo(() => new THREE.TubeGeometry(new Lemniscate(), mobile ? 260 : 520, 0.4, mobile ? 32 : 64, true), [mobile])
  const { viewport } = useThree()
  const fit = mobile ? (viewport.width / 5.6) * 0.92 : Math.min(1, viewport.width / 7.2) * 0.8
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
      <group ref={spin}>
        <mesh
          geometry={geometry}
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
          <MeshTransmissionMaterial
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
      </group>
    </group>
  )
}

/**
 * Loads the general OsLoop logo (SVG) as a white silhouette texture so it can be tinted per theme.
 * Returns null while loading or if the file isn't there yet — the scene then shows the word instead.
 */
function useMarkTexture(url: string) {
  const [mark, setMark] = useState<{ texture: THREE.CanvasTexture; aspect: number } | null>(null)
  useEffect(() => {
    let alive = true
    const img = new Image()
    img.onload = () => {
      if (!alive) return
      const nw = img.naturalWidth || 1200
      const nh = img.naturalHeight || 400
      const w = 2048
      const h = Math.max(1, Math.round((w * nh) / nw))
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      const texture = new THREE.CanvasTexture(c)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 8
      setMark({ texture, aspect: w / h })
    }
    img.onerror = () => alive && setMark(null)
    img.src = url
    return () => {
      alive = false
    }
  }, [url])
  return mark
}

function BackdropWord({ progress, intro, mobile, theme }: Refs & { mobile: boolean; theme: Theme }) {
  const ref = useRef<THREE.Group>(null)
  const { viewport, camera } = useThree()
  const vp = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, -2.6))
  const size = Math.min(vp.width / 3.05, 3.2)

  const mark = useMarkTexture(brand.markSvg)

  useFrame((state, dt) => {
    if (!ref.current) return
    const p = progress.current
    const i = intro.current
    ref.current.position.y = damp(ref.current.position.y, (mobile ? 0.75 : 0) - p * 1.2 + (1 - i) * -0.6, 3, dt)
    ref.current.position.x = damp(ref.current.position.x, -state.pointer.x * 0.25, 2, dt)
    const mat = (ref.current.children[0] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined
    if (mat) mat.opacity = i
  })

  if (mark) {
    // Same footprint as the word: ~88% of the visible width, never taller than ~42% of the height.
    const w = Math.min(vp.width * 0.86, vp.height * 0.42 * mark.aspect)
    return (
      <group ref={ref} position={[0, 0, -2.6]}>
        <mesh>
          <planeGeometry args={[w, w / mark.aspect]} />
          <meshBasicMaterial map={mark.texture} color={PALETTE[theme].word} transparent toneMapped={false} />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={ref} position={[0, 0, -2.6]}>
      <Text
        font="/fonts/InterTight-ExtraBold.woff"
        fontSize={size}
        letterSpacing={-0.065}
        anchorX="center"
        anchorY="middle"
        position={[0, size * 0.04, 0]}
      >
        osloop
        <meshBasicMaterial color={PALETTE[theme].word} transparent toneMapped={false} />
      </Text>
    </group>
  )
}

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

const FLIGHT = 2.6 // seconds out-and-back
const REST = 3 // seconds still at home

/** Orange orb: flies out on a smooth loop and lands exactly where it started, then rests. */
function LoopingOrb() {
  const ref = useRef<THREE.Mesh>(null)
  const home = useMemo(() => new THREE.Vector3(3.7, 0.4, -0.9), [])
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime % (FLIGHT + REST)
    if (t >= FLIGHT) {
      m.position.copy(home)
      m.scale.setScalar(1)
      return
    }
    const x = t / FLIGHT
    const u = x * x * x * (x * (x * 6 - 15) + 10) // smootherstep — zero velocity at both ends
    const a = u * Math.PI * 2
    const R = 0.95
    m.position.set(home.x - R * Math.sin(a) * 1.25, home.y + R * (1 - Math.cos(a)), home.z + R * 0.9 * Math.sin(a))
    m.scale.setScalar(1 + 0.35 * Math.sin(u * Math.PI))
    m.rotation.y = a
  })
  return (
    <mesh ref={ref} position={home}>
      <sphereGeometry args={[0.2, 48, 48]} />
      <meshPhysicalMaterial color="#ffb547" roughness={0.2} metalness={0.1} clearcoat={1} emissive="#ff8a00" emissiveIntensity={0.25} />
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
      <LoopingOrb />
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
      <BackdropWord progress={progress} intro={intro} mobile={mobile} theme={theme} />
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
