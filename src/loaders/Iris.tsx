import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { brand } from '../lib/content'
import { useTheme } from '../providers/Theme'
import type { LoaderProps } from './types'
import './iris.css'

const BLADES = 9
/** the focus scale ends on ∞ — every real lens has it, and it's OsLoop's mark */
const FOCUS = ['0.5', '0.7', '1', '1.5', '2', '3', '5', '10', '∞']
const FSTOPS = ['16', '11', '8', '5.6', '4', '2.8', '2', '1.4']
const FOCUS_STEP = 22
const FSTOP_STEP = 19
const rad = (d: number) => (d * Math.PI) / 180

/**
 * Loading screen — "Focus on ∞".
 * A camera lens: the aperture blades open while the focus ring turns until its ∞ mark reaches the
 * index — that's the moment the OsLoop logo snaps into focus. Then the iris opens all the way and
 * the site appears through it. Follows the light / dark theme.
 */
export function Iris({ onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [{ w, h }] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const R = Math.min(w * 0.46, h * 0.42) // outer radius of the lens
  const Rin = R * 0.64 // the blades live inside this barrel
  const logoW = Rin * 1.08

  useGSAP(
    () => {
      const el = root.current!
      const blades = [...el.querySelectorAll<SVGPolygonElement>('.ld-iris__blade')]
      const hole = el.querySelector<SVGPolygonElement>('.ld-iris__hole')!
      const readF = el.querySelector<HTMLElement>('.ld-iris__read-f')!
      const readA = el.querySelector<HTMLElement>('.ld-iris__read-a')!
      const st = { r: Rin * 0.05, focus: 1, stop: 1 }

      /** aperture polygon + the blades whose straight edges form it */
      const paint = () => {
        const r = st.r
        const theta = -94 - (Math.min(r, Rin) / Rin) * 38 // the iris turns as it opens
        const pts = Array.from({ length: BLADES }, (_, i) => {
          const a = rad(theta + (i * 360) / BLADES)
          return [r * Math.cos(a), r * Math.sin(a)]
        })
        hole.setAttribute('points', pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '))
        blades.forEach((b, i) => {
          const [x0, y0] = pts[i]
          const [x1, y1] = pts[(i + 1) % BLADES]
          let dx = x1 - x0
          let dy = y1 - y0
          const len = Math.hypot(dx, dy) || 1
          dx /= len
          dy /= len
          let nx = dy
          let ny = -dx
          if (nx * (x0 + x1) + ny * (y0 + y1) < 0) {
            nx = -nx
            ny = -ny
          }
          const back = Rin * 0.18
          const fwd = Rin * 2.4
          const depth = Rin * 2.2
          const ax = x0 - dx * back
          const ay = y0 - dy * back
          const bx = x0 + dx * fwd
          const by = y0 + dy * fwd
          b.setAttribute(
            'points',
            [ax, ay, bx, by, bx + nx * depth, by + ny * depth, ax + nx * depth, ay + ny * depth].map((v) => v.toFixed(1)).join(','),
          )
        })
      }
      const readouts = () => {
        readF.textContent = FOCUS[Math.round((1 - st.focus) * (FOCUS.length - 1))]
        readA.textContent = 'f/' + FSTOPS[Math.round((1 - st.stop) * (FSTOPS.length - 1))]
      }
      paint()
      readouts()

      if (prefersReducedMotion()) {
        st.r = Rin * 0.84
        st.focus = 0
        st.stop = 0
        paint()
        readouts()
        gsap.set('.ld-iris__focus, .ld-iris__stops', { rotation: 0, svgOrigin: '0 0' })
        gsap.timeline().to(el, { autoAlpha: 0, duration: 0.5, delay: 0.7 }).add(onReveal, 0.7).add(onDone)
        return
      }

      const tl = gsap.timeline({ paused: true })
      tl.from('.ld-iris__ring', { opacity: 0, scale: 0.9, svgOrigin: '0 0', duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0)
        .from('.ld-iris__hud-in', { yPercent: 115, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.1)
        // the iris opens and the focus ring turns towards ∞
        .to(st, { r: Rin * 0.84, duration: 2.6, ease: 'power2.inOut', onUpdate: paint }, 0.35)
        .fromTo(
          '.ld-iris__focus',
          { rotation: FOCUS_STEP * (FOCUS.length - 1) },
          { rotation: 0, svgOrigin: '0 0', duration: 2.6, ease: 'power3.inOut' },
          0.35,
        )
        .to(st, { focus: 0, duration: 2.6, ease: 'power3.inOut', onUpdate: readouts }, 0.35)
        .fromTo('.ld-iris__stops', { rotation: -FSTOP_STEP * (FSTOPS.length - 1) }, { rotation: 0, svgOrigin: '0 0', duration: 2.6, ease: 'power2.inOut' }, 0.35)
        .to(st, { stop: 0, duration: 2.6, ease: 'power2.inOut', onUpdate: readouts }, 0.35)
        .fromTo('.ld-iris__knurl', { rotation: -36 }, { rotation: 0, svgOrigin: '0 0', duration: 2.6, ease: 'power3.inOut' }, 0.35)
        // rack focus: the logo is soft until the ring lands on ∞
        .fromTo(
          '.ld-iris__logo',
          { filter: 'blur(20px)', scale: 1.14, opacity: 0.7 },
          { filter: 'blur(0px)', scale: 1, opacity: 1, duration: 2.25, ease: 'expo.in' },
          0.7,
        )
        .addLabel('focus', 2.95)
        .fromTo('.ld-iris__index', { scale: 1 }, { scale: 1.7, svgOrigin: `0 ${-R * 0.91}`, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' }, 'focus')
        .set('.ld-iris__read-f', { color: '#ffae23' }, 'focus')
        .fromTo('.ld-iris__glint', { xPercent: -130, opacity: 1 }, { xPercent: 130, duration: 0.95, ease: 'power2.inOut' }, 'focus-=0.05')
        .fromTo('.ld-iris__pulse', { attr: { r: Rin * 0.84 }, opacity: 0.7 }, { attr: { r: Rin * 1.25 }, opacity: 0, duration: 0.8, ease: 'power2.out', immediateRender: false }, 'focus')
        // the iris opens all the way onto the site
        .addLabel('open', 'focus+=0.5')
        .add(onReveal, 'open')
        .to('.ld-iris__stage', { opacity: 0, duration: 0.5, ease: 'power2.in' }, 'open')
        .to(st, { r: Math.hypot(w, h) * 0.75, duration: 1.15, ease: 'power3.in', onUpdate: paint }, 'open')
        .to('.ld-iris__rings', { scale: 1.45, opacity: 0, svgOrigin: '0 0', duration: 1.0, ease: 'power3.in' }, 'open+=0.1')
        .to('.ld-iris__hud', { opacity: 0, duration: 0.4, ease: 'power2.in' }, 'open')
        .add(onDone)

      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.play())
    },
    { scope: root },
  )

  const t = (r: number, a: number) => `rotate(${a}) translate(0 ${-r})`

  return (
    <div className="ld-iris" ref={root} aria-hidden data-loader-theme={theme}>
      {/* what's seen through the aperture */}
      <div className="ld-iris__stage">
        <div className="ld-iris__glow" />
        <img className="ld-iris__logo" src={theme === 'dark' ? brand.stackedLogoWhite : brand.stackedLogo} alt="" style={{ width: logoW }} />
        <div className="ld-iris__glint" />
      </div>

      <svg className="ld-iris__body" viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}>
        <defs>
          <mask id="iris-hole" maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 2} height={h * 2}>
            <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="#fff" />
            <polygon className="ld-iris__hole" fill="#000" />
          </mask>
          <clipPath id="iris-barrel">
            <circle r={Rin} />
          </clipPath>
          <radialGradient id="iris-vignette">
            <stop offset="0.55" style={{ stopColor: 'var(--ld-iris-body)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ld-iris-shadow)' }} />
          </radialGradient>
          {/* curved-metal sheen over the blades: lit near the opening, shadowed at the barrel */}
          <radialGradient id="iris-sheen" gradientUnits="userSpaceOnUse" cx="0" cy="0" r={Rin}>
            <stop offset="0" style={{ stopColor: 'var(--ld-iris-sheen)', stopOpacity: 0.55 }} />
            <stop offset="0.6" style={{ stopColor: 'var(--ld-iris-sheen)', stopOpacity: 0 }} />
            <stop offset="0.86" style={{ stopColor: 'var(--ld-iris-shadow)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ld-iris-shadow)', stopOpacity: 0.7 }} />
          </radialGradient>
          <linearGradient id="iris-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ld-iris-sheen)', stopOpacity: 0.22 }} />
            <stop offset="0.5" style={{ stopColor: 'var(--ld-iris-sheen)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ld-iris-shadow)', stopOpacity: 0.25 }} />
          </linearGradient>
        </defs>

        <g mask="url(#iris-hole)">
          <rect className="ld-iris__bodybg" x={-w} y={-h} width={w * 2} height={h * 2} />
          <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="url(#iris-vignette)" />

          {/* the blades */}
          <g clipPath="url(#iris-barrel)">
            {Array.from({ length: BLADES }, (_, i) => (
              <polygon key={i} className="ld-iris__blade" style={{ fill: `var(--ld-iris-blade-${i % 3})` }} />
            ))}
            <circle r={Rin} fill="url(#iris-light)" />
            <circle r={Rin} fill="url(#iris-sheen)" />
          </g>

          {/* the lens rings */}
          <g className="ld-iris__rings">
            <circle className="ld-iris__ring ld-iris__rim" r={Rin} />
            <circle className="ld-iris__pulse" r={Rin * 0.84} />

            <g className="ld-iris__ring ld-iris__stops">
              {FSTOPS.map((s, i) => {
                const a = FSTOP_STEP * (FSTOPS.length - 1 - i)
                return (
                  <g key={s}>
                    <line className="ld-iris__tick" x1="0" x2="0" y1={-R * 0.69} y2={-R * 0.715} transform={`rotate(${a})`} />
                    <text className="ld-iris__label" transform={t(R * 0.74, a)} style={{ fontSize: R * 0.045 }}>
                      {s}
                    </text>
                  </g>
                )
              })}
            </g>

            <g className="ld-iris__ring ld-iris__focus">
              {FOCUS.map((s, i) => {
                const a = -FOCUS_STEP * (FOCUS.length - 1 - i)
                return (
                  <g key={s}>
                    <line className="ld-iris__tick" x1="0" x2="0" y1={-R * 0.8} y2={-R * 0.825} transform={`rotate(${a})`} />
                    <text className={`ld-iris__label${s === '∞' ? ' is-inf' : ''}`} transform={t(R * 0.85, a)} style={{ fontSize: s === '∞' ? R * 0.072 : R * 0.05 }}>
                      {s}
                    </text>
                  </g>
                )
              })}
              <text className="ld-iris__label ld-iris__unit" transform={t(R * 0.855, 26)} style={{ fontSize: R * 0.036 }}>
                m
              </text>
            </g>

            <g className="ld-iris__ring ld-iris__knurl">
              <circle r={R} className="ld-iris__edge" />
              <circle r={R * 0.92} className="ld-iris__edge" />
              {Array.from({ length: 96 }, (_, i) => (
                <line key={i} className="ld-iris__grip" x1="0" x2="0" y1={-R * 0.935} y2={-R * 0.985} transform={`rotate(${i * 3.75})`} />
              ))}
            </g>

            <path className="ld-iris__ring ld-iris__index" d={`M0 ${-R * 0.893} L${-R * 0.02} ${-R * 0.927} L${R * 0.02} ${-R * 0.927} Z`} />
          </g>
        </g>
      </svg>

      <div className="ld-iris__hud mono">
        <span className="ld-iris__hud-item ld-iris__hud-item--tl">
          <span className="ld-iris__hud-in">{brand.fullName}</span>
        </span>
        <span className="ld-iris__hud-item ld-iris__hud-item--tr">
          <span className="ld-iris__hud-in">35 mm · 24 fps</span>
        </span>
        <span className="ld-iris__hud-item ld-iris__hud-item--bl">
          <span className="ld-iris__hud-in">
            Focus <b className="ld-iris__read-f">0.5</b>
          </span>
        </span>
        <span className="ld-iris__hud-item ld-iris__hud-item--br">
          <span className="ld-iris__hud-in">
            Aperture <b className="ld-iris__read-a">f/16</b>
          </span>
        </span>
      </div>
    </div>
  )
}
