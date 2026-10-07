import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { buildRandoms, buildShape, logoShape, type ShapeName } from './shapes'

/** Where a formation sits on stage. x is mirrored to 0 on mobile (shape above the copy). */
export type View = {
  x: number
  y: number
  rx: number
  ry: number
  rz?: number
  scale: number
  /** continuous rotation speed (rad/s). 0 = settle facing the camera */
  spin: number
}

type Theme = 'light' | 'dark'

const damp = THREE.MathUtils.damp
const lerp = THREE.MathUtils.lerp
const TAU = Math.PI * 2

const PALETTE = {
  dark: { bg: '#030719', a: '#2147c9', b: '#7f9dff', c: '#ffffff', accent: '#ffb547' },
  light: { bg: '#f4f5fa', a: '#1940b4', b: '#2c5bff', c: '#050b24', accent: '#ff9a1f' },
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform float uWaveFrom;
  uniform float uWaveTo;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uAccent;
  uniform float uLight;
  uniform float uFade;
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aRand;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 waveAnim(vec3 p, float w) {
    float k = 0.5 + 0.5 * sin(uTime * 2.2 + p.x * 1.7) * cos(uTime * 1.15 - p.x * 0.6);
    p.y *= mix(1.0, 0.25 + k, w);
    return p;
  }

  void main() {
    float delay = aRand.x * 0.45;
    float t = clamp((uMix - delay) / 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 pos = mix(waveAnim(aFrom, uWaveFrom), waveAnim(aTo, uWaveTo), t);

    float mid = sin(t * 3.14159265);
    float ph = aRand.z * 6.2831853;
    vec3 turb = vec3(
      sin(pos.y * 1.3 + uTime * 0.6 + ph),
      cos(pos.x * 1.1 + uTime * 0.5 + ph * 1.3),
      sin((pos.x + pos.y) * 0.8 + uTime * 0.45 + ph)
    );
    pos += turb * (0.02 + mid * 0.6 * (0.35 + aRand.y));
    float ang = mid * (aRand.w - 0.5) * 1.8;
    float ca = cos(ang), sa = sin(ang);
    pos.xz = mat2(ca, -sa, sa, ca) * pos.xz;

    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float force = smoothstep(1.2, 0.0, dist) * uMouseStrength;
    pos.xy += (d / max(dist, 0.0001)) * force * 0.5;
    pos.z += force * 0.35;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.35 + aRand.y * 0.95) * mix(1.0, 0.82, uLight);
    gl_PointSize = size * uPixelRatio / -mv.z;

    vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 0.65, aRand.w));
    col = mix(col, uColorC, smoothstep(0.78, 1.0, aRand.w));
    col = mix(col, uAccent, step(0.972, aRand.z));
    vColor = col;
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + aRand.y * 2.2) + ph);
    float base = twinkle * (0.5 + 0.5 * aRand.y) * (1.0 - mid * 0.2) + force * 0.4;
    vAlpha = base * mix(1.0, 1.25, uLight) * uFade;
  }
`

const fragment = /* glsl */ `
  uniform float uLight;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), mix(1.7, 1.1, uLight));
    vec3 glow = vColor * (0.75 + a * 0.6);
    gl_FragColor = vec4(mix(glow, vColor, uLight), a * vAlpha);
  }
