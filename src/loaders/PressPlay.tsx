import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { brand } from '../lib/content'
import { useTheme } from '../providers/Theme'
import { ARROW_CENTRE_PDF, ARROW_D, ARROW_HOME_SVG, ARROW_POINTING_SVG, ARROW_SCALE, RT, iconSvg } from '../lib/loopShape'
import type { LoaderProps } from './types'
import './press-play.css'

const ICON = iconSvg()

/*
 * The stacked logo files (icon + "OSLOOP MEDIA") share the drawn icon's exact geometry, so they're
 * placed in icon units and only their "OSLOOP MEDIA" line is shown under the drawn loop.
 */
const PX_PER_UNIT = 9.72
const STACKED = {
  dark: { src: brand.stackedLogoWhite, x: -87.12, y: -46.03 },
  light: { src: brand.stackedLogo, x: -86.81, y: -46.18 },
}
const TEXT_TOP = 48 // the "OSLOOP MEDIA" line sits between these (icon units)
const TEXT_H = 19

/** how far the drawn band trails behind the arrow's centre (hidden under the arrow) */
const LAG = 6
const FPS = 24
const timecode = (t: number) => {
  const frames = Math.floor(t * FPS)
  const p = (n: number) => String(n).padStart(2, '0')
  return `00:${p(Math.floor(frames / FPS / 60))}:${p(Math.floor(frames / FPS) % 60)}:${p(frames % FPS)}`
}
const ease = (x: number) => x * x * (3 - 2 * x)

/**
 * Loading screen — "press play".
 * A camera viewfinder opens; the orange play arrow leaves its slot and rides the ∞, drawing the
 * band behind it, then settles back home: the OsLoop icon is complete. The arrow is pressed like a
 * play button and the site opens from it in a circle — straight into the hero, where the same icon
 * spins in as glass. Follows the light / dark theme.
 */
