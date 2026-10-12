import { useMemo, useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { brand } from '../lib/content'
import { iconMotion, ARROW_HOME_SVG } from '../lib/loopShape'
import { useTheme } from '../providers/Theme'
import { IconArrow, IconBand, IconDefs, STACK_CENTRE, StackedWord } from './art'
import type { LoaderProps } from './types'
import './frames.css'

const LEADER = 5 // countdown frames 5 · 4 · 3 · 2 · 1
const DRAW = 23 // frames 0–22 draw the loop, frame 23 is the finished logo
const AFTER = 3 // blank frames that follow
const smooth = (x: number) => x * x * (3 - 2 * x)
const inOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)

/** a countdown frame of the film leader: the number, its circle, crosshair and the sweep */
function Leader({ n, r, fw, fh }: { n: number; r: number; fw: number; fh: number }) {
  const frac = Math.min(0.9999, (LEADER - n + 1) / LEADER)
  const a = 2 * Math.PI * frac
  return (
    <g className="ld-film__leader">
      <path
        className="ld-film__sweep"
        d={`M0 0 L0 ${-r} A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)} Z`}
      />
      <circle r={r} />
      <circle r={r * 0.82} />
      <line x1={-fw / 2} x2={fw / 2} y1="0" y2="0" />
      <line x1="0" x2="0" y1={-fh / 2} y2={fh / 2} />
      <text className="ld-film__digit" style={{ fontSize: fh * 0.46 }}>
        {n}
      </text>
    </g>
  )
}

/**
 * Loading screen — "Frame by Frame".
 * A 35 mm film strip runs through a projector gate with a real pull-down: each frame stops in the
 * gate, then jumps to the next. After the countdown leader, the frames are a flipbook of the OsLoop
 * icon being drawn by its play arrow. The strip slows and locks on the last frame — the finished
 * logo — then the gate opens like a shutter and the site plays. Follows the light / dark theme.
 */