`

type FieldProps = {
  /** float index into `shapes` — 2.5 means half-way between shape 2 and 3 */
  progress: MutableRefObject<number>
  shapes: ShapeName[]
  views: View[]
  theme: Theme
  /** 0..1 global opacity (optional) */
  fade?: MutableRefObject<number>
  count: number
}

function Particles({ progress, shapes, views, theme, fade, count }: FieldProps) {
  const points = useRef<THREE.Points>(null)
  const group = useRef<THREE.Group>(null)
  const { gl, size, camera } = useThree()
  const smooth = useRef(progress.current)
  const seg = useRef(-1)
  const spin = useRef(0)
  const mouseStrength = useRef(0)
  const lastPointer = useRef(new THREE.Vector2(9, 9))
  const tmp = useMemo(
    () => ({ ray: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit: new THREE.Vector3() }),
    [],
  )
  const key = shapes.join('|')

  const { geometry, attrs } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const cache = new Map<ShapeName, THREE.BufferAttribute>()
    const attrs = shapes.map((s) => {
      if (!cache.has(s)) cache.set(s, new THREE.BufferAttribute(buildShape(s, count), 3))
      return cache.get(s)!
    })
    geo.setAttribute('position', attrs[0])
    geo.setAttribute('aFrom', attrs[0])
    geo.setAttribute('aTo', attrs[Math.min(1, attrs.length - 1)])
    geo.setAttribute('aRand', new THREE.BufferAttribute(buildRandoms(count), 4))
    return { geometry: geo, attrs }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, count])

  // Re-sample the wordmark once the display font is ready.
  useEffect(() => {
    let alive = true
    const i = shapes.indexOf('logo')
    if (i < 0) return
    document.fonts.load('800 330px "Inter Tight Variable"').then(() => {
      if (!alive) return
      ;(attrs[i].array as Float32Array).set(logoShape(count))
      attrs[i].needsUpdate = true
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attrs, count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMix: { value: 0 },
          uSize: { value: 50 },
          uPixelRatio: { value: 1 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uMouseStrength: { value: 0 },
          uWaveFrom: { value: 0 },
          uWaveTo: { value: 0 },
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color() },
          uColorC: { value: new THREE.Color() },
          uAccent: { value: new THREE.Color() },
          uLight: { value: 0 },
          uFade: { value: 1 },
        },
      }),
    [],
  )

  // Theme: additive glow on dark, crisp ink dots on light.
  useEffect(() => {
    const c = PALETTE[theme]
    const u = material.uniforms
    u.uColorA.value.set(c.a)
    u.uColorB.value.set(c.b)
    u.uColorC.value.set(c.c)
    u.uAccent.value.set(c.accent)
    u.uLight.value = theme === 'light' ? 1 : 0
    material.blending = theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending
    material.needsUpdate = true
  }, [theme, material])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state, dt) => {
    const u = material.uniforms
    const mobile = size.width < 760
    u.uTime.value = state.clock.elapsedTime
    u.uPixelRatio.value = gl.getPixelRatio()
    u.uSize.value = (mobile ? 46 : 58) * Math.min(1.35, size.height / 900)
    u.uFade.value = fade ? fade.current : 1

    // Medium-paced follow of the scroll position.
    smooth.current = damp(smooth.current, progress.current, 2.4, Math.min(dt, 0.05))
    const maxSeg = shapes.length - 2
    const p = THREE.MathUtils.clamp(smooth.current, 0, maxSeg + 1)
    const s = Math.max(0, Math.min(Math.floor(p), maxSeg))
    const t = p - s
    if (s !== seg.current) {
      seg.current = s
      geometry.setAttribute('aFrom', attrs[s])
      geometry.setAttribute('aTo', attrs[s + 1])
      u.uWaveFrom.value = shapes[s] === 'wave' ? 1 : 0
      u.uWaveTo.value = shapes[s + 1] === 'wave' ? 1 : 0
    }
    u.uMix.value = t

    const a = views[s]
    const b = views[s + 1] ?? a
    const e = t * t * (3 - 2 * t)
    const g = group.current!
    // Narrower screens: pull formations in and shrink them so they never cover the copy.
    const fit = THREE.MathUtils.clamp(size.width / size.height / 1.75, 0.68, 1.1)
    const x = mobile ? 0 : lerp(a.x, b.x, e) * fit
    const y = mobile ? lerp(a.y, b.y, e) * 0.3 + 1.55 : lerp(a.y, b.y, e)
    const sc = lerp(a.scale, b.scale, e) * (mobile ? 0.56 : fit)
    g.position.x = damp(g.position.x, x, 3, dt)
    g.position.y = damp(g.position.y, y, 3, dt)
    g.scale.setScalar(damp(g.scale.x, sc, 3, dt))

    const spinSpeed = lerp(a.spin, b.spin, e)
    if (spinSpeed > 0.005) spin.current += spinSpeed * dt
    else spin.current = damp(spin.current, Math.round(spin.current / TAU) * TAU, 2.2, dt)
    g.rotation.x = damp(g.rotation.x, lerp(a.rx, b.rx, e) + state.pointer.y * -0.08, 2.5, dt)
    g.rotation.z = damp(g.rotation.z, lerp(a.rz ?? 0, b.rz ?? 0, e), 2.5, dt)
    points.current!.rotation.y = lerp(a.ry, b.ry, e) + spin.current + state.pointer.x * 0.12

    // Pointer → local space for the repel force.
    const moved = lastPointer.current.distanceToSquared(state.pointer) > 1e-6
    lastPointer.current.copy(state.pointer)
    mouseStrength.current = damp(mouseStrength.current, moved ? 1 : 0.25, moved ? 6 : 1.2, dt)
    tmp.ray.setFromCamera(state.pointer, camera)
    if (tmp.ray.ray.intersectPlane(tmp.plane, tmp.hit)) {
      points.current!.worldToLocal(tmp.hit)
      u.uMouse.value.lerp(tmp.hit, 0.2)
    }
    u.uMouseStrength.value = mouseStrength.current

    state.camera.position.x = damp(state.camera.position.x, state.pointer.x * 0.35, 2, dt)
    state.camera.position.y = damp(state.camera.position.y, state.pointer.y * 0.22, 2, dt)
    state.camera.position.z = mobile ? 11 : 9
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}

export default function ParticleField(props: Omit<FieldProps, 'count'>) {
  const count = useMemo(() => {
    const mobile = window.matchMedia('(max-width: 760px)').matches
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4
    return mobile ? 12000 : weak ? 16000 : 26000
  }, [])
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, 1.75))
  const bg = PALETTE[props.theme].bg

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 9], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: false }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.75))} />
      <color attach="background" args={[bg]} key={bg} />
      <Particles {...props} count={count} />
    </Canvas>
  )
}