export function PressPlay({ onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const stacked = STACKED[theme]

  useGSAP(
    () => {
      const el = root.current!
      const band = el.querySelector<SVGPathElement>('.pre__band')!
      const flight = el.querySelector<SVGPathElement>('.pre__flight')!
      const arrow = el.querySelector<SVGGElement>('.pre__arrow')!
      const halo = el.querySelector<SVGCircleElement>('.pre__halo')!
      const tc = el.querySelector<HTMLElement>('.pre__tc-v')!
      const bandLen = band.getTotalLength()
      const flightLen = flight.getTotalLength()

      // heading along the flight path, unwrapped (the ∞ turns both ways, so it ends where it began)
      const N = 480
      const head: number[] = []
      for (let i = 0; i <= N; i++) {
        const a = flight.getPointAtLength((Math.max(0, i - 1) / N) * flightLen)
        const b = flight.getPointAtLength((Math.min(N, i + 1) / N) * flightLen)
        let h = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
        if (i) {
          while (h - head[i - 1] > 180) h -= 360
          while (h - head[i - 1] < -180) h += 360
        }
        head.push(h)
      }
      const p0 = flight.getPointAtLength(0)
      const ox = ARROW_HOME_SVG.x - p0.x
      const oy = ARROW_HOME_SVG.y - p0.y

      /** put the arrow at distance `s` along its flight; `w` blends from rest pose (0) to flying (1) */
      const place = (s: number, w: number, scale: number) => {
        const p = flight.getPointAtLength(s)
        const f = (s / flightLen) * N
        const i0 = Math.min(N - 1, Math.floor(f))
        const h = head[i0] + (head[i0 + 1] - head[i0]) * (f - i0)
        const x = p.x + ox
        const y = p.y + oy
        arrow.setAttribute('transform', `translate(${x} ${y}) rotate(${(h - ARROW_POINTING_SVG) * w}) scale(${scale})`)
        halo.setAttribute('cx', String(x))
        halo.setAttribute('cy', String(y))
        halo.style.opacity = String(0.55 * w)
      }
      const draw = (s: number) => {
        const d = Math.min(bandLen, Math.max(0, s - ICON.flightToBand - LAG))
        band.style.strokeDashoffset = String(bandLen - d)
      }

      gsap.set(band, { strokeDasharray: bandLen, strokeDashoffset: bandLen })
      gsap.set(el, { '--hr': '-1px' })
      place(0, 0, 0.001)

      if (prefersReducedMotion()) {
        draw(flightLen)
        place(0, 0, 1)
        gsap.set('.pre__shade, .pre__over', { opacity: 1 })
        gsap.timeline().to(el, { autoAlpha: 0, duration: 0.5, delay: 0.6 }).add(onReveal, 0.6).add(onDone)
        return
      }

      const st = { pop: 0, s: 0, press: 1 }
      // the timecode runs until the play arrow is pressed
      const tl = gsap.timeline({ paused: true, onUpdate: () => (tc.textContent = timecode(Math.min(tl.time(), tl.labels.press ?? 99))) })

      // 1 · the viewfinder opens
      tl.from('.pre__glow', { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0)
        .from('.pre__corner', { scale: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0)
        .from('.pre__hud-in', { yPercent: 115, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.08)
        // 2 · the play arrow appears in its slot
        .to(st, { pop: 1, duration: 0.6, ease: 'back.out(2.4)', onUpdate: () => place(0, 0, st.pop) }, 0.2)
        // 3 · …and rides the loop, drawing it
        .to(
          st,
          {
            s: flightLen,
            duration: 1.95,
            ease: 'power2.inOut',
            onUpdate: () => {
              const u = st.s / flightLen
              const w = ease(Math.min(1, u / 0.12)) * ease(Math.min(1, (1 - u) / 0.12))
              place(st.s, w, 1 + 0.1 * w)
              draw(st.s)
            },
          },
          0.7,
        )
        // 4 · the icon locks: fold shading at the crossing, then OSLOOP MEDIA rises
        .addLabel('lock', '-=0.15')
        .to('.pre__shade', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 'lock')
        .set('.pre__over', { opacity: 1 }, 'lock')
        .fromTo('.pre__word', { y: TEXT_H }, { y: 0, duration: 0.8, ease: 'expo.out' }, 'lock')
        // 5 · press play
        .addLabel('press', 'lock+=0.45')
        .to(st, { press: 0.82, duration: 0.16, ease: 'power2.in', onUpdate: () => place(flightLen, 0, st.press) }, 'press')
        .to('.pre__hud-rec', { yPercent: -115, duration: 0.45, ease: 'expo.out' }, 'press+=0.1')
        .fromTo(
          '.pre__hud-play',
          { yPercent: 115, visibility: 'visible' },
          { yPercent: 0, duration: 0.45, ease: 'expo.out', immediateRender: false },
          'press+=0.1',
        )
        .to(st, { press: 1, duration: 0.55, ease: 'back.out(3)', onUpdate: () => place(flightLen, 0, st.press) }, '>')
        .fromTo(
          '.pre__ripple',
          { attr: { r: RT * 1.6 }, opacity: 0.8 },
          { attr: { r: 150 }, opacity: 0, duration: 1.1, ease: 'power2.out', immediateRender: false },
          '<',
        )
        .addLabel('open', '<0.08')
        // 6 · the site opens from the arrow
        .add(() => {
          const r = arrow.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          el.style.setProperty('--hx', `${cx}px`)
          el.style.setProperty('--hy', `${cy}px`)
        }, 'open')
        .add(onReveal, 'open')
        .to(
          el,
          {
            '--hr': () => {
              const cx = parseFloat(el.style.getPropertyValue('--hx')) || innerWidth / 2
              const cy = parseFloat(el.style.getPropertyValue('--hy')) || innerHeight / 2
              return `${Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40}px`
            },
            duration: 1.1,
            ease: 'power3.inOut',
          },
          'open',
        )
        .to('.pre__stage', { scale: 1.12, duration: 1.1, ease: 'power3.in' }, 'open')
        .to('.pre__hud, .pre__corner', { opacity: 0, duration: 0.45, ease: 'power2.in' }, 'open')
        .add(onDone)

      // Start once fonts are ready (avoids a flash of fallback text in the HUD).
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.play())
    },
    { scope: root },
  )

  return (
    <div className="pre" ref={root} aria-hidden>
      <div className="pre__glow" />

      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <span key={c} className={`pre__corner pre__corner--${c}`} />
      ))}

      <div className="pre__hud mono">
        <span className="pre__hud-item pre__hud-item--tl">
          <span className="pre__hud-in pre__hud-rec">
            <i className="pre__rec" />
            Rec
          </span>
          {/* swaps in when the arrow is pressed */}
          <span className="pre__hud-play">
            <svg viewBox="0 0 10 11" width="8" height="9" aria-hidden>
              <path d="M1 1.2v8.6c0 .5.5.8.9.5l7.2-4.3c.4-.2.4-.8 0-1L1.9.7C1.5.4 1 .7 1 1.2z" />
            </svg>
            Play
          </span>
        </span>
        <span className="pre__hud-item pre__hud-item--tr">
          <span className="pre__hud-in">{brand.fullName}</span>
        </span>
        <span className="pre__hud-item pre__hud-item--bl">
          <span className="pre__hud-in">{brand.tagline}</span>
        </span>
        <span className="pre__hud-item pre__hud-item--br">
          <span className="pre__hud-in">
            TC <b className="pre__tc-v">00:00:00:00</b>
          </span>
        </span>
      </div>

      <div className="pre__stage">
        <svg className="pre__icon" viewBox="-90 -48 172 116">
          <defs>
            <mask id="pre-cut" maskUnits="userSpaceOnUse" x="-120" y="-90" width="240" height="200">
              <rect x="-120" y="-90" width="240" height="200" fill="#fff" />
              <polygon points={ICON.cutWedge} fill="#000" />
            </mask>
            <linearGradient id="pre-fold" gradientUnits="userSpaceOnUse" x1="-18.48" y1="-18.36" x2="17.79" y2="17.91">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.114" stopColor="#fdfdfd" />
              <stop offset="0.611" stopColor="#696a6d" />
              <stop offset="0.955" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
            <radialGradient id="pre-halo">
              <stop offset="0" stopColor="#ffae23" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffae23" stopOpacity="0" />
            </radialGradient>
            {/* the window the line rises into, and the line itself (moves with it) */}
            <clipPath id="pre-word-window">
              <rect x="-110" y={TEXT_TOP} width="220" height={TEXT_H} />
            </clipPath>
            <clipPath id="pre-word-line">
              <rect x="-110" y={TEXT_TOP} width="220" height={TEXT_H} />
            </clipPath>
          </defs>

          <path className="pre__flight" d={ICON.flight} />
          {/* one group: the cut applies to everything, and the fold shading multiplies onto the band */}
          <g mask="url(#pre-cut)">
            <path className="pre__band" d={ICON.band} />
            <path className="pre__shade" d={ICON.s1} stroke="url(#pre-fold)" />
            <path className="pre__over" d={ICON.s2} />
          </g>

          <g clipPath="url(#pre-word-window)">
            <g className="pre__word">
              <image
                href={stacked.src}
                x={stacked.x}
                y={stacked.y}
                width={1622 / PX_PER_UNIT}
                height={1100 / PX_PER_UNIT}
                clipPath="url(#pre-word-line)"
              />
            </g>
          </g>

          <circle className="pre__halo" r={RT * 2.6} fill="url(#pre-halo)" />
          <circle className="pre__ripple" cx={ARROW_HOME_SVG.x} cy={ARROW_HOME_SVG.y} r={RT * 1.6} />
          <g className="pre__arrow">
            <path d={ARROW_D} transform={`scale(${ARROW_SCALE}) translate(${-ARROW_CENTRE_PDF.x} ${-ARROW_CENTRE_PDF.y})`} />
          </g>
        </svg>
      </div>
    </div>
  )
}