export function FrameByFrame({ onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [{ w, h }] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const fw = Math.min(w * 0.64, 600, h * 0.5 * 1.66) // frame window
  const fh = fw / 1.66
  const margin = fw * 0.12 // sprocket edge
  const stripW = fw + margin * 2
  const pitch = fh * 1.1
  const sc = Math.min((fw * 0.8) / 165, (fh * 0.84) / 111) // icon units → px inside a frame

  const frames = useMemo(() => {
    const m = iconMotion()
    return Array.from({ length: LEADER + DRAW + 1 + AFTER }, (_, i) => {
      const k = i - LEADER
      if (k < 0) return { k, kind: 'leader' as const, n: -k }
      if (k > DRAW) return { k, kind: 'blank' as const }
      if (k === DRAW) return { k, kind: 'final' as const }
      const u = inOut(k / (DRAW - 1))
      const s = u * m.flightLen
      const wgt = smooth(Math.min(1, u / 0.12)) * smooth(Math.min(1, (1 - u) / 0.12))
      return { k, kind: 'draw' as const, dash: m.bandOffset(s), dashLen: m.bandLen, arrow: m.arrowAt(s, wgt, 1 + 0.1 * wgt) }
    })
  }, [])

  useGSAP(
    () => {
      const el = root.current!
      const strip = el.querySelector<SVGGElement>('.ld-film__strip')!
      const blur = el.querySelector<SVGFEGaussianBlurElement>('.ld-film__blur feGaussianBlur')!
      const counter = el.querySelector<HTMLElement>('.ld-film__count')!
      const st = { c: -LEADER, jolt: 0 }
      let last = -LEADER
      let lastFrame = ''

      const paint = () => {
        // projector pull-down: the frame rests in the gate, then jumps to the next one
        const base = Math.floor(st.c)
        const f = st.c - base
        const pos = base + (f < 0.72 ? 0 : smooth((f - 0.72) / 0.28))
        strip.setAttribute('transform', `translate(0 ${(-pos * pitch + st.jolt).toFixed(2)})`)
        const v = Math.abs(pos - last) * pitch
        last = pos
        blur.setAttribute('stdDeviation', `0 ${Math.min(7, v * 0.12).toFixed(2)}`)
        const k = Math.round(pos)
        const label = k < 0 ? `Leader ${-k}` : `Frame ${String(Math.min(k + 1, DRAW + 1)).padStart(2, '0')} / ${DRAW + 1}`
        if (label !== lastFrame) counter.textContent = lastFrame = label
      }
      paint()

      // the shutter: the gate opens and becomes the window onto the site
      const gate = { hw: fw / 2, hh: 0 }
      const shutter = () => {
        const cx = w / 2
        const cy = h / 2
        const l = cx - gate.hw
        const r = cx + gate.hw
        const t = cy - gate.hh
        const b = cy + gate.hh
        el.style.clipPath = `polygon(evenodd, 0 0, ${w}px 0, ${w}px ${h}px, 0 ${h}px, 0 0, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px ${t}px)`
      }

      if (prefersReducedMotion()) {
        st.c = DRAW
        paint()
        gsap.timeline().to(el, { autoAlpha: 0, duration: 0.5, delay: 0.7 }).add(onReveal, 0.7).add(onDone)
        return
      }

      const tl = gsap.timeline({ paused: true })
      tl.from('.ld-film__reel', { y: h * 0.2, opacity: 0, duration: 1, ease: 'expo.out' }, 0)
        .from('.ld-film__hud-in', { yPercent: 115, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.1)
        .from('.ld-film__gate', { opacity: 0, scale: 1.08, svgOrigin: '0 0', duration: 0.8, ease: 'expo.out' }, 0.2)
        // the film runs: the countdown, then the loop drawn frame by frame
        .to(st, { c: DRAW, duration: 2.8, ease: 'power2.inOut', onUpdate: paint }, 0.25)
        // locked: a small jolt and a flicker of the lamp
        .addLabel('lock', '>')
        .fromTo(st, { jolt: 5 }, { jolt: 0, duration: 0.35, ease: 'back.out(3)', onUpdate: paint }, 'lock')
        .fromTo('.ld-film__lamp', { opacity: 0 }, { keyframes: [{ opacity: 0.32 }, { opacity: 0.08 }, { opacity: 0.24 }, { opacity: 0 }], duration: 0.45, ease: 'none' }, 'lock')
        .set('.ld-film__count', { color: '#ffae23' }, 'lock')
        // the show starts: the gate opens like a shutter and grows to the screen
        .addLabel('open', 'lock+=0.5')
        .add(onReveal, 'open')
        .add(shutter, 'open')
        .to(gate, { hh: fh / 2, duration: 0.42, ease: 'power3.out', onUpdate: shutter }, 'open')
        .to(gate, { hw: w * 0.75, hh: h * 0.75, duration: 0.95, ease: 'power3.in', onUpdate: shutter }, 'open+=0.4')
        .to('.ld-film__reel', { scale: 1.35, opacity: 0, svgOrigin: '0 0', duration: 0.95, ease: 'power3.in' }, 'open+=0.4')
        .to('.ld-film__hud', { opacity: 0, duration: 0.4 }, 'open+=0.3')
        .add(onDone)

      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.play())
    },
    { scope: root },
  )

  const holeW = margin * 0.42
  const holeH = (pitch / 4) * 0.52
  const id = 'film'

  return (
    <div className="ld-film" ref={root} aria-hidden>
      <svg className="ld-film__svg" viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}>
        <defs>
          <IconDefs id={id} />
          <filter id="film-blur" className="ld-film__blur" filterUnits="userSpaceOnUse" x={-w / 2} y={-h / 2} width={w} height={h}>
            <feGaussianBlur stdDeviation="0 0" />
          </filter>
          <linearGradient id="film-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ld-film-bg)', stopOpacity: 1 }} />
            <stop offset="0.3" style={{ stopColor: 'var(--ld-film-bg)', stopOpacity: 0 }} />
            <stop offset="0.7" style={{ stopColor: 'var(--ld-film-bg)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ld-film-bg)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        <g className="ld-film__reel">
          <g filter="url(#film-blur)">
            <g className="ld-film__strip">
              {frames.map((fr) => (
                <g key={fr.k} transform={`translate(0 ${fr.k * pitch})`}>
                  <rect className="ld-film__body" x={-stripW / 2} y={-pitch / 2 - 0.5} width={stripW} height={pitch + 1} />
                  {[0, 1, 2, 3].map((s) =>
                    [-1, 1].map((side) => (
                      <rect
                        key={`${s}${side}`}
                        className="ld-film__hole"
                        x={side * (fw / 2 + margin / 2) - holeW / 2}
                        y={-pitch / 2 + (pitch * (s + 0.5)) / 4 - holeH / 2}
                        width={holeW}
                        height={holeH}
                        rx={holeW * 0.22}
                      />
                    )),
                  )}
                  <rect className="ld-film__frame" x={-fw / 2} y={-fh / 2} width={fw} height={fh} rx={fh * 0.04} />
                  {fr.k >= 0 && fr.k <= DRAW && (
                    <text className="ld-film__edge" x={-fw / 2 + fh * 0.07} y={-fh / 2 + fh * 0.11} style={{ fontSize: Math.max(8, fh * 0.065) }}>
                      {String(fr.k + 1).padStart(2, '0')}
                    </text>
                  )}

                  {fr.kind === 'leader' && <Leader n={fr.n} r={fh * 0.36} fw={fw} fh={fh} />}

                  {(fr.kind === 'draw' || fr.kind === 'final') && (
                    <g className="ld-film__art" transform={`scale(${sc}) translate(${-STACK_CENTRE.x} ${-STACK_CENTRE.y})`}>
                      {fr.kind === 'draw' ? (
                        <>
                          <IconBand id={id} dash={fr.dash} dashLen={fr.dashLen} finished={false} />
                          <IconArrow transform={fr.arrow} />
                        </>
                      ) : (
                        <>
                          <IconBand id={id} />
                          <IconArrow transform={`translate(${ARROW_HOME_SVG.x} ${ARROW_HOME_SVG.y})`} />
                          <StackedWord id={id} theme={theme} />
                        </>
                      )}
                    </g>
                  )}
                </g>
              ))}
            </g>
          </g>
          {/* the strip fades away from the gate */}
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="url(#film-fade)" />
        </g>

        {/* projector gate */}
        <g className="ld-film__gate">
          <rect className="ld-film__lamp" x={-fw / 2} y={-fh / 2} width={fw} height={fh} rx={fh * 0.04} />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sy]) => {
            const x = (sx * (fw / 2 + 10))
            const y = (sy * (fh / 2 + 10))
            const l = Math.min(26, fw * 0.06)
            return <path key={`${sx}${sy}`} className="ld-film__bracket" d={`M${x} ${y - sy * l} L${x} ${y} L${x - sx * l} ${y}`} />
          })}
        </g>
      </svg>

      <div className="ld-film__hud mono">
        <span className="ld-film__hud-item ld-film__hud-item--tl">
          <span className="ld-film__hud-in">{brand.fullName}</span>
        </span>
        <span className="ld-film__hud-item ld-film__hud-item--tr">
          <span className="ld-film__hud-in">35 mm · 24 fps</span>
        </span>
        <span className="ld-film__hud-item ld-film__hud-item--bl">
          <span className="ld-film__hud-in">
            <b className="ld-film__count">Leader 5</b>
          </span>
        </span>
        <span className="ld-film__hud-item ld-film__hud-item--br">
          <span className="ld-film__hud-in">Frame by frame, loop after loop</span>
        </span>
      </div>
    </div>
  )
}
