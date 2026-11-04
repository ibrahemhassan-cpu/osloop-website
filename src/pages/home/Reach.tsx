import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/gsap'
import { useI18n } from '../../lib/i18n'
import { rich } from '../../lib/rich'
import { flag } from '../../lib/flags'
import { useMedia } from '../../lib/useMedia'
import { useExperience } from '../../providers/Experience'
import { random, type GlobeBridge } from './globe'
import './reach.css'

const ReachScene = lazy(() => import('./ReachScene'))

/** a press on a flag isn't a grab of the globe */
const keepOffGlobe = (e: PointerEvent) => e.stopPropagation()

/**
 * Our reach: a 3D globe in empty space that the visitor can grab and spin any way. A pin with a small
 * flag stands on each market's country, and every market is listed beside the globe (chips under it
 * on smaller screens). Picking one, on the globe or in the list, flies the globe round to it and in
 * close: the country lights up whole while every other dims. Picking it again, the button under the
 * globe or Esc goes back out to the whole globe.
 */
export function Reach() {
  const { ready } = useExperience()
  const { t, c, rtl } = useI18n()
  const { reach } = c
  const mobile = useMedia('(max-width: 760px)')
  // below laptops the markets are listed as chips under the globe
  const compact = useMedia('(max-width: 1100px)')
  const still = prefersReducedMotion()

  const root = useRef<HTMLElement>(null)
  const box = useRef<HTMLDivElement | null>(null)
  const [mount, setMount] = useState(false)
  const [inView, setInView] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  const bridge = useRef<GlobeBridge>({ active: null, reveal: still ? 1 : 0, surface: null, pins: [], focus: null })
  useEffect(() => {
    bridge.current.active = active
  }, [active])

  /** picking a market flies the globe to it and keeps it lit until it's picked again */
  const pick = (i: number) => {
    if (active === i) return setActive(null)
    bridge.current.focus = { i, n: (bridge.current.focus?.n ?? 0) + 1 }
    setActive(i)
  }
  // Esc goes back out to the whole globe
  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  /* ------------------------------------------------------------------ load and draw only near the screen */
  // fetch the scene's code once the page has settled, so it's there before the section is
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => void import('./ReachScene'), 2500)
    return () => window.clearTimeout(id)
  }, [ready])
  useEffect(() => {
    const el = box.current!
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMount(true), { rootMargin: '120% 0px' })
    const seen = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '10% 0px' })
    near.observe(el)
    seen.observe(el)
    return () => {
      near.disconnect()
      seen.disconnect()
    }
  }, [])

  /* ------------------------------------------------------------------ entrance */
  useGSAP(
    () => {
      if (!ready || still) return
      const tl = gsap
        .timeline({ scrollTrigger: { trigger: box.current, start: 'top 75%', once: true } })
        .to(bridge.current, { reveal: 1, duration: 3.2, ease: 'power2.out' }, 0)
        .from('.reach__hint', { autoAlpha: 0, y: 20, duration: 1.2 }, 1.2)
      // the list beside the globe is only there on wide screens
      const items = gsap.utils.toArray<HTMLElement>('.reach__list li', root.current)
      if (items.length) tl.from(items, { autoAlpha: 0, x: rtl ? -24 : 24, duration: 1.1, stagger: 0.04 }, 0.6)
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <section className="reach" id="reach" ref={root} data-header-theme="dark" data-theme="dark">
      <Space />
      <div className="reach__head">
        <h2 className="reach__h" data-reveal="lines">
          {rich(t.reach.title)}
        </h2>
        <p className="reach__p" data-reveal="fade" data-delay="0.15">
          {t.reach.text(reach.markets.length)}
        </p>
      </div>

      <div className="reach__stage">
        <div
          className="reach__globe"
          ref={(el) => {
            box.current = el
            bridge.current.surface = el
          }}
        >
          <div className="reach__canvas" aria-hidden>
            {mount && (
              <Suspense fallback={null}>
                <ReachScene bridge={bridge} active={inView} mobile={compact} />
              </Suspense>
            )}
          </div>
          {/* on touch, only a swipe that starts on the globe turns it; elsewhere the page scrolls */}
          <div className="reach__grab" aria-hidden />

          {/* the list beside (or the chips under) the globe is what a screen reader gets */}
          <ul className={`reach__pins${active !== null ? ' has-active' : ''}`} aria-hidden>
            {reach.markets.map((m, i) => (
              <li key={m.code} className={`reach__pin${active === i ? ' is-on' : ''}`} ref={(el) => void (bridge.current.pins[i] = el)}>
                <span className="reach__pin-stem" />
                <button type="button" tabIndex={-1} className="reach__pin-in" onPointerDown={keepOffGlobe} onClick={() => pick(i)}>
                  <span className="reach__flag">{flag(m.code)}</span>
                  <span className="reach__pin-name">{m.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={`reach__out${active !== null ? ' is-on' : ''}`}
            tabIndex={active !== null ? undefined : -1}
            aria-hidden={active === null || undefined}
            onPointerDown={keepOffGlobe}
            onClick={() => setActive(null)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="6.5" />
              <path d="M8 11h6M16 16l4 4" />
            </svg>
            {t.reach.whole}
          </button>
        </div>

        {!compact && (
          <ol className="reach__list" aria-label={t.reach.countries} data-lenis-prevent>
            {reach.markets.map((m, i) => (
              <li key={m.code}>
                <button type="button" className={`reach__item${active === i ? ' is-on' : ''}`} aria-pressed={active === i} onClick={() => pick(i)}>
                  <span className="reach__flag" aria-hidden>
                    {flag(m.code)}
                  </span>
                  {m.name}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* phones and tablets: the markets as chips under the globe */}
      {compact && (
        <div className="reach__chips" role="group" aria-label={t.reach.countries}>
          {reach.markets.map((m, i) => (
            <button key={m.code} type="button" className={`reach__chip${active === i ? ' is-on' : ''}`} aria-pressed={active === i} onClick={() => pick(i)}>
              <span className="reach__flag" aria-hidden>
                {flag(m.code)}
              </span>
              {m.name}
            </button>
          ))}
        </div>
      )}

      <p className="reach__hint mono">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4.4h-4.4" />
        </svg>
        {mobile ? t.reach.hintPhone : compact ? t.reach.hintTablet : t.reach.hintDesktop}
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ space */

/** a star's colour from its temperature: mostly white, some blue-white, a few yellow and orange */
const starTone = (t: number) =>
  t < 0.1 ? '170, 195, 255' : t < 0.2 ? '205, 218, 255' : t < 0.84 ? '255, 255, 255' : t < 0.95 ? '255, 240, 214' : '255, 208, 168'
/** roughly bell-shaped in -1..1, for things that crowd towards a line */
const bell = (rand: () => number) => (rand() + rand() + rand() - 1.5) / 1.5

/** one star: a dot, a soft glow round the brighter ones, and the faint cross of light a telescope puts on the brightest */
function drawStar(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, rgb: string) {
  if (r > 1) {
    const glow = g.createRadialGradient(x, y, 0, x, y, r * 4)
    glow.addColorStop(0, `rgba(${rgb}, ${a * 0.35})`)
    glow.addColorStop(1, `rgba(${rgb}, 0)`)
    g.fillStyle = glow
    g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8)
  }
  if (r > 1.6) {
    const reach = r * 9
    for (const [dx, dy] of [
      [reach, 0],
      [0, reach],
    ]) {
      const ray = g.createLinearGradient(x - dx, y - dy, x + dx, y + dy)
      ray.addColorStop(0, `rgba(${rgb}, 0)`)
      ray.addColorStop(0.5, `rgba(${rgb}, ${a * 0.45})`)
      ray.addColorStop(1, `rgba(${rgb}, 0)`)
      g.strokeStyle = ray
      g.lineWidth = 0.7
      g.beginPath()
      g.moveTo(x - dx, y - dy)
      g.lineTo(x + dx, y + dy)
      g.stroke()
    }
  }
  g.fillStyle = `rgba(${rgb}, ${a})`
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
}

/**
 * The far sky: the Milky Way across it (glowing gas, cut by dark lanes of dust and thick with faint
 * stars) and distant stars all over. The brighter of those go on the two twinkling layers.
 */
function drawSky([g, ...twinkles]: CanvasRenderingContext2D[], w: number, h: number) {
  const rand = random(3)
  const len = Math.hypot(w, h)
  const thick = Math.min(Math.max(w, h) * 0.22, 520)
  g.save()
  g.translate(w * 0.52, h * 0.44)
  g.rotate(-0.42)
  const band = g.createLinearGradient(0, -thick, 0, thick)
  band.addColorStop(0, 'rgba(120, 140, 255, 0)')
  band.addColorStop(0.32, 'rgba(140, 160, 255, 0.03)')
  band.addColorStop(0.5, 'rgba(255, 236, 214, 0.055)')
  band.addColorStop(0.68, 'rgba(140, 160, 255, 0.03)')
  band.addColorStop(1, 'rgba(120, 140, 255, 0)')
  g.fillStyle = band
  g.fillRect(-len / 2, -thick, len, thick * 2)
  // patches of glowing gas along it, warm at its heart and cool at its edges
  for (let i = 0; i < 180; i++) {
    const x = (rand() - 0.5) * len
    const y = bell(rand) * thick * 0.5
    const r = 30 + rand() * 170
    const warm = Math.abs(y) < thick * 0.18 && rand() < 0.7
    const gas = g.createRadialGradient(x, y, 0, x, y, r)
    gas.addColorStop(0, warm ? `rgba(255, 226, 196, ${0.015 + rand() * 0.03})` : `rgba(150, 170, 255, ${0.015 + rand() * 0.025})`)
    gas.addColorStop(1, 'rgba(0, 0, 0, 0)')
    g.fillStyle = gas
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // dark lanes of dust winding through the glow
  g.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 80; i++) {
    const x = (rand() - 0.5) * len
    const y = bell(rand) * thick * 0.12 + Math.sin((x / len) * 7) * thick * 0.14
    const r = 20 + rand() * 90
    const dust = g.createRadialGradient(x, y, 0, x, y, r)
    dust.addColorStop(0, `rgba(0, 0, 0, ${0.25 + rand() * 0.3})`)
    dust.addColorStop(1, 'rgba(0, 0, 0, 0)')
    g.fillStyle = dust
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  g.globalCompositeOperation = 'source-over'
  // the band's countless faint stars, thickest along its middle
  const dust = Math.round((len * thick) / 45)
  for (let i = 0; i < dust; i++) {
    const s = 0.4 + rand() * 0.7
    g.fillStyle = `rgba(${starTone(rand())}, ${0.06 + rand() ** 2 * 0.4})`
    g.fillRect((rand() - 0.5) * len, bell(rand) * thick * 0.55, s, s)
  }
  g.restore()
  // distant stars everywhere
  const count = Math.round((w * h) / 2200)
  for (let i = 0; i < count; i++) {
    const r = 0.3 + rand() ** 6 * 1.4
    const target = r > 0.85 ? twinkles[i % twinkles.length] : g
    drawStar(target, rand() * w, rand() * h, r, 0.2 + rand() ** 2 * 0.7, starTone(rand()))
  }
}

/** A square of stars that repeats without a seam: a star near an edge is drawn again across it. */
function starTile(size: number, density: number, bright: boolean, seed: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const c = document.createElement('canvas')
  c.width = c.height = Math.round(size * dpr)
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  const rand = random(seed)
  const count = Math.round((size * size) / density)
  for (let i = 0; i < count; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = bright ? 0.6 + rand() ** 4 * 1.6 : 0.35 + rand() ** 5 * 0.9
    const a = bright ? 0.5 + rand() * 0.5 : 0.25 + rand() ** 2 * 0.6
    const rgb = starTone(rand())
    const reach = r * 10
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const px = x + dx
        const py = y + dy
        if (px > -reach && py > -reach && px < size + reach && py < size + reach) drawStar(g, px, py, r, a, rgb)
      }
    }
  }
  return new Promise<string>((resolve) => c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : '')))
}

/** the depths of space, far to near: how far each moves as the section scrolls by (px), and its drifting stars */
const DEPTHS = [
  { travel: 140 },
  { travel: 80, tile: 560, period: 260, density: 2600 },
  { travel: 30, tile: 820, period: 170, density: 9000 },
]

/**
 * Real space behind the whole section. Far away: the Milky Way and faint stars, drawn once for each
 * size of the section, the brighter ones twinkling. Nearer: two fields of stars drifting slowly past
 * at different speeds, as if the planet were travelling through space. As the page scrolls, each depth
 * goes by at its own pace. Nothing redraws: the drift and the twinkle are CSS, paused off screen.
 */
function Space() {
  const host = useRef<HTMLDivElement>(null)

  // the far sky, redrawn when the section changes size
  useEffect(() => {
    const far = host.current!.querySelector<HTMLElement>('.reach__depth')!
    const layers = [...far.querySelectorAll('canvas')]
    let drawn = ''
    let frame = 0
    const draw = () => {
      frame = 0
      const w = far.clientWidth
      const h = far.clientHeight
      if (!w || !h || drawn === `${w}x${h}`) return
      drawn = `${w}x${h}`
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const ctx = layers.map((c) => {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
        const g = c.getContext('2d')!
        g.scale(dpr, dpr)
        return g
      })
      drawSky(ctx, w, h)
    }
    const ro = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(draw)
    })
    ro.observe(far)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  // the drifting star fields: one tile each, repeated
  useEffect(() => {
    let live = true
    const urls: string[] = []
    host.current!.querySelectorAll<HTMLElement>('.reach__drift').forEach((el, k) => {
      const d = DEPTHS[k + 1]
      void starTile(d.tile!, d.density!, k === 1, 11 + k).then((url) => {
        if (!live) return URL.revokeObjectURL(url)
        urls.push(url)
        el.style.backgroundImage = `url(${url})`
      })
    })
    return () => {
      live = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  // drift and twinkle only while the section is on screen
  useEffect(() => {
    const el = host.current!
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-away', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // as the page scrolls, the farther a depth, the slower it goes by
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const scrollTrigger = { trigger: host.current!.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      gsap.utils.toArray<HTMLElement>('.reach__depth', host.current).forEach((el, k) => {
        gsap.fromTo(el, { y: -DEPTHS[k].travel }, { y: DEPTHS[k].travel, ease: 'none', scrollTrigger })
      })
    },
    { scope: host },
  )

  return (
    <div className="reach__space" ref={host} aria-hidden>
      {DEPTHS.map((d, k) => (
        <div key={k} className="reach__depth" style={{ '--travel': `${d.travel}px` } as CSSProperties}>
          {d.tile ? (
            <div className="reach__drift" style={{ '--tile': `${d.tile}px`, '--period': `${d.period}s` } as CSSProperties} />
          ) : (
            <>
              <canvas />
              <canvas className="reach__twinkle" />
              <canvas className="reach__twinkle reach__twinkle--late" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
