import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/gsap'
import { reach } from '../../lib/content'
import { flag } from '../../lib/flags'
import { useMedia } from '../../lib/useMedia'
import { useExperience } from '../../providers/Experience'
import { useTheme } from '../../providers/Theme'
import type { GlobeBridge } from './globe'
import './reach.css'

const ReachScene = lazy(() => import('./ReachScene'))

/**
 * Our reach: a glowing 3D globe the visitor can grab and spin any way, with our markets riding
 * rings round it, each named beside its satellite. The rings and names hold still; only the globe
 * turns. Pointing at a name lights its country on the globe and draws a line down to it; a click (a
 * tap on phones) also turns the globe slowly to bring that country to the front.
 */
export function Reach() {
  const { ready } = useExperience()
  const { theme } = useTheme()
  const mobile = useMedia('(max-width: 760px)')
  // below laptops, 18 names don't fit round the globe: they sit under it as chips
  const compact = useMedia('(max-width: 1100px)')
  const still = prefersReducedMotion()

  const root = useRef<HTMLElement>(null)
  const box = useRef<HTMLDivElement | null>(null)
  const [mount, setMount] = useState(false)
  const [inView, setInView] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const release = useRef(0)

  const bridge = useRef<GlobeBridge>({ active: null, reveal: still ? 1 : 0, surface: null, labels: [], focus: null, onGrab: () => {} })
  bridge.current.onGrab = () => setActive(null)
  useEffect(() => {
    bridge.current.active = active
  }, [active])

  /** a click turns the globe to a market and lights it for a few seconds */
  const tap = (i: number) => {
    bridge.current.focus = { i, n: (bridge.current.focus?.n ?? 0) + 1 }
    window.clearTimeout(release.current)
    setActive(i)
    release.current = window.setTimeout(() => setActive(null), 6000)
  }
  useEffect(() => () => window.clearTimeout(release.current), [])

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
      gsap
        .timeline({ scrollTrigger: { trigger: box.current, start: 'top 75%', once: true } })
        .to(bridge.current, { reveal: 1, duration: 3.2, ease: 'power2.out' }, 0)
        .from('.reach__hint', { autoAlpha: 0, y: 20, duration: 1.2 }, 1.2)
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <section className="reach" id="reach" ref={root} data-header-theme="auto">
      <div className="reach__head">
        <h2 className="reach__h" data-reveal="lines">
          Our reach across <br />
          <span className="serif">local &amp; global markets.</span>
        </h2>
        <p className="reach__p" data-reveal="fade" data-delay="0.15">
          From our studio in Alexandria, we create for brands in {reach.markets.length} countries across five continents.
        </p>
      </div>

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
              <ReachScene bridge={bridge} active={inView} mobile={compact} theme={theme} />
            </Suspense>
          )}
        </div>
        {/* on touch, only a swipe that starts on the globe turns it; elsewhere the page scrolls */}
        <div className="reach__grab" aria-hidden />
        <ul className="reach__tags" aria-label="Countries we work with">
          {reach.markets.map((m, i) => (
            <li key={m.code} className={`reach__tag${active === i ? ' is-on' : ''}`} ref={(el) => void (bridge.current.labels[i] = el)}>
              <button
                type="button"
                className="reach__tag-in"
                // a press on a name isn't a grab of the globe
                onPointerDown={(e) => e.stopPropagation()}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setActive((a) => (a === i ? null : a))}
                onClick={() => tap(i)}
                onFocus={(e) => e.currentTarget.matches(':focus-visible') && setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
              >
                <span className="reach__flag" aria-hidden>
                  {flag(m.code)}
                </span>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* phones and tablets: a tap on a chip shows that market's name on its ring */}
      {compact && (
        <div className="reach__chips" aria-hidden>
          {reach.markets.map((m, i) => (
            <button key={m.code} type="button" tabIndex={-1} className={`reach__chip${active === i ? ' is-on' : ''}`} onClick={() => tap(i)}>
              <span className="reach__flag">{flag(m.code)}</span>
              {m.name}
            </button>
          ))}
        </div>
      )}

      <p className="reach__hint mono">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4.4h-4.4" />
        </svg>
        {mobile ? 'Swipe the globe to spin it, tap a country' : compact ? 'Drag the globe to spin it, tap a country' : 'Drag the globe to spin it, click a country'}
      </p>
    </section>
  )
}
