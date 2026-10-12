import { Component, lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { brand } from '../lib/content'
import { A, ARROW_HOME_SVG, ARROW_SCALE, RHO, RT } from '../lib/loopShape'
import { useTheme } from '../providers/Theme'
import { IconArrow, IconBand, IconDefs } from './art'
import { TAGLINE_BOX, TAGLINE_D, WORD, WORD_BOX } from './wordmark'
import type { LoaderProps } from './types'
import './word.css'

const WordScene = lazy(() => import('./WordScene'))

/** what the timeline drives in the 3D scene; per-letter values are indexed o, s, L, ∞, p */
export type WordState = {
  depth: Record<number, number>
  exit: Record<number, number>
  ry: number
  rx: number
  zoom: number
  ride: number
}
/** the 3D camera sees the word exactly where the SVG draws it */
export type WordLayout = { cx: number; cy: number; fov: number; dist: number }

const CX = WORD_BOX.x + WORD_BOX.w / 2
const CY = WORD_BOX.y + WORD_BOX.h / 2
const FOV = 30
const TAG_W = TAGLINE_BOX.w + 4
/** the exit starts from the middle of the word (L, ∞) and reaches the ends (o, p) last */
const EXIT_DELAY = [0.12, 0.07, 0.02, 0.03, 0.11]

/** the geometry the letters are built on (icon units, y down): their rings… */
const RINGS = [
  { x: -239.61, y: -0.18, r: [41.32, 16.77] },
  { x: -157.83, y: -8.08, r: [33.4, 11.16] },
  { x: -173.56, y: 7.72, r: [33.38, 11.16] },
  { x: -A, y: 0, r: [RHO + RT, RHO - RT] },
  { x: A, y: 0, r: [RHO + RT, RHO - RT] },
  { x: 129.66, y: 0.87, r: [41.32, 16.77] },
]
/** …the type lines, the 12° slant of the L and the p, and the 45° cut of the s */
const LINES = [
  [-300, -60.65, 192, -60.65],
  [-300, -41.5, 192, -41.5],
  [-300, 41.14, 192, 41.14],
  [-300, 77.71, 192, 77.71],
  [-86.29, -75, -121.84, 92],
  [103.66, -75, 68.38, 92],
  [-112.8, -53.1, -218.6, 52.7],
]

/** if WebGL (or its chunk) isn't available, the loader finishes on the flat logo */
class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Loading screen — "Take Shape".
 * The word "osloop" builds itself: the construction lines of its letters are drawn, the flat logo fills
 * in, then it extrudes into real 3D and turns in the light while the play arrow rides the ∞ once. Then
 * the word bursts towards us, its letters spreading off the screen, onto the site. Follows the theme.
 */
export function Word3D({ onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  // the box the fixed overlay really gets (no scrollbar), so the SVG and the 3D camera share one scale
  const [{ w, h }] = useState(() => ({ w: document.documentElement.clientWidth || window.innerWidth, h: window.innerHeight }))
  const [still] = useState(prefersReducedMotion)
  const mobile = w < 640
  const S = Math.min(((mobile ? 0.86 : 0.62) * w) / WORD_BOX.w, (0.34 * h) / WORD_BOX.h) // px per icon unit
  const [layout] = useState<WordLayout>(() => ({ cx: CX, cy: CY, fov: FOV, dist: h / S / (2 * Math.tan((FOV * Math.PI) / 360)) }))
  const st = useRef<WordState>({ depth: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, exit: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, ry: 0, rx: 0, zoom: 1, ride: 0 })
  const link = useRef({ ready: false, failed: false, onReady: () => {}, onFail: () => {} })

  useGSAP(
    () => {
      const el = root.current!
      const stage = el.querySelector<HTMLElement>('.ld-word__stage')!
      const depthOut = el.querySelector<HTMLElement>('.ld-word__depth')!
      const s = st.current
      const readout = { v: 0 }
      const setStage = (t: string) => () => {
        stage.textContent = t
      }

      if (still) {
        gsap.set('.ld-word__guides', { opacity: 0 })
        gsap.set('.ld-word__tagclip', { attr: { width: TAG_W } })
        gsap.timeline().to(el, { autoAlpha: 0, duration: 0.5, delay: 0.9 }).add(onReveal, 0.9).add(onDone)
        return
      }

      const tl = gsap.timeline({ paused: true })
      let waiting = false
      let timer = 0
      let flat = false

      // no 3D after all: end on the flat logo
      const finishFlat = () => {
        if (flat) return
        flat = true
        waiting = false
        window.clearTimeout(timer)
        tl.kill()
        gsap
          .timeline()
          .to('.ld-word__guides', { opacity: 0, duration: 0.4 }, 0)
          .fromTo('.ld-word__tagclip', { attr: { width: 0 } }, { attr: { width: TAG_W }, duration: 0.7, ease: 'power2.inOut' }, 0)
          .add(onReveal, 1)
          .to(el, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, 1)
          .add(onDone)
      }
      link.current.onReady = () => {
        if (!waiting) return
        waiting = false
        window.clearTimeout(timer)
        tl.play()
      }
      link.current.onFail = () => {
        if (waiting) finishFlat()
      }
      // the 3D takes over here — wait for it if it's still loading
      const handOver = () => {
        if (link.current.failed) return finishFlat()
        if (link.current.ready) return
        tl.pause()
        waiting = true
        timer = window.setTimeout(finishFlat, 2600)
      }

      tl.from('.ld-word__hud-in', { yPercent: 115, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.1)
        // 01 · construct: the rings and lines the letters are built on
        .fromTo('.ld-word__guide', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.95, stagger: 0.035, ease: 'power2.inOut' }, 0.12)
        .from('.ld-word__dot', { scale: 0, transformOrigin: '50% 50%', duration: 0.45, stagger: 0.05, ease: 'back.out(3)' }, 0.5)
        // 02 · fill: the flat logo
        .add(setStage('02 Fill'), 0.85)
        .from('.ld-word__l', { opacity: 0, scale: 0.84, transformOrigin: '50% 50%', duration: 0.55, stagger: 0.07, ease: 'expo.out' }, 0.85)
        .from('.ld-word__arrow', { scale: 0, rotation: -40, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.2)' }, 1.2)
        .to('.ld-word__guides', { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, 1.35)
        // 03 · extrude: the flat logo becomes solid and turns in the light
        .addLabel('gl', 1.6)
        .add(handOver, 'gl')
        .set('.ld-word__gl', { opacity: 1 }, 'gl+=0.01')
        .to('.ld-word__letters', { opacity: 0, duration: 0.35, ease: 'power1.in' }, 'gl+=0.02')
        .add(setStage('03 Extrude'), 'gl+=0.02')
      for (let i = 0; i < 5; i++) tl.to(s.depth, { [i]: 1, duration: 1, ease: 'power3.inOut' }, `gl+=${0.12 + i * 0.07}`)
      tl.to(readout, { v: 19.8, duration: 1.28, ease: 'power3.inOut', onUpdate: () => void (depthOut.textContent = readout.v.toFixed(1)) }, 'gl+=0.12')
        .to(s, { ry: -0.5, rx: 0.2, zoom: 0.9, duration: 1.3, ease: 'power2.inOut' }, 'gl+=0.08')
        // 04 · play: the arrow rides the ∞ once while the word turns back to face us
        .addLabel('play', 'gl+=1.1')
        .add(setStage('04 Play'), 'play')
        .set('.ld-word__stage', { color: '#ffae23' }, 'play')
        .to(s, { ride: 1, duration: 1.2, ease: 'none' }, 'play')
        .to(s, { ry: 0.16, rx: 0.05, duration: 0.8, ease: 'power2.inOut' }, 'play')
        .to(s, { ry: 0, rx: 0, zoom: 1, duration: 0.6, ease: 'power2.inOut' }, 'play+=0.8')
        .fromTo('.ld-word__tagclip', { attr: { width: 0 } }, { attr: { width: TAG_W }, duration: 0.6, ease: 'power2.inOut' }, 'play+=0.85')
        // the word bursts towards us, letters spreading off the screen, and the site is behind it
        .addLabel('open', 'play+=1.5')
        .add(onReveal, 'open')
        .to('.ld-word__bg', { opacity: 0, duration: 0.75, ease: 'power2.inOut' }, 'open')
        .to('.ld-word__tag', { opacity: 0, duration: 0.3, ease: 'power1.in' }, 'open')
        .to('.ld-word__hud', { opacity: 0, duration: 0.4 }, 'open')
      EXIT_DELAY.forEach((d, i) => tl.to(s.exit, { [i]: 1, duration: 0.9, ease: 'power2.in' }, `open+=${d}`))
      tl.to('.ld-word__gl', { opacity: 0, duration: 0.35, ease: 'power1.in' }, 'open+=0.65').add(onDone)

      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.play())
      return () => window.clearTimeout(timer)
    },
    { scope: root },
  )

  return (
    <div className="ld-word" ref={root} aria-hidden>
      <div className="ld-word__bg" />
      {!still && (
        <div className="ld-word__gl">
          <Boundary
            onError={() => {
              link.current.failed = true
              link.current.onFail()
            }}
          >
            <Suspense fallback={null}>
              <WordScene
                st={st}
                layout={layout}
                theme={theme}
                mobile={mobile}
                onReady={() => {
                  if (link.current.ready) return
                  link.current.ready = true
                  link.current.onReady()
                }}
              />
            </Suspense>
          </Boundary>
        </div>
      )}

      <svg className="ld-word__svg" viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} style={{ ['--px' as string]: 1 / S }}>
        <defs>
          <IconDefs id="word" />
          <clipPath id="word-tag">
            <rect className="ld-word__tagclip" x={TAGLINE_BOX.x - 2} y={TAGLINE_BOX.y - 2} width="0" height={TAGLINE_BOX.h + 4} />
          </clipPath>
        </defs>
        <g transform={`scale(${S}) translate(${-CX} ${-CY})`}>
          <g className="ld-word__guides">
            {RINGS.map((c, i) => (
              <g key={i}>
                {c.r.map((r) => (
                  <circle key={r} className="ld-word__guide" cx={c.x} cy={c.y} r={r} pathLength={1} />
                ))}
                <circle className="ld-word__dot" cx={c.x} cy={c.y} r={2.4 / S} />
              </g>
            ))}
            {LINES.map(([x1, y1, x2, y2], i) => (
              <line key={i} className="ld-word__guide" x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} />
            ))}
          </g>

          <g className="ld-word__letters">
            <g className="ld-word__l">
              <path className="ld-word__ink" d={WORD.o[0]} />
            </g>
            <g className="ld-word__l">
              {WORD.s.map((d) => (
                <path key={d} className="ld-word__ink" d={d} />
              ))}
            </g>
            <g className="ld-word__l">
              <path className="ld-word__ink" d={WORD.L[0]} />
            </g>
            <g className="ld-word__l">
              <IconBand id="word" />
            </g>
            <g className="ld-word__l">
              {WORD.p.map((d) => (
                <path key={d} className="ld-word__ink" d={d} />
              ))}
            </g>
            <g className="ld-word__arrow">
              <IconArrow transform={`translate(${ARROW_HOME_SVG.x} ${ARROW_HOME_SVG.y}) scale(${1 / ARROW_SCALE})`} />
            </g>
          </g>

          <path className="ld-word__tag" d={TAGLINE_D} clipPath="url(#word-tag)" />
        </g>
      </svg>

      <div className="ld-word__hud mono">
        <span className="ld-word__hud-item ld-word__hud-item--tl">
          <span className="ld-word__hud-in">{brand.fullName}</span>
        </span>
        <span className="ld-word__hud-item ld-word__hud-item--tr">
          <span className="ld-word__hud-in">2D → 3D</span>
        </span>
        <span className="ld-word__hud-item ld-word__hud-item--bl">
          <span className="ld-word__hud-in">
            <b className="ld-word__stage">01 Construct</b>
          </span>
        </span>
        <span className="ld-word__hud-item ld-word__hud-item--br">
          <span className="ld-word__hud-in">
            Depth <b className="ld-word__depth">0.0</b>
          </span>
        </span>
      </div>
    </div>
  )
}
