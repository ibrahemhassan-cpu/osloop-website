import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { brand } from '../lib/content'
import { A, ARROW_HOME_SVG, RHO, RT } from '../lib/loopShape'
import { useTheme } from '../providers/Theme'
import { ICON_CENTRE, IconArrow, IconBand, IconDefs, StackedWord } from './art'
import type { LoaderProps } from './types'
import './loops.css'

/** each loop sits inside the right lobe of the one before */
const H = { x: A, y: 0 } // the right lobe's hole — every level shares it
const HOLE = RHO - RT
const Q = 0.135 // size of the next loop
const TWIST = 32 // degrees each level turns
const LEVELS = 6
const Z_END = 3 // the loop we land on

/**
 * Loading screen — "Loop after Loop".
 * An endless zoom: every OsLoop ∞ holds the next one inside its lobe, turning a little each time.
 * We dive through three loops, land on the logo, then fly through its lobe — which becomes the
 * window onto the site. Follows the light / dark theme.
 */
export function LoopAfterLoop({ onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [{ w, h }] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const S = Math.min(w * 0.62, h * 0.62 * 1.7, 560) / 164 // px per icon unit at rest

  useGSAP(
    () => {
      const el = root.current!
      const levels = [...el.querySelectorAll<SVGUseElement>('.ld-loop__lvl')]
      const word = el.querySelector<SVGGElement>('.ld-loop__word')!
      const hole = el.querySelector<SVGCircleElement>('.ld-loop__hole')!
      const counter = el.querySelector<HTMLElement>('.ld-loop__count')!
      const st = { z: -0.6, f: 0, open: 0, wordY: 18 }
      let shown = ''

      const transformFor = (k: number, fx: number, fy: number) => {
        const s = S * Q ** (k - st.z)
        return `translate(${(S * (H.x - fx)).toFixed(2)} ${(S * (H.y - fy)).toFixed(2)}) rotate(${(TWIST * (k - st.z)).toFixed(2)}) scale(${s.toFixed(5)}) translate(${-H.x} ${-H.y})`
      }

      const paint = () => {
        // the camera looks at the hole while diving, at the logo's centre when it lands
        const fx = H.x + (ICON_CENTRE.x - H.x) * st.f
        const fy = H.y + (ICON_CENTRE.y - H.y) * st.f
        const base = Math.floor(st.z) - 1
        levels.forEach((lvl, j) => {
          const k = base + j
          const s = S * Q ** (k - st.z)
          lvl.setAttribute('transform', transformFor(k, fx, fy))
          lvl.style.color = `var(${k % 2 ? '--ld-loop-alt' : '--ld-loop-ink'})`
          // loops fade as they fly past the camera (tunnel), and appear once big enough to read
          const passed = st.z - k
          lvl.style.opacity = s < 0.012 ? '0' : passed > 0 ? Math.max(0, 1 - passed * 1.15).toFixed(3) : '1'
        })
        word.setAttribute('transform', `${transformFor(Z_END, fx, fy)} translate(0 ${st.wordY})`)
        // the final loop's lobe becomes the window onto the site
        const hs = S * Q ** (Z_END - st.z)
        hole.setAttribute('cx', (S * (H.x - fx)).toFixed(2))
        hole.setAttribute('cy', (S * (H.y - fy)).toFixed(2))
        hole.setAttribute('r', st.open ? (HOLE * hs).toFixed(2) : '0')
        const label = `Loop ${String(Math.max(1, Math.floor(st.z + 0.5) + 1)).padStart(2, '0')}`
        if (label !== shown) counter.textContent = shown = label
      }
      paint()

      if (prefersReducedMotion()) {
        st.z = Z_END
        st.f = 1
        st.wordY = 0
        paint()
        gsap.set(word, { opacity: 1 })
        gsap.timeline().to(el, { autoAlpha: 0, duration: 0.5, delay: 0.7 }).add(onReveal, 0.7).add(onDone)
        return
      }

      const tl = gsap.timeline({ paused: true })
      tl.from('.ld-loop__scene', { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0)
        .from('.ld-loop__hud-in', { yPercent: 115, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.1)
        // dive: loop after loop
        .to(st, { z: Z_END, duration: 2.75, ease: 'power2.inOut', onUpdate: paint }, 0)
        // land on the logo
        .to(st, { f: 1, duration: 0.85, ease: 'power3.inOut', onUpdate: paint }, 2.15)
        .to(word, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 2.75)
        .to(st, { wordY: 0, duration: 0.8, ease: 'expo.out', onUpdate: paint }, 2.75)
        .set('.ld-loop__count', { color: '#ffae23' }, 2.75)
        // fly through the lobe onto the site
        .addLabel('open', 3.45)
        .add(() => {
          st.open = 1
          paint()
        }, 'open')
        .add(onReveal, 'open')
        .to(word, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 'open')
        .to(st, { f: 0, duration: 1.05, ease: 'power2.inOut', onUpdate: paint }, 'open')
        .to(st, { z: Z_END + 1.75, duration: 1.15, ease: 'power3.in', onUpdate: paint }, 'open')
        .to('.ld-loop__hud', { opacity: 0, duration: 0.4 }, 'open')
        .add(onDone)

      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.play())
    },
    { scope: root },
  )

  const id = 'loop'

  return (
    <div className="ld-loop" ref={root} aria-hidden>
      <svg className="ld-loop__svg" viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}>
        <defs>
          <IconDefs id={id} />
          <g id="loop-icon">
            <IconBand id={id} />
            <IconArrow transform={`translate(${ARROW_HOME_SVG.x} ${ARROW_HOME_SVG.y})`} />
          </g>
          <mask id="loop-window" maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 2} height={h * 2}>
            <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="#fff" />
            <circle className="ld-loop__hole" r="0" fill="#000" />
          </mask>
          <radialGradient id="loop-vignette">
            <stop offset="0.45" style={{ stopColor: 'var(--ld-loop-bg)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ld-loop-edge)', stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        <g mask="url(#loop-window)">
          <rect className="ld-loop__bg" x={-w} y={-h} width={w * 2} height={h * 2} />
          <g className="ld-loop__scene">
            {Array.from({ length: LEVELS }, (_, j) => (
              <use key={j} href="#loop-icon" className="ld-loop__lvl" />
            ))}
            <g className="ld-loop__word" style={{ opacity: 0, color: 'var(--ld-loop-ink)' }}>
              <StackedWord id={id} theme={theme} />
            </g>
          </g>
          <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="url(#loop-vignette)" />
        </g>
      </svg>

      <div className="ld-loop__hud mono">
        <span className="ld-loop__hud-item ld-loop__hud-item--tl">
          <span className="ld-loop__hud-in">{brand.fullName}</span>
        </span>
        <span className="ld-loop__hud-item ld-loop__hud-item--tr">
          <span className="ld-loop__hud-in">∞</span>
        </span>
        <span className="ld-loop__hud-item ld-loop__hud-item--bl">
          <span className="ld-loop__hud-in">
            <b className="ld-loop__count">Loop 01</b>
          </span>
        </span>
        <span className="ld-loop__hud-item ld-loop__hud-item--br">
          <span className="ld-loop__hud-in">Loop after loop</span>
        </span>
      </div>
    </div>
  )
}
