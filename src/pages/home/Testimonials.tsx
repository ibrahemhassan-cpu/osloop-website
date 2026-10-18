import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { testimonials } from '../../lib/content'
import { Arrow, Magnetic } from '../../components/ui'

const DURATION = 9

type Review = { quote: string; project: string }

/**
 * Client reviews: a big quote that changes on its own while the section is on screen. The home page
 * shows all of them with the list of projects beside; a project page passes its own reviews and no list
 * (they're all the same project). With a single review, the arrows and timer go too.
 */
export function Testimonials({
  items = testimonials,
  title = (
    <>
      Echoes of <span className="serif">satisfaction.</span>
    </>
  ),
  id = 'testimonials',
  list = true,
}: {
  items?: Review[]
  title?: ReactNode
  id?: string
  list?: boolean
}) {
  const N = items.length
  const single = N === 1
  const showList = list && !single
  const root = useRef<HTMLElement>(null)
  // `n` bumps on every change so the entrance replays even when landing back on the same review
  const [view, setView] = useState({ idx: 0, n: 0 })
  const idx = view.idx
  const idxRef = useRef(0)
  const leaving = useRef<gsap.core.Timeline | null>(null)
  const timer = useRef<gsap.core.Tween | null>(null)
  const inView = useRef(false)
  const hovering = useRef(false)

  const go = (next: number) => setView((v) => ({ idx: next, n: v.n + 1 }))

  /** Go to a review. Rapid clicks never get stuck: a second click during the exit jumps straight there. */
  const show = (next: number) => {
    next = ((next % N) + N) % N
    if (next === idxRef.current && !leaving.current) return
    idxRef.current = next
    if (leaving.current) {
      leaving.current.kill()
      leaving.current = null
      go(next)
      return
    }
    const lines = root.current!.querySelectorAll('.v1-testi__quote .split-line')
    leaving.current = gsap
      .timeline({
        onComplete: () => {
          leaving.current = null
          go(next)
        },
      })
      .to(lines, { yPercent: -110, duration: 0.6, stagger: 0.03, ease: 'power3.in', overwrite: 'auto' })
      .to('.v1-testi__project', { autoAlpha: 0, y: -10, duration: 0.4, overwrite: 'auto' }, 0)
  }
  const showRef = useRef(show)
  showRef.current = show

  // Bring the new review in, restart the progress bar.
  useGSAP(
    () => {
      const q = root.current!.querySelector('.v1-testi__quote')!
      const split = SplitText.create(q, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
      gsap.set(q, { visibility: 'visible' })
      gsap
        .timeline()
        .from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.07, ease: 'silk' })
        .fromTo('.v1-testi__project', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.3)
      timer.current?.kill()
      if (single) return () => split.revert()
      timer.current = gsap.fromTo(
        '.v1-testi__timer-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: DURATION,
          ease: 'none',
          paused: !inView.current || hovering.current,
          onComplete: () => showRef.current(idxRef.current + 1),
        },
      )
      return () => split.revert()
    },
    { scope: root, dependencies: [view.n] },
  )

  // Autoplay only while the section is on screen.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        inView.current = self.isActive
        if (self.isActive && !hovering.current) timer.current?.play()
        else timer.current?.pause()
      },
    })
    return () => st.kill()
  }, [])

  // Horizontal swipe (touch + pen + mouse drag) on the quote area.
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(idxRef.current + (dx < 0 ? 1 : -1))
  }

  const t = items[idx]

  return (
    <section className={`v1-testi${showList ? '' : ' v1-testi--single'}${single ? ' v1-testi--one' : ''}`} id={id} ref={root} data-header-theme="dark" data-theme="dark">
      <div className="v1-testi__head">
        <h2 className="v1-testi__h" data-reveal="lines">
          {title}
        </h2>
        <div className="v1-testi__rating" data-reveal="fade">
          <span className="v1-testi__stars" aria-label="5 out of 5 stars">
            ★★★★★
          </span>
          <span className="mono">Client reviews</span>
        </div>
      </div>

      <div
        className="v1-testi__body"
        onMouseEnter={() => {
          hovering.current = true
          timer.current?.pause()
        }}
        onMouseLeave={() => {
          hovering.current = false
          if (inView.current) timer.current?.play()
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div className="v1-testi__mark serif" aria-hidden>
          “
        </div>
        <blockquote className="v1-testi__quote" key={view.n} aria-live="polite">
          {t.quote}
        </blockquote>
        <div className="v1-testi__meta">
          <div className="v1-testi__project">
            <span className="mono">Project</span>
            <strong>{t.project}</strong>
          </div>
          {!single && (
            <div className="v1-testi__controls">
              <span className="v1-testi__count mono">
                {String(idx + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
              </span>
              <div className="v1-testi__timer" aria-hidden>
                <div className="v1-testi__timer-fill" />
              </div>
              <Magnetic>
                <button type="button" className="v1-testi__btn" onClick={() => show(idxRef.current - 1)} aria-label="Previous review">
                  <Arrow rotate={180} />
                </button>
              </Magnetic>
              <Magnetic>
                <button type="button" className="v1-testi__btn" onClick={() => show(idxRef.current + 1)} aria-label="Next review">
                  <Arrow />
                </button>
              </Magnetic>
            </div>
          )}
        </div>
      </div>

      {showList && (
        <ol className="v1-testi__list">
          {items.map((x, i) => (
            <li key={x.quote}>
              <button type="button" className={i === idx ? 'is-on' : ''} onClick={() => show(i)} aria-current={i === idx}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                {x.project}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
